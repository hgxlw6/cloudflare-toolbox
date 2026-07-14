// type.idai.asia — 静态资源 + 打卡 API
// KV binding: CHECKIN
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }
    return env.ASSETS.fetch(request);
  }
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
};
const j = (obj, status=200) => new Response(JSON.stringify(obj), { status, headers: CORS });
const ok = (data) => j({ ok:true, data });
const err = (msg, status=400) => j({ ok:false, error:msg }, status);

async function handleApi(request, env, url) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (!env.CHECKIN) return err('KV 未绑定', 500);

  const path = url.pathname;
  const uid = (url.searchParams.get('uid') || '').trim();
  if (!/^[a-zA-Z0-9_-]{6,32}$/.test(uid)) return err('无效 uid', 400);
  const key = `user:${uid}`;

  // GET /api/checkin?uid=xxx  → 拉全部
  if (path === '/api/checkin' && request.method === 'GET') {
    const raw = await env.CHECKIN.get(key);
    const data = raw ? JSON.parse(raw) : { uid, days:{}, streak:0, total:0, longest:0, lastDate:null };
    return ok(data);
  }

  // POST /api/checkin?uid=xxx  → 今日打卡
  if (path === '/api/checkin' && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch {}
    const today = todayStr(); // YYYY-MM-DD Asia/Shanghai
    const raw = await env.CHECKIN.get(key);
    const data = raw ? JSON.parse(raw) : { uid, days:{}, streak:0, total:0, longest:0, lastDate:null };
    const firstTimeToday = !data.days[today];
    data.days[today] = {
      apps: mergeApps(data.days[today]?.apps || {}, body.apps || {}),
      note: body.note || data.days[today]?.note || ''
    };
    if (firstTimeToday) {
      data.total = (data.total||0) + 1;
      // 连续天数
      const y = yesterdayOf(today);
      if (data.lastDate === y) data.streak = (data.streak||0) + 1;
      else if (data.lastDate === today) { /* 不该发生 */ }
      else data.streak = 1;
      data.lastDate = today;
      data.longest = Math.max(data.longest||0, data.streak);
    }
    await env.CHECKIN.put(key, JSON.stringify(data));
    return ok(data);
  }

  // POST /api/progress?uid=xxx  → 记录做题/打字进度（可选）
  if (path === '/api/progress' && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch {}
    const raw = await env.CHECKIN.get(key);
    const data = raw ? JSON.parse(raw) : { uid, days:{}, streak:0, total:0, longest:0, lastDate:null };
    const today = todayStr();
    if (!data.days[today]) data.days[today] = { apps:{}, note:'' };
    data.days[today].apps = mergeApps(data.days[today].apps, body.apps || {});
    await env.CHECKIN.put(key, JSON.stringify(data));
    return ok(data);
  }

  return err('路径不存在', 404);
}

function mergeApps(a, b) {
  const out = { ...a };
  for (const k of Object.keys(b)) {
    out[k] = (out[k]||0) + (b[k]||0);
  }
  return out;
}
function todayStr() {
  const d = new Date();
  // 强制 Asia/Shanghai
  const shanghai = new Date(d.getTime() + (8*60 - d.getTimezoneOffset()) * 60000);
  return shanghai.toISOString().slice(0,10);
}
function yesterdayOf(dstr) {
  const d = new Date(dstr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0,10);
}
