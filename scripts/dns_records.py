"""
Cloudflare DNS 记录管理（列出 / 新增 / 更新 / 删除）。

示例:
    # 列出 idai.asia 所有 DNS
    python scripts/dns_records.py list --zone idai.asia

    # 新增或更新一条 CNAME（upsert，按 name+type 唯一）
    python scripts/dns_records.py upsert --zone idai.asia --type CNAME --name blog --content ghs.googlehosted.com --proxied

    # 新增 A 记录
    python scripts/dns_records.py upsert --zone idai.asia --type A --name api --content 1.2.3.4

    # 删除
    python scripts/dns_records.py delete --zone idai.asia --name old.idai.asia --type A
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cf_client import CloudflareClient  # noqa: E402


def get_zone_id(cf: CloudflareClient, zone: str) -> str:
    zones = list(cf.paginate("/zones", params={"name": zone}))
    if not zones:
        raise SystemExit(f"找不到 zone: {zone}")
    return zones[0]["id"]


def full_name(name: str, zone: str) -> str:
    return name if name.endswith(zone) else f"{name}.{zone}"


def cmd_list(cf, args):
    zid = get_zone_id(cf, args.zone)
    recs = list(cf.paginate(f"/zones/{zid}/dns_records"))
    for r in recs:
        proxied = "☁" if r.get("proxied") else " "
        print(f"{proxied} {r['type']:6} {r['name']:40} -> {r['content']}  (id={r['id']})")
    print(f"\n共 {len(recs)} 条")


def cmd_upsert(cf, args):
    zid = get_zone_id(cf, args.zone)
    name = full_name(args.name, args.zone)
    existing = list(cf.paginate(f"/zones/{zid}/dns_records", params={"name": name, "type": args.type}))
    body = {
        "type": args.type,
        "name": name,
        "content": args.content,
        "ttl": args.ttl,
        "proxied": args.proxied,
    }
    if existing:
        rid = existing[0]["id"]
        cf.put(f"/zones/{zid}/dns_records/{rid}", data=body)
        print(f"updated {args.type} {name} -> {args.content}")
    else:
        cf.post(f"/zones/{zid}/dns_records", data=body)
        print(f"created {args.type} {name} -> {args.content}")


def cmd_delete(cf, args):
    zid = get_zone_id(cf, args.zone)
    name = full_name(args.name, args.zone)
    recs = list(cf.paginate(f"/zones/{zid}/dns_records", params={"name": name, "type": args.type}))
    if not recs:
        print("no matching record")
        return
    for r in recs:
        cf.delete(f"/zones/{zid}/dns_records/{r['id']}")
        print(f"deleted {r['type']} {r['name']}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    lp = sub.add_parser("list")
    lp.add_argument("--zone", required=True)

    up = sub.add_parser("upsert")
    up.add_argument("--zone", required=True)
    up.add_argument("--type", required=True, choices=["A", "AAAA", "CNAME", "TXT", "MX", "NS"])
    up.add_argument("--name", required=True, help="子域名（不含 zone）或完整域名")
    up.add_argument("--content", required=True)
    up.add_argument("--ttl", type=int, default=1, help="1=Auto")
    up.add_argument("--proxied", action="store_true")

    dp = sub.add_parser("delete")
    dp.add_argument("--zone", required=True)
    dp.add_argument("--name", required=True)
    dp.add_argument("--type", required=True)

    args = ap.parse_args()
    cf = CloudflareClient.from_env(dotenv_path=Path(__file__).resolve().parent.parent / ".env")
    {"list": cmd_list, "upsert": cmd_upsert, "delete": cmd_delete}[args.cmd](cf, args)


if __name__ == "__main__":
    main()