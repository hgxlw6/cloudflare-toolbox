/* 三年级语文 SPA
 * - 生字：拼音 + 部首 + 释义 + hanzi-writer 笔顺动画
 * - 词语 & 古诗：中文 TTS 朗读，逐句高亮
 * - 4 种题型闯关：看字选拼音 / 看拼音选字 / 看义选词 / 补全古诗
 * - localStorage 保存进度和错题
 */

// ============ 中文 TTS ============
const tts = {
  supported: ('speechSynthesis' in window),
  voices: [], pref: null, rate: 0.9,
  init() {
    if (!this.supported) return;
    const load = () => {
      const all = speechSynthesis.getVoices() || [];
      this.voices = all.slice().sort((a,b) => {
        const za = /zh/i.test(a.lang) ? 0 : 1;
        const zb = /zh/i.test(b.lang) ? 0 : 1;
        if (za !== zb) return za - zb;
        return a.lang.localeCompare(b.lang);
      });
      const saved = localStorage.getItem('yw.voice');
      if (saved) this.pref = this.voices.find(v => v.voiceURI === saved) || null;
      if (!this.pref) {
        this.pref = this.voices.find(v => /zh-CN/i.test(v.lang) && /female|xiaoxiao|huihui|yaoyao/i.test(v.name))
                 || this.voices.find(v => /zh-CN/i.test(v.lang))
                 || this.voices.find(v => /^zh/i.test(v.lang))
                 || null;
      }
    };
    load();
    if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = load;
    const r = parseFloat(localStorage.getItem('yw.rate') || '0.9');
    if (r >= 0.5 && r <= 1.3) this.rate = r;
  },
  speak(text, onend) {
    if (!this.supported) return;
    try {
      if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = this.rate; u.pitch = 1;
      if (this.pref) u.voice = this.pref;
      u.lang = (this.pref && this.pref.lang) || 'zh-CN';
      if (onend) u.onend = () => setTimeout(onend, 200);
      u.onerror = (e) => { const err = e && e.error; if (err==='interrupted'||err==='canceled') return; console.warn('tts err', err); };
      speechSynthesis.speak(u);
    } catch (e) { console.warn(e); }
  },
  cancel() { try { speechSynthesis.cancel(); } catch(e){} },
  setVoice(uri) { const v = this.voices.find(x => x.voiceURI === uri); if (v) { this.pref = v; localStorage.setItem('yw.voice', uri); } },
  setRate(r) { this.rate = r; localStorage.setItem('yw.rate', String(r)); },
  speakSeq(list, i=0, onWord) {
    if (!this.supported || !list || i >= list.length) return;
    try { if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel(); } catch(e){}
    const u = new SpeechSynthesisUtterance(list[i]);
    u.rate = this.rate; u.pitch = 1;
    if (this.pref) u.voice = this.pref;
    u.lang = (this.pref && this.pref.lang) || 'zh-CN';
    if (onWord) onWord(i);
    u.onend = () => setTimeout(() => this.speakSeq(list, i+1, onWord), 400);
    u.onerror = (e) => { const err = e && e.error; if (err==='interrupted'||err==='canceled') return; console.warn(err); };
    speechSynthesis.speak(u);
  },
};
tts.init();

// ============ 存储 ============
const store = {
  ns: 'yw.v1',
  _read() { try { return JSON.parse(localStorage.getItem(this.ns) || '{}'); } catch { return {}; } },
  _write(d) { localStorage.setItem(this.ns, JSON.stringify(d)); },
  getUnit(id) { const d=this._read(); return d[id]||{stars:0,best:0,totalRight:0,totalWrong:0,wrongList:[]}; },
  saveUnit(id, patch) { const d=this._read(); d[id]=Object.assign(this.getUnit(id),patch); this._write(d); },
  addWrong(id, item) { const d=this._read(); const r=d[id]||{stars:0,best:0,totalRight:0,totalWrong:0,wrongList:[]}; r.wrongList=[item,...(r.wrongList||[])].slice(0,40); d[id]=r; this._write(d); },
  clearWrong(id) { const d=this._read(); if (d[id]) { d[id].wrongList=[]; this._write(d); } },
  incStat(id, right) { const d=this._read(); const r=d[id]||{stars:0,best:0,totalRight:0,totalWrong:0,wrongList:[]}; if(right) r.totalRight++; else r.totalWrong++; d[id]=r; this._write(d); },

  getStory(id) { const d=this._read(); return (d.__stories||{})[id]||{done:false,scene:0}; },
  saveStory(id, patch) { const d=this._read(); const st=d.__stories||{}; st[id]=Object.assign(this.getStory(id),patch); d.__stories=st; this._write(d); },
  reset() { localStorage.removeItem(this.ns); }
};

// ============ 工具 ============
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
const shuffle = (a) => { a=a.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const norm = (s) => String(s).trim().replace(/\s+/g,'');
const same = (a,b) => norm(a) === norm(b);

// ============ 通关烟花 ============
function firework() {
  const emojis = ['🎉','🎊','⭐','🌟','✨','🎈','🏆'];
  for (let i=0; i<12; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'firework';
      el.textContent = pick(emojis);
      el.style.left = (Math.random()*window.innerWidth) + 'px';
      el.style.top = (window.innerHeight * 0.4 + Math.random()*100) + 'px';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    }, i*80);
  }
}

