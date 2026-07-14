/* 快乐打字 SPA
 * 模式：
 *   1) 键位闯关 — 认键位，虚拟键盘高亮，手指颜色标注
 *   2) 词语拼音 — 二三年级词库，输拼音 → 显汉字
 *   3) 句子闯关 — 英文短句 / 诗句拼音
 *   4) 陨石竞速 — 单词从天而降，输完消灭，训练反应
 */

const app = document.getElementById('app');
let state = { view:'home' };

// ===== 音效（Web Audio 生成，无需外链）=====
const beep = (freq=800, dur=60, type='sine', gain=0.06) => {
  try {
    const ctx = beep.ctx || (beep.ctx = new (window.AudioContext||window.webkitAudioContext)());
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = gain;
    o.connect(g); g.connect(ctx.destination);
    o.start(); setTimeout(()=>{ o.stop(); }, dur);
  } catch(e){}
};
const sfx = {
  ok:   () => beep(880, 50, 'sine'),
  bad:  () => beep(180, 100, 'square', 0.05),
  boom: () => { beep(300,60,'triangle',0.09); setTimeout(()=>beep(150,80,'sawtooth',0.08), 40); },
  win:  () => { [523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,120,'triangle',0.08),i*90)); }
};

// ===== 存储 =====
const store = {
  ns:'type.v1',
  _r(){ try{ return JSON.parse(localStorage.getItem(this.ns)||'{}'); } catch{return {}} },
  _w(d){ localStorage.setItem(this.ns, JSON.stringify(d)); },
  get(id){ const d=this._r(); return d[id]||{stars:0, bestWpm:0, bestAcc:0, done:false}; },
  set(id,patch){ const d=this._r(); d[id]=Object.assign(this.get(id),patch); this._w(d); },
  addMeteor(score){ const d=this._r(); d.meteor = Math.max(d.meteor||0, score); this._w(d); },
  meteorBest(){ return this._r().meteor||0; },
  reset(){ localStorage.removeItem(this.ns); }
};


// ===== 打卡（服务端持久化） =====
const APP_ID = 'type';
const ENDPOINT = '/api/checkin';
async function doCheckin() {
  try {
    const uid = CheckIn.getUid();
    const data = await CheckIn.checkin(ENDPOINT, uid, APP_ID);
    if (data && data.streak && typeof MILESTONES !== 'undefined' && MILESTONES.find(x=>x.n===data.streak)) {
      // 全站首次达标弹一次
      const key = 'ms.shown.' + data.streak;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        try { showMilestone(data.streak); } catch(e){}
      }
    }
    return data;
  } catch(e) { console.warn('checkin failed', e); return null; }
}
async function loadCheckin() {
  try {
    const uid = CheckIn.getUid();
    return await CheckIn.fetchData(ENDPOINT, uid);
  } catch(e) { return null; }
}

const rnd = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick = a=>a[Math.floor(Math.random()*a.length)];
const shuffle = a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };

function nav(view, extra={}){ Object.assign(state, extra, {view}); render(); window.scrollTo(0,0); }
function star(n){ return '★★★'.slice(0,n) + '☆☆☆'.slice(0,3-n); }
function firework(){
  const es=['🎉','🎊','⭐','🌟','✨','🏆','🎈'];
  for(let i=0;i<14;i++) setTimeout(()=>{
    const el=document.createElement('div'); el.className='firework'; el.textContent=pick(es);
    el.style.left=(Math.random()*window.innerWidth)+'px';
    el.style.top=(window.innerHeight*.4+Math.random()*100)+'px';
    document.body.appendChild(el); setTimeout(()=>el.remove(),1500);
  }, i*70);
}

// ===== 虚拟键盘 =====
function keyboardHtml(hot='') {
  const finger = window.KEY_FINGER || {};
  const cellsFor = (row, keys) => keys.split('').map(k => {
    const fk = finger[k.toLowerCase()] ?? '';
    const hotCls = hot && hot.toLowerCase() === k.toLowerCase() ? ' hot' : '';
    return `<span class="k finger-${fk}${hotCls}" data-k="${k}">${k}</span>`;
  }).join('');
  const rows = (window.KEY_LAYOUT||[]);
  return `<div class="kbd">
    <div class="row">${cellsFor('num', rows[0].keys)}</div>
    <div class="row"><span class="k wide">Tab</span>${cellsFor('top', rows[1].keys)}</div>
    <div class="row"><span class="k wide">Caps</span>${cellsFor('home', rows[2].keys)}<span class="k wide">Enter</span></div>
    <div class="row"><span class="k wide">Shift</span>${cellsFor('bottom', rows[3].keys)}<span class="k wide">Shift</span></div>
    <div class="row"><span class="k">Ctrl</span><span class="k">Alt</span><span class="k space ${hot===' '?'hot':''}" data-k=" ">Space</span><span class="k">Alt</span><span class="k">Ctrl</span></div>
  </div>`;
}
function fingerHint(ch) {
  const f = ['小指','无名指','中指','食指','拇指'];
  const c = ['#f87171','#fb923c','#facc15','#4ade80','#38bdf8'];
  const finger = window.KEY_FINGER || {};
  const idx = finger[String(ch||'').toLowerCase()];
  if (idx === undefined) return '';
  const side = ('qazwsxedcrfvtgb'.includes(String(ch).toLowerCase())) ? '左手' : '右手';
  return `<div class="hand-hint">👉 用 <b style="color:${c[idx]}">${side}${f[idx]}</b> 敲 <b>「${ch===' '?'空格':ch}」</b></div>`;
}

