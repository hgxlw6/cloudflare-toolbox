# bootstrap.py — 新电脑环境体检

## 用途

在**任何一台新电脑**上，克隆本仓库后运行一次，脚本会告诉你还差哪些东西才能开始部署。

## 用法

```powershell
# 只体检，不改动
python scripts/bootstrap.py

# 缺 Python 依赖时自动 pip install
python scripts/bootstrap.py --install

# .env 不存在时交互式生成（会问你 Token / Account / Zone）
python scripts/bootstrap.py --init-env
```

推荐第一次跑：

```powershell
python scripts/bootstrap.py --install --init-env
```

## 检查项（10 项）

| # | 项目 | 通过标准 |
|---|---|---|
| 1 | Python 版本 | ≥ 3.10 |
| 2 | 关键命令 | `git` 必装；`node` `gh` 可选 |
| 3 | Python 依赖 | `requests` + `cryptography` |
| 4 | 项目文件 | scripts/*.py + .gitignore + README |
| 5 | `.env` | 存在 + 无 BOM + `CLOUDFLARE_API_TOKEN` 已填 |
| 6 | 网络 | 能连通 `api.cloudflare.com`（识别代理） |
| 7 | Token 校验 | `/user/tokens/verify` 返回 active，输出生效/过期时间 |
| 8 | Zone 列表 | 能读到账号下的域名（标出 .env 里指定的 zone） |
| 9 | Workers 数量 | 列出账号里现有 Worker Scripts |
| 10 | Git 状态 | remote 已配置；如装了 gh，检查登录 |

## 输出示例

```
── 5. .env ──
  [OK]   .env 编码正常（无 BOM）
  [OK]   CLOUDFLARE_API_TOKEN 已设置 (cfut_d…2360)
  [WARN] CLOUDFLARE_ACCOUNT_ID 未设置（建议填上）

── 7. Cloudflare Token 校验 ──
  [OK]   Token 有效  id=3e0435c40a…  status=active
  [..]   过期时间 expires_on = 2026-12-01T23:59:59Z

── 8. 账号 / Zone ──
  [OK]   可访问 1 个 zone
         · idai.asia  id=952eab…  status=active ⭐
```

## 退出码

- `0` — 无 FAIL（可能有 WARN，可以正常开发）
- `1` — 有 FAIL（阻塞项，需按提示修复）

方便在 CI/自动化里直接判断。

## 新电脑接手完整流程

```powershell
# 1. 拉代码
git clone https://github.com/hgxlw6/cloudflare-toolbox.git
cd cloudflare-toolbox

# 2. 一键体检 + 初始化
python scripts/bootstrap.py --install --init-env

# 3. 通过后直接部署（示例：语文站）
$env:PYTHONIOENCODING="utf-8"
python scripts/deploy_worker.py `
  --name yuwen-idai `
  --script yuwen-app/src/worker.js `
  --assets yuwen-app/public `
  --domain yuwen.idai.asia
```
