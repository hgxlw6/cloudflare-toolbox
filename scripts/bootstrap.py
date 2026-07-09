"""
bootstrap.py — 新电脑环境体检 & 一键就绪

用法：
    python scripts/bootstrap.py               # 只体检，不改动
    python scripts/bootstrap.py --install     # 缺依赖时自动 pip install
    python scripts/bootstrap.py --init-env    # 若 .env 不存在，交互式生成

检查项：
  1. Python 版本 >= 3.10
  2. 关键命令：git / node（可选）
  3. Python 依赖：requests / cryptography
  4. 项目文件：scripts/ .gitignore 等是否齐全
  5. .env：文件存在 + 关键变量齐全 + 无 BOM
  6. 网络：能否访问 api.cloudflare.com（识别是否需要代理）
  7. Cloudflare Token：调用 /user/tokens/verify 验证有效性 + 是否已生效
  8. 账号：列出 zones，看能否读到 idai.asia，输出 zone_id
  9. Workers：列 workers 数量、账号资源可用性
 10. Git：远程地址 / 是否已登录 gh
"""
from __future__ import annotations
import argparse
import json
import os
import shutil
import subprocess
import sys
import urllib.request
import urllib.error
import ssl
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

# ---------- 打印工具 ----------
def _color(code: str, s: str) -> str:
    if os.environ.get("NO_COLOR"): return s
    return f"\x1b[{code}m{s}\x1b[0m"
def ok(msg):   print(_color("32", "  [OK]   ") + msg)
def warn(msg): print(_color("33", "  [WARN] ") + msg)
def err(msg):  print(_color("31", "  [FAIL] ") + msg)
def info(msg): print(_color("36", "  [..]   ") + msg)
def title(msg):
    print()
    print(_color("1;35", f"── {msg} ──"))

RESULTS = {"ok": 0, "warn": 0, "fail": 0}
def record(kind):
    RESULTS[kind] = RESULTS.get(kind, 0) + 1

# ---------- 检查项 ----------
def check_python():
    title("1. Python 版本")
    v = sys.version_info
    s = f"{v.major}.{v.minor}.{v.micro}"
    if v >= (3, 10):
        ok(f"Python {s} (>= 3.10)"); record("ok")
    else:
        err(f"Python {s} 太旧，建议 >= 3.10"); record("fail")

def which(cmd):
    return shutil.which(cmd)

def check_commands():
    title("2. 关键命令")
    for name, required in [("git", True), ("node", False), ("gh", False)]:
        p = which(name)
        if p:
            try:
                v = subprocess.check_output([name, "--version"], stderr=subprocess.STDOUT, text=True, timeout=5).strip().splitlines()[0]
                ok(f"{name}: {p}  ({v})"); record("ok")
            except Exception:
                ok(f"{name}: {p}"); record("ok")
        else:
            if required:
                err(f"{name} 未安装（必需）"); record("fail")
            else:
                warn(f"{name} 未安装（可选，用于本地语法检查/GitHub 登录）"); record("warn")

def check_python_deps(auto_install: bool):
    title("3. Python 依赖")
    need = [("requests", "requests"), ("cryptography", "cryptography")]
    missing = []
    for mod, pkg in need:
        try:
            __import__(mod)
            ok(f"{mod} 已安装"); record("ok")
        except Exception:
            err(f"{mod} 未安装"); record("fail"); missing.append(pkg)
    if missing:
        if auto_install:
            info(f"自动安装：pip install {' '.join(missing)}")
            r = subprocess.run([sys.executable, "-m", "pip", "install", *missing])
            if r.returncode == 0:
                ok("依赖安装完成"); record("ok")
            else:
                err("pip install 失败"); record("fail")
        else:
            warn(f"运行 `python -m pip install {' '.join(missing)}` 安装；或加 --install 让本脚本自动装")

def check_project_files():
    title("4. 项目文件")
    must = [
        "scripts/cf_client.py",
        "scripts/deploy_worker.py",
        "scripts/list_zones.py",
        "scripts/dns_records.py",
        "scripts/origin_cert.py",
        ".gitignore",
        "README.md",
    ]
    for rel in must:
        p = ROOT / rel
        if p.exists():
            ok(f"{rel}"); record("ok")
        else:
            err(f"{rel} 缺失"); record("fail")

def _read_dotenv(p: Path) -> dict:
    env = {}
    raw = p.read_bytes()
    has_bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig", errors="replace")
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env, has_bom