// ===== 首页 =====
function renderHome() {
  const modes = [
    { id:'key',    emoji:'⌨️', title:'键位闯关', desc:'认识键盘，10 个关卡逐步扩展键位', view:'key-select' },
    { id:'pin',    emoji:'🀄', title:'词语拼音', desc:'二三年级词库，输入拼音打出汉字', view:'pin-select' },
    { id:'sent',   emoji:'📝', title:'句子练习', desc:'英文短句 · 唐诗拼音 · 鼓励语', view:'sent-select' },
    { id:'meteor', emoji:'☄️', title:'陨石竞速', desc:'单词从天而降，输完消灭它！', view:'meteor' }
  ];
  const totalStars = (window.KEY_STAGES.concat(window.PIN_STAGES).concat(window.SENTENCE_STAGES)).reduce((s,x)=>s+store.get(x.id).stars, 0);
  app.innerHTML = `
    <div class="summary">
      <div class="s-item"><div class="s-num">${totalStars}</div><div class="s-lbl">⭐ 星星</div></div>
      <div class="s-item"><div class="s-num">${store.meteorBest()}</div><div class="s-lbl">☄️ 最高分</div></div>
      <button class="ghost sm" id="checkin" style="margin-left:auto">📅 每日打卡</button>
      <button class="ghost sm" id="reset">🗑️ 清空进度</button>
    </div>
    <div class="mode-grid">
      ${modes.map(m => `<div class="mode-card" data-view="${m.view}">
        <div class="emoji">${m.emoji}</div>
        <h3>${m.title}</h3>
        <p>${m.desc}</p>
      </div>`).join('')}
    </div>
    <div class="panel">
      <h3 style="margin-top:0">💡 小贴士</h3>
      <ul style="margin:6px 0 0;padding-left:22px;line-height:1.9;color:var(--muted);font-size:14px">
        <li>把两只手的食指分别放在 <b>F</b> 和 <b>J</b> 键上（键上有小凸起）</li>
        <li>不要用眼睛找键，多练几次手就记住了 👌</li>
        <li>先追求 <b>准确</b>，再追求 <b>速度</b></li>
        <li>建议每天练 10-15 分钟，坚持一个月你会飞起来 ✈️</li>
      </ul>
    </div>`;
  app.querySelectorAll('.mode-card').forEach(el => el.onclick = () => nav(el.dataset.view));
  document.getElementById('checkin').onclick = () => nav('checkin');
  document.getElementById('reset').onclick = () => { if (confirm('确定清空全部进度和最高分吗？')) { store.reset(); render(); } };
}

// ===== 选关（通用）=====
function renderKeySelect() {
  const list = window.KEY_STAGES;
  app.innerHTML = `
    <a class="back" id="back">← 返回首页</a>
    <div class="panel">
      <h2 style="margin:0">⌨️ 键位闯关</h2>
      <p style="color:var(--muted);margin:6px 0 0">按顺序练习，每关满分 3 星</p>
    </div>
    <div class="grid">
      ${list.map((s,i) => {
        const r = store.get(s.id);
        const prev = i>0 ? store.get(list[i-1].id) : {done:true};
        const locked = i>0 && !prev.done;
        return `<div class="card ${locked?'locked':''}" data-id="${s.id}">
          ${locked?'<span class="lock">🔒</span>':''}
          <div class="badge">关 ${i+1}</div>
          <h4>${s.name}</h4>
          <div class="desc">${s.desc}</div>
          <div class="stars">${star(r.stars)}</div>
          ${r.bestWpm?`<div class="desc" style="margin-top:4px">最高 ${r.bestWpm} 字/分 · 准确率 ${r.bestAcc}%</div>`:''}
        </div>`;
      }).join('')}
    </div>`;
  document.getElementById('back').onclick = () => nav('home');
  app.querySelectorAll('.card:not(.locked)').forEach(el => el.onclick = () => nav('key-run', { sid: el.dataset.id }));
}

