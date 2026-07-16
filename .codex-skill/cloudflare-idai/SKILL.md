---
name: cloudflare-idai
description: Deploy and operate sites under the idai.asia domain on Cloudflare's free tier (Workers, Static Assets, KV, Workers AI, Origin CA). Use whenever the user asks to publish a new subdomain of idai.asia, deploy a Worker, manage DNS/SSL, add server-side check-in via KV, wire up the cross-site checkin system, run diagnostics on the setup, or reuse the Python operations toolkit in D:/ai-test1/cloudflare-test/scripts.
---

# Cloudflare · idai.asia Toolkit

Reusable operations skill for the personal Cloudflare account that hosts `idai.asia`. All scripts and account facts live in the repo at `D:/ai-test1/cloudflare-test/`.

## When To Use

Trigger this skill whenever the user asks to:
- Deploy or update a subdomain of `idai.asia` (e.g. `foo.idai.asia`)
- Manage Cloudflare Workers / Static Assets / custom domains for that zone
- Add or read KV data (especially the shared `idai-checkin` namespace)
- Manage DNS records, Origin CA certificates, or diagnose the environment
- Integrate a new site into the cross-site check-in system

Do **not** use it for unrelated Cloudflare accounts or non-`idai.asia` domains.

## Toolkit Location

```
D:/ai-test1/cloudflare-test/
├─ .env                     # CLOUDFLARE_API_TOKEN etc. — never commit
├─ scripts/
│  ├─ cf_client.py          # CloudflareClient (from_env)
│  ├─ deploy_worker.py      # Full deploy: assets + Worker + custom domain + optional --kv
│  ├─ kv.py                 # list / create / delete / get / put
│  ├─ dns_records.py        # list / upsert / delete DNS records
│  ├─ list_zones.py
│  ├─ origin_cert.py        # Origin CA cert (up to 15y)
│  └─ bootstrap.py          # 10-item environment health-check
├─ type-app/  math-app/  yuwen-app/  en-app/  worker/(chat)
```

Always run scripts from the repo root with UTF-8 IO:
```powershell
cd D:/ai-test1/cloudflare-test
$env:PYTHONIOENCODING="utf-8"
python scripts/<name>.py ...
```

## Account Facts

| Fact | Value |
|---|---|
| Account ID | `237793524d9280c9a6a30f0fc172d276` |
| Zone | `idai.asia` |
| Zone ID | `952eabdad2694bf167e2c3f3cc7d0c9b` |
| Check-in KV namespace | `idai-checkin` (`c60399eb426b403682e944404c6187f3`) |
| Check-in API endpoint | `https://type.idai.asia/api/checkin` |
| Origin CA cert | in gitignored `certs/idai.asia/` (5475 days) |
| GitHub repo | `https://github.com/hgxlw6/cloudflare-toolbox` |
| Corp proxy (git push) | `http://192.168.19.216:808` |

## Deployed Site Matrix

| Domain | Worker script | Content |
|---|---|---|
| `math.idai.asia` | `math-idai` | Grade-3 math |
| `yuwen.idai.asia` | `yuwen-idai` | Grade-3 Chinese (生字/古诗/故事屋) |
| `en.idai.asia` | `en-idai` | Grade-3 English up/down |
| `type.idai.asia` | `type-idai` | Typing tutor + **checkin API (KV bound)** |
| `chat.idai.asia` | `idai-chat` | Workers AI chat |

## Canonical Workflows

See `references/common-tasks.md` for step-by-step recipes (deploy new site, add KV, purge cache, sign cert, cross-site checkin integration, common gotchas).

Quick pointers:

- **Deploy any site:** `python scripts/deploy_worker.py --name <slug> --script <path/worker.js> --assets <public_dir> --domain <sub>.idai.asia`
- **Deploy with KV:** append `--kv NAME=<namespace_id>` (may repeat)
- **Environment sanity check:** `python scripts/bootstrap.py`
- **Verify deployment:** `Invoke-WebRequest -Uri "https://<sub>.idai.asia/" -UseBasicParsing`
- **After 15s SSL warm-up**, cache-bust HTML with `?v=$([DateTimeOffset]::Now.ToUnixTimeSeconds())`

## New-Site Conventions

Any new subdomain should follow the existing pattern (mirrors `math-app`/`yuwen-app`):

```
<name>-app/
├─ src/worker.js       # minimal env.ASSETS.fetch(request) proxy
└─ public/
   ├─ index.html
   ├─ app.js
   └─ checkin-client.js   # copy from type-app if enabling checkin
```

If check-in is desired, inject this block near end of `index.html` (see `references/common-tasks.md § Cross-site checkin`).

## Style / Preferences

- Chinese user; response and inline comments may be Chinese
- Everything runs on Cloudflare **free tier only** — never suggest paid features
- Static Assets pattern, no build step, no framework
- Client-side progress in `localStorage`; server-side persistence only via the shared `idai-checkin` KV
- No secrets in git — `.env`, `certs/`, `*.pem`, `*.key` are gitignored & CI-checked

## Windows / PowerShell Gotchas

- Set `$env:PYTHONIOENCODING="utf-8"` before running Python
- `git push` writes `To https://...` to stderr → PowerShell reports exit 1 but the operation may have succeeded — confirm by checking the `main -> main` line
- Corp proxy for `git push`: `$env:HTTPS_PROXY="http://192.168.19.216:808"; $env:HTTP_PROXY="http://192.168.19.216:808"`
- Long here-docs may hit "文件名或扩展名太长" — split into multiple `Add-Content` calls or write via Python
- BOM breaks `.env` parsing — write with `UTF8Encoding($false)`

## References

- `references/common-tasks.md` — canonical recipes (deploy / KV / DNS / cert / checkin integration)
- `references/scripts-catalog.md` — every script, args, expected output
- `references/account-facts.md` — IDs, endpoints, secrets locations (no secret values)