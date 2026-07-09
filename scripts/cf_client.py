"""
Cloudflare API 通用客户端

用法:
    from cf_client import CloudflareClient
    cf = CloudflareClient.from_env()
    data = cf.get("/zones", params={"per_page": 50})

认证:
    - 优先读取环境变量 CLOUDFLARE_API_TOKEN（推荐, Bearer Token 方式）
    - 或使用 CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY（Global Key，遗留方式）
    - 支持读取项目根目录下的 .env 文件（无需安装 python-dotenv）
"""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Iterator


API_BASE = "https://api.cloudflare.com/client/v4"


def load_dotenv(path: str | os.PathLike[str] = ".env") -> None:
    """极简 .env 加载，不覆盖已存在的环境变量。"""
    p = Path(path)
    if not p.exists():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


class CloudflareError(RuntimeError):
    def __init__(self, message: str, errors: list[dict] | None = None, status: int | None = None):
        super().__init__(message)
        self.errors = errors or []
        self.status = status


class CloudflareClient:
    def __init__(self, token: str | None = None, email: str | None = None, api_key: str | None = None,
                 base_url: str = API_BASE, timeout: int = 30):
        if not token and not (email and api_key):
            raise ValueError("需要提供 token 或 (email + api_key)")
        self.token = token
        self.email = email
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    @classmethod
    def from_env(cls, dotenv_path: str | os.PathLike[str] = ".env") -> "CloudflareClient":
        load_dotenv(dotenv_path)
        token = os.environ.get("CLOUDFLARE_API_TOKEN")
        email = os.environ.get("CLOUDFLARE_EMAIL")
        api_key = os.environ.get("CLOUDFLARE_API_KEY")
        if not token and not (email and api_key):
            raise SystemExit(
                "未找到 Cloudflare 凭证。请在 .env 或环境变量中设置 CLOUDFLARE_API_TOKEN，"
                "或同时设置 CLOUDFLARE_EMAIL 与 CLOUDFLARE_API_KEY。"
            )
        return cls(token=token, email=email, api_key=api_key)

    def _headers(self) -> dict[str, str]:
        h = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        else:
            h["X-Auth-Email"] = self.email or ""
            h["X-Auth-Key"] = self.api_key or ""
        return h

    def request(self, method: str, path: str, params: dict | None = None, data: Any = None) -> dict:
        url = self.base_url + path
        if params:
            url += "?" + urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
        body = None
        if data is not None:
            body = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(url, data=body, method=method.upper(), headers=self._headers())
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", errors="replace")
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                raise CloudflareError(f"HTTP {e.code}: {raw}", status=e.code) from None
            errors = payload.get("errors") or []
            msg = "; ".join(f"[{er.get('code')}] {er.get('message')}" for er in errors) or raw
            raise CloudflareError(f"HTTP {e.code}: {msg}", errors=errors, status=e.code) from None

        if not payload.get("success", True):
            errors = payload.get("errors") or []
            msg = "; ".join(f"[{er.get('code')}] {er.get('message')}" for er in errors)
            raise CloudflareError(msg or "Cloudflare API returned success=false", errors=errors)
        return payload

    def get(self, path: str, params: dict | None = None) -> dict:
        return self.request("GET", path, params=params)

    def post(self, path: str, data: Any = None) -> dict:
        return self.request("POST", path, data=data)

    def put(self, path: str, data: Any = None) -> dict:
        return self.request("PUT", path, data=data)

    def delete(self, path: str) -> dict:
        return self.request("DELETE", path)

    def paginate(self, path: str, params: dict | None = None, per_page: int = 50) -> Iterator[dict]:
        """自动翻页遍历所有结果条目。"""
        params = dict(params or {})
        params.setdefault("per_page", per_page)
        page = 1
        while True:
            params["page"] = page
            payload = self.get(path, params=params)
            items = payload.get("result") or []
            for item in items:
                yield item
            info = payload.get("result_info") or {}
            total_pages = info.get("total_pages") or 1
            if page >= total_pages or not items:
                break
            page += 1


if __name__ == "__main__":
    cf = CloudflareClient.from_env()
    print(json.dumps(cf.get("/user/tokens/verify"), indent=2, ensure_ascii=False))