function renderPinSelect() {
  const list = window.PIN_STAGES;
  app.innerHTML = `
    <a class="back" id="back">← 返回首页</a>
    <div class="panel">
      <h2 style="margin:0">🀄 词语拼音</h2>
      <p style="color:var(--muted);margin:6px 0 0">二三年级常用词，请切到<b>英文输入法</b>输拼音</p>
    </div>
    <div class="grid">
      ${list.map(s => {
        const r = store.get(s.id);
        return `<div class="card" data-id="${s.id}">
          <div class="badge" style="background:var(--acc)">${s.grade}</div>
          <h4>${s.name}</h4>
          <div class="desc">${s.items.length} 个词</div>
          <div class="stars">${star(r.stars)}</div>
          ${r.bestWpm?`<div class="desc" style="margin-top:4px">最高 ${r.bestWpm} 字/分</div>`:''}
        </div>`;
      }).join('')}
    </div>`;
  document.getElementById('back').onclick = () => nav('home');
  app.querySelectorAll('.card').forEach(el => el.onclick = () => nav('pin-run', { sid: el.dataset.id }));
}

function renderSentSelect() {
  const list = window.SENTENCE_STAGES;
  app.innerHTML = `
    <a class="back" id="back">← 返回首页</a>
    <div class="panel">
      <h2 style="margin:0">📝 句子练习</h2>
      <p style="color:var(--muted);margin:6px 0 0">整句连打，训练节奏和肌肉记忆</p>
    </div>
    <div class="grid">
      ${list.map(s => {
        const r = store.get(s.id);
        return `<div class="card" data-id="${s.id}">
          <div class="badge">${s.items.length} 句</div>
          <h4>${s.name}</h4>
          <div class="stars">${star(r.stars)}</div>
          ${r.bestWpm?`<div class="desc" style="margin-top:4px">最高 ${r.bestWpm} 字/分</div>`:''}
        </div>`;
      }).join('')}
    </div>`;
  document.getElementById('back').onclick = () => nav('home');
  app.querySelectorAll('.card').forEach(el => el.onclick = () => nav('sent-run', { sid: el.dataset.id }));
}

// ===== 打字场（通用）=====
// 传入 { items: ['abc', 'hello world', ...], titleHtml, onDone(kpi), showKb, hint(ch)->boolean }
function runTyping(cfg) {
  const app0 = app;
  let idx = 0, pos = 0, right = 0, wrong = 0, totalChars = 0;
  cfg.items.forEach(x => totalChars += x.length);
  const startAt = Date.now();

  function paint() {
    const cur = cfg.items[idx] || '';
    const chs = cur.split('').map((c,i) => {
      let cls = '';
      if (i < pos) cls = 'done';
      else if (i === pos) cls = 'cur';
      const disp = c === ' ' ? '␣' : c;
      return `<span class="ch ${cls}" data-i="${i}">${disp}</span>`;
    }).join('');
    const doneChars = cfg.items.slice(0,idx).reduce((s,x)=>s+x.length,0) + pos;
    const pct = totalChars ? Math.round(doneChars/totalChars*100) : 0;
    const elapsed = Math.max(1, (Date.now()-startAt)/1000);
    const wpm = Math.round((right/5)/(elapsed/60));  // 通用 WPM 定义
    const acc = right+wrong ? Math.round(right/(right+wrong)*100) : 100;

    const curCh = cur[pos] || '';
    app0.innerHTML = `
      <a class="back" id="back">← 返回</a>
      ${cfg.titleHtml||''}
      <div class="stage">
        <div class="target">${chs}</div>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="hud">
          <div class="b">题 <b>${idx+1}</b>/${cfg.items.length}</div>
          <div class="b">正确 <b>${right}</b></div>
          <div class="b">错误 <b>${wrong}</b></div>
          <div class="b">速度 <b>${wpm}</b> 字/分</div>
          <div class="b">准确率 <b>${acc}%</b></div>
          <div class="b" style="margin-left:auto">⏱ ${Math.floor(elapsed)}s</div>
        </div>
      </div>
      ${cfg.showKb ? keyboardHtml(curCh) : ''}
      ${cfg.showKb ? fingerHint(curCh) : ''}
      <p class="hand-hint">💡 请把光标放在这里后<b>直接敲键盘</b>（不需要点击输入框）</p>`;
    document.getElementById('back').onclick = () => { document.removeEventListener('keydown', onKey); nav(cfg.backView||'home'); };
  }

  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); nav(cfg.backView||'home'); return; }
    if (e.key === 'Backspace') {
      if (pos > 0) { pos--; paint(); }
      e.preventDefault(); return;
    }
    // 忽略无字符功能键
    if (e.key.length !== 1) return;

    const cur = cfg.items[idx] || '';
    const need = cur[pos];
    const got = e.key;
    e.preventDefault();

    if (got === need) {
      right++; pos++; sfx.ok();
      // 一句完成
      if (pos >= cur.length) {
        idx++; pos = 0;
        if (idx >= cfg.items.length) {
          document.removeEventListener('keydown', onKey);
          finish();
          return;
        }
      }
      paint();
    } else {
      wrong++; sfx.bad();
      // 闪一下红
      const el = document.querySelector('.target .ch.cur');
      if (el) { el.classList.add('bad'); setTimeout(()=>el && el.classList.remove('bad'), 300); }
    }
  }

  function finish() {
    const elapsed = Math.max(1, (Date.now()-startAt)/1000);
    const wpm = Math.round((right/5)/(elapsed/60));
    const acc = right+wrong ? Math.round(right/(right+wrong)*100) : 100;
    let stars = 0;
    if (acc >= 80) stars = 1;
    if (acc >= 90 && wpm >= 8) stars = 2;
    if (acc >= 95 && wpm >= 15) stars = 3;
    sfx.win(); firework();
    cfg.onDone && cfg.onDone({ wpm, acc, stars, right, wrong });
    doCheckin();
    app0.innerHTML = `
      <div class="panel result">
        <div class="big">${stars===3?'🏆':(stars===2?'🥈':(stars===1?'🥉':'💪'))}</div>
        <h2 style="margin:6px 0">${stars>0?'太棒了！':'差一点点，再来一次吧！'}</h2>
        <div style="font-size:28px;color:var(--acc);letter-spacing:6px">${star(stars)}</div>
        <div class="kpi">
          <div class="b">速度 <b>${wpm}</b> 字/分</div>
          <div class="b">准确率 <b>${acc}%</b></div>
          <div class="b">正确 <b>${right}</b></div>
          <div class="b">错误 <b>${wrong}</b></div>
          <div class="b">用时 <b>${Math.floor(elapsed)}s</b></div>
        </div>
        <div style="margin-top:14px">
          <button class="primary" id="retry">🔄 再来一次</button>
          <button class="ghost" id="home">🏠 返回首页</button>
        </div>
      </div>`;
    document.getElementById('retry').onclick = () => nav(state.view, {});
    document.getElementById('home').onclick = () => nav('home');
  }

  paint();
  document.addEventListener('keydown', onKey);
}

