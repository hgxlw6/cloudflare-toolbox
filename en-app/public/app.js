/* 三年级英语上册 SPA
 * - 6 个 Unit，词汇 + 音标 + 中文 + 句型 + 思维导图
 * - Web Speech API 朗读（浏览器免费内置）
 * - 4 种题型闯关：EN→CN、CN→EN、听音选词、拼写
 * - localStorage 存进度和错词
 */

// ============ 语音（Web Speech API） ============
const tts = {
  voices: [],
  pref: null,
  rate: 0.9,
  init() {
    const load = () => {
      this.voices = (speechSynthesis.getVoices() || []).filter(v => /en(-|_|$)/i.test(v.lang));
      const saved = localStorage.getItem('g3en.voice');
      if (saved) this.pref = this.voices.find(v => v.voiceURI === saved) || null;
      if (!this.pref) {
        // 尝试挑一个英美语音，女声优先
        this.pref = this.voices.find(v => /en-US/i.test(v.lang) && /female|zira|samantha/i.test(v.name))
                 || this.voices.find(v => /en-US/i.test(v.lang))
                 || this.voices.find(v => /en-GB/i.test(v.lang))
                 || this.voices[0] || null;
      }
    };
    load();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = load;
    }
    const savedRate = parseFloat(localStorage.getItem('g3en.rate') || '0.9');
    if (savedRate >= 0.5 && savedRate <= 1.5) this.rate = savedRate;
  },
  speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = this.rate;
      u.pitch = 1;
      if (this.pref) u.voice = this.pref;
      u.lang = (this.pref && this.pref.lang) || 'en-US';
      speechSynthesis.speak(u);
    } catch (e) { console.warn('tts fail', e); }
  },
  setVoice(uri) {
    const v = this.voices.find(x => x.voiceURI === uri);
    if (v) { this.pref = v; localStorage.setItem('g3en.voice', uri); }
  },
  setRate(r) { this.rate = r; localStorage.setItem('g3en.rate', String(r)); },
};
tts.init();

// ============ 存储层 ============
const store = {
  ns: 'g3en.v1',
  _read() { try { return JSON.parse(localStorage.getItem(this.ns) || '{}'); } catch { return {}; } },
  _write(d) { localStorage.setItem(this.ns, JSON.stringify(d)); },
  getUnit(id) {
    const d = this._read();
    return d[id] || { stars: 0, best: 0, totalRight: 0, totalWrong: 0, wrongList: [] };
  },
  saveUnit(id, patch) {
    const d = this._read();
    d[id] = Object.assign(this.getUnit(id), patch);
    this._write(d);
  },
  addWrong(id, item) {
    const d = this._read();
    const rec = d[id] || { stars:0, best:0, totalRight:0, totalWrong:0, wrongList: [] };
    rec.wrongList = [item, ...(rec.wrongList || [])].slice(0, 40);
    d[id] = rec; this._write(d);
  },
  clearWrong(id) {
    const d = this._read();
    if (d[id]) { d[id].wrongList = []; this._write(d); }
  },
  incStat(id, right) {
    const d = this._read();
    const rec = d[id] || { stars:0, best:0, totalRight:0, totalWrong:0, wrongList: [] };
    if (right) rec.totalRight++; else rec.totalWrong++;
    d[id] = rec; this._write(d);
  },
  reset() { localStorage.removeItem(this.ns); }
};

