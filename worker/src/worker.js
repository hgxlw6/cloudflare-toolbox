// idai-chat Worker: 静态站点 + /api/chat 使用 Workers AI
// 免费额度：Workers 10 万请求/天 + Workers AI 10k neurons/天

const SYSTEM_PROMPT = `你是 idai.asia 的智能助手，用简洁友好的中文回答用户问题。
如果用户询问站内文档内容，就基于下面提供的文档上下文回答；
如果文档中没有相关内容，就基于常识回答，并明确说明"文档中没有直接提到"。`;

// 简易内嵌文档（你可以随时替换为自己的内容）
const DOCS = [
  {
    title: "关于 idai.asia",
    body: "idai.asia 是一个技术博客与实验站点，托管在 Cloudflare Workers + Workers AI 之上，完全运行于免费额度。",
  },
  {
    title: "如何联系",
    body: "可以通过 GitHub Issue 或邮箱 512799065@qq.com 联系站长。",
  },
  {
    title: "技术栈",
    body: "前端：原生 HTML/CSS/JS。后端：Cloudflare Workers。AI：Workers AI 上的 Llama 3.1 8B。域名与 CDN：Cloudflare。",
  },
];

function buildContext(userMessage) {
  const q = userMessage.toLowerCase();
  const scored = DOCS.map((d) => {
    let score = 0;
    const text = (d.title + " " + d.body).toLowerCase();
    for (const w of q.split(/\s+/).filter(Boolean)) {
      if (text.includes(w)) score += 1;
    }
    return { d, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (scored.length === 0) return "";
  return scored.map((x) => `# ${x.d.title}\n${x.d.body}`).join("\n\n");
}

async function handleChat(request, env) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const messages = Array.isArray(payload.messages) ? payload.messages : null;
  if (!messages || messages.length === 0) {
    return json({ error: "messages required" }, 400);
  }
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const context = lastUser ? buildContext(lastUser.content || "") : "";
  const systemContent = context
    ? `${SYSTEM_PROMPT}\n\n以下是站内文档上下文：\n${context}`
    : SYSTEM_PROMPT;

  const fullMessages = [{ role: "system", content: systemContent }, ...messages];

  try {
    const resp = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: fullMessages,
      max_tokens: 512,
    });
    return json({ reply: resp.response || "", model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast" });
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat") {
      return handleChat(request, env);
    }
    if (url.pathname === "/api/health") {
      return json({ ok: true, ts: Date.now() });
    }
    // 其余交给静态资源
    return env.ASSETS.fetch(request);
  },
};