// ===== 键位闯关 =====
function renderKeyRun() {
  const s = window.KEY_STAGES.find(x=>x.id===state.sid); if (!s) return nav('key-select');
  let items;
  if (s.sentence) items = [s.keys];
  else {
    const pool = s.keys.split('');
    items = [];
    for (let i=0;i<s.tries;i++) items.push(pick(pool));
    items = [items.join(' ').match(/.{1,10}/g).join(' ').trim().split(' ').join(' ')].map(t=>t); // 合成一段
    items = [pool.length<=8 ? Array.from({length:s.tries},()=>pick(pool)).join('') : shuffle(pool.concat(pool)).slice(0,s.tries).join('')];
  }
  runTyping({
    items,
    titleHtml:`<a class="back" id="back"></a><div class="panel"><div class="badge">键位闯关</div><h2 style="margin:6px 0 0">${s.name}</h2><p style="color:var(--muted);margin:4px 0 0">${s.desc}</p></div>`,
    showKb: true,
    backView:'key-select',
    onDone: ({wpm, acc, stars}) => {
      const prev = store.get(s.id);
      store.set(s.id, {
        stars: Math.max(prev.stars, stars),
        bestWpm: Math.max(prev.bestWpm, wpm),
        bestAcc: Math.max(prev.bestAcc, acc),
        done: true
      });
    }
  });
}

// ===== 词语拼音 =====
function renderPinRun() {
  const s = window.PIN_STAGES.find(x=>x.id===state.sid); if (!s) return nav('pin-select');
  const items = s.items.map(x => x.py);
  runTyping({
    items,
    titleHtml:`<div class="panel"><div class="badge" style="background:var(--acc)">${s.grade}</div><h2 style="margin:6px 0 4px">🀄 ${s.name}</h2>
      <div class="list-inline">${s.items.map(x=>`<span class="chip"><b>${x.han}</b> <span style="color:var(--muted)">${x.py}</span></span>`).join('')}</div></div>`,
    showKb: true,
    backView:'pin-select',
    onDone:({wpm,acc,stars}) => {
      const prev = store.get(s.id);
      store.set(s.id, {
        stars: Math.max(prev.stars, stars),
        bestWpm: Math.max(prev.bestWpm, wpm),
        bestAcc: Math.max(prev.bestAcc, acc),
        done: true
      });
    }
  });
}

// ===== 句子练习 =====
function renderSentRun() {
  const s = window.SENTENCE_STAGES.find(x=>x.id===state.sid); if (!s) return nav('sent-select');
  runTyping({
    items: s.items,
    titleHtml:`<div class="panel"><div class="badge">句子练习</div><h2 style="margin:6px 0 0">${s.name}</h2></div>`,
    showKb: true,
    backView:'sent-select',
    onDone:({wpm,acc,stars}) => {
      const prev = store.get(s.id);
      store.set(s.id, {
        stars: Math.max(prev.stars, stars),
        bestWpm: Math.max(prev.bestWpm, wpm),
        bestAcc: Math.max(prev.bestAcc, acc),
        done: true
      });
    }
  });
}

