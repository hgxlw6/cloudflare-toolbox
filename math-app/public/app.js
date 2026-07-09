/* 三年级数学 学习+练习 前端 SPA
 * 章节参考人教版三年级上/下册核心内容
 */

// -------- 工具 --------
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (a) => { a = a.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const same = (a,b) => String(a).trim().replace(/\s+/g,'') === String(b).trim().replace(/\s+/g,'');

// -------- 题目生成器 --------
// 每个 generator 返回 { q: 'HTML片段', answer: '标准答案', type: 'fill'|'choice', options?: [...] }

const gens = {
  // 上册
  timeUnits() {
    const kinds = [
      () => { const m=rnd(1,5); return { q:`${m} 分 = ${'<span class="blank"></span>'} 秒`, answer: String(m*60) }; },
      () => { const s=rnd(60,300); const m=Math.floor(s/60), r=s%60; return { q:`${s} 秒 = ${'<span class="blank"></span>'} 分 ${'<span class="blank"></span>'} 秒`, answer: `${m},${r}`, hint:'两个空用英文逗号隔开', two:true }; },
      () => { const h=rnd(1,6); return { q:`${h} 小时 = ${'<span class="blank"></span>'} 分`, answer: String(h*60) }; },
      () => { const h=rnd(8,10), m=rnd(10,50); const total=h*60+m+rnd(20,90); const eh=Math.floor(total/60), em=total%60; return { q:`小明 ${h}:${String(m).padStart(2,'0')} 出门，走了 ${total-h*60-m} 分钟到学校，到学校时是 ${'<span class="blank"></span>'}:${'<span class="blank"></span>'}`, answer:`${eh},${String(em).padStart(2,'0')}`, hint:'先填小时，再填分钟，用英文逗号分隔', two:true }; },
    ];
    return pick(kinds)();
  },

  addSubWithin10000() {
    const kinds = [
      () => { const a=rnd(100,999), b=rnd(100,999); return { q:`${a} + ${b} = ${'<span class="blank"></span>'}`, answer:String(a+b) }; },
      () => { const a=rnd(500,999), b=rnd(100,499); return { q:`${a} − ${b} = ${'<span class="blank"></span>'}`, answer:String(a-b) }; },
      () => { const a=rnd(1000,4000), b=rnd(1000,4000); return { q:`${a} + ${b} = ${'<span class="blank"></span>'}`, answer:String(a+b) }; },
      () => { const a=rnd(3000,9000), b=rnd(1000,2999); return { q:`${a} − ${b} = ${'<span class="blank"></span>'}`, answer:String(a-b) }; },
    ];
    return pick(kinds)();
  },

  multiplyOneDigit() {
    const kinds = [
      () => { const a=rnd(11,99), b=rnd(2,9); return { q:`${a} × ${b} = ${'<span class="blank"></span>'}`, answer:String(a*b) }; },
      () => { const a=rnd(100,999), b=rnd(2,9); return { q:`${a} × ${b} = ${'<span class="blank"></span>'}`, answer:String(a*b) }; },
      () => { const a=rnd(12,50), b=rnd(3,9); return { q:`${b} 个 ${a} 的和是多少？<br/>答：${'<span class="blank"></span>'}`, answer:String(a*b) }; },
    ];
    return pick(kinds)();
  },

  divideOneDigit() {
    const kinds = [
      () => { const b=rnd(2,9), q=rnd(2,50); const a=b*q; return { q:`${a} ÷ ${b} = ${'<span class="blank"></span>'}`, answer:String(q) }; },
      () => { const b=rnd(2,9), q=rnd(3,30), r=rnd(1,b-1); const a=b*q+r; return { q:`${a} ÷ ${b} = ${'<span class="blank"></span>'} …… ${'<span class="blank"></span>'}`, answer:`${q},${r}`, hint:'商和余数用英文逗号隔开', two:true }; },
    ];
    return pick(kinds)();
  },

  fractionBasic() {
    const kinds = [
      () => { const d=rnd(3,9), n1=rnd(1,d-2), n2=rnd(1,d-n1-1); return { q:`${n1}/${d} + ${n2}/${d} = ${'<span class="blank"></span>'}/${d}`, answer:String(n1+n2) }; },
      () => { const d=rnd(3,9), n2=rnd(1,d-2), n1=rnd(n2+1,d-1); return { q:`${n1}/${d} − ${n2}/${d} = ${'<span class="blank"></span>'}/${d}`, answer:String(n1-n2) }; },
      () => { const d=rnd(3,9), n=rnd(1,d-1); const opts = shuffle([`${n}/${d}`,`${d-n}/${d}`,`${n}/${d+1}`,`${n+1}/${d}`]); return { q:`把一根绳子平均分成 ${d} 段，其中 ${n} 段是全长的多少？`, type:'choice', options: opts, answer: `${n}/${d}` }; },
    ];
    return pick(kinds)();
  },

  measureLength() {
    const table = { '毫米':1, '厘米':10, '分米':100, '米':1000, '千米':1000000 };
    const kinds = [
      () => { const m=rnd(1,9); return { q:`${m} 米 = ${'<span class="blank"></span>'} 厘米`, answer:String(m*100) }; },
      () => { const m=rnd(2,9); return { q:`${m} 分米 = ${'<span class="blank"></span>'} 厘米`, answer:String(m*10) }; },
      () => { const km=rnd(1,9); return { q:`${km} 千米 = ${'<span class="blank"></span>'} 米`, answer:String(km*1000) }; },
      () => { const cm=rnd(20,200); return { q:`${cm} 厘米 = ${'<span class="blank"></span>'} 毫米`, answer:String(cm*10) }; },
    ];
    return pick(kinds)();
  },

  measureMass() {
    const kinds = [
      () => { const t=rnd(1,9); return { q:`${t} 吨 = ${'<span class="blank"></span>'} 千克`, answer:String(t*1000) }; },
      () => { const kg=rnd(2,9); return { q:`${kg} 千克 = ${'<span class="blank"></span>'} 克`, answer:String(kg*1000) }; },
      () => { const g=rnd(1,9)*1000; return { q:`${g} 克 = ${'<span class="blank"></span>'} 千克`, answer:String(g/1000) }; },
    ];
    return pick(kinds)();
  },

  // 下册
  position() {
    const dirs=['东','南','西','北'];
    const opps={东:'西',西:'东',南:'北',北:'南'};
    const kinds = [
      () => { const d=pick(dirs); return { q:`太阳升起的方向是？`, type:'choice', options: shuffle(dirs), answer:'东' }; },
      () => { const d=pick(dirs); return { q:`${d} 的相反方向是？`, type:'choice', options: shuffle(dirs), answer: opps[d] }; },
      () => { return { q:`地图上通常"上北下南，左西右____"，横线上填？`, type:'choice', options: shuffle(dirs), answer:'东' }; },
    ];
    return pick(kinds)();
  },

  divideTwoDigit() {
    const kinds = [
      () => { const b=rnd(2,9), q=rnd(10,50); const a=b*q; return { q:`${a} ÷ ${b} = ${'<span class="blank"></span>'}`, answer:String(q) }; },
      () => { const b=rnd(2,9), q=rnd(10,80), r=rnd(1,b-1); const a=b*q+r; return { q:`${a} ÷ ${b} = ${'<span class="blank"></span>'} …… ${'<span class="blank"></span>'}`, answer:`${q},${r}`, hint:'商，余数', two:true }; },
    ];
    return pick(kinds)();
  },

  multiplyTwoDigit() {
    const kinds = [
      () => { const a=rnd(11,49), b=rnd(11,49); return { q:`${a} × ${b} = ${'<span class="blank"></span>'}`, answer:String(a*b) }; },
      () => { const a=rnd(50,99), b=rnd(11,29); return { q:`${a} × ${b} = ${'<span class="blank"></span>'}`, answer:String(a*b) }; },
      () => { const a=rnd(20,99); const opts=shuffle([String(a*10),String(a*100),String(a+10),String(a*1000)]); return { q:`${a} × 100 = ?`, type:'choice', options:opts, answer:String(a*100) }; },
    ];
    return pick(kinds)();
  },

  area() {
    const kinds = [
      () => { const a=rnd(3,15), b=rnd(3,15); return { q:`长方形长 ${a} 厘米，宽 ${b} 厘米，面积 = ${'<span class="blank"></span>'} 平方厘米`, answer:String(a*b) }; },
      () => { const a=rnd(3,15); return { q:`边长为 ${a} 米的正方形面积 = ${'<span class="blank"></span>'} 平方米`, answer:String(a*a) }; },
      () => { const a=rnd(3,15), b=rnd(3,15); return { q:`长方形长 ${a} 米，宽 ${b} 米，周长 = ${'<span class="blank"></span>'} 米`, answer:String(2*(a+b)) }; },
      () => { return { q:`1 平方米 = ${'<span class="blank"></span>'} 平方分米`, answer:'100' }; },
      () => { return { q:`1 平方分米 = ${'<span class="blank"></span>'} 平方厘米`, answer:'100' }; },
    ];
    return pick(kinds)();
  },

  decimalBasic() {
    const kinds = [
      () => { const a=rnd(1,9)/10 + rnd(0,9); const s=a.toFixed(1); const yuan=Math.floor(a), jiao=Math.round((a-yuan)*10); return { q:`${s} 元 = ${'<span class="blank"></span>'} 元 ${'<span class="blank"></span>'} 角`, answer:`${yuan},${jiao}`, hint:'元数，角数', two:true }; },
      () => { const a=(rnd(1,9)+rnd(1,9)/10).toFixed(1), b=(rnd(1,5)+rnd(1,9)/10).toFixed(1); const s=(parseFloat(a)+parseFloat(b)).toFixed(1); return { q:`${a} + ${b} = ${'<span class="blank"></span>'}`, answer:s }; },
      () => { const a=(rnd(5,9)+rnd(1,9)/10).toFixed(1), b=(rnd(1,4)+rnd(1,9)/10).toFixed(1); const s=(parseFloat(a)-parseFloat(b)).toFixed(1); return { q:`${a} − ${b} = ${'<span class="blank"></span>'}`, answer:s }; },
      () => { const opts = shuffle(['0.1','0.01','0.5','1.0']); return { q:`把 1 元平均分成 10 份，每份是多少元？`, type:'choice', options:opts, answer:'0.1' }; },
    ];
    return pick(kinds)();
  },

  statistics() {
    const data = [rnd(3,20),rnd(3,20),rnd(3,20),rnd(3,20)];
    const names = ['苹果','香蕉','橘子','葡萄'];
    const total = data.reduce((a,b)=>a+b,0);
    const kinds = [
      () => { const maxI = data.indexOf(Math.max(...data)); return { q:`统计四种水果销量：${names.map((n,i)=>`${n}${data[i]}`).join('、')}。销量最多的是？`, type:'choice', options:shuffle(names), answer:names[maxI] }; },
      () => ({ q:`四种水果一共卖出 ${'<span class="blank"></span>'} 个：${names.map((n,i)=>`${n}${data[i]}`).join('、')}`, answer:String(total) }),
      () => { const avg = Math.round(total/4); return { q:`四种水果销量分别是 ${data.join('、')}，平均每种卖出 ${'<span class="blank"></span>'} 个（结果保留整数）`, answer:String(avg), hint:'总数÷4，四舍五入' }; },
    ];
    return pick(kinds)();
  },

  yearMonthDay() {
    const kinds = [
      () => ({ q:`一年有 ${'<span class="blank"></span>'} 个月`, answer:'12' }),
      () => ({ q:`一年有 ${'<span class="blank"></span>'} 天（平年）`, answer:'365' }),
      () => ({ q:`一年有 ${'<span class="blank"></span>'} 天（闰年）`, answer:'366' }),
      () => { const opts=shuffle(['28','29','30','31']); return { q:`2024 年 2 月有多少天？`, type:'choice', options:opts, answer:'29' }; },
      () => { const opts=shuffle(['28','29','30','31']); return { q:`2025 年 2 月有多少天？`, type:'choice', options:opts, answer:'28' }; },
      () => { const opts=shuffle(['30','31']); return { q:`7 月有多少天？`, type:'choice', options:opts, answer:'31' }; },
    ];
    return pick(kinds)();
  },
};

// -------- 章节数据 --------
const CHAPTERS = [
  {
    id:'time', term:'上册', title:'时、分、秒',
    tag:'时间单位',
    desc:'认识时、分、秒，掌握它们的换算。',
    lessons: [
      '1 时 = 60 分，1 分 = 60 秒。',
      '计算经过时间：结束时刻 − 开始时刻。跨小时时先加到整点，再补足剩余分钟。',
      '例：8:20 到 9:05，先 8:20 → 9:00 是 40 分，再 9:00 → 9:05 是 5 分，共 45 分。',
    ],
    gen: gens.timeUnits,
  },
  {
    id:'addsub', term:'上册', title:'万以内加减法',
    tag:'计算',
    desc:'三位数、四位数的加减法竖式计算。',
    lessons: [
      '数位对齐，从个位算起。',
      '加法：满十进一；减法：不够减向前一位借 1 当 10。',
      '技巧：验算时用"减法验算加法"或者"交换加数验算"。',
    ],
    gen: gens.addSubWithin10000,
  },
  {
    id:'measure_len', term:'上册', title:'长度单位',
    tag:'测量',
    desc:'毫米、厘米、分米、米、千米之间的换算。',
    lessons:[
      '1 厘米 = 10 毫米，1 分米 = 10 厘米，1 米 = 10 分米 = 100 厘米，1 千米 = 1000 米。',
      '大单位换小单位 × 进率；小单位换大单位 ÷ 进率。',
    ],
    gen: gens.measureLength,
  },
  {
    id:'measure_mass', term:'上册', title:'质量单位',
    tag:'测量',
    desc:'吨、千克、克的换算。',
    lessons:[
      '1 吨 = 1000 千克，1 千克 = 1000 克。',
      '常用参考：一枚 1 元硬币约 6 克，一袋大米 25 千克，一辆小汽车约 1 吨。',
    ],
    gen: gens.measureMass,
  },
  {
    id:'multi1', term:'上册', title:'多位数乘一位数',
    tag:'计算',
    desc:'两位数、三位数乘一位数。',
    lessons:[
      '从个位起，逐位相乘，满几十向前进几。',
      '例：237 × 4：4×7=28 写 8 进 2；4×3+2=14 写 4 进 1；4×2+1=9。得 948。',
    ],
    gen: gens.multiplyOneDigit,
  },
  {
    id:'div1', term:'上册', title:'有余数的除法',
    tag:'计算',
    desc:'带余除法：商 × 除数 + 余数 = 被除数。',
    lessons:[
      '余数一定要 **小于** 除数。',
      '检验：商 × 除数 + 余数 应等于被除数。',
    ],
    gen: gens.divideOneDigit,
  },
  {
    id:'frac', term:'上册', title:'分数的初步认识',
    tag:'分数',
    desc:'认识几分之一、几分之几，同分母加减。',
    lessons:[
      '把一个整体平均分成若干份，其中 1 份就是几分之一。',
      '同分母分数相加减：分母不变，分子相加或相减。',
      '例：2/7 + 3/7 = 5/7。',
    ],
    gen: gens.fractionBasic,
  },

  {
    id:'position', term:'下册', title:'位置与方向',
    tag:'空间',
    desc:'东南西北，地图方向。',
    lessons:[
      '地图上默认"上北、下南、左西、右东"。',
      '东和西相反，南和北相反。太阳东升西落。',
    ],
    gen: gens.position,
  },
  {
    id:'div2', term:'下册', title:'除数是一位数的除法',
    tag:'计算',
    desc:'两三位数除以一位数（有商、有余）。',
    lessons:[
      '从被除数的最高位开始试商，商写在对应数位上。',
      '每步余数必须小于除数，再落下一位继续。',
    ],
    gen: gens.divideTwoDigit,
  },
  {
    id:'stat', term:'下册', title:'数据的收集与整理',
    tag:'统计',
    desc:'读懂统计图/表，简单平均数。',
    lessons:[
      '总数 = 各项之和；平均数 = 总数 ÷ 项数。',
      '看图题先看横纵坐标含义，再比较数量大小。',
    ],
    gen: gens.statistics,
  },
  {
    id:'ymd', term:'下册', title:'年、月、日',
    tag:'时间',
    desc:'认识年月日，平年与闰年。',
    lessons:[
      '一年 12 个月，31 天的月份：1、3、5、7、8、10、12；30 天的月份：4、6、9、11。',
      '平年 365 天（2 月 28 天），闰年 366 天（2 月 29 天）。',
      '判断闰年：能被 4 整除且不能被 100 整除，或者能被 400 整除。',
    ],
    gen: gens.yearMonthDay,
  },
  {
    id:'multi2', term:'下册', title:'两位数乘两位数',
    tag:'计算',
    desc:'两位数乘两位数的竖式。',
    lessons:[
      '先用第二个乘数个位去乘，再用十位去乘（十位结果左移一位），最后相加。',
      '整十整百相乘：先算不带 0 的部分，再在结果末尾补上 0。例：30 × 40 = 1200。',
    ],
    gen: gens.multiplyTwoDigit,
  },
  {
    id:'area', term:'下册', title:'面积',
    tag:'几何',
    desc:'长方形、正方形的面积和周长。',
    lessons:[
      '长方形面积 = 长 × 宽；周长 = (长 + 宽) × 2。',
      '正方形面积 = 边长 × 边长；周长 = 边长 × 4。',
      '常用面积单位：平方厘米、平方分米、平方米。1 平方米 = 100 平方分米 = 10000 平方厘米。',
    ],
    gen: gens.area,
  },
  {
    id:'decimal', term:'下册', title:'小数的初步认识',
    tag:'小数',
    desc:'一位小数的含义、加减以及元角分。',
    lessons:[
      '把 1 平均分成 10 份，其中 1 份就是 0.1。',
      '一位小数加减：小数点对齐，按整数方法算，最后点上小数点。',
      '元角分：1 元 = 10 角 = 100 分。例：3.5 元 = 3 元 5 角。',
    ],
    gen: gens.decimalBasic,
  },
];

// -------- 路由与渲染 --------
const app = document.getElementById('app');
let state = { view:'home', term:'全部', chId:null, index:0, total:10, current:null, right:0, wrong:0 };

function nav(view, extra={}) {
  Object.assign(state, extra, { view });
  render();
  window.scrollTo(0, 0);
}

function renderHome() {
  const terms = ['全部','上册','下册'];
  const list = state.term === '全部' ? CHAPTERS : CHAPTERS.filter(c => c.term === state.term);
  app.innerHTML = `
    <div class="tabs">
      ${terms.map(t => `<button class="${t===state.term?'active':''}" data-term="${t}">${t}</button>`).join('')}
    </div>
    <div class="grid">
      ${list.map(c => `
        <div class="card" data-id="${c.id}">
          <div class="badge">${c.term} · ${c.tag}</div>
          <h3>${c.title}</h3>
          <p>${c.desc}</p>
        </div>
      `).join('')}
    </div>
  `;
  app.querySelectorAll('.tabs button').forEach(b => b.onclick = () => nav('home', { term: b.dataset.term }));
  app.querySelectorAll('.card').forEach(el => el.onclick = () => nav('chapter', { chId: el.dataset.id }));
}

function renderChapter() {
  const ch = CHAPTERS.find(c => c.id === state.chId);
  app.innerHTML = `
    <a class="back" id="back">← 返回目录</a>
    <div class="panel">
      <h2>📘 ${ch.title} · 知识点</h2>
      ${ch.lessons.map(l => `<p>• ${l}</p>`).join('')}
    </div>
    <div class="panel">
      <h2>✏️ 练习巩固（10 题）</h2>
      <p style="color:var(--muted);margin:0 0 12px">做错也没关系，会显示正确答案。做完 10 题会给出得分。</p>
      <div class="row">
        <button class="primary" id="start">开始练习</button>
        <button class="ghost" id="only-view">只看知识点</button>
      </div>
    </div>
  `;
  document.getElementById('back').onclick = () => nav('home');
  document.getElementById('start').onclick = () => {
    state.index = 0; state.right = 0; state.wrong = 0; state.current = null;
    nav('quiz');
  };
  document.getElementById('only-view').onclick = () => nav('home');
}

function nextQuestion() {
  const ch = CHAPTERS.find(c => c.id === state.chId);
  state.current = ch.gen();
  state.answered = false;
}

function renderQuiz() {
  const ch = CHAPTERS.find(c => c.id === state.chId);
  if (state.index >= state.total) return renderResult();
  if (!state.current) nextQuestion();

  const q = state.current;
  const progress = Math.round((state.index / state.total) * 100);

  let inputHtml;
  if (q.type === 'choice') {
    inputHtml = `<div class="options" id="options">
      ${q.options.map(o => `<button data-opt="${o}">${o}</button>`).join('')}
    </div>`;
  } else if (q.two) {
    inputHtml = `<div class="row">
      <input id="ans1" type="text" placeholder="第一空" autocomplete="off" />
      <input id="ans2" type="text" placeholder="第二空" autocomplete="off" />
      <button class="primary" id="submit">提交</button>
    </div>${q.hint?`<p style="color:var(--muted);font-size:13px;margin:6px 0 0">提示：${q.hint}</p>`:''}`;
  } else {
    inputHtml = `<div class="row">
      <input id="ans" type="text" placeholder="输入答案" autocomplete="off" />
      <button class="primary" id="submit">提交</button>
    </div>${q.hint?`<p style="color:var(--muted);font-size:13px;margin:6px 0 0">提示：${q.hint}</p>`:''}`;
  }

  app.innerHTML = `
    <a class="back" id="back">← 返回章节</a>
    <div class="panel">
      <div class="quiz-head">
        <span>${ch.title} · 第 ${state.index+1} / ${state.total} 题</span>
        <span>✅ ${state.right} &nbsp; ❌ ${state.wrong}</span>
      </div>
      <div class="progress"><i style="width:${progress}%"></i></div>
      <div class="q">${q.q}</div>
      ${inputHtml}
      <div id="fb"></div>
    </div>
  `;

  document.getElementById('back').onclick = () => nav('chapter');

  const showFeedback = (ok, user) => {
    state.answered = true;
    if (ok) state.right++; else state.wrong++;
    const fb = document.getElementById('fb');
    fb.innerHTML = `<div class="feedback ${ok?'ok':'bad'}">
      ${ok ? '✅ 回答正确！' : `❌ 正确答案是 <b>${q.answer}</b>${user!==undefined?`，你的答案是 <b>${user}</b>`:''}`}
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
      let val;
      if (q.two) {
        const a1 = document.getElementById('ans1').value;
        const a2 = document.getElementById('ans2').value;
        if (!a1 || !a2) return;
        val = `${a1},${a2}`;
      } else {
        val = document.getElementById('ans').value;
        if (!val) return;
      }
      const ok = same(val, q.answer);
      showFeedback(ok, val);
    };
    document.getElementById('submit').onclick = submit;
    document.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key==='Enter') submit(); }));
    const first = document.getElementById('ans1') || document.getElementById('ans');
    if (first) first.focus();
  }
}

function renderResult() {
  const ch = CHAPTERS.find(c => c.id === state.chId);
  const total = state.right + state.wrong;
  const pct = total ? Math.round(state.right / total * 100) : 0;
  const level = pct >= 90 ? '🏆 太棒了' : pct >= 70 ? '👍 不错' : pct >= 50 ? '💪 继续努力' : '📖 多复习一下';
  app.innerHTML = `
    <a class="back" id="back">← 返回章节</a>
    <div class="panel" style="text-align:center">
      <h2>${ch.title} · 练习结果</h2>
      <div style="font-size:56px; margin: 6px 0">${pct}<span style="font-size:24px">分</span></div>
      <p>${level}　✅ 正确 ${state.right}　❌ 错误 ${state.wrong}</p>
      <div class="row" style="justify-content:center; margin-top: 8px">
        <button class="primary" id="again">再练一次</button>
        <button class="ghost" id="other">换个章节</button>
      </div>
    </div>
  `;
  document.getElementById('back').onclick = () => nav('chapter');
  document.getElementById('again').onclick = () => { state.index=0; state.right=0; state.wrong=0; state.current=null; nav('quiz'); };
  document.getElementById('other').onclick = () => nav('home');
}

function render() {
  if (state.view === 'home') return renderHome();
  if (state.view === 'chapter') return renderChapter();
  if (state.view === 'quiz') return renderQuiz();
}

render();