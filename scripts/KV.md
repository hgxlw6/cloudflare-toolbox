# scripts/kv.py — Cloudflare KV 管理

## 前置
Token 需要 **Account · Workers KV Storage · Edit** 权限。

## 命令
```powershell
# 列出账号下的所有 KV namespace
python scripts/kv.py list

# 创建新的 namespace
python scripts/kv.py create --title idai-checkin
#   输出：[创建成功] <id>  title=idai-checkin

# 删除
python scripts/kv.py delete --id <namespace_id>

# 单 key 读/写（调试用）
python scripts/kv.py get --id <ns_id> --key user:abc123
python scripts/kv.py put --id <ns_id> --key user:abc123 --value '{"streak":5}'
```

## 给 Worker 绑定 KV
`deploy_worker.py` 已支持 `--kv NAME=namespace_id`，可以多次：

```powershell
python scripts/deploy_worker.py `
  --name type-idai `
  --script type-app/src/worker.js `
  --assets type-app/public `
  --domain type.idai.asia `
  --kv CHECKIN=c60399eb426b403682e944404c6187f3
```

Worker 里就能用 `env.CHECKIN.get(key)` / `env.CHECKIN.put(key, value)`。

## 当前已建 namespace

| 名字 | ID | 用途 |
|---|---|---|
| `idai-checkin` | `c60399eb426b403682e944404c6187f3` | 打卡/进度数据（`user:<uid>`） |

## 数据 schema（`user:<uid>` 的值）
```json
{
  "uid": "abc123",
  "days": {
    "2026-07-14": { "apps": {"type": 3, "yuwen": 1}, "note": "" }
  },
  "streak": 5,
  "total": 12,
  "longest": 7,
  "lastDate": "2026-07-14"
}
```

时区：`todayStr()` 强制转 Asia/Shanghai，避免跨时区错日。

## 免费额度
- 读：100k/天
- 写：1k/天
- 存储：1GB
- 单 key：25MB

对打卡场景绝对够（每人每天最多写 1 次，读若干次）。
