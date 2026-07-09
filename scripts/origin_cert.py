"""
Cloudflare Origin CA 证书签发工具（免费、最长 15 年）。

Origin CA 证书由 Cloudflare 私有 CA 签发，用于 **源站 <-> Cloudflare 边缘**
的加密，浏览器直接访问不信任。若网站放在 Cloudflare 后面，通常使用 "Full (strict)"
SSL 模式，源站部署此证书即可实现端到端加密，且无需域名验证 / 邮箱验证。

用法:
    python scripts/origin_cert.py issue \
        --hostname "*.idai.asia" --hostname "idai.asia" \
        --days 5475 \
        --out certs/idai.asia

    python scripts/origin_cert.py list
    python scripts/origin_cert.py revoke --id <cert_id>

参数:
    --days     有效天数，最大 5475 (15 年)
    --key-type rsa (默认, 2048) | ecc (P-256)
    --out      输出目录，会生成 privkey.pem / cert.pem / fullchain.pem / csr.pem

注意:
    - Origin CA API 要求使用 "Origin CA Key"（不是普通 API Token）。
      在 https://dash.cloudflare.com/profile/api-tokens 页面下方
      "API Keys" 区域，点 "Origin CA Key" -> View -> 复制。
    - 或者使用具备 "SSL and Certificates:Edit" 的 API Token。当前脚本两种都支持：
        * 环境变量 CLOUDFLARE_ORIGIN_CA_KEY  -> 走 X-Auth-User-Service-Key 头（推荐）
        * 否则回落到 CLOUDFLARE_API_TOKEN     -> 走 Bearer 头
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cf_client import load_dotenv, API_BASE  # noqa: E402

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.x509.oid import NameOID


ORIGIN_CA_ENDPOINT = f"{API_BASE}/certificates"


def _auth_headers() -> dict:
    key = os.environ.get("CLOUDFLARE_ORIGIN_CA_KEY")
    if key:
        return {"X-Auth-User-Service-Key": key}
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    if token:
        return {"Authorization": f"Bearer {token}"}
    raise SystemExit("请设置 CLOUDFLARE_ORIGIN_CA_KEY 或 CLOUDFLARE_API_TOKEN")


def _request(method: str, url: str, data: dict | None = None) -> dict:
    body = None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    headers.update(_auth_headers())
    if data is not None:
        body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            payload = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {e.code}: {raw}") from None
    if not payload.get("success", True):
        raise SystemExit(f"Cloudflare 返回错误: {payload}")
    return payload


def gen_key_and_csr(hostnames: list[str], key_type: str) -> tuple[bytes, bytes]:
    if key_type == "ecc":
        key = ec.generate_private_key(ec.SECP256R1())
    else:
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    key_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    # CN 使用第一个 hostname
    subject = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, hostnames[0])])
    san = x509.SubjectAlternativeName([x509.DNSName(h) for h in hostnames])
    csr = (
        x509.CertificateSigningRequestBuilder()
        .subject_name(subject)
        .add_extension(san, critical=False)
        .sign(key, hashes.SHA256())
    )
    csr_pem = csr.public_bytes(serialization.Encoding.PEM)
    return key_pem, csr_pem


def cmd_issue(args):
    hostnames = args.hostname
    days = min(max(int(args.days), 7), 5475)
    key_pem, csr_pem = gen_key_and_csr(hostnames, args.key_type)

    payload = {
        "hostnames": hostnames,
        "requested_validity": days,
        "request_type": "origin-ecc" if args.key_type == "ecc" else "origin-rsa",
        "csr": csr_pem.decode("utf-8"),
    }
    resp = _request("POST", ORIGIN_CA_ENDPOINT, data=payload)
    result = resp["result"]

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "privkey.pem").write_bytes(key_pem)
    (out_dir / "csr.pem").write_bytes(csr_pem)
    (out_dir / "cert.pem").write_text(result["certificate"], encoding="utf-8")
    # Origin CA 单独提供 Root CA (可选下载)
    (out_dir / "fullchain.pem").write_text(result["certificate"], encoding="utf-8")
    (out_dir / "info.json").write_text(
        json.dumps({
            "id": result.get("id"),
            "hostnames": result.get("hostnames"),
            "expires_on": result.get("expires_on"),
            "requested_validity": result.get("requested_validity"),
            "type": result.get("request_type"),
        }, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    # Windows 权限：私钥应仅本人可读，这里仅提示
    print("== 签发成功 ==")
    print(f"cert id     : {result.get('id')}")
    print(f"hostnames   : {result.get('hostnames')}")
    print(f"validity    : {days} 天")
    print(f"expires_on  : {result.get('expires_on')}")
    print(f"输出目录    : {out_dir.resolve()}")
    print("文件:")
    print("  privkey.pem   私钥（部署到源站，务必保密）")
    print("  cert.pem      证书")
    print("  fullchain.pem 同 cert.pem（Origin CA 是单证书，无中间链）")
    print("  csr.pem       CSR")
    print("  info.json     元数据")


def cmd_list(args):
    resp = _request("GET", ORIGIN_CA_ENDPOINT + "?per_page=50")
    for c in resp.get("result", []):
        exp = c.get("expires_on") or ""
        print(f"{c['id']}  {c.get('hostnames')}  expires={exp}")


def cmd_revoke(args):
    resp = _request("DELETE", f"{ORIGIN_CA_ENDPOINT}/{args.id}")
    print("revoked:", resp.get("result"))


def main():
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")

    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    ip = sub.add_parser("issue", help="签发 Origin CA 证书")
    ip.add_argument("--hostname", action="append", required=True,
                    help="可重复；例如 --hostname *.idai.asia --hostname idai.asia")
    ip.add_argument("--days", type=int, default=5475, help="有效天数，最大 5475 (=15年)")
    ip.add_argument("--key-type", choices=["rsa", "ecc"], default="rsa")
    ip.add_argument("--out", default="certs/output", help="输出目录")
    ip.set_defaults(func=cmd_issue)

    lp = sub.add_parser("list", help="列出账户下所有 Origin CA 证书")
    lp.set_defaults(func=cmd_list)

    rp = sub.add_parser("revoke", help="吊销证书")
    rp.add_argument("--id", required=True)
    rp.set_defaults(func=cmd_revoke)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()