(function(){
  const D = window.ISTIO_DATA;
  const APP_ID = "istio";
  const ENDPOINT = "https://type.idai.asia/api/checkin";
  const LS_TASKS = "istio.tasks";
  const LS_QUIZ  = "istio.quiz";

  // ---- checkin ----
  (function bootUid(){
    try{
      const m = location.hash.match(/uid=([a-zA-Z0-9_-]{6,32})/);
      if (m) { localStorage.setItem("idai.uid", m[1]); location.hash = ""; }
    }catch(e){}
    const uid = window.CheckIn ? window.CheckIn.getUid() : "-";
    const tag = document.getElementById("uid-tag");
    if (tag) tag.textContent = "uid: " + uid.slice(0,6);
  })();

  document.getElementById("btn-checkin").addEventListener("click", async () => {
    try {
      const uid = window.CheckIn.getUid();
      const data = await window.CheckIn.checkin(ENDPOINT, uid, APP_ID);
      if (data) {
        const s = (data.streak && (data.streak[APP_ID] || data.streak.total)) || "✓";
        document.getElementById("streak-tag").textContent = "🔥 " + s;
        toast("打卡成功，坚持一下 🎉");
      } else toast("打卡失败（后端未返回数据）", true);
    } catch(e){ toast("打卡异常：" + e.message, true); }
  });

  function toast(msg, err){
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:30px;transform:translateX(-50%);padding:10px 18px;border-radius:24px;z-index:99;font-size:14px;"
      + (err ? "background:#3a1a1a;color:#f8b4b4;border:1px solid #f87171" : "background:#0f2a1e;color:#b6f0d0;border:1px solid #34d399");
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  const loadTasks = () => { try { return JSON.parse(localStorage.getItem(LS_TASKS) || "{}"); } catch(e){ return {}; } };
  const saveTasks = (o) => localStorage.setItem(LS_TASKS, JSON.stringify(o));


  function renderChecklist(){
    const LS = "istio.checklist";
    const state = JSON.parse(localStorage.getItem(LS) || "{}");
    let total=0, done=0;
    (D.checklist||[]).forEach((g,gi) => g[1].forEach((_,ii) => { total++; if (state[gi+":"+ii]) done++; }));
    const pct = total ? Math.round(done/total*100) : 0;
    const html = (D.checklist||[]).map((g,gi) => {
      const [title, items] = g;
      const rows = items.map((it,ii) => {
        const k = gi+":"+ii;
        return `<li class="${state[k]?'done':''}"><input type="checkbox" data-k="${k}" ${state[k]?'checked':''}/><label>${esc(it)}</label></li>`;
      }).join("");
      return `<div class="card"><h3>${esc(title)}</h3><ul class="checklist">${rows}</ul></div>`;
    }).join("");
    document.getElementById("app").innerHTML = `
      <h1>生产准入 Checklist</h1>
      <p class="section-lead">上线前逐条核对；建议全部勾完再放量。全部 <b>${total}</b> 条 · 已完成 <b>${done}</b> 条。</p>
      <div class="card"><div class="progressbar"><span style="width:${pct}%"></span></div><div style="text-align:center;margin-top:6px"><span class="stat">${pct}%</span></div></div>
      <div class="grid cols-2">${html}</div>
    `;
    document.querySelectorAll(".checklist input").forEach(el => el.addEventListener("change", ev => {
      const k = ev.target.getAttribute("data-k");
      if (ev.target.checked) state[k]=1; else delete state[k];
      localStorage.setItem(LS, JSON.stringify(state));
      ev.target.closest("li").classList.toggle("done", ev.target.checked);
    }));
  }

  function renderIncidents(){
    const html = (D.incidents||[]).map((it, i) => `
      <div class="card">
        <h3>案例 ${i+1} · ${esc(it.title)}</h3>
        <p><b class="tag err">影响</b> ${esc(it.impact)}</p>
        <p><b class="tag warn">触发</b> ${esc(it.trigger)}</p>
        <p><b class="tag">根因</b> ${esc(it.root_cause)}</p>
        <p><b class="tag ok">修复</b> ${esc(it.fix)}</p>
        <p><b class="tag ok">预防</b> ${esc(it.prevent)}</p>
      </div>
    `).join("");
    document.getElementById("app").innerHTML = `
      <h1>真实事故案例库</h1>
      <p class="section-lead">6 个生产 Istio 事故复盘：影响 → 触发 → 根因 → 修复 → 预防。上线前过一遍，能少踩 80% 的坑。</p>
      ${html}
    `;
  }

  const routes = { "": renderHome, "roadmap": renderRoadmap, "labs": renderLabs, "cheatsheet": renderCheatsheet, "quiz": renderQuiz, "checklist": renderChecklist, "incidents": renderIncidents, "day": renderDay };
  window.addEventListener("hashchange", route);
  window.addEventListener("DOMContentLoaded", route);
  function route(){
    const raw = (location.hash || "#/").replace(/^#\/?/, "");
    const parts = raw.split("/");
    const key = parts[0] || "";
    document.querySelectorAll(".topbar nav a").forEach(a => {
      a.classList.toggle("active", a.getAttribute("href") === "#/" + key);
    });
    (routes[key] || renderHome)(parts.slice(1));
    window.scrollTo(0,0);
    setTimeout(renderMermaid, 60);
  }

  let _mid = 0;
  function renderMermaid(){
    document.querySelectorAll(".mermaid[data-src]:not([data-rendered])").forEach(async el => {
      const src = el.getAttribute("data-src");
      el.setAttribute("data-rendered","1");
      try {
        const { svg } = await mermaid.render("m"+(++_mid), src);
        el.innerHTML = svg;
      } catch(e){ el.innerHTML = "<pre style='color:#f87171'>Mermaid 渲染失败：" + esc(e.message) + "\n\n" + esc(src) + "</pre>"; }
    });
  }

  function progressPct(){
    const t = loadTasks();
    let total=0, done=0;
    D.days.forEach(d => (d.tasks||[]).forEach((_,i) => { total++; if (t[d.day+":"+i]) done++; }));
    return { total, done, pct: total ? Math.round(done/total*100) : 0 };
  }

  function esc(s){ return String(s==null?"":s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

  function copyBtn(text){
    const id = "c" + Math.random().toString(36).slice(2,8);
    setTimeout(() => {
      const b = document.getElementById(id);
      if (!b) return;
      b.onclick = () => {
        navigator.clipboard.writeText(text).then(() => { b.textContent="已复制"; setTimeout(()=>b.textContent="复制",1200); });
      };
    }, 0);
    return `<button class="copy-btn" id="${id}">复制</button>`;
  }

  function renderHome(){
    const p = progressPct();
    const cards = D.days.map(d => {
      const doneAll = (d.tasks||[]).length && (d.tasks||[]).every((_,i) => (loadTasks()[d.day+":"+i]));
      return `<a class="card day-card ${doneAll?'done':''}" href="#/day/${d.day}">
        <div class="day-num">D${d.day}</div>
        <div class="badge-list"><span class="tag">Week ${d.week}</span><span class="tag ok">${d.phase}</span></div>
        <h3 style="margin:6px 0 4px">${d.title}</h3>
        <div style="color:var(--muted);font-size:13px">🎯 ${d.goal}</div>
        <div style="margin-top:8px;color:var(--muted);font-size:12px">⏱ ${d.duration||'-'} · 📖 ${(d.theory||[]).length} 理论 · 💻 ${(d.labs||[]).length} 实战</div>
      </a>`;
    }).join("");
    document.getElementById("app").innerHTML = `
      <section class="hero">
        <h1>14 天从 0 到 Istio 中高级</h1>
        <p>贴近 <b>Istio 1.24 官方文档</b>：每天含 3-5 段理论精讲 + Mermaid 架构图 + 3-5 个可复制粘贴的实战 Lab（含期望输出）。两个综合项目：<code>canary-shop</code> 与 <code>mesh-shop</code>。</p>
        <p style="margin-top:14px"><span class="stat">${p.pct}%</span> <span style="color:var(--muted)">完成 ${p.done}/${p.total} 项验收任务</span></p>
        <div class="progressbar" style="max-width:420px;margin-top:8px"><span style="width:${p.pct}%"></span></div>
      </section>

      <h2>课程亮点</h2>
      <div class="grid cols-3">
        <div class="card"><h3>贴近官方文档</h3><p>每节理论都标注对应 istio.io 原文链接；术语、字段名、错误码严格对齐官方。</p></div>
        <div class="card"><h3>图辅助理解</h3><p>Mermaid 架构图 + 时序图 + 数据流图，Sidecar/Ambient/mTLS/xDS 都能一图看懂。</p></div>
        <div class="card"><h3>实战步骤即拷即用</h3><p>每个 Lab 步骤都给出可执行命令与期望输出，YAML 已通过 istioctl analyze 校验。</p></div>
      </div>

      <h2>14 天路径</h2>
      <div class="grid cols-3">${cards}</div>

      <h2>推荐学习节奏</h2>
      <div class="card">
        <ol>
          <li>点开对应 <b>Day X</b>，先看「理论精讲」的每张卡片，再看架构图；</li>
          <li>按 Lab 顺序在自己 kind 集群上执行命令，对照期望输出；</li>
          <li>完成 <b>验收清单</b> 勾选进度；</li>
          <li>下班前右上角 <span class="kbd">今日打卡</span>，与 idai.asia 其他站共享连击；</li>
          <li>Week1/Week2 收官日交付项目，再刷「自测」验证。</li>
        </ol>
      </div>
    `;
  }

  function renderRoadmap(){
    const rows = D.days.map(d => `
      <tr>
        <td>Day ${d.day}</td>
        <td>W${d.week}</td>
        <td>${d.phase}</td>
        <td><a href="#/day/${d.day}">${d.title}</a></td>
        <td>${d.goal}</td>
        <td>${d.duration||'-'}</td>
      </tr>`).join("");
    document.getElementById("app").innerHTML = `
      <h1>学习路径 · 14 天全览</h1>
      <div class="card"><table>
        <thead><tr><th>#</th><th>周</th><th>阶段</th><th>主题</th><th>目标</th><th>时长</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div class="tips">建议节奏：工作日 2-3 小时理论+实操，周末半天做项目复盘。掉课不追，直接接下一天，周末补。</div>
    `;
  }

  function renderLabs(){
    const t = loadTasks();
    const html = D.days.map(d => {
      const items = (d.tasks||[]).map((task,i) => {
        const k = d.day + ":" + i;
        return `<li class="${t[k]?'done':''}"><input type="checkbox" data-key="${k}" ${t[k]?'checked':''}/><label>${task}</label></li>`;
      }).join("");
      return `<div class="card"><h3><a href="#/day/${d.day}">Day ${d.day} · ${d.title}</a></h3><ul class="checklist">${items}</ul></div>`;
    }).join("");
    document.getElementById("app").innerHTML = `<h1>实战清单 · 全部验收项</h1>${html}`;
    document.querySelectorAll(".checklist input").forEach(el => el.addEventListener("change", onCheck));
  }

  function onCheck(ev){
    const k = ev.target.getAttribute("data-key");
    const t = loadTasks();
    if (ev.target.checked) t[k]=1; else delete t[k];
    saveTasks(t);
    ev.target.closest("li").classList.toggle("done", ev.target.checked);
  }

  function renderCheatsheet(){
    const html = D.cheatsheet.map(([title, rows]) => {
      const trs = rows.map(([k,v]) => `<tr><td style="white-space:nowrap"><code>${k}</code></td><td>${v}</td></tr>`).join("");
      return `<div class="card"><h3>${title}</h3><table>${trs}</table></div>`;
    }).join("");
    document.getElementById("app").innerHTML = `
      <h1>速查表 · Istio Cheatsheet</h1>
      <p class="section-lead">离开网站也能带走的 7 张卡片。</p>
      <div class="grid cols-2">${html}</div>
    `;
  }

  function renderQuiz(){
    const state = JSON.parse(localStorage.getItem(LS_QUIZ) || "{}");
    const html = D.quiz.map((q, qi) => {
      const chosen = state[qi];
      const opts = q.opts.map((o, oi) => {
        let cls = "opt";
        if (chosen !== undefined) {
          if (oi === q.answer) cls += " right";
          else if (oi === chosen) cls += " wrong";
        }
        return `<span class="${cls}" data-q="${qi}" data-o="${oi}">${String.fromCharCode(65+oi)}. ${o}</span>`;
      }).join("");
      const why = chosen !== undefined ? `<div class="tips ${chosen===q.answer?'ok':'err'}" style="margin-top:6px">${chosen===q.answer?'✅':'❌'} ${q.why}</div>` : "";
      return `<div class="quiz-q"><b>Q${qi+1}. ${q.q}</b>${opts}${why}</div>`;
    }).join("");
    let right=0; Object.keys(state).forEach(k => { if (state[k] === D.quiz[+k].answer) right++; });
    document.getElementById("app").innerHTML = `
      <h1>自测 · Istio ${D.quiz.length} 题</h1>
      <div class="card">得分：<span class="stat">${right}/${D.quiz.length}</span> <button id="quiz-reset" style="margin-left:12px;background:#22335e;color:#fff;border:0;padding:4px 10px;border-radius:6px;cursor:pointer">重做</button></div>
      ${html}
    `;
    document.querySelectorAll(".quiz-q .opt").forEach(el => {
      el.addEventListener("click", () => {
        const qi = +el.getAttribute("data-q"), oi = +el.getAttribute("data-o");
        state[qi] = oi;
        localStorage.setItem(LS_QUIZ, JSON.stringify(state));
        renderQuiz();
      });
    });
    document.getElementById("quiz-reset").onclick = () => { localStorage.removeItem(LS_QUIZ); renderQuiz(); };
  }

  function renderDay(parts){
    const day = +parts[0];
    const d = D.days.find(x => x.day === day);
    if (!d) { document.getElementById("app").innerHTML = "<h1>404</h1>"; return; }
    const t = loadTasks();
    const prev = D.days.find(x => x.day === day-1);
    const next = D.days.find(x => x.day === day+1);

    const theoryHtml = (d.theory||[]).map(sec => {
      const refs = (sec.refs||[]).map(([n,u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join("");
      return `<div class="card">
        <h3>${esc(sec.title)}</h3>
        <p>${sec.body.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>')}</p>
        ${refs ? `<div style="font-size:12px;color:var(--muted)">🔗 官方参考：<ul class="mini-refs">${refs}</ul></div>` : ''}
      </div>`;
    }).join("");

    const diagramsHtml = (d.diagrams||[]).map(dg => `
      <div class="card">
        <h3>${esc(dg.title)}</h3>
        <div class="mermaid-wrap"><div class="mermaid" data-src="${esc(dg.mermaid)}"></div></div>
      </div>
    `).join("");

    const labsHtml = (d.labs||[]).map(lab => {
      const steps = (lab.steps||[]).map(s => {
        const cmd = s.cmd ? `<pre>${copyBtn(s.cmd)}<code>${esc(s.cmd)}</code></pre>` : "";
        const exp = s.expect ? `<div><span class="expect-label">期望输出</span></div><pre class="expect"><code>${esc(s.expect)}</code></pre>` : "";
        return `<div class="step"><div class="step-desc">${esc(s.desc)}</div>${cmd}${exp}</div>`;
      }).join("");
      return `<div class="lab-block"><h3>🧪 ${esc(lab.title)}</h3>${steps}</div>`;
    }).join("");

    const tasks = (d.tasks||[]).map((task,i) => {
      const k = d.day + ":" + i;
      return `<li class="${t[k]?'done':''}"><input type="checkbox" data-key="${k}" ${t[k]?'checked':''}/><label>${esc(task)}</label></li>`;
    }).join("");

    const verify = (d.verify||[]).map(v => `<li>${esc(v)}</li>`).join("");
    const gotchas = (d.gotchas||[]).map(g => `<li>${esc(g)}</li>`).join("");
    const refs = (d.refs||[]).map(([n,u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join("");
    const prereq = (d.prereq||[]).map(p => `<li>${esc(p)}</li>`).join("");

    document.getElementById("app").innerHTML = `
      <div><a href="#/">← 首页</a> · <a href="#/roadmap">路径</a></div>
      <h1>Day ${d.day} · ${esc(d.title)}</h1>
      <div class="badge-list"><span class="tag">Week ${d.week}</span><span class="tag ok">${d.phase}</span><span class="tag warn">⏱ ${d.duration||'-'}</span></div>
      <div class="card hl" style="margin-top:10px"><b>🎯 今日目标：</b>${esc(d.goal)}</div>

      ${prereq ? `<h2>🔧 前置条件</h2><div class="prereq"><ul>${prereq}</ul></div>` : ""}

      ${theoryHtml ? `<h2>📖 理论精讲</h2><div class="theory grid cols-2">${theoryHtml}</div>` : ""}
      ${diagramsHtml ? `<h2>🗺 架构图 & 时序图</h2>${diagramsHtml}` : ""}
      ${labsHtml ? `<h2>💻 实战 Lab（可直接复制）</h2>${labsHtml}` : ""}

      ${verify ? `<h2>✅ 验证标准</h2><div class="card"><ul>${verify}</ul></div>` : ""}
      ${gotchas ? `<h2>⚠️ 踩坑提醒</h2><div class="card"><ul>${gotchas}</ul></div>` : ""}

      <h2>📌 今日验收清单</h2>
      <div class="card"><ul class="checklist">${tasks}</ul></div>

      ${refs ? `<h2>🔗 官方参考</h2><div class="card"><ul>${refs}</ul></div>` : ""}

      <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        ${prev ? `<a href="#/day/${prev.day}">← Day ${prev.day} ${esc(prev.title)}</a>` : "<span></span>"}
        <button id="day-checkin" style="background:linear-gradient(90deg,#7dd3fc,#a78bfa);color:#0b1220;border:0;padding:8px 18px;border-radius:6px;font-weight:600;cursor:pointer">完成今日 · 打卡</button>
        ${next ? `<a href="#/day/${next.day}">Day ${next.day} ${esc(next.title)} →</a>` : "<span></span>"}
      </div>
    `;
    document.querySelectorAll(".checklist input").forEach(el => el.addEventListener("change", onCheck));
    document.getElementById("day-checkin").onclick = () => document.getElementById("btn-checkin").click();
  }
})();