// ============ 工具 ============
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (a) => { a = a.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const normEn = (s) => String(s).toLowerCase().replace(/[^a-z0-9'\- ]/g,'').trim();
const same = (a,b) => normEn(a) === normEn(b);
// ============ Unit 数据（人教版 PEP 三年级上册） ============
const UNITS = [
  {
    id:'u1', title:'Unit 1 · Hello!',
    desc:'打招呼与自我介绍',
    words:[
      {en:'hello', ipa:'/həˈloʊ/', cn:'你好'},
      {en:'hi', ipa:'/haɪ/', cn:'嗨；你好'},
      {en:'I', ipa:'/aɪ/', cn:'我'},
      {en:'am', ipa:'/æm/', cn:'是'},
      {en:'my', ipa:'/maɪ/', cn:'我的'},
      {en:'name', ipa:'/neɪm/', cn:'名字'},
      {en:'goodbye', ipa:'/ˌɡʊdˈbaɪ/', cn:'再见'},
      {en:'bye', ipa:'/baɪ/', cn:'再见'},
      {en:'ruler', ipa:'/ˈruːlər/', cn:'尺子'},
      {en:'pencil', ipa:'/ˈpensl/', cn:'铅笔'},
      {en:'eraser', ipa:'/ɪˈreɪsər/', cn:'橡皮'},
      {en:'crayon', ipa:'/ˈkreɪən/', cn:'蜡笔'},
      {en:'bag', ipa:'/bæɡ/', cn:'包；书包'},
      {en:'pen', ipa:'/pen/', cn:'钢笔'},
      {en:'book', ipa:'/bʊk/', cn:'书'},
      {en:'school', ipa:'/skuːl/', cn:'学校'},
    ],
    sentences:[
      {en:'Hello! I am Sarah.', cn:'你好！我是萨拉。'},
      {en:'Hi! My name is Mike.', cn:'嗨！我叫麦克。'},
      {en:'Goodbye!', cn:'再见！'},
      {en:'Show me your pencil.', cn:'给我看看你的铅笔。'},
    ],
    mind:`mindmap
  root((Unit 1 Hello))
    Greetings
      Hello
      Hi
      Goodbye
      Bye
    Self intro
      I am ___
      My name is ___
    School things
      ruler
      pencil
      eraser
      crayon
      bag
      pen
      book`
  },
  {
    id:'u2', title:'Unit 2 · Colours',
    desc:'颜色',
    words:[
      {en:'red', ipa:'/red/', cn:'红色的'},
      {en:'yellow', ipa:'/ˈjeloʊ/', cn:'黄色的'},
      {en:'green', ipa:'/ɡriːn/', cn:'绿色的'},
      {en:'blue', ipa:'/bluː/', cn:'蓝色的'},
      {en:'black', ipa:'/blæk/', cn:'黑色的'},
      {en:'white', ipa:'/waɪt/', cn:'白色的'},
      {en:'orange', ipa:'/ˈɔːrɪndʒ/', cn:'橙色的；橙子'},
      {en:'brown', ipa:'/braʊn/', cn:'棕色的'},
      {en:'pink', ipa:'/pɪŋk/', cn:'粉红色的'},
      {en:'purple', ipa:'/ˈpɜːrpl/', cn:'紫色的'},
      {en:'colour', ipa:'/ˈkʌlər/', cn:'颜色'},
    ],
    sentences:[
      {en:'What colour is it?', cn:'它是什么颜色？'},
      {en:'It is red.', cn:'它是红色的。'},
      {en:'I like blue.', cn:'我喜欢蓝色。'},
      {en:'Show me your green crayon.', cn:'给我看看你的绿色蜡笔。'},
    ],
    mind:`mindmap
  root((Unit 2 Colours))
    Warm 暖色
      red
      yellow
      orange
      pink
    Cool 冷色
      blue
      green
      purple
    Basic
      black
      white
      brown
    Sentence
      What colour is it?
      It is ___`
  },
  {
    id:'u3', title:'Unit 3 · Look at me!',
    desc:'身体部位',
    words:[
      {en:'face', ipa:'/feɪs/', cn:'脸'},
      {en:'ear', ipa:'/ɪr/', cn:'耳朵'},
      {en:'eye', ipa:'/aɪ/', cn:'眼睛'},
      {en:'nose', ipa:'/noʊz/', cn:'鼻子'},
      {en:'mouth', ipa:'/maʊθ/', cn:'嘴'},
      {en:'head', ipa:'/hed/', cn:'头'},
      {en:'hand', ipa:'/hænd/', cn:'手'},
      {en:'arm', ipa:'/ɑːrm/', cn:'胳膊'},
      {en:'leg', ipa:'/leɡ/', cn:'腿'},
      {en:'foot', ipa:'/fʊt/', cn:'脚'},
      {en:'body', ipa:'/ˈbɑːdi/', cn:'身体'},
      {en:'finger', ipa:'/ˈfɪŋɡər/', cn:'手指'},
    ],
    sentences:[
      {en:'Look at me!', cn:'看着我！'},
      {en:'This is my head.', cn:'这是我的头。'},
      {en:'Touch your nose.', cn:'摸摸你的鼻子。'},
      {en:'Wave your hand.', cn:'挥挥你的手。'},
    ],
    mind:`mindmap
  root((Unit 3 Body))
    Head 头部
      face
      eye
      ear
      nose
      mouth
    Upper 上肢
      arm
      hand
      finger
    Lower 下肢
      leg
      foot
    Action
      Touch your ___
      Wave your ___`
  },
  {
    id:'u4', title:'Unit 4 · We love animals',
    desc:'动物',
    words:[
      {en:'cat', ipa:'/kæt/', cn:'猫'},
      {en:'dog', ipa:'/dɔːɡ/', cn:'狗'},
      {en:'monkey', ipa:'/ˈmʌŋki/', cn:'猴子'},
      {en:'panda', ipa:'/ˈpændə/', cn:'熊猫'},
      {en:'rabbit', ipa:'/ˈræbɪt/', cn:'兔子'},
      {en:'duck', ipa:'/dʌk/', cn:'鸭子'},
      {en:'pig', ipa:'/pɪɡ/', cn:'猪'},
      {en:'bird', ipa:'/bɜːrd/', cn:'鸟'},
      {en:'bear', ipa:'/ber/', cn:'熊'},
      {en:'elephant', ipa:'/ˈelɪfənt/', cn:'大象'},
      {en:'mouse', ipa:'/maʊs/', cn:'老鼠'},
      {en:'tiger', ipa:'/ˈtaɪɡər/', cn:'老虎'},
      {en:'zoo', ipa:'/zuː/', cn:'动物园'},
    ],
    sentences:[
      {en:'I have a cat.', cn:'我有一只猫。'},
      {en:'Look at the panda!', cn:'看那只熊猫！'},
      {en:'It is a bird.', cn:'它是一只鸟。'},
      {en:'Do you like tigers?', cn:'你喜欢老虎吗？'},
    ],
    mind:`mindmap
  root((Unit 4 Animals))
    Pets 宠物
      cat
      dog
      rabbit
      bird
    Farm 农场
      duck
      pig
    Wild 野生
      monkey
      panda
      bear
      elephant
      tiger
      mouse
    Sentence
      I have a ___
      It is a ___`
  },
  {
    id:'u5', title:'Unit 5 · Let\u2019s eat!',
    desc:'食物和饮料',
    words:[
      {en:'bread', ipa:'/bred/', cn:'面包'},
      {en:'egg', ipa:'/eɡ/', cn:'鸡蛋'},
      {en:'milk', ipa:'/mɪlk/', cn:'牛奶'},
      {en:'water', ipa:'/ˈwɔːtər/', cn:'水'},
      {en:'juice', ipa:'/dʒuːs/', cn:'果汁'},
      {en:'cake', ipa:'/keɪk/', cn:'蛋糕'},
      {en:'fish', ipa:'/fɪʃ/', cn:'鱼'},
      {en:'rice', ipa:'/raɪs/', cn:'米饭'},
      {en:'chicken', ipa:'/ˈtʃɪkɪn/', cn:'鸡肉；小鸡'},
      {en:'noodles', ipa:'/ˈnuːdlz/', cn:'面条'},
      {en:'hamburger', ipa:'/ˈhæmbɜːrɡər/', cn:'汉堡包'},
      {en:'hot dog', ipa:'/ˌhɑːt ˈdɔːɡ/', cn:'热狗'},
      {en:'coffee', ipa:'/ˈkɔːfi/', cn:'咖啡'},
      {en:'tea', ipa:'/tiː/', cn:'茶'},
    ],
    sentences:[
      {en:'I would like some bread, please.', cn:'请给我一些面包。'},
      {en:'Have some juice.', cn:'来点果汁。'},
      {en:'Let us eat!', cn:'我们吃吧！'},
      {en:'I am hungry.', cn:'我饿了。'},
    ],
    mind:`mindmap
  root((Unit 5 Food))
    Drink 饮料
      water
      milk
      juice
      coffee
      tea
    Staple 主食
      bread
      rice
      noodles
      hamburger
      hot dog
    Others 其他
      egg
      cake
      fish
      chicken
    Sentence
      I would like ___
      Have some ___`
  },
  {
    id:'u6', title:'Unit 6 · Happy birthday!',
    desc:'生日与数字',
    words:[
      {en:'one', ipa:'/wʌn/', cn:'一'},
      {en:'two', ipa:'/tuː/', cn:'二'},
      {en:'three', ipa:'/θriː/', cn:'三'},
      {en:'four', ipa:'/fɔːr/', cn:'四'},
      {en:'five', ipa:'/faɪv/', cn:'五'},
      {en:'six', ipa:'/sɪks/', cn:'六'},
      {en:'seven', ipa:'/ˈsevn/', cn:'七'},
      {en:'eight', ipa:'/eɪt/', cn:'八'},
      {en:'nine', ipa:'/naɪn/', cn:'九'},
      {en:'ten', ipa:'/ten/', cn:'十'},
      {en:'birthday', ipa:'/ˈbɜːrθdeɪ/', cn:'生日'},
      {en:'happy', ipa:'/ˈhæpi/', cn:'快乐的'},
      {en:'cake', ipa:'/keɪk/', cn:'蛋糕'},
      {en:'gift', ipa:'/ɡɪft/', cn:'礼物'},
      {en:'candle', ipa:'/ˈkændl/', cn:'蜡烛'},
      {en:'card', ipa:'/kɑːrd/', cn:'卡片'},
    ],
    sentences:[
      {en:'Happy birthday!', cn:'生日快乐！'},
      {en:'How old are you?', cn:'你几岁了？'},
      {en:'I am nine.', cn:'我九岁。'},
      {en:'This is for you.', cn:'这是给你的。'},
    ],
    mind:`mindmap
  root((Unit 6 Birthday))
    Numbers 1-10
      one two three
      four five six
      seven eight
      nine ten
    Birthday 生日
      happy birthday
      cake
      candle
      gift
      card
    Sentence
      How old are you?
      I am ___
      This is for you`
  },
];
// ============ 题目生成器（4 种题型） ============
function makeQuestion(unit, level) {
  // level: 1=easy(多选), 2=medium(听音), 3=hard(拼写)
  const words = unit.words;
  const target = pick(words);
  const distractors = shuffle(words.filter(w => w.en !== target.en)).slice(0, 3);

  const type = level === 3 ? 'spell'
             : level === 2 ? pick(['listen','en2cn'])
             : pick(['en2cn','cn2en']);

  if (type === 'en2cn') {
    const opts = shuffle([target, ...distractors].map(w => w.cn));
    return {
      type:'choice',
      qHtml: `<div class="big-en">${target.en}</div><div class="ipa">${target.ipa}</div><span class="play-btn" data-play="${target.en}">🔊</span>`,
      autoPlay: target.en,
      options: opts,
      answer: target.cn,
      target,
    };
  }
  if (type === 'cn2en') {
    const opts = shuffle([target, ...distractors].map(w => w.en));
    return {
      type:'choice',
      qHtml: `<div style="font-size:26px">${target.cn}</div><div class="ipa" style="margin-top:4px">选出对应的英文</div>`,
      options: opts,
      answer: target.en,
      target,
    };
  }
  if (type === 'listen') {
    const opts = shuffle([target, ...distractors].map(w => w.en));
    return {
      type:'choice',
      qHtml: `<div style="font-size:22px">🎧 听音选词</div><span class="play-btn big" data-play="${target.en}">🔊 点击播放</span>`,
      autoPlay: target.en,
      options: opts,
      answer: target.en,
      target,
    };
  }
  // spell
  return {
    type:'spell',
    qHtml: `<div style="font-size:22px">🎧 听音写单词</div><div style="margin-top:6px;font-size:15px;color:var(--muted)">中文：${target.cn}</div><span class="play-btn big" data-play="${target.en}">🔊 点击播放</span>`,
    autoPlay: target.en,
    answer: target.en,
    target,
  };
}

// ============ SPA 状态 & 路由 ============
const app = document.getElementById('app');
let state = { view:'home', uid:null, mode:'practice', stage:1, index:0, total:10, current:null, right:0, wrong:0, currentWrongs:[] };

function nav(view, extra={}) {
  Object.assign(state, extra, { view });
  render();
  window.scrollTo(0,0);
}
function starHtml(n) { return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3-n); }

function voiceBar() {
  const voices = tts.voices;
  return `
    <div class="voice-bar">
      🔊 发音：
      <select id="voice-sel">
        ${voices.length===0? '<option>浏览器暂无英文语音</option>' : voices.map(v => `<option value="${v.voiceURI}" ${tts.pref && tts.pref.voiceURI===v.voiceURI?'selected':''}>${v.name} (${v.lang})</option>`).join('')}
      </select>
      语速
      <input class="rate-slider" type="range" min="0.5" max="1.3" step="0.1" value="${tts.rate}" id="rate-sel" />
      <span id="rate-val">${tts.rate.toFixed(1)}x</span>
    </div>
  `;
}
function bindVoiceBar() {
  const vs = document.getElementById('voice-sel');
  if (vs) vs.onchange = () => tts.setVoice(vs.value);
  const rs = document.getElementById('rate-sel');
  if (rs) rs.oninput = () => { tts.setRate(parseFloat(rs.value)); document.getElementById('rate-val').textContent = tts.rate.toFixed(1)+'x'; };
}

// ============ 首页 ============
function renderHome() {
  let totalStars = 0, wrongTotal = 0;
  for (const u of UNITS) { const r = store.getUnit(u.id); totalStars += r.stars; wrongTotal += (r.wrongList||[]).length; }
  app.innerHTML = `
    ${voiceBar()}
    <div class="summary">
      <div class="s-item"><div class="s-num">${totalStars}</div><div class="s-lbl">⭐ 星星</div></div>
      <div class="s-item"><div class="s-num">${wrongTotal}</div><div class="s-lbl">📕 错词</div></div>
      <div class="s-item"><div class="s-num">${UNITS.length}</div><div class="s-lbl">📚 单元</div></div>
      <button class="ghost sm" id="reset">🗑️ 清空进度</button>
    </div>
    <div class="grid">
      ${UNITS.map(u => {
        const r = store.getUnit(u.id);
        return `<div class="card" data-id="${u.id}">
          <div class="badge">${u.words.length} 个词 · ${u.sentences.length} 个句</div>
          <h3>${u.title}</h3>
          <p>${u.desc}</p>
          <div class="stars">${starHtml(r.stars)} ${r.wrongList.length?`<span class="wrong-dot">📕 ${r.wrongList.length}</span>`:''}</div>
        </div>`;
      }).join('')}
    </div>
  `;
  bindVoiceBar();
  app.querySelectorAll('.card').forEach(el => el.onclick = () => nav('unit', { uid: el.dataset.id }));
  document.getElementById('reset').onclick = () => { if (confirm('确定清空所有星星和错词？')) { store.reset(); render(); } };
}

// ============ 单元详情 ============
function renderUnit() {
  const u = UNITS.find(x => x.id === state.uid);
  const r = store.getUnit(u.id);
  app.innerHTML = `
    <a class="back" id="back">← 返回目录</a>
    ${voiceBar()}
    <div class="panel">
      <div class="badge">${u.words.length} 词 · ${u.sentences.length} 句</div>
      <h2 style="margin:6px 0 4px">${u.title}</h2>
      <div class="stars big">${starHtml(r.stars)} ${r.best?`（历史最高 ${r.best} 分）`:''}</div>
    </div>
    <div class="panel">
      <h3 style="margin-top:0">🧠 思维导图</h3>
      <div class="mind-toggle open" id="mind-toggle">收起/展开</div>
      <div class="mind-wrap" id="mind-wrap"><p style="color:var(--muted);padding:8px">加载中…</p></div>
    </div>
    <div class="panel">
      <h3 style="margin-top:0">📖 单词表（点击卡片自动朗读）</h3>
      <div class="word-grid">
        ${u.words.map(w => `
          <div class="word" data-en="${w.en}">
            <span class="speaker">🔊</span>
            <div class="en">${w.en}</div>
            <div class="ipa">${w.ipa}</div>
            <div class="cn">${w.cn}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="panel">
      <h3 style="margin-top:0">💬 常用句型（点击朗读）</h3>
      <div class="sent-list">
        ${u.sentences.map(s => `
          <div class="sent" data-en="${s.en}">
            <div>
              <div class="en">${s.en}</div>
              <div class="cn">${s.cn}</div>
            </div>
            <span class="spk">🔊</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="panel">
      <h3 style="margin-top:0">🎯 开始学习</h3>
      <div class="row">
        <button class="primary" id="practice">✏️ 练习模式（10 题）</button>
        <button class="primary" id="stage" style="background:#f59e0b">🏆 闯关模式</button>
        ${r.wrongList.length? `<button class="ghost" id="wrong">📕 错词本 (${r.wrongList.length})</button>` : ''}
      </div>
      <p style="color:var(--muted);font-size:13px;margin:10px 0 0">闯关：3 关递进，每关 5 题全对得 1 颗星</p>
    </div>
  `;
  bindVoiceBar();
  document.getElementById('back').onclick = () => nav('home');
  app.querySelectorAll('.word').forEach(el => el.onclick = () => tts.speak(el.dataset.en));
  app.querySelectorAll('.sent').forEach(el => el.onclick = () => tts.speak(el.dataset.en));
  document.getElementById('practice').onclick = () => nav('quiz', { mode:'practice', total:10, index:0, right:0, wrong:0, current:null, currentWrongs:[] });
  document.getElementById('stage').onclick = () => nav('stage-select');
  const wb = document.getElementById('wrong');
  if (wb) wb.onclick = () => nav('wrongbook');

  // 思维导图
  const mmWrap = document.getElementById('mind-wrap');
  const mmToggle = document.getElementById('mind-toggle');
  if (window.mermaid && u.mind) {
    (async () => {
      try {
        const id = 'mm-' + Math.random().toString(36).slice(2,8);
        const { svg } = await window.mermaid.render(id, u.mind);
        mmWrap.innerHTML = svg;
      } catch(e) { mmWrap.innerHTML = '<p style="color:var(--muted);padding:8px">导图渲染失败：' + e.message + '</p>'; }
    })();
  }
  if (mmToggle) mmToggle.onclick = () => {
    const open = mmToggle.classList.toggle('open');
    mmWrap.style.display = open ? '' : 'none';
  };
}

// ============ 闯关选择 ============
function renderStageSelect() {
  const u = UNITS.find(x => x.id === state.uid);
  const r = store.getUnit(u.id);
  const stages = [
    { n:1, name:'⭐ 初级', desc:'看词选中文 / 看中文选词', unlock:true },
    { n:2, name:'⭐⭐ 中级', desc:'加入听音选词', unlock: r.stars >= 1 },
    { n:3, name:'⭐⭐⭐ 高级', desc:'听音拼写单词', unlock: r.stars >= 2 },
  ];
  app.innerHTML = `
    <a class="back" id="back">← 返回单元</a>
    <div class="panel">
      <h2 style="margin-top:0">🏆 ${u.title} · 闯关</h2>
      <p>当前进度：${starHtml(r.stars)}（${r.stars}/3）</p>
    </div>
    ${stages.map(s => `
      <div class="panel stage-card ${s.unlock?'':'locked'}" data-n="${s.n}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h3 style="margin:0 0 4px">第 ${s.n} 关 · ${s.name}</h3>
            <p style="margin:0;color:var(--muted)">${s.desc}</p>
          </div>
          <div style="font-size:24px">${r.stars >= s.n ? '✅' : (s.unlock?'▶️':'🔒')}</div>
        </div>
      </div>
    `).join('')}
  `;
  document.getElementById('back').onclick = () => nav('unit');
  document.querySelectorAll('.stage-card').forEach(el => {
    if (el.classList.contains('locked')) return;
    el.onclick = () => nav('quiz', { mode:'stage', stage:parseInt(el.dataset.n), total:5, index:0, right:0, wrong:0, current:null, currentWrongs:[] });
  });
}

// ============ 做题页 ============
function nextQuestion() {
  const u = UNITS.find(x => x.id === state.uid);
  const level = state.mode === 'stage' ? state.stage : (1 + Math.floor(Math.random()*2));
  state.current = makeQuestion(u, level);
  state.answered = false;
}

function renderQuiz() {
  const u = UNITS.find(x => x.id === state.uid);
  if (state.index >= state.total) return renderResult();
  if (!state.current) nextQuestion();
  const q = state.current;
  const progress = Math.round((state.index / state.total) * 100);
  const title = state.mode === 'stage' ? `${u.title} · 第 ${state.stage} 关` : `${u.title} · 练习`;

  let inputHtml;
  if (q.type === 'choice') {
    inputHtml = `<div class="options" id="options">
      ${q.options.map(o => `<button data-opt="${o}">${o}</button>`).join('')}
    </div>`;
  } else {
    inputHtml = `<div class="row" style="justify-content:center">
      <input id="ans" type="text" placeholder="拼写单词" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button class="primary" id="submit">提交</button>
    </div><p class="hint">💡 可以多点几次🔊反复听</p>`;
  }

  app.innerHTML = `
    <a class="back" id="back">← 退出</a>
    <div class="panel">
      <div class="quiz-head">
        <span>${title} · 第 ${state.index+1} / ${state.total} 题</span>
        <span>✅ ${state.right} &nbsp; ❌ ${state.wrong}</span>
      </div>
      <div class="progress"><i style="width:${progress}%"></i></div>
      <div class="q">${q.qHtml}</div>
      ${inputHtml}
      <div id="fb"></div>
    </div>
  `;
  document.getElementById('back').onclick = () => nav(state.mode==='stage'?'stage-select':'unit');

  // 播放按钮
  app.querySelectorAll('[data-play]').forEach(el => el.onclick = (e) => { e.stopPropagation(); tts.speak(el.dataset.play); });
  // 自动播放
  if (q.autoPlay) setTimeout(() => tts.speak(q.autoPlay), 200);

  const showFeedback = (ok, user) => {
    state.answered = true;
    if (ok) state.right++;
    else {
      state.wrong++;
      const item = { en: q.target.en, ipa: q.target.ipa, cn: q.target.cn, yours: user, at: Date.now() };
      state.currentWrongs.push(item);
      store.addWrong(u.id, item);
    }
    store.incStat(u.id, ok);
    if (ok) tts.speak(q.target.en);

    const fb = document.getElementById('fb');
    fb.innerHTML = `<div class="feedback ${ok?'ok':'bad'}">
      ${ok
        ? `✅ 正确！<b>${q.target.en}</b> ${q.target.ipa} — ${q.target.cn}`
        : `❌ 正确答案：<b>${q.target.en}</b> ${q.target.ipa} — ${q.target.cn}${user!==undefined?`（你的：${user}）`:''} <span class="play-btn" data-play="${q.target.en}">🔊</span>`}
      <div style="margin-top:8px"><button class="primary" id="next">${state.index+1<state.total?'下一题 →':'查看结果'}</button></div>
    </div>`;
    fb.querySelectorAll('[data-play]').forEach(el => el.onclick = () => tts.speak(el.dataset.play));
    document.getElementById('next').onclick = () => { state.index++; state.current = null; render(); };
  };

  if (q.type === 'choice') {
    document.querySelectorAll('#options button').forEach(b => b.onclick = () => {
      if (state.answered) return;
      const val = b.dataset.opt;
      const ok = same(val, q.answer);
      document.querySelectorAll('#options button').forEach(x => {
        if (same(x.dataset.opt, q.answer)) x.classList.add('ok');
        else if (x === b && !ok) x.classList.add('bad');
      });
      showFeedback(ok, val);
    });
  } else {
    const submit = () => {
      if (state.answered) return;
      const val = document.getElementById('ans').value;
      if (!val) return;
      const ok = same(val, q.answer);
      showFeedback(ok, val);
    };
    document.getElementById('submit').onclick = submit;
    const inp = document.getElementById('ans');
    inp.addEventListener('keydown', e => { if (e.key==='Enter') submit(); });
    inp.focus();
  }
}

// ============ 结果页 ============
function renderResult() {
  const u = UNITS.find(x => x.id === state.uid);
  const total = state.right + state.wrong;
  const pct = total ? Math.round(state.right / total * 100) : 0;
  const rec = store.getUnit(u.id);
  if (pct > rec.best) store.saveUnit(u.id, { best: pct });
  let gain = '';
  if (state.mode === 'stage' && state.wrong === 0) {
    if (state.stage > rec.stars) {
      store.saveUnit(u.id, { stars: state.stage });
      gain = `<p style="color:#f59e0b;font-size:18px;margin:8px 0"><b>🎉 恭喜通过第 ${state.stage} 关！</b>获得 1 颗星</p>`;
    } else {
      gain = `<p style="color:var(--muted);margin:8px 0">已通过本关（${state.stage}/3）</p>`;
    }
  }
  const level = pct >= 90 ? '🏆 太棒了！' : pct >= 70 ? '👍 不错' : pct >= 50 ? '💪 继续加油' : '📖 多复习一下';
  app.innerHTML = `
    <a class="back" id="back">← 返回单元</a>
    <div class="panel" style="text-align:center">
      <h2 style="margin-top:0">${state.mode==='stage'?`第 ${state.stage} 关 · `:''}${u.title}</h2>
      <div style="font-size:56px;margin:6px 0">${pct}<span style="font-size:24px">分</span></div>
      <p>${level}　✅ ${state.right} 题　❌ ${state.wrong} 题</p>
      ${gain}
      <div class="row" style="justify-content:center;margin-top:8px">
        <button class="primary" id="again">🔁 再来一次</button>
        ${state.mode==='stage'?`<button class="ghost" id="stages">🏆 关卡列表</button>`:''}
        <button class="ghost" id="other">📚 换个单元</button>
        ${state.currentWrongs.length?`<button class="ghost" id="review">📕 查看错词</button>`:''}
      </div>
    </div>
  `;
  document.getElementById('back').onclick = () => nav('unit');
  document.getElementById('again').onclick = () => nav('quiz', { index:0, right:0, wrong:0, current:null, currentWrongs:[] });
  document.getElementById('other').onclick = () => nav('home');
  const sb = document.getElementById('stages'); if (sb) sb.onclick = () => nav('stage-select');
  const rb = document.getElementById('review'); if (rb) rb.onclick = () => nav('wrongbook');
}

// ============ 错词本 ============
function renderWrongbook() {
  const u = UNITS.find(x => x.id === state.uid);
  const rec = store.getUnit(u.id);
  const list = rec.wrongList || [];
  app.innerHTML = `
    <a class="back" id="back">← 返回单元</a>
    <div class="panel">
      <h2 style="margin-top:0">📕 ${u.title} · 错词本</h2>
      <p style="color:var(--muted)">最近 ${list.length} 个错词（点击可朗读）</p>
      ${list.length===0? '<p>暂无错词。做题时答错会自动记录。</p>' : ''}
      ${list.map((w,i) => `
        <div class="wrong-item">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <b>${i+1}. ${w.en}</b> <span style="color:var(--muted)">${w.ipa}</span> — ${w.cn}
              ${w.yours!==undefined?`<div style="color:var(--muted);font-size:13px;margin-top:2px">你的答案：${w.yours}</div>`:''}
            </div>
            <span class="play-btn" data-play="${w.en}" style="font-size:22px;cursor:pointer">🔊</span>
          </div>
        </div>
      `).join('')}
      ${list.length? '<div style="margin-top:10px"><button class="ghost" id="clr">🗑️ 清空本单元错词</button></div>' : ''}
    </div>
  `;
  document.getElementById('back').onclick = () => nav('unit');
  app.querySelectorAll('[data-play]').forEach(el => el.onclick = () => tts.speak(el.dataset.play));
  const clr = document.getElementById('clr');
  if (clr) clr.onclick = () => { if (confirm('清空本单元错词？')) { store.clearWrong(u.id); render(); } };
}

function render() {
  const m = { home: renderHome, unit: renderUnit, quiz: renderQuiz, 'stage-select': renderStageSelect, wrongbook: renderWrongbook };
  (m[state.view] || renderHome)();
}
render();