// ===== 陨石竞速 =====
let meteorGame = null;
function renderMeteor() {
  if (meteorGame) { clearInterval(meteorGame.tick); meteorGame = null; }
  app.innerHTML = `
    <a class="back" id="back">← 返回首页</a>
    <div class="panel">
      <h2 style="margin:0">☄️ 陨石竞速</h2>
      <p style="color:var(--muted);margin:6px 0 0">单词从天而降，把它<b>完整输完</b>就能消灭它。3 次未消灭就 Game Over！最高分 <b style="color:var(--brand)">${store.meteorBest()}</b></p>
    </div>
    <div class="arena" id="arena">
      <div class="hp" id="hp">❤️❤️❤️</div>
      <div class="score" id="score">得分 0</div>
      <div class="player">🚀</div>
      <div class="ground"></div>
      <div class="banner" id="banner">
        <div>
          <div style="font-size:38px">☄️</div>
          <div>按 <b>空格键</b> 或 <b>点击</b> 开始</div>
          <div style="font-size:14px;color:#cbd5e1;margin-top:8px">遇到陨石时敲键盘输入单词</div>
        </div>
      </div>
    </div>
    <div class="hand-hint">💡 遇到 <b>大写</b> 请按 Shift · Esc 退出</div>`;
  document.getElementById('back').onclick = () => { if (meteorGame) clearInterval(meteorGame.tick); nav('home'); };

  const arena = document.getElementById('arena');
  const banner = document.getElementById('banner');
  const hpEl = document.getElementById('hp');
  const scoreEl = document.getElementById('score');

  const startGame = () => {
    banner.style.display='none';
    const g = { words: [], hp:3, score:0, level:0, spawnMs:2000, fallPerTick: 0.35, tick:null };
    meteorGame = g;

    const spawn = () => {
      const pool = window.METEOR_WORDS[Math.min(g.level, window.METEOR_WORDS.length-1)];
      const text = pick(pool);
      const el = document.createElement('div');
      el.className = 'word';
      el.dataset.text = text;
      el.dataset.pos = 0;
      el.innerHTML = `<span class="typed"></span>${text}`;
      el.style.left = (10 + Math.random()*80) + '%';
      el.style.top = '-30px';
      arena.appendChild(el);
      g.words.push(el);
    };

    let spawnAcc = 0;
    g.tick = setInterval(() => {
      // 落
      const arenaH = arena.getBoundingClientRect().height;
      for (const w of g.words) {
        if (w.classList.contains('hit')) continue;
        const y = parseFloat(w.style.top||'0') + g.fallPerTick * 2;
        w.style.top = y + 'px';
        if (y >= arenaH - 40) {
          w.remove(); g.hp--; sfx.bad();
          hpEl.textContent = '❤️'.repeat(Math.max(0,g.hp)) + '🖤'.repeat(3-Math.max(0,g.hp));
          if (g.hp <= 0) return gameOver();
        }
      }
      g.words = g.words.filter(w => w.isConnected && !w.classList.contains('hit'));
      // 生成
      spawnAcc += 30;
      if (spawnAcc >= g.spawnMs) { spawn(); spawnAcc = 0; }
      // 升级
      if (g.score > 50 && g.level < 1) { g.level = 1; g.fallPerTick = 0.45; }
      if (g.score > 150 && g.level < 2) { g.level = 2; g.fallPerTick = 0.6; g.spawnMs = 1500; }
    }, 30);

    const onKey = (e) => {
      if (e.key === 'Escape') { endGame(); nav('home'); return; }
      if (e.key.length !== 1) return;
      // 找和当前字符匹配的最靠下的 word
      const c = e.key;
      let target = null, maxY = -1;
      for (const w of g.words) {
        if (w.classList.contains('hit')) continue;
        const pos = parseInt(w.dataset.pos||'0',10);
        const need = w.dataset.text[pos];
        if (need === c) {
          const y = parseFloat(w.style.top||'0');
          if (y > maxY) { maxY = y; target = w; }
        }
      }
      if (!target) {
        // 没匹配到就重置离得最近的那个
        for (const w of g.words) w.dataset.pos = 0, w.querySelector('.typed').textContent = '';
        // 视觉抖一下
        arena.style.transform='translateX(-3px)'; setTimeout(()=>arena.style.transform='',80);
        sfx.bad();
        return;
      }
      const pos = parseInt(target.dataset.pos||'0',10);
      const newPos = pos + 1;
      target.dataset.pos = newPos;
      target.querySelector('.typed').textContent = target.dataset.text.slice(0, newPos);
      target.innerHTML = `<span class="typed">${target.dataset.text.slice(0,newPos)}</span>${target.dataset.text.slice(newPos)}`;
      sfx.ok();
      if (newPos >= target.dataset.text.length) {
        // 消灭
        target.classList.add('hit');
        sfx.boom();
        g.score += 10 + target.dataset.text.length * 2;
        scoreEl.textContent = '得分 ' + g.score;
        setTimeout(()=>target.remove(), 400);
      }
    };

    const endGame = () => {
      clearInterval(g.tick);
      document.removeEventListener('keydown', onKey);
      meteorGame = null;
      arena.querySelectorAll('.word').forEach(w=>w.remove());
    };

    const gameOver = () => {
      endGame();
      store.addMeteor(g.score);
      firework();
      banner.style.display='';
      banner.innerHTML = `<div>
        <div style="font-size:44px">💥</div>
        <div style="font-size:22px;margin:4px 0">Game Over</div>
        <div>得分 <b style="color:#fbbf24;font-size:24px">${g.score}</b></div>
        <div style="font-size:13px;color:#cbd5e1;margin-top:4px">最高分 ${store.meteorBest()}</div>
        <div style="margin-top:14px">
          <button class="primary" id="again">🔄 再来一局</button>
          <button class="ghost" id="quit" style="background:#334155;color:#fff;border-color:transparent">🏠 回首页</button>
        </div>
      </div>`;
      document.getElementById('again').onclick = () => renderMeteor();
      document.getElementById('quit').onclick = () => nav('home');
    };

    document.addEventListener('keydown', onKey);
  };

  const startHandler = (e) => {
    if (e && e.type === 'keydown' && e.key !== ' ') return;
    document.removeEventListener('keydown', startHandler);
    arena.removeEventListener('click', startHandler);
    startGame();
  };
  document.addEventListener('keydown', startHandler);
  arena.addEventListener('click', startHandler);
}

