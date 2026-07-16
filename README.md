# Cloudflare 教育站矩阵 & 运维工具箱

[![CI](https://github.com/hgxlw6/cloudflare-toolbox/actions/workflows/ci.yml/badge.svg)](https://github.com/hgxlw6/cloudflare-toolbox/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20AI%20%2B%20KV-orange?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers/)

**完全跑在 Cloudflare 免费额度上**的一套小学教育站矩阵 + 通用 Python 运维脚本。

## 🌐 已上线站点（idai.asia）

| 域名 | 内容 | 亮点 |
|---|---|---|
| [math.idai.asia](https://math.idai.asia) | 小学三年级数学 | 17 章节 · Mermaid 思维导图 · 闯关 · 错题本 |
| [yuwen.idai.asia](https://yuwen.idai.asia) | 小学三年级语文 | 生字笔顺（hanzi-writer）· 8 首必背古诗跟读 · 故事屋（8 篇动画寓言） |
| [en.idai.asia](https://en.idai.asia) | 小学三年级英语上下册 | 音标 · TTS · 对话/儿歌/拼写/故事 |
| [type.idai.asia](https://type.idai.asia) | 二三年级打字学习 | 5 指颜色键盘 · 词语拼音 · 陨石竞速 · **每日打卡中心** |
| [chat.idai.asia](https://chat.idai.asia) | AI 聊天助手 | Workers AI · Llama-3.3-70B |

**跨站数据打通**：每站完成一关会自动 checkin 到 `type.idai.asia` 的 KV，5 站共享一个 UID 的连续打卡天数、里程碑徽章、月历。

## 🚀 新电脑接手（1 条命令）

```powershell
git clone https://github.com/hgxlw6/cloudflare-toolbox.git
cd cloudflare-toolbox
python scripts/bootstrap.py --install --init-env
```

`bootstrap.py` 会自动体检 10 项（Python/依赖/.env/Token/Zone/Workers...），FAIL/WARN 都会明确告诉你怎么修。详见 [`scripts/BOOTSTRAP.md`](scripts/BOOTSTRAP.md)。

## 📁 项目结构

```
cloudflare-test/
├─ .env.example                # 环境变量样板
├─ .env                        # 你的凭证（不要提交，已 gitignore）
├─ certs/                      # Origin CA 证书（gitignore）
├─ scripts/                    # Python 运维脚本（zero-deps 纯标准库 + cryptography）
│  ├─ cf_client.py             #   通用 API v4 客户端（可 import）
│  ├─ bootstrap.py             #   ⭐ 新电脑一键环境体检
│  ├─ list_zones.py            #   列域名
│  ├─ dns_records.py           #   DNS 记录 CRUD
│  ├─ origin_cert.py           #   签 Origin CA 证书（最长 15 年）
│  ├─ deploy_worker.py         #   ⭐ 部署 Worker（含静态资源 + AI + KV + 自定义域名）
│  ├─ kv.py                    #   ⭐ KV Namespace 管理
│  └─ *.md                     #   各脚本使用说明
├─ math-app/    | yuwen-app/ | en-app/ | type-app/ | worker/
│  ├─ src/worker.js            # Worker 入口
│  └─ public/                  # 静态资源
└─ .github/workflows/ci.yml    # CI 检查敏感文件 & 格式
```

## 🔑 一次性准备

### 1. API Token

打开 https://dash.cloudflare.com/profile/api-tokens 创建 Token，权限：

| 权限 | 用途 |
|---|---|
| Account · Workers Scripts · Edit | 部署 Worker |
| Account · Workers AI · Read | chat 站调用 AI |
| **Account · Workers KV Storage · Edit** | ⭐ 打卡数据持久化 |
| Account · Account Settings · Read | 拉取账号 ID |
| Zone · Zone · Read | 查 Zone 信息 |
| Zone · DNS · Edit | 自定义域名 |
| Zone · Workers Routes · Edit | 绑域名 |
| Zone · SSL and Certificates · Edit | 签 Origin CA |

> ⚠️ **不要设 Start Date**，否则会被判"未生效"（错误码 10002）。

### 2. `.env`

```env
CLOUDFLARE_API_TOKEN=cfut_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCOUNT_ID=237793524d9280c9a6a30f0fc172d276
CLOUDFLARE_ZONE_NAME=idai.asia
CLOUDFLARE_ZONE_ID=952eabdad2694bf167e2c3f3cc7d0c9b
```

（用 `python scripts/bootstrap.py --init-env` 会交互式生成。）

## 🛠️ 常用命令

### 部署单个学习站

```powershell
$env:PYTHONIOENCODING="utf-8"

# 打字站（唯一需要 KV 绑定）
python scripts/deploy_worker.py --name type-idai --script type-app/src/worker.js `
    --assets type-app/public --domain type.idai.asia `
    --kv CHECKIN=c60399eb426b403682e944404c6187f3

# 其他站（无 KV）
python scripts/deploy_worker.py --name math-idai  --script math-app/src/worker.js  --assets math-app/public  --domain math.idai.asia
python scripts/deploy_worker.py --name yuwen-idai --script yuwen-app/src/worker.js --assets yuwen-app/public --domain yuwen.idai.asia
python scripts/deploy_worker.py --name en-idai    --script en-app/src/worker.js    --assets en-app/public    --domain en.idai.asia
python scripts/deploy_worker.py --name idai-chat  --script worker/src/worker.js    --assets worker/public    --domain chat.idai.asia
```

只想重绑域名不重上传代码：加 `--only-domain`。

### 一键部署所有站（PowerShell）

```powershell
$env:PYTHONIOENCODING="utf-8"
$KV = "c60399eb426b403682e944404c6187f3"
python scripts/deploy_worker.py --name type-idai  --script type-app/src/worker.js  --assets type-app/public  --domain type.idai.asia --kv CHECKIN=$KV
python scripts/deploy_worker.py --name math-idai  --script math-app/src/worker.js  --assets math-app/public  --domain math.idai.asia
python scripts/deploy_worker.py --name yuwen-idai --script yuwen-app/src/worker.js --assets yuwen-app/public --domain yuwen.idai.asia
python scripts/deploy_worker.py --name en-idai    --script en-app/src/worker.js    --assets en-app/public    --domain en.idai.asia
python scripts/deploy_worker.py --name idai-chat  --script worker/src/worker.js    --assets worker/public    --domain chat.idai.asia
```

### 域名 / DNS / 证书

```powershell
python scripts/list_zones.py                    # 表格 / --format names|json
python scripts/dns_records.py list --zone idai.asia
python scripts/dns_records.py upsert --zone idai.asia --type CNAME --name docs --content chat.idai.asia --proxied
python scripts/dns_records.py delete --zone idai.asia --name docs --type CNAME
python scripts/origin_cert.py --hostname "*.idai.asia" "idai.asia" --days 5475   # 15 年 Origin CA
```

### KV 管理（打卡数据）

```powershell
python scripts/kv.py list                                   # 列所有 namespace
python scripts/kv.py create --title idai-checkin            # 建新 namespace
python scripts/kv.py get --id <ns> --key user:abc123        # 读某个用户
python scripts/kv.py put --id <ns> --key user:abc123 --value '{"streak":5}'
python scripts/kv.py delete --id <ns>                       # 删除 namespace
```

详细文档见 [`scripts/KV.md`](scripts/KV.md)。

**打卡数据 schema**（KV key = `user:<uid>`）：
```json
{
  "uid": "abc123",
  "days": { "2026-07-14": { "apps": {"math":1,"yuwen":1,"type":3}, "note":"" } },
  "streak": 5, "longest": 7, "total": 12, "lastDate": "2026-07-14"
}
```

## 📅 每日打卡 & 里程碑徽章

- **匿名 UID**：首次打开自动生成，存 localStorage
- **服务端持久化**：Cloudflare KV，浏览器清缓存/换设备都不丢
- **跨站聚合**：math/yuwen/en/type/chat 5 站完成关卡后自动 checkin → 同一 UID 累加
- **月历图**：绿色格=已打卡，右下角小数字=当日活动次数
- **9 个里程碑徽章**：1/3/7/14/30/60/100/180/365 天，达成时全站大屏弹窗
- **换设备同步**：打卡页显示 UID + 二维码，新设备扫码或粘贴同步码即可

访问 https://type.idai.asia/ → 右上「📅 每日打卡」查看。

## 🏗️ 架构（完全免费）

| 组件 | 用途 | 免费额度 |
|---|---|---|
| Cloudflare Workers | 5 个站的运行时 | 10 万请求/天 |
| Workers Static Assets | 静态文件 | 无限，边缘缓存 |
| Workers AI | chat 站的 Llama-3.3-70B | 10k neurons/天 |
| **KV Storage** | 打卡数据 | 100k 读/1k 写/1GB 存储 |
| SSL / DNS / CDN | 全站 HTTPS + 全球加速 | 无限 |
| Origin CA | 源站证书 | 15 年长效 |

一个孩子每天平均 20-30 次打卡请求，可支撑 30+ 家庭并发使用。

## 🧑‍💻 复用 `cf_client.py` 写自己的脚本

```python
from cf_client import CloudflareClient
cf = CloudflareClient.from_env()

for acc in cf.paginate("/accounts"):
    print(acc["id"], acc["name"])

info = cf.get("/user/tokens/verify")
```

Cloudflare API 文档：https://developers.cloudflare.com/api/

## 🔗 前端 checkin SDK

各站 `public/checkin-client.js` 提供 `window.CheckIn`：

```js
const uid = CheckIn.getUid();                       // 自动生成或读 localStorage
await CheckIn.checkin(endpoint, uid, 'math');       // POST 打卡
await CheckIn.fetchData(endpoint, uid);             // GET 完整数据
```

endpoint 用 `https://type.idai.asia/api/checkin`（type 站 Worker 已开 CORS）。

## 💡 修改站内文档 / 提示词

- Chat 语料：`worker/src/worker.js` 里的 `DOCS` 数组
- 系统提示词：同文件 `SYSTEM_PROMPT`
- 换模型：改 `env.AI.run("<model-id>", ...)`，免费模型列表见 https://developers.cloudflare.com/workers-ai/models/

## 📖 各脚本详细文档

- [`scripts/BOOTSTRAP.md`](scripts/BOOTSTRAP.md) — 新电脑一键就绪
- [`scripts/KV.md`](scripts/KV.md) — KV Namespace 管理 & 数据模型



## 🤖 作为 Codex Agent Skill 使用

本仓库自带一个 Codex Skill（`.codex-skill/cloudflare-idai/`），装完后**任何仓库、任何新对话**里，只要你对 Codex 说「帮我部署到 xxx.idai.asia」「加个新学习站」之类的话，Codex 会自动加载这套操作知识（Account ID / Zone ID / KV / 脚本路径 / 部署流程 / 打卡集成方式 / Windows 常见坑），直接使用本仓库的 `scripts/` 完成任务。

### 安装（一次性）

**Windows / PowerShell：**
```powershell
python .codex-skill/sync.py
```

**macOS / Linux：**
```bash
python3 .codex-skill/sync.py
```

或手动复制：
```powershell
Copy-Item .codex-skill/cloudflare-idai "$env:USERPROFILE/.codex/skills/cloudflare-idai" -Recurse -Force
```

### 效果

装完之后在**任何目录**新开 Codex 对话都可以说：

- 「帮我部署一个 blog.idai.asia，就一个静态首页」
- 「给 blog 站也加上跨站打卡」
- 「idai.asia 现在还有哪些子域？」
- 「续签一下 Origin CA 证书」

Codex 会自动读 `~/.codex/skills/cloudflare-idai/SKILL.md`，找到本仓库路径，用 `scripts/deploy_worker.py` / `scripts/kv.py` 等完成任务，不需要你再手动指定 token/account_id/zone_id。

### 更新

改完 `.codex-skill/` 里的任何文件，重新跑 `python .codex-skill/sync.py` 即可。所以修改 skill 也走 git，其他机器 pull 后再同步一次。



MIT — 见 [`LICENSE`](LICENSE)
