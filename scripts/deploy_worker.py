"""
通过 Cloudflare API 部署 Worker（含静态资源 + AI 绑定 + 自定义域名）。

不依赖 wrangler，只用标准库 + cf_client。适合作为脚本长期复用。

用法:
    # 首次部署 / 更新代码 + 资源
    python scripts/deploy_worker.py \
        --name idai-chat \
        --script worker/src/worker.js \
        --assets worker/public \
        --domain chat.idai.asia

    # 仅重新绑定域名
    python scripts/deploy_worker.py --name idai-chat --domain chat.idai.asia --only-domain

环境变量:
    CLOUDFLARE_API_TOKEN   必需，需含 Workers Scripts:Edit、Workers AI:Edit、Zone:Edit
    CLOUDFLARE_ACCOUNT_ID  可选，未设置时脚本会自动从 /accounts 拉取第一个
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cf_client import CloudflareClient, CloudflareError, API_BASE  # noqa: E402


def get_account_id(cf: CloudflareClient) -> str:
    aid = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if aid:
        return aid
    accounts = list(cf.paginate("/accounts"))
    if not accounts:
        raise SystemExit("找不到可用账号")
    return accounts[0]["id"]


def find_zone_id(cf: CloudflareClient, domain: str) -> str:
    # domain 例如 chat.idai.asia -> zone 是 idai.asia
    parts = domain.split(".")
    for i in range(len(parts) - 1):
        candidate = ".".join(parts[i:])
        zones = list(cf.paginate("/zones", params={"name": candidate}))
        if zones:
            return zones[0]["id"]
    raise SystemExit(f"找不到 {domain} 对应的 zone，请先把父域名接入 Cloudflare")


# ---------- Assets 上传 ----------

def _sha256_hex(data: bytes) -> str:
    import hashlib
    return hashlib.sha256(data).hexdigest()


def upload_assets(cf: CloudflareClient, account_id: str, script_name: str, assets_dir: Path) -> str | None:
    """上传静态资源，返回 completion token（用于随后 script upload）。"""
    files: dict[str, dict] = {}
    for path in assets_dir.rglob("*"):
        if not path.is_file():
            continue
        rel = "/" + path.relative_to(assets_dir).as_posix()
        data = path.read_bytes()
        # 官方要求 hash 为 32 hex 字符
        h = _sha256_hex(data)[:32]
        ct = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        files[rel] = {"data": data, "hash": h, "content_type": ct}

    if not files:
        print("[assets] 目录为空，跳过")
        return None

    manifest = {p: {"hash": info["hash"], "size": len(info["data"])} for p, info in files.items()}
    by_hash = {info["hash"]: info for info in files.values()}
    print(f"[assets] 声明清单 {len(manifest)} 个文件…")

    resp = cf.post(
        f"/accounts/{account_id}/workers/scripts/{script_name}/assets-upload-session",
        data={"manifest": manifest},
    )
    result = resp.get("result") or {}
    jwt = result.get("jwt")
    buckets = result.get("buckets") or []

    if not buckets:
        print("[assets] 服务端表示无需上传（内容未变）")
        return jwt

    # 上传每个 bucket（multipart/form-data，每个文件 base64 编码）
    import base64, secrets
    for bucket in buckets:
        boundary = "----cfAssets" + secrets.token_hex(8)
        parts = []
        for path_key in bucket:
            info = by_hash.get(path_key) or files.get(path_key)
            if info is None:
                continue
            b64 = base64.b64encode(info["data"]).decode("ascii")
            parts.append(f"--{boundary}\r\n".encode())
            parts.append(
                (f'Content-Disposition: form-data; name="{info["hash"]}"; filename="{info["hash"]}"\r\n'
                 f'Content-Type: {info["content_type"]}\r\n'
                 f'\r\n').encode()
            )
            parts.append(b64.encode("ascii"))
            parts.append(b"\r\n")
        parts.append(f"--{boundary}--\r\n".encode())
        body = b"".join(parts)
        req = urllib.request.Request(
            f"{API_BASE}/accounts/{account_id}/workers/assets/upload?base64=true",
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {jwt}",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                payload = json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", errors="replace")
            raise SystemExit(f"[assets] upload HTTP {e.code}: {raw}")
        new_jwt = (payload.get("result") or {}).get("jwt")
        if new_jwt:
            jwt = new_jwt
        print(f"[assets] 上传桶 {len(bucket)} 个文件 ok")
    return jwt


# ---------- Worker script 上传 ----------

def upload_script(cf: CloudflareClient, account_id: str, script_name: str,
                  script_path: Path, assets_jwt: str | None,
                  ai_binding: str = "AI", assets_binding: str = "ASSETS",
                  spa: bool = True, kv_bindings: list | None = None) -> None:
    metadata = {
        "main_module": script_path.name,
        "compatibility_date": "2025-01-01",
        "bindings": [{"type": "ai", "name": ai_binding}],
    }
    if assets_jwt is not None or assets_binding:
        assets_conf: dict = {"config": {"not_found_handling": "single-page-application" if spa else "none"}}
        if assets_jwt:
            assets_conf["jwt"] = assets_jwt
        metadata["assets"] = assets_conf
        metadata["bindings"].append({"type": "assets", "name": assets_binding})

    for kv in (kv_bindings or []):
        # kv 形如 {"name":"CHECKIN","namespace_id":"xxxxx"}
        metadata["bindings"].append({"type": "kv_namespace", "name": kv["name"], "namespace_id": kv["namespace_id"]})

    boundary = "----cfWorkerBoundary" + str(int(time.time()))
    parts: list[bytes] = []

    def add_part(name: str, filename: str | None, content_type: str, body: bytes):
        headers = f'Content-Disposition: form-data; name="{name}"'
        if filename:
            headers += f'; filename="{filename}"'
        headers += f"\r\nContent-Type: {content_type}\r\n\r\n"
        parts.append(f"--{boundary}\r\n".encode())
        parts.append(headers.encode())
        parts.append(body)
        parts.append(b"\r\n")

    add_part("metadata", None, "application/json", json.dumps(metadata).encode("utf-8"))
    add_part(script_path.name, script_path.name, "application/javascript+module", script_path.read_bytes())
    parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(parts)

    url = f"{API_BASE}/accounts/{account_id}/workers/scripts/{script_name}"
    req = urllib.request.Request(
        url, data=body, method="PUT",
        headers={
            "Authorization": f"Bearer {cf.token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        payload = json.loads(r.read().decode("utf-8"))
    if not payload.get("success"):
        raise SystemExit(f"部署失败: {payload}")
    print(f"[worker] 部署 {script_name} 成功, id={payload['result'].get('id')}")


# ---------- 自定义域名 ----------

def bind_custom_domain(cf: CloudflareClient, account_id: str, script_name: str, domain: str) -> None:
    zone_id = find_zone_id(cf, domain)
    print(f"[domain] zone_id={zone_id}, 绑定 {domain} -> {script_name}")
    try:
        cf.put(
            f"/accounts/{account_id}/workers/domains",
            data={
                "environment": "production",
                "hostname": domain,
                "service": script_name,
                "zone_id": zone_id,
            },
        )
        print("[domain] 已绑定/更新自定义域名")
    except CloudflareError as e:
        # 已存在等情况给出更友好的提示
        print(f"[domain] 绑定接口返回: {e}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", required=True, help="Worker 脚本名，例如 idai-chat")
    ap.add_argument("--script", help="Worker 入口 .js 文件路径")
    ap.add_argument("--assets", help="静态资源目录（可选）")
    ap.add_argument("--domain", help="要绑定的自定义域名，例如 chat.idai.asia")
    ap.add_argument("--only-domain", action="store_true", help="只重绑域名，不重新上传代码")
    ap.add_argument("--no-spa", action="store_true", help="关闭 SPA 回退（默认开启）")
    ap.add_argument("--kv", action="append", default=[], help="KV 绑定，形如 CHECKIN=xxxxxxxxnamespace_id；可多次")
    args = ap.parse_args()

    cf = CloudflareClient.from_env(dotenv_path=Path(__file__).resolve().parent.parent / ".env")
    account_id = get_account_id(cf)
    print(f"[cf] account_id={account_id}")

    if not args.only_domain:
        if not args.script:
            raise SystemExit("需要 --script")
        script_path = Path(args.script).resolve()
        assets_jwt = None
        if args.assets:
            assets_jwt = upload_assets(cf, account_id, args.name, Path(args.assets).resolve())
        kvs = []
        for k in args.kv:
            if "=" not in k: raise SystemExit(f"--kv 格式错误: {k}, 应为 NAME=namespace_id")
            n, i = k.split("=", 1)
            kvs.append({"name": n.strip(), "namespace_id": i.strip()})
        upload_script(cf, account_id, args.name, script_path, assets_jwt, spa=not args.no_spa, kv_bindings=kvs)

    if args.domain:
        bind_custom_domain(cf, account_id, args.name, args.domain)

    print("[done] 完成。稍等 10-30 秒 SSL 就绪后即可访问。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())