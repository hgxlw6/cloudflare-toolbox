"""
kv.py — Cloudflare KV Namespace 管理

用法：
    # 列出所有 namespace
    python scripts/kv.py list

    # 创建
    python scripts/kv.py create --title idai-checkin

    # 删除
    python scripts/kv.py delete --id xxxxxxxxxxxxxxxx

    # 查看某个 key
    python scripts/kv.py get --id xxxx --key user:abc

    # 写入某个 key
    python scripts/kv.py put --id xxxx --key user:abc --value '{"days":1}'
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cf_client import CloudflareClient  # type: ignore


def get_account_id(cf: CloudflareClient) -> str:
    import os
    aid = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if aid: return aid
    data = cf.get("/accounts")
    return data["result"][0]["id"]


def cmd_list(cf, aid, args):
    r = cf.get(f"/accounts/{aid}/storage/kv/namespaces", params={"per_page": 50})
    for n in r.get("result", []):
        print(f"  {n['id']}  {n['title']}")


def cmd_create(cf, aid, args):
    r = cf.post(f"/accounts/{aid}/storage/kv/namespaces", data={"title": args.title})
    ns = r["result"]
    print(f"[创建成功] {ns['id']}  title={ns['title']}")
    print(f"\n→ 部署时加参数：--kv CHECKIN={ns['id']}")


def cmd_delete(cf, aid, args):
    cf.delete(f"/accounts/{aid}/storage/kv/namespaces/{args.id}")
    print(f"[已删除] {args.id}")


def cmd_get(cf, aid, args):
    import urllib.request
    url = f"https://api.cloudflare.com/client/v4/accounts/{aid}/storage/kv/namespaces/{args.id}/values/{args.key}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {cf.token}"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            print(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"[{e.code}] {e.read().decode('utf-8')}")


def cmd_put(cf, aid, args):
    import urllib.request
    url = f"https://api.cloudflare.com/client/v4/accounts/{aid}/storage/kv/namespaces/{args.id}/values/{args.key}"
    req = urllib.request.Request(url, data=args.value.encode("utf-8"), method="PUT",
                                 headers={"Authorization": f"Bearer {cf.token}", "Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=15) as r:
        print(r.read().decode("utf-8"))


def main():
    ap = argparse.ArgumentParser(description="Cloudflare KV Namespace 管理")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("list", help="列出所有 KV namespace")

    p_create = sub.add_parser("create", help="创建 namespace")
    p_create.add_argument("--title", required=True)

    p_del = sub.add_parser("delete", help="删除 namespace")
    p_del.add_argument("--id", required=True)

    p_get = sub.add_parser("get", help="读 key")
    p_get.add_argument("--id", required=True)
    p_get.add_argument("--key", required=True)

    p_put = sub.add_parser("put", help="写 key")
    p_put.add_argument("--id", required=True)
    p_put.add_argument("--key", required=True)
    p_put.add_argument("--value", required=True)

    args = ap.parse_args()
    cf = CloudflareClient.from_env(dotenv_path=Path(__file__).resolve().parent.parent / ".env")
    aid = get_account_id(cf)

    funcs = {"list": cmd_list, "create": cmd_create, "delete": cmd_delete, "get": cmd_get, "put": cmd_put}
    funcs[args.cmd](cf, aid, args)


if __name__ == "__main__":
    main()
