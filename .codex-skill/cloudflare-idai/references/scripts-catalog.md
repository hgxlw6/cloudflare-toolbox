# Scripts Catalog

All scripts live in `D:/ai-test1/cloudflare-test/scripts/`. Every one reads `.env` via `CloudflareClient.from_env()` in `cf_client.py`.

## cf_client.py
Reusable HTTP client. Import from other scripts:
```python
from cf_client import CloudflareClient
cf = CloudflareClient.from_env()
cf.get("/zones")
cf.paginate("/accounts")
```
Handles Bearer auth, pagination, retries, JSON parsing.

## bootstrap.py
Environment health check. **Run first on any new machine.**

```powershell
python scripts/bootstrap.py                 # dry check
python scripts/bootstrap.py --install       # pip install missing deps
python scripts/bootstrap.py --init-env      # interactive .env creation
```

Checks: Python ≥3.10, git/node/gh, `requests`/`cryptography`, project file layout, `.env` (no BOM, required keys), network to `api.cloudflare.com`, token `verify` (incl. `not_before`/`expires_on`), zone list, workers list, git remote & gh login.
Exit 0 = no FAILs.

## deploy_worker.py
Full-stack deploy: static assets + Worker script + custom domain + optional AI/KV bindings.

```powershell
python scripts/deploy_worker.py `
  --name <script-name> `
  --script <path/to/worker.js> `
  --assets <public_dir> `
  --domain <sub>.idai.asia `
  [--kv NAME=namespace_id] [--kv OTHER=...] `
  [--no-spa] [--only-domain]
```

Details:
- Uploads assets by SHA hash — unchanged files skipped
- Default `not_found_handling: single-page-application` (SPA fallback to `/index.html`)
- Always binds `AI` (Workers AI) and `ASSETS`
- `--kv` may be repeated
- `--only-domain` rebinds custom domain without touching code

## kv.py
KV namespace CRUD.
```powershell
python scripts/kv.py list
python scripts/kv.py create --title <title>
python scripts/kv.py delete --id <ns_id>
python scripts/kv.py get    --id <ns_id> --key <key>
python scripts/kv.py put    --id <ns_id> --key <key> --value '<string>'
```

## dns_records.py
```powershell
python scripts/dns_records.py list --zone idai.asia
python scripts/dns_records.py upsert --zone idai.asia --type CNAME --name foo --content bar.idai.asia --proxied
python scripts/dns_records.py delete --zone idai.asia --name foo --type CNAME
```
Idempotent upsert (matches on name+type).

## list_zones.py
```powershell
python scripts/list_zones.py                    # table
python scripts/list_zones.py --format names     # just hostnames
python scripts/list_zones.py --format json
```

## origin_cert.py
Sign a long-lived Origin CA certificate.
```powershell
python scripts/origin_cert.py --hostname "*.idai.asia" "idai.asia" --days 5475
```
Writes `.pem` + `.key` under `certs/<zone>/` (which is gitignored). Use in Nginx / origin server.