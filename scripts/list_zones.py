"""
列出 Cloudflare 账号下的所有域名(Zone)。

用法:
    python scripts/list_zones.py                # 表格 + 统计
    python scripts/list_zones.py --format json  # 输出 JSON
    python scripts/list_zones.py --status active
    python scripts/list_zones.py --account <account_id>

字段说明:
    name        域名
    status      active / pending / initializing / moved / deleted 等
    plan        套餐(Free / Pro / Business / Enterprise)
    type        full / partial / secondary
    account     所属账号名
    id          Zone ID (用于后续 API 调用)
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cf_client import CloudflareClient  # noqa: E402


def parse_args():
    p = argparse.ArgumentParser(description="List Cloudflare zones (domains).")
    p.add_argument("--status", help="按状态过滤，如 active/pending")
    p.add_argument("--account", help="按 account id 过滤")
    p.add_argument("--name", help="按名称精确匹配")
    p.add_argument("--format", choices=["table", "json", "names"], default="table",
                   help="输出格式：table(默认) / json / names(仅域名列表)")
    p.add_argument("--per-page", type=int, default=50)
    return p.parse_args()


def main() -> int:
    args = parse_args()
    cf = CloudflareClient.from_env()

    params: dict = {}
    if args.status:
        params["status"] = args.status
    if args.account:
        params["account.id"] = args.account
    if args.name:
        params["name"] = args.name

    zones = list(cf.paginate("/zones", params=params, per_page=args.per_page))

    if args.format == "json":
        print(json.dumps(zones, indent=2, ensure_ascii=False))
        return 0

    if args.format == "names":
        for z in zones:
            print(z.get("name"))
        return 0

    # table
    if not zones:
        print("未找到任何域名。")
        return 0

    rows = [(
        z.get("name", ""),
        z.get("status", ""),
        (z.get("plan") or {}).get("name", ""),
        z.get("type", ""),
        (z.get("account") or {}).get("name", ""),
        z.get("id", ""),
    ) for z in zones]

    headers = ("NAME", "STATUS", "PLAN", "TYPE", "ACCOUNT", "ZONE_ID")
    widths = [max(len(str(r[i])) for r in [headers, *rows]) for i in range(len(headers))]
    fmt = "  ".join("{:<" + str(w) + "}" for w in widths)
    print(fmt.format(*headers))
    print(fmt.format(*["-" * w for w in widths]))
    for r in rows:
        print(fmt.format(*r))

    print()
    print(f"共 {len(zones)} 个域名。")
    # 按状态统计
    from collections import Counter
    c = Counter(z.get("status", "") for z in zones)
    print("按状态: " + ", ".join(f"{k}={v}" for k, v in sorted(c.items())))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
