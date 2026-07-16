# Codex Skill · cloudflare-idai

This is the version-controlled copy of the Codex agent skill that lets any Codex conversation know how to operate the idai.asia Cloudflare account and this repo's `scripts/`.

## Install

**Windows (PowerShell):**
```powershell
$target = "$env:USERPROFILE/.codex/skills/cloudflare-idai"
if (Test-Path $target) { Remove-Item $target -Recurse -Force }
Copy-Item .codex-skill/cloudflare-idai $target -Recurse
```

**macOS / Linux:**
```bash
rm -rf ~/.codex/skills/cloudflare-idai
cp -R .codex-skill/cloudflare-idai ~/.codex/skills/
```

Or use the sync helper:
```powershell
python .codex-skill/sync.py
```

## How Codex activates it

The skill triggers automatically when the user asks about:
- Deploying anything to `*.idai.asia`
- Cloudflare Workers/KV/DNS/SSL for that zone
- Adding cross-site check-in to a new site
- Reusing scripts in `D:/ai-test1/cloudflare-test/scripts/`

You don't need to name the skill — Codex will pick it up from the description.

## Files

| File | Purpose |
|---|---|
| `cloudflare-idai/SKILL.md` | Entry point (metadata + high-level guide). Codex loads this first. |
| `cloudflare-idai/agents/openai.yaml` | UI display name / short description |
| `cloudflare-idai/references/common-tasks.md` | Canonical recipes (deploy / KV / DNS / cert / checkin integration) |
| `cloudflare-idai/references/scripts-catalog.md` | Every Python script with args & sample outputs |
| `cloudflare-idai/references/account-facts.md` | IDs, endpoints, KV schema (no secret values) |

## Updating

1. Edit files under `.codex-skill/cloudflare-idai/`
2. Commit + push
3. On each machine, re-run the install step above (or `python .codex-skill/sync.py`)

## Why in-repo

Keeps the operational knowledge next to the code it operates on. Anyone cloning this repo can install the skill and get the same "AI understands my setup" experience without re-explaining.