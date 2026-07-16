"""
workers.py — Cloudflare Workers 脚本管理

用法：
    # 列出账号下所有 Worker Scripts
    python scripts/workers.py list

    # 删除单个
    python scripts/workers.py delete --name cors-worker

    # 批量删除（多个）
    python scripts/workers.py delete --name cors-worker --name floral-sun-6ea7

    # 干跑（只打印不执行）
    python scripts/workers.py delete --name xxx --dry-run

    # 交互式确认（默认要 --yes 才真删）
    python scripts/workers.py delete --name xxx --yes
"""
from __future__ import annotations
import argparse
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cf_client import CloudflareClient  # type: ignore


def get_account_id(cf: CloudflareClient) -> str:
    aid = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if aid:
        return aid
    data = cf.get("/accounts")
    return data["result"][0]["id"]


def cmd_list(cf: CloudflareClient, aid: str, args) -> int:
    r = cf.get(f"/accounts/{aid}/workers/scripts", params={"per_page": 100})
    scripts = r.get("result", []) or []
    if not scripts:
        print("(无 Worker Script)")
        return 0
    print(f"共 {len(scripts)} 个 Worker Script：\n")
    for s in scripts:
        print(f"  · {s.get('id'):<32}  modified={(s.get('modified_on') or '')[:19]}")
    return 0


def delete_script(cf: CloudflareClient, aid: str, name: str) -> tuple[bool, str]:
    """返回 (成功, 消息)"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{aid}/workers/scripts/{name}"
    req = urllib.request.Request(
        url, method="DELETE",
        headers={"Authorization": f"Bearer {cf.token}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode("utf-8", errors="replace")
        return True, body
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode('utf-8', errors='replace')}"
    except Exception as e:
        return False, str(e)


def cmd_delete(cf: CloudflareClient, aid: str, args) -> int:
    names = args.name or []
    if not names:
        print("请用 --name 指定要删除的 worker 名（可多次）")
        return 1

    # 校验存在性
    r = cf.get(f"/accounts/{aid}/workers/scripts", params={"per_page": 100})
    existing = {s["id"] for s in (r.get("result") or [])}
    missing = [n for n in names if n not in existing]
    if missing:
        print(f"[警告] 以下 worker 不存在，将跳过：{missing}")
    to_delete = [n for n in names if n in existing]
    if not to_delete:
        print("没有可删除的 worker。")
        return 0

    print(f"将删除 {len(to_delete)} 个 Worker Script：")
    for n in to_delete:
        print(f"  · {n}")

    if args.dry_run:
        print("\n[dry-run] 未执行删除。")
        return 0

    if not args.yes:
        ans = input("\n确认删除？(输入 yes 继续): ").strip().lower()
        if ans != "yes":
            print("已取消。")
            return 1

    fail = 0
    for n in to_delete:
        ok, msg = delete_script(cf, aid, n)
        if ok:
            print(f"  [OK]   {n}")
        else:
            print(f"  [FAIL] {n} — {msg}")
            fail += 1
    print(f"\n完成：成功 {len(to_delete)-fail} / 失败 {fail}")
    return 0 if fail == 0 else 2


def main() -> int:
    ap = argparse.ArgumentParser(description="Cloudflare Workers 脚本管理")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("list", help="列出所有 Worker Scripts")

    p_del = sub.add_parser("delete", help="删除一个或多个 Worker Script")
    p_del.add_argument("--name", action="append", default=[], help="worker 名，可多次")
    p_del.add_argument("--yes", action="store_true", help="跳过交互确认")
    p_del.add_argument("--dry-run", action="store_true", help="只打印不执行")

    args = ap.parse_args()
    cf = CloudflareClient.from_env(dotenv_path=Path(__file__).resolve().parent.parent / ".env")
    aid = get_account_id(cf)

    funcs = {"list": cmd_list, "delete": cmd_delete}
    return funcs[args.cmd](cf, aid, args)


if __name__ == "__main__":
    raise SystemExit(main())