// ===== 路由 =====
function render() {
  const m = {
    home: renderHome,
    'checkin': renderCheckin,
    'key-select': renderKeySelect, 'key-run': renderKeyRun,
    'pin-select': renderPinSelect, 'pin-run': renderPinRun,
    'sent-select': renderSentSelect, 'sent-run': renderSentRun,
    'meteor': renderMeteor
  };
  (m[state.view] || renderHome)();
}
render();


// ===== 打卡页 =====
const APP_META = {
  type:  { emoji:'⌨️', name:'打字',  color:'#2563eb' },
  math:  { emoji:'📐', name:'数学',  color:'#f59e0b' },
  yuwen: { emoji:'📚', name:'语文',  color:'#e11d48' },
  en:    { emoji:'🔤', name:'英语',  color:'#7c3aed' },
  chat:  { emoji:'💬', name:'AI聊天', color:'#22c55e' }
};
const MILESTONES = [
  { n:1,   icon:'🌱', title:'开启旅程' },
  { n:3,   icon:'🌿', title:'三天新芽' },
  { n:7,   icon:'🥉', title:'一周达成' },
  { n:14,  icon:'🎖️', title:'两周勇士' },
  { n:30,  icon:'🥈', title:'月度冠军' },
  { n:60,  icon:'💎', title:'钻石学者' },
  { n:100, icon:'🥇', title:'百日行者' },
  { n:180, icon:'🏆', title:'半年之王' },
  { n:365, icon:'👑', title:'年度传奇' }
];