def init_env_interactive():
    p = ROOT / ".env"
    if p.exists():
        info(".env 已存在，跳过初始化")
        return
    print()
    print(_color("1;36", "首次初始化 .env（回车保留默认值）"))
    token = input("CLOUDFLARE_API_TOKEN (cfut_... 或 API Token): ").strip()
    account = input("CLOUDFLARE_ACCOUNT_ID [237793524d9280c9a6a30f0fc172d276]: ").strip() or "237793524d9280c9a6a30f0fc172d276"
    zone_name = input("CLOUDFLARE_ZONE_NAME [idai.asia]: ").strip() or "idai.asia"
    zone_id = input("CLOUDFLARE_ZONE_ID [952eabdad2694bf167e2c3f3cc7d0c9b]: ").strip() or "952eabdad2694bf167e2c3f3cc7d0c9b"
    content = (
        f"CLOUDFLARE_API_TOKEN={token}\n"
        f"CLOUDFLARE_ACCOUNT_ID={account}\n"
        f"CLOUDFLARE_ZONE_NAME={zone_name}\n"
        f"CLOUDFLARE_ZONE_ID={zone_id}\n"
    )
    p.write_bytes(content.encode("utf-8"))  # 不带 BOM
    ok(f"已生成 {p}")

def check_env():
    title("5. .env")
    p = ROOT / ".env"
    if not p.exists():
        err(".env 不存在。请先运行 `python scripts/bootstrap.py --init-env` 生成"); record("fail")
        return None
    env, bom = _read_dotenv(p)
    if bom:
        warn(".env 有 UTF-8 BOM，建议改成无 BOM（可能导致解析异常）"); record("warn")
    else:
        ok(".env 编码正常（无 BOM）"); record("ok")

    keys_required = ["CLOUDFLARE_API_TOKEN"]
    keys_recommend = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ZONE_NAME", "CLOUDFLARE_ZONE_ID"]
    for k in keys_required:
        if env.get(k):
            v = env[k]; mask = v[:6] + "…" + v[-4:] if len(v) > 12 else "***"
            ok(f"{k} 已设置 ({mask})"); record("ok")
        else:
            err(f"{k} 未设置"); record("fail")
    for k in keys_recommend:
        if env.get(k):
            ok(f"{k}={env[k]}"); record("ok")
        else:
            warn(f"{k} 未设置（建议填上）"); record("warn")
    return env

def http_get(url, headers=None, timeout=10, proxy=None):
    req = urllib.request.Request(url, headers=headers or {})
    if proxy:
        req.set_proxy(proxy.replace("http://", "").replace("https://", ""), "http")
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
        return r.status, r.read().decode("utf-8", errors="replace")

def check_network():
    title("6. 网络连通性")
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("HTTP_PROXY")
    if proxy:
        info(f"检测到代理环境变量：{proxy}")
    url = "https://api.cloudflare.com/client/v4/ips"
    try:
        s, _ = http_get(url, timeout=8)
        if s == 200:
            ok("能直连 api.cloudflare.com"); record("ok"); return True
    except Exception as e:
        warn(f"直连失败：{e}"); record("warn")
    # 尝试用系统代理（urllib 默认会用）
    try:
        s, _ = http_get(url, timeout=10)
        if s == 200:
            ok("通过代理能访问 api.cloudflare.com"); record("ok"); return True
    except Exception as e:
        err(f"访问失败：{e}"); record("fail")
    return False

def check_token(env: dict):
    title("7. Cloudflare Token 校验")
    token = env.get("CLOUDFLARE_API_TOKEN") if env else None
    if not token:
        err("跳过：无 token"); record("fail"); return None
    try:
        s, body = http_get("https://api.cloudflare.com/client/v4/user/tokens/verify",
                           headers={"Authorization": f"Bearer {token}"}, timeout=10)
        data = json.loads(body)
    except Exception as e:
        err(f"请求失败：{e}"); record("fail"); return None
    if data.get("success"):
        r = data.get("result", {})
        status = r.get("status")
        ok(f"Token 有效  id={r.get('id','?')[:10]}…  status={status}")
        record("ok")
        # 提示 not_before / expires_on
        if r.get("not_before"):
            info(f"生效时间 not_before = {r['not_before']}")
        if r.get("expires_on"):
            info(f"过期时间 expires_on = {r['expires_on']}")
        # 检查 messages 里是否有"未生效"提示
        for m in data.get("messages", []) or []:
            if "can not be used before" in (m.get("message") or ""):
                warn(f"Token 尚未生效：{m['message']}"); record("warn")
        return token
    else:
        errs = "; ".join(e.get("message", "") for e in data.get("errors", []))
        err(f"Token 无效：{errs or body[:200]}"); record("fail")
        return None

