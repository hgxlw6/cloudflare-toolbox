# Cloudflare 运维工具箱

[![CI](https://github.com/hgxlw6/cloudflare-toolbox/actions/workflows/ci.yml/badge.svg)](https://github.com/hgxlw6/cloudflare-toolbox/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20AI-orange?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers/)


基于 Cloudflare REST API v4 的通用 Python 工具（标准库 zero-deps），可长期复用。

## 项目结构

```
cloudflare-test/
├─ .env.example
├─ .env                       # 你的凭证（不要提交）
├─ scripts/
│  ├─ cf_client.py            # 通用 API 客户端（可 import）
│  ├─ list_zones.py           # 列出账号下所有域名
│  ├─ dns_records.py          # DNS 记录 list / upsert / delete
│  └─ deploy_worker.py        # 部署 Worker（含静态资源 + AI 绑定 + 自定义域名）
└─ worker/                    # 一个示例：静态站 + AI 聊天
   ├─ wrangler.toml           # 供 wrangler 使用（可选）
   ├─ src/worker.js           # Worker 入口
   └─ public/index.html       # 静态首页
```

## 一次性准备

1. 打开 https://dash.cloudflare.com/profile/api-tokens 创建 API Token。
2. 建议权限（用于全部脚本）：
   - Account · Workers Scripts · Edit
   - Account · Workers AI · Edit
   - Zone · Zone · Read
   - Zone · DNS · Edit
   - Zone · Workers Routes · Edit
   - 全部资源包含所有账号 / 所有 Zone
   - **不要设置 Start Date**，否则会因未生效被拒（错误码 10002）
3. 拷贝 `.env.example` → `.env` 填入 token：

   ```
   CLOUDFLARE_API_TOKEN=你的token
   ```

   如需锁定账号，可再加一行 `CLOUDFLARE_ACCOUNT_ID=...`（`list_zones.py` 已可帮你查出）。

## 常用命令

### 1) 列域名

```powershell
python scripts\list_zones.py                    # 表格
python scripts\list_zones.py --format names     # 只输出域名
python scripts\list_zones.py --format json      # JSON
```

> Windows 终端中文乱码：先 `chcp 65001` 切 UTF-8，或用 `--format names/json`。

### 2) DNS 记录

```powershell
python scripts\dns_records.py list --zone idai.asia
python scripts\dns_records.py upsert --zone idai.asia --type CNAME --name docs --content chat.idai.asia --proxied
python scripts\dns_records.py delete --zone idai.asia --name docs --type CNAME
```

### 3) 部署 Worker（静态站 + AI 聊天示例）

```powershell
python scripts\deploy_worker.py `
    --name idai-chat `
    --script worker\src\worker.js `
    --assets worker\public `
    --domain chat.idai.asia
```

- 自动上传静态资源（增量 hash 对比）
- 自动写入 AI 绑定和 ASSETS 绑定
- 自动在正确的 Zone 上绑 Custom Domain（同时 Cloudflare 会自动创建 DNS 记录 + 免费 SSL）
- 只想重新绑域名不动代码：加 `--only-domain`

也可以用 wrangler（需要 Node ≥ 22）：
```powershell
cd worker
$env:CLOUDFLARE_API_TOKEN="<token>"
npx wrangler@3 deploy   # 若 node<22 用 v3；node>=22 用 latest
```

## 已部署站点

- 前台：https://chat.idai.asia
- 健康检查：https://chat.idai.asia/api/health
- Chat API：`POST https://chat.idai.asia/api/chat`
  ```json
  { "messages": [{"role":"user","content":"你好"}] }
  ```

**架构（完全免费）**
- Cloudflare Workers（免费额度 100k 请求/天）
- Workers Static Assets（Worker 内置，免费）
- Workers AI · `@cf/meta/llama-3.3-70b-instruct-fp8-fast`（免费额度 10k neurons/天）
- SSL、DNS、CDN 全部由 Cloudflare 免费提供

## 复用 `cf_client.py` 写自己的脚本

```python
from cf_client import CloudflareClient
cf = CloudflareClient.from_env()

# 任意 REST 端点
for acc in cf.paginate("/accounts"):
    print(acc["id"], acc["name"])

# 通用 GET/POST/PUT/DELETE
info = cf.get("/user/tokens/verify")
```

Cloudflare API 文档：https://developers.cloudflare.com/api/

## 修改站内文档 / 提示词

- 文档语料在 `worker/src/worker.js` 中的 `DOCS` 数组，直接改后重新 `deploy_worker.py` 即可。
- 系统提示词在同文件 `SYSTEM_PROMPT`。
- 想换模型：改 `env.AI.run("<model-id>", ...)`。免费模型列表见 https://developers.cloudflare.com/workers-ai/models/