async function renderCheckin() {
  app.innerHTML = `
    <a class="back" id="back">← 返回首页</a>
    <div class="panel">
      <h2 style="margin:0 0 4px">📅 每日打卡</h2>
      <p style="color:var(--muted);margin:0">在任意学习站完成关卡即自动打卡。数据存服务端，换设备用同步码可同步。</p>
    </div>
    <div class="panel" id="loading">正在从云端拉取…</div>
  `;
  document.getElementById('back').onclick = () => nav('home');

  const uid = CheckIn.getUid();
  const data = await loadCheckin();
  if (!data) {
    document.getElementById('loading').innerHTML = '❌ 加载失败，检查网络后重试。<br><button class="primary" id="retry" style="margin-top:10px">🔄 重试</button>';
    document.getElementById('retry').onclick = () => renderCheckin();
    return;
  }

  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth();
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = startDow-1; i >= 0; i--) cells.push({ d: prevDays-i, other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, y, m });
  while (cells.length % 7) cells.push({ d: cells.length - daysInMonth - startDow + 1, other: true });

  const doneMap = data.days || {};
  const pad = (n) => String(n).padStart(2,'0');
  const todayStr = `${y}-${pad(m+1)}-${pad(today.getDate())}`;
  const isDone = (c) => !c.other && !!doneMap[`${c.y}-${pad(c.m+1)}-${pad(c.d)}`];
  const alreadyToday = !!doneMap[todayStr];
  const todayApps = (doneMap[todayStr] && doneMap[todayStr].apps) || {};

  // 各学科累计次数（整段时间）
  const appTotals = {};
  for (const day of Object.values(doneMap)) {
    for (const [k,v] of Object.entries(day.apps||{})) {
      appTotals[k] = (appTotals[k]||0) + v;
    }
  }
  const grandTotal = Object.values(appTotals).reduce((a,b)=>a+b,0) || 1;

  const dowLabels = ['日','一','二','三','四','五','六'];
  const monthLabel = `${y} 年 ${m+1} 月`;

  // 里程碑：已达成 / 下一站
  const streak = data.streak || 0;
  const longest = data.longest || 0;
  const achieved = MILESTONES.filter(x => longest >= x.n);
  const next = MILESTONES.find(x => x.n > streak);

  document.getElementById('loading').outerHTML = `
    <div class="panel">
      <div class="streak-big">
        <div class="num">${streak}</div>
        <div class="lbl">🔥 连续打卡天数（历史最长 ${longest} 天）</div>
        ${next ? `<div style="margin-top:8px;color:var(--muted);font-size:13px">再坚持 <b style="color:var(--brand)">${next.n - streak}</b> 天即可解锁 ${next.icon} <b>${next.title}</b></div>` : '<div style="margin-top:8px">🎊 已解锁全部徽章！</div>'}
      </div>
      <div class="hud" style="justify-content:center">
        <div class="b">总打卡 <b>${data.total||0}</b> 天</div>
        <div class="b">本月完成 <b>${cells.filter(c=>!c.other && isDone(c)).length}</b> 天</div>
        <div class="b">今日 <b>${alreadyToday?'✅ 已打卡':'⏳ 未打卡'}</b></div>
      </div>
      ${!alreadyToday ? '<div style="text-align:center;margin-top:12px"><button class="primary" id="do-checkin">📌 立即打卡</button></div>' : ''}
    </div>

    <div class="panel">
      <h3 style="margin-top:0">🎯 今日各学科完成次数</h3>
      ${Object.keys(APP_META).map(k => {
        const cnt = todayApps[k] || 0;
        const meta = APP_META[k];
        const w = Math.min(100, cnt*15);
        return `<div style="display:flex;align-items:center;gap:10px;margin:8px 0">
          <div style="width:82px;flex-shrink:0"><span style="font-size:18px">${meta.emoji}</span> <span style="font-size:14px">${meta.name}</span></div>
          <div style="flex:1;background:var(--bg);height:22px;border-radius:6px;overflow:hidden;position:relative">
            <div style="height:100%;background:${meta.color};width:${w}%;transition:width .6s ease;border-radius:6px"></div>
            <span style="position:absolute;left:8px;top:2px;font-size:13px;color:var(--text);font-weight:600">${cnt>0?cnt+' 次':''}</span>
          </div>
        </div>`;
      }).join('')}
      ${!alreadyToday ? '<p style="color:var(--muted);font-size:13px;text-align:center;margin:8px 0 0">💡 到任意学习站完成一关就会自动出现</p>' : ''}
    </div>

    <div class="panel">
      <h3 style="margin-top:0">📊 累计学习分布</h3>
      <div style="display:flex;height:24px;border-radius:6px;overflow:hidden;background:var(--bg)">
        ${Object.keys(APP_META).map(k => {
          const cnt = appTotals[k] || 0;
          const pct = (cnt/grandTotal)*100;
          if (pct < 0.1) return '';
          return `<div title="${APP_META[k].name} ${cnt} 次" style="background:${APP_META[k].color};width:${pct}%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px">${pct>8?APP_META[k].emoji:''}</div>`;
        }).join('')}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:10px;font-size:13px">
        ${Object.keys(APP_META).map(k => `<span><span style="display:inline-block;width:10px;height:10px;background:${APP_META[k].color};border-radius:2px;vertical-align:middle"></span> ${APP_META[k].emoji} ${APP_META[k].name} <b>${appTotals[k]||0}</b></span>`).join('')}
      </div>
    </div>

    <div class="panel">
      <h3 style="margin-top:0">🏅 里程碑徽章</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:10px">
        ${MILESTONES.map(x => {
          const got = longest >= x.n;
          return `<div style="text-align:center;padding:10px 6px;border-radius:12px;background:${got?'linear-gradient(135deg,#fbbf24,#f59e0b)':'var(--bg)'};border:1px solid ${got?'transparent':'var(--line)'};color:${got?'#fff':'var(--muted)'};${got?'':'opacity:.55'}">
            <div style="font-size:32px;line-height:1">${got?x.icon:'🔒'}</div>
            <div style="font-size:13px;margin-top:4px;font-weight:${got?'700':'400'}">${x.title}</div>
            <div style="font-size:11px;opacity:.85">${x.n} 天</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <h3 style="margin:0">${monthLabel}</h3>
        <div style="color:var(--muted);font-size:13px">🟩 = 已打卡</div>
      </div>
      <div class="cal">
        ${dowLabels.map(x=>`<div class="dow">${x}</div>`).join('')}
        ${cells.map(c => {
          const done = isDone(c);
          const isTodayCell = !c.other && `${c.y}-${pad(c.m+1)}-${pad(c.d)}` === todayStr;
          const dateKey = c.other?null:`${c.y}-${pad(c.m+1)}-${pad(c.d)}`;
          const day = dateKey && doneMap[dateKey];
          const totalToday = day ? Object.values(day.apps||{}).reduce((a,b)=>a+b,0) : 0;
          return `<div class="day ${c.other?'other':''} ${done?'done':''} ${isTodayCell?'today':''}" title="${dateKey||''}${totalToday?'  完成 '+totalToday+' 次':''}">
            ${c.d}${totalToday>0?`<span class="dot">${totalToday>9?'9+':totalToday}</span>`:''}
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="panel">
      <h3 style="margin-top:0">🔗 换设备同步</h3>
      <p style="color:var(--muted);font-size:14px;margin:0 0 8px">这是你的<b>同步码</b>。5 个学习站共用一份数据，在新设备粘贴或扫码即可同步。</p>
      <div class="uid-box">
        <code id="uid-code">${uid}</code>
        <button class="ghost sm" id="copy-uid">📋 复制</button>
        <button class="ghost sm" id="show-qr">📱 显示二维码</button>
      </div>
      <div class="qr-box" id="qr" style="display:none"></div>
      <div style="margin-top:14px">
        <label style="font-size:13px;color:var(--muted)">在新设备输入原有同步码：</label>
        <div class="row" style="margin-top:6px">
          <input id="new-uid" type="text" placeholder="粘贴同步码" autocomplete="off" style="padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;flex:1;min-width:200px" />
          <button class="primary" id="apply-uid">应用</button>
        </div>
      </div>
      <p style="color:var(--muted);font-size:12px;margin:12px 0 0">🌐 5 个学习站：math.idai.asia · yuwen.idai.asia · en.idai.asia · type.idai.asia · chat.idai.asia</p>
    </div>
  `;

  const dc = document.getElementById('do-checkin');
  if (dc) dc.onclick = async () => {
    dc.disabled = true; dc.textContent = '打卡中…';
    const newData = await doCheckin();
    // 触发里程碑弹窗
    if (newData && newData.streak && MILESTONES.find(x=>x.n===newData.streak)) showMilestone(newData.streak);
    firework();
    renderCheckin();
  };

  document.getElementById('copy-uid').onclick = async () => {
    try { await navigator.clipboard.writeText(uid); alert('已复制！'); } catch { alert('请手动选中复制'); }
  };
  document.getElementById('show-qr').onclick = () => {
    const box = document.getElementById('qr');
    if (box.style.display !== 'none' && box.innerHTML) { box.style.display='none'; box.innerHTML=''; return; }
    box.style.display = '';
    const url = `${location.origin}${location.pathname}#uid=${uid}`;
    const src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=200x200`;
    box.innerHTML = `<img src="${src}" alt="uid QR" width="200" height="200"><div style="color:var(--muted);font-size:12px;margin-top:6px">扫码后打开链接自动同步</div>`;
  };
  document.getElementById('apply-uid').onclick = () => {
    const v = document.getElementById('new-uid').value.trim();
    try { CheckIn.setUid(v); alert('已切换到同步码：' + v); renderCheckin(); }
    catch(e) { alert('同步码格式不对'); }
  };
}

// 里程碑弹窗（打卡后触发）
function showMilestone(days) {
  const info = MILESTONES.find(x => x.n === days) || { icon:'⭐', title:days+' 天达成' };
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
  div.innerHTML = `<div style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:32px 40px;border-radius:20px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);max-width:340px;animation:pop-ms .5s ease-out">
    <div style="font-size:80px;line-height:1">${info.icon}</div>
    <div style="font-size:26px;font-weight:800;margin:10px 0 4px">${info.title}！</div>
    <div style="font-size:56px;font-weight:900;margin-top:6px">${days}<span style="font-size:20px;font-weight:400;opacity:.9"> 天</span></div>
    <button style="margin-top:20px;padding:10px 24px;font-size:16px;background:#fff;color:#e11d48;border:none;border-radius:999px;cursor:pointer;font-weight:700" id="ms-close">太棒了！</button>
  </div>`;
  if (!document.getElementById('ms-anim')) {
    const st=document.createElement('style'); st.id='ms-anim';
    st.textContent='@keyframes pop-ms{0%{transform:scale(0) rotate(-10deg)}70%{transform:scale(1.15)}100%{transform:scale(1)}}';
    document.head.appendChild(st);
  }
  document.body.appendChild(div);
  div.querySelector('#ms-close').onclick = () => div.remove();
  firework();
}

// 支持 URL hash #uid=xxx 一键切换
(function(){
  const m = location.hash.match(/uid=([a-zA-Z0-9_-]{6,32})/);
  if (m) {
    try { CheckIn.setUid(m[1]); location.hash = ''; } catch(e){}
  }
})();
