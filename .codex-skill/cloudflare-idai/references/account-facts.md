# Account Facts — idai.asia

## Cloudflare Account
- **Account ID**: `237793524d9280c9a6a30f0fc172d276`
- Owner: single-person personal account, free plan
- Region: global (Anycast)

## Zone: idai.asia
- **Zone ID**: `952eabdad2694bf167e2c3f3cc7d0c9b`
- Nameservers: managed by Cloudflare (from registrar side)
- Universal SSL: ON
- Always Use HTTPS: (verify in dashboard)
- Wildcard Origin CA cert: `*.idai.asia` + `idai.asia`, 5475 days, files in `certs/idai.asia/`

## KV Namespaces
| Title | ID | Purpose |
|---|---|---|
| `idai-checkin` | `c60399eb426b403682e944404c6187f3` | Cross-site check-in data (`user:<uid>` schema) |

Data schema for `user:<uid>` (JSON):
```json
{
  "uid": "abc123",
  "days": { "YYYY-MM-DD": { "apps": {"math":1,"yuwen":1,...}, "note":"" } },
  "streak": 5,
  "longest": 7,
  "total": 12,
  "lastDate": "YYYY-MM-DD"
}
```
Date key uses Asia/Shanghai timezone.

## Workers Scripts (deployed)
| Script name | Domain | Bindings |
|---|---|---|
| `type-idai`  | `type.idai.asia`  | ASSETS, AI, **CHECKIN (KV)** |
| `math-idai`  | `math.idai.asia`  | ASSETS, AI |
| `yuwen-idai` | `yuwen.idai.asia` | ASSETS, AI |
| `en-idai`    | `en.idai.asia`    | ASSETS, AI |
| `idai-chat`  | `chat.idai.asia`  | ASSETS, AI |

## Check-in API (`type-idai`)
Base URL: `https://type.idai.asia`

| Method | Path | Body | Description |
|---|---|---|---|
| GET  | `/api/checkin?uid=<uid>` | — | Fetch full user record |
| POST | `/api/checkin?uid=<uid>` | `{"apps": {"<appId>": 1}}` | Check-in for today; increments per-app counter, updates streak (once per day) |
| POST | `/api/progress?uid=<uid>` | `{"apps": {"<appId>": N}}` | Log activity without touching streak |

`uid` must match `^[a-zA-Z0-9_-]{6,32}$`.

CORS is open (`Access-Control-Allow-Origin: *`) so any subdomain can call it.

## Secrets Location (files, never commit)
- `.env` at repo root — has `CLOUDFLARE_API_TOKEN` (Bearer)
- `certs/idai.asia/*.pem` `*.key` — Origin CA private key
- `.gitignore` covers all above; CI has a "no secrets" check

## GitHub
- Repo: `https://github.com/hgxlw6/cloudflare-toolbox` (public, MIT)
- CI: `.github/workflows/ci.yml` — sensitive-file scan, Python syntax check

## Corporate Proxy (may or may not apply)
`http://192.168.19.216:808` — needed when at office network for `git push`.