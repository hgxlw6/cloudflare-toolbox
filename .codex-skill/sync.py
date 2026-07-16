"""
Sync .codex-skill/ → ~/.codex/skills/
Idempotent. Overwrites existing files (skill is source-controlled here).
"""
from pathlib import Path
import shutil
import sys

src = Path(__file__).resolve().parent / "cloudflare-idai"
if not src.exists():
    raise SystemExit(f"source missing: {src}")

home = Path.home() / ".codex" / "skills"
home.mkdir(parents=True, exist_ok=True)
dst = home / "cloudflare-idai"

if dst.exists():
    shutil.rmtree(dst)
shutil.copytree(src, dst)
print(f"[OK] Installed skill to {dst}")
print(f"     Total files: {sum(1 for _ in dst.rglob('*') if _.is_file())}")