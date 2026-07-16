# Common Tasks — Cloudflare · idai.asia

All commands assume:
```powershell
cd D:/ai-test1/cloudflare-test
$env:PYTHONIOENCODING="utf-8"
```

---

## 1. Deploy a new site under idai.asia

**Scaffold** (mirrors `math-app`/`yuwen-app`):
```
newname-app/
├─ src/worker.js
└─ public/
   ├─ index.html
   └─ app.js
```

Minimal `src/worker.js`:
```js
export default { async fetch(request, env) { return env.ASSETS.fetch(request); } };
```

**Deploy:**
```powershell
python scripts/deploy_worker.py `
  --name newname-idai `
  --script newname-app/src/worker.js `
  --assets newname-app/public `
  --domain newname.idai.asia
```

**Verify** (wait ~15s for SSL):
```powershell
Start-Sleep 15
Invoke-WebRequest -Uri "https://newname.idai.asia/" -UseBasicParsing
```

Cache-bust static file after redeploy:
```powershell
Invoke-WebRequest -Uri "https://newname.idai.asia/app.js?v=$([DateTimeOffset]::Now.ToUnixTimeSeconds())" -UseBasicParsing
```

---

## 2. Add KV binding to a Worker

Create namespace (once) & remember the ID:
```powershell
python scripts/kv.py create --title newname-data
# → prints [创建成功] <namespace_id>
```

Redeploy with binding:
```powershell
python scripts/deploy_worker.py --name newname-idai `
  --script newname-app/src/worker.js --assets newname-app/public `
  --domain newname.idai.asia `
  --kv MYKV=<namespace_id>
```

In Worker code: `env.MYKV.get(key)` / `env.MYKV.put(key, value)`.

Repeat `--kv` for multiple bindings.

---

## 3. Integrate cross-site check-in on a new site

**Purpose:** every completed activity should call the shared checkin API at `https://type.idai.asia/api/checkin`.

**Step 1** — copy client SDK:
```powershell
Copy-Item type-app/public/checkin-client.js newname-app/public/
```

**Step 2** — before `</body>` in `newname-app/public/index.html`, inject:
```html
<script src="/checkin-client.js"></script>
<script>
(function(){
  const m = location.hash.match(/uid=([a-zA-Z0-9_-]{6,32})/);
  if (m) { try { localStorage.setItem('idai.uid', m[1]); location.hash=''; } catch(e){} }
  window.__APP_ID = 'newname';                                  // unique short id
  window.__CHECKIN_ENDPOINT = 'https://type.idai.asia/api/checkin';
  window.doCheckin = async () => {
    try {
      const uid = CheckIn.getUid();
      return await CheckIn.checkin(window.__CHECKIN_ENDPOINT, uid, window.__APP_ID);
    } catch(e){}
  };
})();
</script>
```

**Step 3** — call `window.doCheckin()` wherever the user finishes a level / action.
Example insertion at start of your `renderResult()`:
```js
try { window.doCheckin && window.doCheckin(); } catch(e){}
```

**Step 4** — update `type-app/public/app.js`'s `APP_META` map to include this new app id (for the dashboard bars). Redeploy `type-idai`.

---

## 4. DNS records

```powershell
python scripts/dns_records.py list --zone idai.asia
python scripts/dns_records.py upsert --zone idai.asia --type CNAME --name blog --content chat.idai.asia --proxied
python scripts/dns_records.py delete --zone idai.asia --name blog --type CNAME
```

Custom domain binding via `deploy_worker.py --domain` is preferred — Cloudflare auto-creates the DNS record + SSL.

---

## 5. Sign a fresh Origin CA cert

```powershell
python scripts/origin_cert.py --hostname "*.idai.asia" "idai.asia" --days 5475
```

Cert files written to gitignored `certs/idai.asia/`. Nginx config on origin uses those.

---

## 6. Environment health-check

Always run first on a new machine / new checkout:
```powershell
python scripts/bootstrap.py --install --init-env
```

Passes if `.env` has a valid non-expired token with required scopes:
- Workers Scripts: Edit
- Workers KV Storage: Edit
- Zone DNS: Edit
- SSL and Certificates: Edit
- Workers AI: Read (only for chat.idai.asia)

---

## 7. Git push behind corporate proxy

```powershell
$env:HTTPS_PROXY="http://192.168.19.216:808"
$env:HTTP_PROXY="http://192.168.19.216:808"
git push
```

PowerShell shows `To https://...` on stderr → renders as red but exit 0 = OK. Look for `<oldsha>..<newsha>  main -> main` line to confirm.

---

## 8. Deploy ALL sites (idempotent)

```powershell
$env:PYTHONIOENCODING="utf-8"
$KV = "c60399eb426b403682e944404c6187f3"

python scripts/deploy_worker.py --name type-idai  --script type-app/src/worker.js  --assets type-app/public  --domain type.idai.asia --kv CHECKIN=$KV
python scripts/deploy_worker.py --name math-idai  --script math-app/src/worker.js  --assets math-app/public  --domain math.idai.asia
python scripts/deploy_worker.py --name yuwen-idai --script yuwen-app/src/worker.js --assets yuwen-app/public --domain yuwen.idai.asia
python scripts/deploy_worker.py --name en-idai    --script en-app/src/worker.js    --assets en-app/public    --domain en.idai.asia
python scripts/deploy_worker.py --name idai-chat  --script worker/src/worker.js    --assets worker/public    --domain chat.idai.asia
```

Only `type-idai` needs `--kv` because it hosts the shared checkin API.

---

## 9. Debug KV data for a UID

```powershell
python scripts/kv.py get --id c60399eb426b403682e944404c6187f3 --key user:<uid>
```

Delete stale test data:
```powershell
python scripts/kv.py put --id c60399eb426b403682e944404c6187f3 --key user:<uid> --value '{}'
```
(There's no CLI delete-key wrapper; use the API directly if needed.)

---

## 10. Gotchas that have bitten us before

- `deploy_worker.py` uploads assets by content hash. If content unchanged nothing re-uploads; that's fine. If it re-uploads every time, check for BOM or CRLF diff in files.
- Long `@'...'@` PowerShell here-docs sometimes fail with "文件名或扩展名太长". Split into multiple `Add-Content` calls or write via a `_p.py` helper.
- Chrome SpeechSynthesis auto-pauses after ~15s. Any long TTS must pause+resume every 8s (see `yuwen-app` `tts._keepAlive`).
- Cloudflare Workers env var `HTTPS_PROXY` may interfere with `urllib.request` — the scripts use `urlopen` directly which honors proxy env; unset locally when testing direct connections.