// ============ 笔顺动画弹窗（hanzi-writer） ============
let strokeWriter = null;
function showStroke(zi) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="box" style="position:relative">
      <span class="close" id="mclose">×</span>
      <h3>${zi.han}</h3>
      <p class="info">${zi.pinyin || ''} ${zi.radical ? '· 部首「'+zi.radical+'」' : ''} ${zi.strokes ? '· '+zi.strokes+'画' : ''}</p>
      ${zi.meaning ? `<p class="info" style="margin-top:-4px">${zi.meaning}</p>` : ''}
      <div class="stroke-target" id="stroke-target"></div>
      <div class="row">
        <button class="primary" id="replay">▶️ 演示</button>
        <button id="quiz-mode">✍️ 我来写</button>
        <button id="speak-zi">🔊 读一下</button>
      </div>
      <p class="info" style="margin-top:8px">数据来源：hanzi-writer</p>
    </div>
  `;
  document.body.appendChild(modal);
  const close = () => { modal.remove(); if (strokeWriter) strokeWriter = null; };
  modal.querySelector('#mclose').onclick = close;
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  modal.querySelector('#speak-zi').onclick = () => tts.speak(zi.han);

  if (typeof HanziWriter === 'undefined') {
    document.getElementById('stroke-target').innerHTML = '<p style="padding:20px;color:var(--muted)">笔顺库加载失败</p>';
    return;
  }
  const create = () => HanziWriter.create('stroke-target', zi.han, {
    width: 240, height: 240, padding: 8,
    strokeAnimationSpeed: 1, delayBetweenStrokes: 250,
    strokeColor: '#e11d48', outlineColor: '#f4c0cf',
    showOutline: true, showCharacter: false,
  });
  try {
    strokeWriter = create();
    strokeWriter.animateCharacter();
  } catch (e) {
    document.getElementById('stroke-target').innerHTML = '<p style="padding:20px;color:var(--muted)">该字暂无笔顺数据</p>';
  }
  modal.querySelector('#replay').onclick = () => { try { strokeWriter && strokeWriter.animateCharacter(); } catch(e){} };
  modal.querySelector('#quiz-mode').onclick = () => {
    try {
      strokeWriter && strokeWriter.quiz({ leniency: 1.2, showHintAfterMisses: 2, onComplete: () => { firework(); tts.speak(zi.han); } });
    } catch(e){}
  };
}
// ============ 单元数据（三年级语文，选取核心生字·词语·古诗） ============
const UNITS = [
  {
    id:'y1', term:'上册', title:'第一单元 · 秋天的图画',
    desc:'描写秋天的字词与短句',
    words:[
      {han:'秋', pinyin:'qiū', meaning:'秋天'},
      {han:'凉', pinyin:'liáng', meaning:'凉爽；冷'},
      {han:'枫', pinyin:'fēng', meaning:'枫树'},
      {han:'黄', pinyin:'huáng', meaning:'黄色'},
      {han:'落', pinyin:'luò', meaning:'落下'},
      {han:'菊', pinyin:'jú', meaning:'菊花'},
      {han:'桂', pinyin:'guì', meaning:'桂花'},
      {han:'霜', pinyin:'shuāng', meaning:'霜'},
      {han:'寒', pinyin:'hán', meaning:'寒冷'},
      {han:'谷', pinyin:'gǔ', meaning:'谷子；山谷'},
    ],
    phrases:[
      {cn:'秋高气爽', hint:'秋天天空晴朗，空气清爽'},
      {cn:'金桂飘香', hint:'桂花开放，香气四溢'},
      {cn:'层林尽染', hint:'树林一层层被染红'},
      {cn:'瓜果飘香', hint:'秋天丰收，果实清香'},
    ],
    poem:{
      title:'山行', author:'唐 · 杜牧',
      lines:['远上寒山石径斜，','白云生处有人家。','停车坐爱枫林晚，','霜叶红于二月花。'],
      trans:'弯弯曲曲的石头小路一直通到寒冷的山顶，白云飘浮的地方隐约有人家。停下车来只因喜爱这傍晚的枫林——秋霜染过的枫叶比二月的春花还要红艳。',
    },
  },
  {
    id:'y2', term:'上册', title:'第二单元 · 金色的草地',
    desc:'花草与颜色',
    words:[
      {han:'蒲', pinyin:'pú', meaning:'蒲公英'},
      {han:'英', pinyin:'yīng', meaning:'花'},
      {han:'耍', pinyin:'shuǎ', meaning:'玩耍'},
      {han:'哈', pinyin:'hā', meaning:'笑声'},
      {han:'欠', pinyin:'qiàn', meaning:'欠身；打哈欠'},
      {han:'钓', pinyin:'diào', meaning:'钓鱼'},
      {han:'察', pinyin:'chá', meaning:'观察'},
      {han:'拢', pinyin:'lǒng', meaning:'合拢'},
      {han:'趣', pinyin:'qù', meaning:'有趣'},
      {han:'装', pinyin:'zhuāng', meaning:'装扮'},
    ],
    phrases:[
      {cn:'一本正经', hint:'很认真严肃的样子'},
      {cn:'引人注目', hint:'吸引人的注意'},
      {cn:'合拢张开', hint:'描写蒲公英花瓣'},
      {cn:'仔细观察', hint:'很认真地看'},
    ],
    poem:{
      title:'赠刘景文', author:'宋 · 苏轼',
      lines:['荷尽已无擎雨盖，','菊残犹有傲霜枝。','一年好景君须记，','正是橙黄橘绿时。'],
      trans:'荷花凋谢了连遮雨的荷叶也没了，菊花凋零后还留着傲霜的枝干。一年当中最美的景色你一定要记住，正是橙子金黄、橘子还绿的时节。',
    },
  },
  {
    id:'y3', term:'上册', title:'第三单元 · 童话世界',
    desc:'童话与形容词',
    words:[
      {han:'蓝', pinyin:'lán', meaning:'蓝色'},
      {han:'笨', pinyin:'bèn', meaning:'笨拙'},
      {han:'翅', pinyin:'chì', meaning:'翅膀'},
      {han:'膀', pinyin:'bǎng', meaning:'翅膀'},
      {han:'仰', pinyin:'yǎng', meaning:'仰望'},
      {han:'羡', pinyin:'xiàn', meaning:'羡慕'},
      {han:'慕', pinyin:'mù', meaning:'羡慕'},
      {han:'焰', pinyin:'yàn', meaning:'火焰'},
      {han:'豫', pinyin:'yù', meaning:'犹豫'},
      {han:'愿', pinyin:'yuàn', meaning:'愿意'},
    ],
    phrases:[
      {cn:'五颜六色', hint:'颜色很多'},
      {cn:'翩翩起舞', hint:'轻快地跳舞'},
      {cn:'展翅高飞', hint:'张开翅膀飞得很高'},
      {cn:'目不转睛', hint:'眼睛不转动地看'},
    ],
    poem:{
      title:'夜书所见', author:'宋 · 叶绍翁',
      lines:['萧萧梧叶送寒声，','江上秋风动客情。','知有儿童挑促织，','夜深篱落一灯明。'],
      trans:'萧萧秋风吹动梧桐叶，送来阵阵寒意；江上秋风勾起旅人思乡的情。忽然看到远处篱笆下有一盏灯，猜想是孩子们在捉蟋蟀。',
    },
  },
  {
    id:'y4', term:'上册', title:'第四单元 · 观察与发现',
    desc:'观察类字词',
    words:[
      {han:'检', pinyin:'jiǎn', meaning:'检查'},
      {han:'查', pinyin:'chá', meaning:'查看'},
      {han:'纠', pinyin:'jiū', meaning:'纠正'},
      {han:'惯', pinyin:'guàn', meaning:'习惯'},
      {han:'努', pinyin:'nǔ', meaning:'努力'},
      {han:'骄', pinyin:'jiāo', meaning:'骄傲'},
      {han:'傲', pinyin:'ào', meaning:'骄傲'},
      {han:'虚', pinyin:'xū', meaning:'谦虚'},
      {han:'诚', pinyin:'chéng', meaning:'诚实'},
      {han:'实', pinyin:'shí', meaning:'真实'},
    ],
    phrases:[
      {cn:'一丝不苟', hint:'非常认真，一点也不马虎'},
      {cn:'专心致志', hint:'非常专注'},
      {cn:'脚踏实地', hint:'做事踏实认真'},
      {cn:'实事求是', hint:'按照事实办事'},
    ],
    poem:{
      title:'望天门山', author:'唐 · 李白',
      lines:['天门中断楚江开，','碧水东流至此回。','两岸青山相对出，','孤帆一片日边来。'],
      trans:'天门山被长江从中冲开，碧绿的江水到这里回旋。两岸青山对望着从水面伸出，一片孤帆从太阳升起的地方驶来。',
    },
  },
  {
    id:'y5', term:'下册', title:'第五单元 · 春天的美景',
    desc:'春天与万物',
    words:[
      {han:'柳', pinyin:'liǔ', meaning:'柳树'},
      {han:'莺', pinyin:'yīng', meaning:'黄莺'},
      {han:'燕', pinyin:'yàn', meaning:'燕子'},
      {han:'鸳', pinyin:'yuān', meaning:'鸳鸯'},
      {han:'鸯', pinyin:'yāng', meaning:'鸳鸯'},
      {han:'惠', pinyin:'huì', meaning:'恩惠；惠崇'},
      {han:'崇', pinyin:'chóng', meaning:'崇高；崇拜'},
      {han:'芦', pinyin:'lú', meaning:'芦苇'},
      {han:'芽', pinyin:'yá', meaning:'芽'},
      {han:'豚', pinyin:'tún', meaning:'河豚'},
    ],
    phrases:[
      {cn:'春光明媚', hint:'春天景色明亮美丽'},
      {cn:'百花齐放', hint:'各种花一起开放'},
      {cn:'莺歌燕舞', hint:'黄莺唱歌、燕子飞舞'},
      {cn:'鸟语花香', hint:'鸟叫声花香'},
    ],
    poem:{
      title:'惠崇春江晚景', author:'宋 · 苏轼',
      lines:['竹外桃花三两枝，','春江水暖鸭先知。','蒌蒿满地芦芽短，','正是河豚欲上时。'],
      trans:'竹林外两三枝桃花已经开放；春江水暖了，鸭子最先感觉到。蒌蒿长满江滩，芦芽刚刚冒出，正是河豚将要逆流而上的季节。',
    },
  },
  {
    id:'y6', term:'下册', title:'第六单元 · 传统节日',
    desc:'节日与习俗',
    words:[
      {han:'贴', pinyin:'tiē', meaning:'张贴'},
      {han:'宵', pinyin:'xiāo', meaning:'元宵'},
      {han:'巷', pinyin:'xiàng', meaning:'小巷'},
      {han:'祭', pinyin:'jì', meaning:'祭祀'},
      {han:'扫', pinyin:'sǎo', meaning:'扫墓'},
      {han:'舟', pinyin:'zhōu', meaning:'船'},
      {han:'艾', pinyin:'ài', meaning:'艾草'},
      {han:'堂', pinyin:'táng', meaning:'厅堂'},
      {han:'乞', pinyin:'qǐ', meaning:'乞求'},
      {han:'巧', pinyin:'qiǎo', meaning:'巧妙'},
    ],
    phrases:[
      {cn:'张灯结彩', hint:'挂上灯笼装饰彩带'},
      {cn:'普天同庆', hint:'全天下一起庆祝'},
      {cn:'欢聚一堂', hint:'高兴地聚在一起'},
      {cn:'团团圆圆', hint:'家人团聚'},
    ],
    poem:{
      title:'清明', author:'唐 · 杜牧',
      lines:['清明时节雨纷纷，','路上行人欲断魂。','借问酒家何处有，','牧童遥指杏花村。'],
      trans:'清明时节细雨纷纷飘落，路上行人心情低落像失了魂。请问哪里有酒家？牧童远远地指向开满杏花的村庄。',
    },
  },
  {
    id:'y7', term:'下册', title:'第七单元 · 神话与传说',
    desc:'故事与人物',
    words:[
      {han:'肃', pinyin:'sù', meaning:'严肃'},
      {han:'诉', pinyin:'sù', meaning:'告诉'},
      {han:'蹦', pinyin:'bèng', meaning:'跳'},
      {han:'瞄', pinyin:'miáo', meaning:'瞄准'},
      {han:'唇', pinyin:'chún', meaning:'嘴唇'},
      {han:'羞', pinyin:'xiū', meaning:'害羞'},
      {han:'惧', pinyin:'jù', meaning:'害怕'},
      {han:'吼', pinyin:'hǒu', meaning:'吼叫'},
      {han:'咬', pinyin:'yǎo', meaning:'咬'},
      {han:'唤', pinyin:'huàn', meaning:'呼唤'},
    ],
    phrases:[
      {cn:'呼风唤雨', hint:'形容能力很大'},
      {cn:'翻天覆地', hint:'变化很大'},
      {cn:'开天辟地', hint:'创造新天地'},
      {cn:'愚公移山', hint:'坚持不懈的精神'},
    ],
    poem:{
      title:'滁州西涧', author:'唐 · 韦应物',
      lines:['独怜幽草涧边生，','上有黄鹂深树鸣。','春潮带雨晚来急，','野渡无人舟自横。'],
      trans:'独爱涧边幽静生长的青草，深树里有黄鹂在鸣叫。傍晚春潮带着雨水急急涌来，无人的渡口只有一只小船横躺着。',
    },
  },
  {
    id:'y8', term:'下册', title:'第八单元 · 有趣的汉字',
    desc:'汉字的奥秘',
    words:[
      {han:'汉', pinyin:'hàn', meaning:'汉族；汉字'},
      {han:'甲', pinyin:'jiǎ', meaning:'甲骨文'},
      {han:'骨', pinyin:'gǔ', meaning:'骨头'},
      {han:'篆', pinyin:'zhuàn', meaning:'篆书'},
      {han:'隶', pinyin:'lì', meaning:'隶书'},
      {han:'楷', pinyin:'kǎi', meaning:'楷书'},
      {han:'仓', pinyin:'cāng', meaning:'仓颉；仓库'},
      {han:'颉', pinyin:'jié', meaning:'仓颉'},
      {han:'笔', pinyin:'bǐ', meaning:'笔'},
      {han:'画', pinyin:'huà', meaning:'笔画；绘画'},
    ],
    phrases:[
      {cn:'博大精深', hint:'内容丰富，含义深刻'},
      {cn:'源远流长', hint:'历史悠久'},
      {cn:'一字千金', hint:'一个字值一千金，形容文字价值高'},
      {cn:'字里行间', hint:'文字之间蕴含的意思'},
    ],
    poem:{
      title:'游山西村', author:'宋 · 陆游',
      lines:['莫笑农家腊酒浑，','丰年留客足鸡豚。','山重水复疑无路，','柳暗花明又一村。'],
      trans:'不要笑农家腊月里酿的酒浑浊，丰收之年他们招待客人有足够的鸡肉和猪肉。山重水复以为没有路了，忽然柳暗花明前面又是一个村庄。',
    },
  },
];
// ============ 出题机 ============
function makeQuestion(unit, level) {
  const words = unit.words;
  const w = pick(words);
  const distractors = shuffle(words.filter(x => x.han !== w.han)).slice(0,3);

  const t = level === 3
          ? pick(['poem-fill','han-pin-fill'])
          : level === 2
            ? pick(['han2pin','pin2han','poem-line','meaning'])
            : pick(['han2pin','pin2han','meaning']);

  if (t === 'han2pin') {
    const opts = shuffle([w, ...distractors].map(x=>x.pinyin));
    return { type:'choice', qHtml:`<div class="big-han">${w.han}</div><div class="hint">读音是？<span class="play-btn" data-play="${w.han}">🔊</span></div>`, autoPlay:w.han, options:opts, answer:w.pinyin, target:w };
  }
  if (t === 'pin2han') {
    const opts = shuffle([w, ...distractors].map(x=>x.han));
    return { type:'choice', qHtml:`<div style="font-size:34px;color:var(--brand);letter-spacing:2px">${w.pinyin}</div><div class="hint">是哪个字？</div>`, options:opts, answer:w.han, target:w };
  }
  if (t === 'meaning') {
    const opts = shuffle([w, ...distractors].map(x=>x.han));
    return { type:'choice', qHtml:`<div style="font-size:22px">意思是「<b>${w.meaning}</b>」的字是？</div>`, options:opts, answer:w.han, target:w };
  }
  if (t === 'han-pin-fill') {
    return { type:'fill', qHtml:`<div class="big-han">${w.han}</div><div class="hint">请写出拼音（例：hao3 也可写作 hǎo）<span class="play-btn" data-play="${w.han}">🔊</span></div>`, autoPlay:w.han, answer:w.pinyin, target:w, altAnswer: (w.pinyin||'').replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, ch => { const m={'ā':'a1','á':'a2','ǎ':'a3','à':'a4','ē':'e1','é':'e2','ě':'e3','è':'e4','ī':'i1','í':'i2','ǐ':'i3','ì':'i4','ō':'o1','ó':'o2','ǒ':'o3','ò':'o4','ū':'u1','ú':'u2','ǔ':'u3','ù':'u4','ǖ':'v1','ǘ':'v2','ǚ':'v3','ǜ':'v4'}; return m[ch]||ch; }) };
  }
  if (t === 'poem-line' || t === 'poem-fill') {
    const p = unit.poem;
    const lineIdx = rnd(0, p.lines.length-1);
    const line = p.lines[lineIdx];
    // 挑一个字挖空
    const chars = Array.from(line.replace(/[，。？！、；]/g,''));
    const target = pick(chars.length ? chars : ['?']);
    const disp = line.replace(target, '（　）');
    if (t === 'poem-fill') {
      return { type:'fill', qHtml:`<div style="font-size:14px;color:var(--muted)">${p.title} · ${p.author}</div><div style="font-size:22px;letter-spacing:3px;margin-top:4px">${disp}</div><div class="hint">填入括号里的字 <span class="play-btn" data-play="${line}">🔊</span></div>`, autoPlay:line, answer:target, target:{han:target, pinyin:'', meaning:'古诗：'+p.title} };
    }
    // poem-line: 从 3 个干扰句里选正确的下一句
    const nextIdx = Math.min(lineIdx+1, p.lines.length-1);
    if (nextIdx === lineIdx) return makeQuestion(unit, level); // 是最后一句，重来
    const correct = p.lines[nextIdx];
    const otherPoems = UNITS.filter(u=>u.id!==unit.id).map(u=>u.poem);
    const wrongLines = shuffle(otherPoems.flatMap(pp=>pp.lines)).slice(0,3);
    const opts = shuffle([correct, ...wrongLines]);
    return { type:'choice', qHtml:`<div style="font-size:14px;color:var(--muted)">${p.title} · ${p.author}</div><div style="font-size:20px;letter-spacing:2px;margin-top:4px">${p.lines[lineIdx]}</div><div class="hint">下一句是？<span class="play-btn" data-play="${p.lines[lineIdx]}">🔊</span></div>`, autoPlay:p.lines[lineIdx], options:opts, answer:correct, target:{han:correct, pinyin:'', meaning:'古诗：'+p.title} };
  }
  // fallback
  return makeQuestion(unit, 1);
}

// ============ SPA 状态与路由 ============
const app = document.getElementById('app');
let state = { view:'home', term:'全部', uid:null, mode:'practice', stage:1, index:0, total:10, current:null, right:0, wrong:0, currentWrongs:[] };
function nav(view, extra={}) { Object.assign(state, extra, { view }); render(); window.scrollTo(0,0); }
function starHtml(n) { return '★★★'.slice(0,n) + '☆☆☆'.slice(0,3-n); }

function voiceBar() {
  const voices = tts.voices;
  return `
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap;font-size:13px;color:var(--muted)">
      🔊 朗读：
      <select id="voice-sel" style="padding:4px 8px;border:1px solid var(--line);background:transparent;color:inherit;border-radius:8px;font-size:13px">
        ${voices.length===0 ? '<option>浏览器暂无语音</option>' : voices.map(v => `<option value="${v.voiceURI}" ${tts.pref && tts.pref.voiceURI===v.voiceURI?'selected':''}>${v.name} (${v.lang})</option>`).join('')}
      </select>
      语速
      <input type="range" min="0.5" max="1.2" step="0.1" value="${tts.rate}" id="rate-sel" style="width:100px" />
      <span id="rate-val">${tts.rate.toFixed(1)}x</span>
    </div>`;
}
function bindVoiceBar() {
  const vs = document.getElementById('voice-sel');
  if (vs) vs.onchange = () => tts.setVoice(vs.value);
  const rs = document.getElementById('rate-sel');
  if (rs) rs.oninput = () => { tts.setRate(parseFloat(rs.value)); document.getElementById('rate-val').textContent = tts.rate.toFixed(1)+'x'; };
}

function renderHome() {
  const terms = ['全部','上册','下册'];
  const list = state.term === '全部' ? UNITS : UNITS.filter(u => u.term === state.term);
  let totalStars = 0, wrongTotal = 0;
  for (const u of UNITS) { const r = store.getUnit(u.id); totalStars += r.stars; wrongTotal += (r.wrongList||[]).length; }
  app.innerHTML = `
    ${voiceBar()}
    <div class="summary">
      <div class="s-item"><div class="s-num">${totalStars}</div><div class="s-lbl">⭐ 星星</div></div>
      <div class="s-item"><div class="s-num">${wrongTotal}</div><div class="s-lbl">📕 错题</div></div>
      <div class="s-item"><div class="s-num">${UNITS.length}</div><div class="s-lbl">📚 单元</div></div>
      <button class="ghost sm" id="btn-stories" style="margin-left:auto">📖 故事屋</button>
      <button class="ghost sm" id="reset">🗑️ 清空进度</button>
    </div>
    <div class="tabs">
      ${terms.map(t => `<button class="${t===state.term?'active':''}" data-term="${t}">${t}</button>`).join('')}
    </div>
    <div class="grid">
      ${list.map(u => {
        const r = store.getUnit(u.id);
        return `<div class="card" data-id="${u.id}">
          <div class="badge">${u.term} · ${u.words.length} 生字</div>
          <h3>${u.title}</h3>
          <p>${u.desc}</p>
          <div class="stars">${starHtml(r.stars)} ${r.wrongList.length?`<span class="wrong-dot">📕 ${r.wrongList.length}</span>`:''}</div>
        </div>`;
      }).join('')}
    </div>`;
  bindVoiceBar();
  app.querySelectorAll('.tabs button').forEach(b => b.onclick = () => nav('home', { term: b.dataset.term }));
  app.querySelectorAll('.card').forEach(el => el.onclick = () => nav('unit', { uid: el.dataset.id }));
  document.getElementById('btn-stories').onclick = () => nav('stories');
  document.getElementById('reset').onclick = () => { if (confirm('确定清空所有星星和错题？')) { store.reset(); render(); } };
}

function renderUnit() {
  const u = UNITS.find(x => x.id === state.uid);
  const r = store.getUnit(u.id);
  app.innerHTML = `
    <a class="back" id="back">← 返回目录</a>
    ${voiceBar()}
    <div class="panel">
      <div class="badge">${u.term} · ${u.words.length} 生字 · ${u.phrases.length} 词语</div>
      <h2 style="margin:6px 0 4px">${u.title}</h2>
      <div class="stars big">${starHtml(r.stars)} ${r.best?`（历史最高 ${r.best} 分）`:''}</div>
    </div>

    <div class="panel">
      <h3 style="margin-top:0">🖌️ 生字（点击看笔顺动画）</h3>
      <div class="zi-grid">
        ${u.words.map((w,i) => `
          <div class="zi" data-i="${i}">
            <div class="han">${w.han}</div>
            <div class="pin">${w.pinyin}</div>
            <div class="meaning">${w.meaning}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="panel">
      <h3 style="margin-top:0">📝 词语（点击朗读）</h3>
      <div class="word-row">
        ${u.phrases.map(p => `<div class="word-chip" data-cn="${p.cn}" title="${p.hint||''}">${p.cn} 🔊</div>`).join('')}
      </div>
      <p class="hint" style="text-align:left;margin-top:10px">💡 悬停可见含义提示</p>
    </div>

    ${u.poem ? `
    <div class="panel">
      <h3 style="margin-top:0">📜 必背古诗</h3>
      <div class="poem">
        <div class="title">${u.poem.title}</div>
        <div class="author">${u.poem.author}</div>
        <div>
          ${u.poem.lines.map((l,i) => `<div class="line" data-i="${i}" data-cn="${l}">${l}</div>`).join('<br/>')}
        </div>
        <div style="margin-top:12px">
          <button class="primary" id="poem-play">▶️ 跟读整首诗</button>
          <button class="ghost" id="poem-stop">⏸ 停止</button>
        </div>
        <p style="color:var(--muted);font-size:13px;margin-top:12px;line-height:1.7">译文：${u.poem.trans}</p>
      </div>
    </div>` : ''}

    <div class="panel">
      <h3 style="margin-top:0">🎯 开始练习</h3>
      <div class="row">
        <button class="primary" id="practice">✏️ 练习模式（10 题）</button>
        <button class="primary" id="stage" style="background:#f59e0b">🏆 闯关模式</button>
        ${r.wrongList.length? `<button class="ghost" id="wrong">📕 错题本 (${r.wrongList.length})</button>` : ''}
      </div>
      <p style="color:var(--muted);font-size:13px;margin:10px 0 0">闯关：3 关递进，每关 5 题全对得 1 星</p>
    </div>
  `;
  bindVoiceBar();
  document.getElementById('back').onclick = () => nav('home');
  app.querySelectorAll('.zi').forEach(el => el.onclick = () => showStroke(u.words[parseInt(el.dataset.i)]));
  app.querySelectorAll('.word-chip').forEach(el => el.onclick = () => tts.speak(el.dataset.cn));
  app.querySelectorAll('.poem .line').forEach(el => el.onclick = () => { tts.speak(el.dataset.cn); highlightLine(parseInt(el.dataset.i)); });
  const pb = document.getElementById('poem-play');
  if (pb) pb.onclick = () => {
    if (!u.poem) return;
    tts.speakSeq(u.poem.lines, 0, (idx) => highlightLine(idx));
  };
  const ps = document.getElementById('poem-stop');
  if (ps) ps.onclick = () => { try { speechSynthesis.cancel(); } catch(e){} highlightLine(-1); };
  document.getElementById('practice').onclick = () => nav('quiz', { mode:'practice', total:10, index:0, right:0, wrong:0, current:null, currentWrongs:[] });
  document.getElementById('stage').onclick = () => nav('stage-select');
  const wb = document.getElementById('wrong'); if (wb) wb.onclick = () => nav('wrongbook');
}

function highlightLine(i) {
  document.querySelectorAll('.poem .line').forEach((el, idx) => {
    if (idx === i) el.classList.add('active'); else el.classList.remove('active');
  });
}

function renderStageSelect() {
  const u = UNITS.find(x => x.id === state.uid);
  const r = store.getUnit(u.id);
  const stages = [
    { n:1, name:'⭐ 初级', desc:'看字选拼音 / 看拼音选字 / 看义选字', unlock:true },
    { n:2, name:'⭐⭐ 中级', desc:'加入古诗上下句', unlock: r.stars >= 1 },
    { n:3, name:'⭐⭐⭐ 高级', desc:'补全古诗 / 写拼音', unlock: r.stars >= 2 },
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
  document.querySelectorAll('.stage-card').forEach(el => { if (el.classList.contains('locked')) return;
    el.onclick = () => nav('quiz', { mode:'stage', stage:parseInt(el.dataset.n), total:5, index:0, right:0, wrong:0, current:null, currentWrongs:[] });
  });
}

function nextQuestion() {
  const u = UNITS.find(x => x.id === state.uid);
  const level = state.mode === 'stage' ? state.stage : (1 + Math.floor(Math.random()*3));
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
    inputHtml = `<div class="options" id="options">${q.options.map(o=>`<button data-opt="${o}">${o}</button>`).join('')}</div>`;
  } else {
    inputHtml = `<div class="row" style="justify-content:center"><input id="ans" type="text" placeholder="输入答案" autocomplete="off" /><button class="primary" id="submit">提交</button></div><p class="hint">💡 拼音可用 hao3 这种数字调号，也可直接输入 hǎo</p>`;
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
  app.querySelectorAll('[data-play]').forEach(el => el.onclick = (e) => { e.stopPropagation(); tts.speak(el.dataset.play); });
  if (q.autoPlay) setTimeout(() => tts.speak(q.autoPlay), 200);

  const showFeedback = (ok, user) => {
    state.answered = true;
    if (ok) state.right++;
    else {
      state.wrong++;
      const item = { han:q.target.han, pinyin:q.target.pinyin||'', meaning:q.target.meaning||'', yours:user, at:Date.now() };
      state.currentWrongs.push(item); store.addWrong(u.id, item);
    }
    store.incStat(u.id, ok);
    if (ok && q.target && q.target.han && q.target.han.length <= 8) tts.speak(q.target.han);
    const fb = document.getElementById('fb');
    fb.innerHTML = `<div class="feedback ${ok?'ok':'bad'}">
      ${ok ? `✅ 正确！<b>${q.target.han}</b> ${q.target.pinyin?'· '+q.target.pinyin:''} ${q.target.meaning?'· '+q.target.meaning:''}`
           : `❌ 正确答案：<b>${q.answer}</b>${user!==undefined?`（你的：${user}）`:''}`}
      <div style="margin-top:8px"><button class="primary" id="next">${state.index+1<state.total?'下一题 →':'查看结果'}</button></div>
    </div>`;
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
      const ok = same(val, q.answer) || (q.altAnswer && same(val, q.altAnswer));
      showFeedback(ok, val);
    };
    document.getElementById('submit').onclick = submit;
    const inp = document.getElementById('ans');
    inp.addEventListener('keydown', e => { if (e.key==='Enter') submit(); });
    inp.focus();
  }
}

function renderResult() {
  const u = UNITS.find(x => x.id === state.uid);
  const total = state.right + state.wrong;
  const pct = total ? Math.round(state.right/total*100) : 0;
  const rec = store.getUnit(u.id);
  if (pct > rec.best) store.saveUnit(u.id, { best: pct });
  let gain = '';
  if (state.mode === 'stage' && state.wrong === 0) {
    if (state.stage > rec.stars) {
      store.saveUnit(u.id, { stars: state.stage });
      gain = `<p style="color:#f59e0b;font-size:18px;margin:8px 0"><b>🎉 恭喜通过第 ${state.stage} 关！</b>获得 1 颗星</p>`;
      setTimeout(firework, 300);
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
        ${state.currentWrongs.length?`<button class="ghost" id="review">📕 查看错题</button>`:''}
      </div>
    </div>
  `;
  document.getElementById('back').onclick = () => nav('unit');
  document.getElementById('again').onclick = () => nav('quiz', { index:0, right:0, wrong:0, current:null, currentWrongs:[] });
  document.getElementById('other').onclick = () => nav('home');
  const sb = document.getElementById('stages'); if (sb) sb.onclick = () => nav('stage-select');
  const rb = document.getElementById('review'); if (rb) rb.onclick = () => nav('wrongbook');
}

function renderWrongbook() {
  const u = UNITS.find(x => x.id === state.uid);
  const rec = store.getUnit(u.id);
  const list = rec.wrongList || [];
  app.innerHTML = `
    <a class="back" id="back">← 返回单元</a>
    <div class="panel">
      <h2 style="margin-top:0">📕 ${u.title} · 错题本</h2>
      <p style="color:var(--muted)">最近 ${list.length} 题（点🔊朗读）</p>
      ${list.length===0? '<p>暂无错题。做题时答错会自动记录。</p>' : ''}
      ${list.map((w,i) => `
        <div class="wrong-item">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <b>${i+1}. ${w.han}</b> ${w.pinyin?`<span style="color:var(--muted)">${w.pinyin}</span>`:''} ${w.meaning?'— '+w.meaning:''}
              ${w.yours!==undefined?`<div style="color:var(--muted);font-size:13px;margin-top:2px">你的答案：${w.yours}</div>`:''}
            </div>
            <span class="play-btn" data-play="${w.han}" style="font-size:22px;cursor:pointer">🔊</span>
          </div>
        </div>
      `).join('')}
      ${list.length? '<div style="margin-top:10px"><button class="ghost" id="clr">🗑️ 清空本单元错题</button></div>' : ''}
    </div>
  `;
  document.getElementById('back').onclick = () => nav('unit');
  app.querySelectorAll('[data-play]').forEach(el => el.onclick = () => tts.speak(el.dataset.play));
  const clr = document.getElementById('clr'); if (clr) clr.onclick = () => { if (confirm('清空本单元错题？')) { store.clearWrong(u.id); render(); } };
}

function render() {
  const m = { home: renderHome, unit: renderUnit, quiz: renderQuiz, 'stage-select': renderStageSelect, wrongbook: renderWrongbook, stories: renderStories, story: renderStory };
  (m[state.view] || renderHome)();
}
render();

// ============ 故事屋 ============
function renderStories() {
  const list = (window.STORIES || []);
  let done = 0; for (const st of list) if (store.getStory(st.id).done) done++;
  app.innerHTML = `
    <a class="back" id="back">← 返回目录</a>
    ${voiceBar()}
    <div class="panel">
      <h2 style="margin:0 0 4px">📖 故事屋</h2>
      <p style="color:var(--muted);margin:0">看动画 · 听朗读 · 学寓意（已读 ${done} / ${list.length}）</p>
    </div>
    <div class="story-grid">
      ${list.map(st => {
        const r = store.getStory(st.id);
        return `<div class="story-card" data-id="${st.id}">
          ${r.done?'<span class="done">✅</span>':''}
          <div class="emoji">${st.emoji}</div>
          <div class="kind">${st.kind}</div>
          <div class="st-title">${st.title}</div>
          <div class="tag-row" style="justify-content:center">${(st.tags||[]).slice(0,3).map(t=>`<span>${t}</span>`).join('')}</div>
        </div>`;
      }).join('')}
    </div>`;
  bindVoiceBar();
  document.getElementById('back').onclick = () => nav('home');
  app.querySelectorAll('.story-card').forEach(el => el.onclick = () => nav('story', { sid: el.dataset.id, scene: 0, autoplay:false }));
}

function renderStory() {
  const st = (window.STORIES||[]).find(x=>x.id===state.sid); if (!st) return nav('stories');
  const idx = Math.max(0, Math.min(state.scene||0, st.scenes.length-1));
  const sc = st.scenes[idx];
  const savedDone = store.getStory(st.id).done;
  app.innerHTML = `
    <a class="back" id="back">← 返回故事屋</a>
    ${voiceBar()}
    <div class="panel">
      <div class="badge">${st.kind}</div>
      <h2 style="margin:6px 0 4px">${st.emoji} ${st.title}</h2>
      <div class="stage-box" id="stage" style="background:${sc.bg}">
        <span class="badge-scene">第 ${idx+1} 幕 / ${st.scenes.length}</span>
        ${(sc.chars||[]).map(c=>`<span class="ch ${c.cls}" style="left:${c.x}%;top:${c.y}%">${c.e}</span>`).join('')}
        <div class="ground"></div>
        <div class="caption" id="caption">${sc.text}</div>
      </div>
      <div class="stage-toolbar">
        <button class="primary" id="play">🔊 朗读本幕</button>
        <button class="ghost" id="stop">⏸ 停止</button>
        <button class="ghost" id="prev" ${idx===0?'disabled':''}>◀ 上一幕</button>
        <button class="ghost" id="next">${idx===st.scenes.length-1?'完成 ✅':'下一幕 ▶'}</button>
        <div class="dots">
          ${st.scenes.map((_,i)=>`<i class="${i===idx?'on':''}" data-i="${i}"></i>`).join('')}
        </div>
      </div>
      ${idx===st.scenes.length-1 ? `
      <div class="moral-card">
        <b>💡 寓意：</b>${st.moral||''}
      </div>
      <div class="panel" style="margin-top:12px">
        <h3 style="margin-top:0">🔁 整体跟读</h3>
        <p style="color:var(--muted);font-size:14px">点击「整篇朗读」，会自动切换幕并朗读每一段文字。</p>
        <div class="row">
          <button class="primary" id="play-all">▶️ 整篇朗读</button>
          <button class="ghost" id="again">🔄 从头再看</button>
        </div>
      </div>` : ''}
    </div>`;
  bindVoiceBar();
  document.getElementById('back').onclick = () => { tts.cancel(); nav('stories'); };
  document.getElementById('play').onclick = () => { tts.cancel(); tts.speak(sc.text); };
  document.getElementById('stop').onclick = () => tts.cancel();
  document.getElementById('prev').onclick = () => { tts.cancel(); nav('story', { sid: st.id, scene: idx-1 }); };
  document.getElementById('next').onclick = () => {
    tts.cancel();
    if (idx === st.scenes.length-1) {
      if (!savedDone) store.saveStory(st.id, { done:true, scene: idx });
      firework();
      nav('stories');
    } else {
      nav('story', { sid: st.id, scene: idx+1 });
    }
  };
  app.querySelectorAll('.dots i').forEach(d => d.onclick = () => { tts.cancel(); nav('story', { sid: st.id, scene: parseInt(d.dataset.i,10) }); });
  const playAll = document.getElementById('play-all');
  if (playAll) playAll.onclick = () => playWholeStory(st);
  const again = document.getElementById('again'); if (again) again.onclick = () => nav('story', { sid: st.id, scene:0 });

  // 进入即自动朗读（如果 autoplay=true 或 用户在整篇播放里）
  if (state.autoplay) {
    setTimeout(() => tts.speak(sc.text, () => {
      if (state.autoplay && idx < st.scenes.length-1) nav('story', { sid: st.id, scene: idx+1, autoplay:true });
      else if (state.autoplay) { state.autoplay=false; if (!savedDone) store.saveStory(st.id,{done:true,scene:idx}); firework(); }
    }), 250);
  }
}

function playWholeStory(st) {
  tts.cancel();
  nav('story', { sid: st.id, scene: 0, autoplay: true });
}