def check_zones(env: dict, token: str):
    title("8. 账号 / Zone")
    try:
        s, body = http_get("https://api.cloudflare.com/client/v4/zones?per_page=50",
                           headers={"Authorization": f"Bearer {token}"}, timeout=10)
        data = json.loads(body)
    except Exception as e:
        err(f"读取 zones 失败：{e}"); record("fail"); return
    if not data.get("success"):
        err(f"读取 zones 失败：{data.get('errors')}"); record("fail"); return
    zones = data.get("result", [])
    ok(f"可访问 {len(zones)} 个 zone"); record("ok")
    target = (env or {}).get("CLOUDFLARE_ZONE_NAME")
    for z in zones:
        mark = " ⭐" if target and z.get("name") == target else ""
        print(f"         · {z.get('name'):<24} id={z.get('id')}  status={z.get('status')}{mark}")
    if target and not any(z.get("name") == target for z in zones):
        warn(f".env 里的 CLOUDFLARE_ZONE_NAME={target} 未在账号里找到"); record("warn")

def check_workers(env: dict, token: str):
    title("9. Workers 资源")
    account = (env or {}).get("CLOUDFLARE_ACCOUNT_ID")
    if not account:
        warn("缺少 CLOUDFLARE_ACCOUNT_ID，跳过"); record("warn"); return
    try:
        s, body = http_get(
            f"https://api.cloudflare.com/client/v4/accounts/{account}/workers/scripts",
            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        data = json.loads(body)
    except Exception as e:
        err(f"读取 workers 失败：{e}"); record("fail"); return
    if not data.get("success"):
        err(f"读取 workers 失败：{data.get('errors')}"); record("fail"); return
    scripts = data.get("result", [])
    ok(f"账号下共有 {len(scripts)} 个 Worker Script"); record("ok")
    for w in scripts:
        print(f"         · {w.get('id')}   modified={w.get('modified_on','')[:19]}")

def check_git():
    title("10. Git 仓库状态")
    if not which("git"):
        warn("git 未安装，跳过"); record("warn"); return
    try:
        remote = subprocess.check_output(["git", "-C", str(ROOT), "remote", "-v"], text=True, timeout=5).strip()
        if remote:
            ok("git 远程："); record("ok")
            for line in remote.splitlines(): print("         " + line)
        else:
            warn("无远程仓库"); record("warn")
    except Exception as e:
        warn(f"git 未初始化：{e}"); record("warn")
    # gh 登录状态
    if which("gh"):
        try:
            out = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True, timeout=5)
            if out.returncode == 0:
                ok("gh 已登录"); record("ok")
            else:
                warn("gh 未登录（若要推送可运行 `gh auth login`）"); record("warn")
        except Exception:
            pass

# ---------- main ----------
def main():
    ap = argparse.ArgumentParser(description="新电脑环境体检")
    ap.add_argument("--install", action="store_true", help="缺 Python 依赖时自动 pip install")
    ap.add_argument("--init-env", action="store_true", help=".env 不存在时交互生成")
    args = ap.parse_args()

    print(_color("1;36", f"cloudflare-toolbox 环境体检  @ {ROOT}"))

    check_python()
    check_commands()
    check_python_deps(args.install)
    check_project_files()
    if args.init_env:
        init_env_interactive()
    env = check_env()
    net_ok = check_network()
    token = check_token(env) if env and net_ok else None
    if env and token:
        check_zones(env, token)
        check_workers(env, token)
    check_git()

    print()
    print(_color("1;35", "══════ 体检结果 ══════"))
    print(f"  ✅ OK   : {RESULTS['ok']}")
    print(f"  ⚠️  WARN : {RESULTS['warn']}")
    print(f"  ❌ FAIL : {RESULTS['fail']}")
    if RESULTS["fail"] == 0 and RESULTS["warn"] == 0:
        print(_color("1;32", "🎉 一切就绪，直接开发部署即可！"))
    elif RESULTS["fail"] == 0:
        print(_color("1;33", "⚠️ 可以工作，但有几处建议关注。"))
    else:
        print(_color("1;31", "❌ 存在阻塞项，请根据上方 [FAIL] 逐条修复后再试。"))
    sys.exit(0 if RESULTS["fail"] == 0 else 1)

if __name__ == "__main__":
    main()
