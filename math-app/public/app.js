/* 三年级数学 · 学习+练习+闯关 SPA */

// ============ 存储层（localStorage，未来可切 D1） ============
const store = {
  ns: 'g3math.v1',
  _read() { try { return JSON.parse(localStorage.getItem(this.ns) || '{}'); } catch { return {}; } },
  _write(d) { localStorage.setItem(this.ns, JSON.stringify(d)); },
  getChapter(id) {
    const d = this._read();
    return d[id] || { stars: 0, best: 0, totalRight: 0, totalWrong: 0, wrongList: [] };
  },
  saveChapter(id, patch) {
    const d = this._read();
    d[id] = Object.assign(this.getChapter(id), patch);
    this._write(d);
  },
  addWrong(id, item) {
    const d = this._read();
    const rec = d[id] || { stars:0, best:0, totalRight:0, totalWrong:0, wrongList: [] };
    rec.wrongList = [item, ...(rec.wrongList || [])].slice(0, 30);
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
const same = (a,b) => String(a).trim().replace(/\s+/g,'').replace(/\uff0c/g,',') === String(b).trim().replace(/\s+/g,'').replace(/\uff0c/g,',');
const BLANK = '<span class="blank"></span>';
// ============ 题目生成器 ============
const gens = {
  timeUnits() {
    return pick([
      () => { const m=rnd(1,10); return { q:`${m} 分 = ${BLANK} 秒`, answer: String(m*60) }; },
      () => { const s=rnd(65,300); const m=Math.floor(s/60), r=s%60; return { q:`${s} 秒 = ${BLANK} 分 ${BLANK} 秒`, answer: `${m},${r}`, hint:'商，余数', two:true }; },
      () => { const h=rnd(1,6); return { q:`${h} 时 = ${BLANK} 分`, answer: String(h*60) }; },
      () => { const h=rnd(2,4); const m=rnd(10,50); return { q:`${h} 时 ${m} 分 = ${BLANK} 分`, answer:String(h*60+m) }; },
      () => { const h=rnd(8,10), m=rnd(10,50); const dur=rnd(20,90); const total=h*60+m+dur; const eh=Math.floor(total/60), em=total%60; return { q:`小明 ${h}:${String(m).padStart(2,'0')} 出门，走了 ${dur} 分钟到学校，几点到？`, answer:`${eh}:${String(em).padStart(2,'0')}`, hint:'格式 时:分，如 9:05' }; },
      () => { const opts=shuffle(['60','100','24','12']); return { q:`1 时等于多少分？`, type:'choice', options:opts, answer:'60' }; },
    ])();
  },
  addSubWithin10000() {
    return pick([
      () => { const a=rnd(100,999), b=rnd(100,999); return { q:`${a} + ${b} = ${BLANK}`, answer:String(a+b) }; },
      () => { const a=rnd(500,999), b=rnd(100,a-1); return { q:`${a} − ${b} = ${BLANK}`, answer:String(a-b) }; },
      () => { const a=rnd(1000,4000), b=rnd(1000,4000); return { q:`${a} + ${b} = ${BLANK}`, answer:String(a+b) }; },
      () => { const a=rnd(3000,9000), b=rnd(1000,a-1); return { q:`${a} − ${b} = ${BLANK}`, answer:String(a-b) }; },
      () => { const a=rnd(200,500), b=rnd(200,500), c=rnd(100,300); return { q:`${a} + ${b} − ${c} = ${BLANK}`, answer:String(a+b-c) }; },
      () => { const a=rnd(300,600); return { q:`${a} + ${BLANK} = 1000`, answer:String(1000-a) }; },
    ])();
  },
  measureLength() {
    return pick([
      () => { const m=rnd(1,9); return { q:`${m} 米 = ${BLANK} 厘米`, answer:String(m*100) }; },
      () => { const m=rnd(2,9); return { q:`${m} 分米 = ${BLANK} 厘米`, answer:String(m*10) }; },
      () => { const km=rnd(1,9); return { q:`${km} 千米 = ${BLANK} 米`, answer:String(km*1000) }; },
      () => { const cm=rnd(20,200); return { q:`${cm} 厘米 = ${BLANK} 毫米`, answer:String(cm*10) }; },
      () => { const mm=rnd(30,200); return { q:`${mm} 毫米 = ${BLANK} 厘米 ${BLANK} 毫米`, answer:`${Math.floor(mm/10)},${mm%10}`, hint:'厘米，毫米', two:true }; },
      () => { const opts=shuffle(['1000','100','10','10000']); return { q:`1 千米 = ? 米`, type:'choice', options:opts, answer:'1000' }; },
      () => { return { q:`一支铅笔大约长 18 ${BLANK}（填单位：毫米/厘米/分米/米）`, answer:'厘米' }; },
    ])();
  },
  measureMass() {
    return pick([
      () => { const t=rnd(1,9); return { q:`${t} 吨 = ${BLANK} 千克`, answer:String(t*1000) }; },
      () => { const kg=rnd(2,9); return { q:`${kg} 千克 = ${BLANK} 克`, answer:String(kg*1000) }; },
      () => { const g=rnd(1,9)*1000; return { q:`${g} 克 = ${BLANK} 千克`, answer:String(g/1000) }; },
      () => { const kg=rnd(1000,9000); return { q:`${kg} 千克 = ${BLANK} 吨`, answer:String(kg/1000) }; },
      () => { return { q:`一头大象重约 3 ${BLANK}（填单位：克/千克/吨）`, answer:'吨' }; },
      () => { return { q:`一枚 1 元硬币大约重 6 ${BLANK}（填单位：克/千克/吨）`, answer:'克' }; },
    ])();
  },
  multiplyOneDigit() {
    return pick([
      () => { const a=rnd(11,99), b=rnd(2,9); return { q:`${a} × ${b} = ${BLANK}`, answer:String(a*b) }; },
      () => { const a=rnd(100,999), b=rnd(2,9); return { q:`${a} × ${b} = ${BLANK}`, answer:String(a*b) }; },
      () => { const a=rnd(12,50), b=rnd(3,9); return { q:`${b} 个 ${a} 的和是多少？<br/>答：${BLANK}`, answer:String(a*b) }; },
      () => { const a=rnd(20,90), b=rnd(3,9); return { q:`一辆车能坐 ${a} 人，${b} 辆车共 ${BLANK} 人`, answer:String(a*b) }; },
      () => { const opts=shuffle(['0','1','原数','不能确定']); return { q:`任何数乘 0 都得多少？`, type:'choice', options:opts, answer:'0' }; },
    ])();
  },
  divideOneDigit() {
    return pick([
      () => { const b=rnd(2,9), q=rnd(2,50); const a=b*q; return { q:`${a} ÷ ${b} = ${BLANK}`, answer:String(q) }; },
      () => { const b=rnd(3,9), q=rnd(3,30), r=rnd(1,b-1); const a=b*q+r; return { q:`${a} ÷ ${b} = ${BLANK} …… ${BLANK}`, answer:`${q},${r}`, hint:'商，余数', two:true }; },
      () => { const b=rnd(3,9), q=rnd(3,20), r=rnd(1,b-1); const a=b*q+r; return { q:`把 ${a} 个苹果平均分给 ${b} 人，每人 ${BLANK} 个，还剩 ${BLANK} 个`, answer:`${q},${r}`, hint:'商，余数', two:true }; },
      () => { const opts=shuffle(['小于','大于','等于','都可以']); return { q:`余数一定要 ____ 除数`, type:'choice', options:opts, answer:'小于' }; },
    ])();
  },  fractionBasic() {
    return pick([
      () => { const d=rnd(3,9), n1=rnd(1,d-2), n2=rnd(1,d-n1-1); return { q:`${n1}/${d} + ${n2}/${d} = ${BLANK}/${d}`, answer:String(n1+n2) }; },
      () => { const d=rnd(3,9), n2=rnd(1,d-2), n1=rnd(n2+1,d-1); return { q:`${n1}/${d} − ${n2}/${d} = ${BLANK}/${d}`, answer:String(n1-n2) }; },
      () => { const d=rnd(3,9), n=rnd(1,d-1); const opts = shuffle([`${n}/${d}`,`${d-n}/${d}`,`${n}/${d+1}`,`${n+1}/${d}`]); return { q:`把一张纸平均分成 ${d} 份，其中 ${n} 份是多少？`, type:'choice', options: opts, answer: `${n}/${d}` }; },
      () => { const d=rnd(3,9); return { q:`${d}/${d} = ${BLANK}`, answer:'1' }; },
      () => { const opts=shuffle(['1/2','1/3','1/4','1/5']); return { q:`下面哪个分数最大？`, type:'choice', options:opts, answer:'1/2' }; },
      () => { const opts=shuffle(['1/8','1/6','1/4','1/2']); return { q:`蛋糕平均切 8 块，取 1 块是多少？`, type:'choice', options:opts, answer:'1/8' }; },
    ])();
  },
  position() {
    const dirs=['东','南','西','北'];
    const opps={东:'西',西:'东',南:'北',北:'南'};
    return pick([
      () => ({ q:`太阳升起的方向是？`, type:'choice', options: shuffle(dirs), answer:'东' }),
      () => { const d=pick(dirs); return { q:`${d} 的相反方向是？`, type:'choice', options: shuffle(dirs), answer: opps[d] }; },
      () => ({ q:`地图上"上北下南，左西右____"，填？`, type:'choice', options: shuffle(dirs), answer:'东' }),
      () => ({ q:`早上面向太阳，你的左手边是？`, type:'choice', options: shuffle(dirs), answer:'北' }),
      () => ({ q:`太阳落下的方向是？`, type:'choice', options: shuffle(dirs), answer:'西' }),
    ])();
  },
  divideTwoDigit() {
    return pick([
      () => { const b=rnd(2,9), q=rnd(10,50); const a=b*q; return { q:`${a} ÷ ${b} = ${BLANK}`, answer:String(q) }; },
      () => { const b=rnd(2,9), q=rnd(10,80), r=rnd(1,b-1); const a=b*q+r; return { q:`${a} ÷ ${b} = ${BLANK} …… ${BLANK}`, answer:`${q},${r}`, hint:'商，余数', two:true }; },
      () => { const b=rnd(2,9), q=rnd(100,300); const a=b*q; return { q:`${a} ÷ ${b} = ${BLANK}`, answer:String(q) }; },
      () => { const opts=shuffle(['一位数','两位数','三位数','四位数']); return { q:`三位数除以一位数，商最多几位？`, type:'choice', options:opts, answer:'三位数' }; },
    ])();
  },
  statistics() {
    const data = [rnd(3,20),rnd(3,20),rnd(3,20),rnd(3,20)];
    const names = ['苹果','香蕉','橘子','葡萄'];
    const total = data.reduce((a,b)=>a+b,0);
    return pick([
      () => { const maxI = data.indexOf(Math.max(...data)); return { q:`销量：${names.map((n,i)=>`${n}${data[i]}`).join('、')}。最多的是？`, type:'choice', options:shuffle(names), answer:names[maxI] }; },
      () => ({ q:`四种水果共卖 ${BLANK} 个：${names.map((n,i)=>`${n}${data[i]}`).join('、')}`, answer:String(total) }),
      () => { const avg = Math.round(total/4); return { q:`四种水果 ${data.join('、')}，平均约 ${BLANK} 个`, answer:String(avg), hint:'总数÷4' }; },
      () => { const minI = data.indexOf(Math.min(...data)); return { q:`销量最少的是？数据：${names.map((n,i)=>`${n}${data[i]}`).join('、')}`, type:'choice', options:shuffle(names), answer:names[minI] }; },
    ])();
  },
  yearMonthDay() {
    return pick([
      () => ({ q:`一年有 ${BLANK} 个月`, answer:'12' }),
      () => ({ q:`平年一年有 ${BLANK} 天`, answer:'365' }),
      () => ({ q:`闰年一年有 ${BLANK} 天`, answer:'366' }),
      () => { const opts=shuffle(['28','29','30','31']); return { q:`2024 年 2 月有多少天？`, type:'choice', options:opts, answer:'29' }; },
      () => { const opts=shuffle(['28','29','30','31']); return { q:`2025 年 2 月有多少天？`, type:'choice', options:opts, answer:'28' }; },
      () => { const opts=shuffle(['30','31']); return { q:`7 月有多少天？`, type:'choice', options:opts, answer:'31' }; },
      () => { const opts=shuffle(['30','31']); return { q:`4 月有多少天？`, type:'choice', options:opts, answer:'30' }; },
      () => ({ q:`一个季度有 ${BLANK} 个月`, answer:'3' }),
      () => ({ q:`上半年（1-6 月）平年共 ${BLANK} 天`, answer:'181' }),
      () => ({ q:`24 时计时法中，下午 3 点是 ${BLANK} 时`, answer:'15' }),
    ])();
  },
  multiplyTwoDigit() {
    return pick([
      () => { const a=rnd(11,49), b=rnd(11,49); return { q:`${a} × ${b} = ${BLANK}`, answer:String(a*b) }; },
      () => { const a=rnd(50,99), b=rnd(11,29); return { q:`${a} × ${b} = ${BLANK}`, answer:String(a*b) }; },
      () => { const a=rnd(20,90); const opts=shuffle([String(a*10),String(a*100),String(a+10),String(a*1000)]); return { q:`${a} × 100 = ?`, type:'choice', options:opts, answer:String(a*100) }; },
      () => { const a=rnd(2,9), b=rnd(2,9); return { q:`${a}0 × ${b}0 = ${BLANK}`, answer:String(a*b*100) }; },
      () => { const a=rnd(15,30), n=rnd(12,20); return { q:`每盒 ${a} 支笔，${n} 盒共 ${BLANK} 支`, answer:String(a*n) }; },
    ])();
  },  area() {
    return pick([
      () => { const a=rnd(3,15), b=rnd(3,15); return { q:`长方形长 ${a} 厘米宽 ${b} 厘米，面积 = ${BLANK} 平方厘米`, answer:String(a*b) }; },
      () => { const a=rnd(3,15); return { q:`边长 ${a} 米的正方形面积 = ${BLANK} 平方米`, answer:String(a*a) }; },
      () => { const a=rnd(3,15), b=rnd(3,15); return { q:`长方形长 ${a} 米宽 ${b} 米，周长 = ${BLANK} 米`, answer:String(2*(a+b)) }; },
      () => { const a=rnd(3,15); return { q:`边长 ${a} 米的正方形周长 = ${BLANK} 米`, answer:String(4*a) }; },
      () => ({ q:`1 平方米 = ${BLANK} 平方分米`, answer:'100' }),
      () => ({ q:`1 平方分米 = ${BLANK} 平方厘米`, answer:'100' }),
      () => ({ q:`1 平方米 = ${BLANK} 平方厘米`, answer:'10000' }),
      () => { const opts=shuffle(['平方厘米','平方分米','平方米','平方千米']); return { q:`一本数学书封面约 3 ${BLANK}`, type:'choice', options:opts, answer:'平方分米' }; },
    ])();
  },
  decimalBasic() {
    return pick([
      () => { const y=rnd(1,9), j=rnd(1,9); return { q:`${y}.${j} 元 = ${BLANK} 元 ${BLANK} 角`, answer:`${y},${j}`, hint:'元数，角数', two:true }; },
      () => { const a=(rnd(1,9)+rnd(1,9)/10).toFixed(1), b=(rnd(1,5)+rnd(1,9)/10).toFixed(1); const s=(parseFloat(a)+parseFloat(b)).toFixed(1); return { q:`${a} + ${b} = ${BLANK}`, answer:s }; },
      () => { const a=(rnd(5,9)+rnd(1,9)/10).toFixed(1), b=(rnd(1,4)+rnd(1,9)/10).toFixed(1); const s=(parseFloat(a)-parseFloat(b)).toFixed(1); return { q:`${a} − ${b} = ${BLANK}`, answer:s }; },
      () => { const opts = shuffle(['0.1','0.01','0.5','1.0']); return { q:`把 1 元平均分成 10 份，每份是几元？`, type:'choice', options:opts, answer:'0.1' }; },
      () => { const opts = shuffle(['0.5','0.05','5','50']); return { q:`5 角 = 多少元？`, type:'choice', options:opts, answer:'0.5' }; },
      () => { const opts = shuffle(['0.9','1.0','1.1','0.99']); return { q:`最接近 1 的是？`, type:'choice', options:opts, answer:'1.0' }; },
      () => { const y=rnd(1,9), j=rnd(1,9), f=rnd(1,9); return { q:`${y} 元 ${j} 角 ${f} 分 = ${BLANK} 元`, answer:`${y}.${j}${f}` }; },
    ])();
  },
  mixed() {
    return pick([
      () => { const a=rnd(20,60), b=rnd(3,9), c=rnd(5,15); return { q:`${a} + ${b} × ${c} = ${BLANK}`, answer:String(a+b*c) }; },
      () => { const a=rnd(50,200), b=rnd(3,9), c=rnd(2,9); return { q:`${a} − ${b} × ${c} = ${BLANK}`, answer:String(a-b*c) }; },
      () => { const b=rnd(2,9), q=rnd(3,12), c=rnd(2,20); return { q:`${b*q} ÷ ${b} + ${c} = ${BLANK}`, answer:String(q+c) }; },
      () => { const a=rnd(5,10), b=rnd(3,7), c=rnd(2,6); return { q:`(${a} + ${b}) × ${c} = ${BLANK}`, answer:String((a+b)*c) }; },
      () => { const a=rnd(3,9), b=rnd(3,9), c=rnd(2,6); return { q:`${a} × ${b} + ${a} × ${c} = ${BLANK}`, answer:String(a*b+a*c) }; },
    ])();
  },
  wordProblem() {
    return pick([
      () => { const price=rnd(3,15), n=rnd(4,20); return { q:`每支笔 ${price} 元，买 ${n} 支需要 ${BLANK} 元`, answer:String(price*n) }; },
      () => { const per=rnd(20,60), boxes=rnd(3,9); return { q:`每盒 ${per} 个苹果，${boxes} 盒共 ${BLANK} 个`, answer:String(per*boxes) }; },
      () => { const total=rnd(80,300), give=rnd(20,50); return { q:`小明有 ${total} 元，花了 ${give} 元，剩 ${BLANK} 元`, answer:String(total-give) }; },
      () => { const per=rnd(3,9), total=per*rnd(3,15); return { q:`把 ${total} 颗糖平均分给 ${per} 人，每人 ${BLANK} 颗`, answer:String(total/per) }; },
      () => { const a=rnd(20,50), b=rnd(20,50); return { q:`一班 ${a} 人，二班 ${b} 人，两班共 ${BLANK} 人`, answer:String(a+b) }; },
      () => { const speed=rnd(50,90), t=rnd(2,6); return { q:`汽车每小时 ${speed} 千米，${t} 小时行 ${BLANK} 千米`, answer:String(speed*t) }; },
      () => { const l=rnd(6,15), w=rnd(3,10); return { q:`花坛长 ${l} 米宽 ${w} 米，围一圈栅栏需 ${BLANK} 米`, answer:String(2*(l+w)) }; },
    ])();
  },
  pattern() {
    return pick([
      () => { const a=rnd(2,9); return { q:`${a}, ${a*2}, ${a*3}, ${a*4}, ${BLANK}`, answer:String(a*5) }; },
      () => { const a=rnd(1,5); return { q:`${a}, ${a+3}, ${a+6}, ${a+9}, ${BLANK}`, answer:String(a+12) }; },
      () => { const s=rnd(2,5); return { q:`${s}, ${s*2}, ${s*4}, ${s*8}, ${BLANK}`, answer:String(s*16) }; },
      () => { const opts=shuffle(['21','24','20','23']); return { q:`1, 3, 6, 10, 15, ?（每次多加的数增加 1）`, type:'choice', options:opts, answer:'21' }; },
      () => ({ q:`1, 4, 9, 16, ${BLANK}（平方数）`, answer:'25' }),
    ])();
  },
};
// ============ 章节数据 ============
const CHAPTERS = [
  {
    id:'time', term:'上册', title:'时、分、秒', tag:'时间',
    desc:'秒的认识，时分秒换算，经过时间。',
    lessons: [
      { h:'📏 基本换算', body:'1 时 = 60 分，1 分 = 60 秒。'},
      { h:'🕐 24 时计时法', body:'上午 8 点写 8:00；下午 3 点 = 15:00（加 12）；夜里 12 点 = 0:00 或 24:00。'},
      { h:'🧭 经过时间', body:'结束时刻 − 开始时刻 = 经过时间。跨小时先加到整点，再补足剩余分钟。'},
      { h:'📝 例题', body:'8:20 到 9:05：先 8:20 → 9:00 用 40 分，再 9:00 → 9:05 用 5 分，共 45 分。'},
      { h:'💡 常用参考', body:'眨眼约 1 秒；一节课 40 分钟；一集动画约 20 分钟。'},
    ],
    gen: gens.timeUnits,
  },
  {
    id:'addsub', term:'上册', title:'万以内加减法', tag:'计算',
    desc:'三位数、四位数的加减法笔算与验算。',
    lessons: [
      { h:'✍️ 竖式规则', body:'数位对齐，从个位开始逐位计算。'},
      { h:'⬆️ 进位', body:'加法某位 ≥10 时，向前一位进 1，本位只留个位数。'},
      { h:'⬇️ 退位', body:'减法某位不够减时，向前一位借 1 当 10。'},
      { h:'🔁 验算', body:'加法：交换加数或用 和 − 加数 = 加数。<br/>减法：差 + 减数 = 被减数。'},
      { h:'📝 例题', body:'365 + 247：5+7=12 写 2 进 1；6+4+1=11 写 1 进 1；3+2+1=6。得 612。'},
    ],
    gen: gens.addSubWithin10000,
  },
  {
    id:'measure_len', term:'上册', title:'长度单位', tag:'测量',
    desc:'毫米、厘米、分米、米、千米的换算。',
    lessons:[
      { h:'📐 单位大小', body:'从大到小：千米 > 米 > 分米 > 厘米 > 毫米。'},
      { h:'🔗 进率', body:'1 千米=1000 米；1 米=10 分米=100 厘米=1000 毫米；1 厘米=10 毫米。'},
      { h:'↔️ 换算方法', body:'大 → 小：× 进率；小 → 大：÷ 进率。'},
      { h:'💡 参考', body:'指甲盖 ≈ 1 厘米；数学书厚 ≈ 8 毫米；一层楼 ≈ 3 米；操场一圈 ≈ 400 米。'},
    ],
    gen: gens.measureLength,
  },
  {
    id:'measure_mass', term:'上册', title:'质量单位', tag:'测量',
    desc:'吨、千克、克的换算。',
    lessons:[
      { h:'⚖️ 单位大小', body:'吨 > 千克 > 克。'},
      { h:'🔗 进率', body:'1 吨 = 1000 千克；1 千克 = 1000 克。'},
      { h:'💡 参考', body:'1 元硬币 ≈ 6 克；一袋盐 500 克；一袋大米 25 千克；一辆小汽车约 1 吨。'},
      { h:'✏️ 单位选择', body:'很轻的用克；能抱起的用千克；大型物体用吨。'},
    ],
    gen: gens.measureMass,
  },
  {
    id:'multi1', term:'上册', title:'多位数乘一位数', tag:'计算',
    desc:'两三位数乘一位数。',
    lessons:[
      { h:'✍️ 竖式方法', body:'从个位起逐位相乘，满几十向前进几。'},
      { h:'📝 例题', body:'237 × 4：4×7=28 写 8 进 2；4×3+2=14 写 4 进 1；4×2+1=9。得 948。'},
      { h:'0️⃣ 零的乘法', body:'0 乘任何数得 0。末尾有 0 时可以先算不带 0 的部分，最后补 0。'},
      { h:'📌 估算', body:'把因数看成整十/整百再乘，判断答案合理性。'},
    ],
    gen: gens.multiplyOneDigit,
  },
  {
    id:'div1', term:'上册', title:'有余数的除法', tag:'计算',
    desc:'带余除法：商×除数+余数=被除数。',
    lessons:[
      { h:'📏 核心', body:'余数一定要 <b>小于除数</b>。'},
      { h:'🔁 验算', body:'商 × 除数 + 余数 = 被除数。'},
      { h:'📝 例题', body:'23 ÷ 4：商 5，余 3 （4×5=20，23−20=3，且 3<4 ✓）'},
      { h:'🧩 生活应用', body:'"够不够坐、够不够分"问题：有时要向上取整多备一份。'},
    ],
    gen: gens.divideOneDigit,
  },
  {
    id:'frac', term:'上册', title:'分数的初步认识', tag:'分数',
    desc:'几分之一、几分之几，同分母加减。',
    lessons:[
      { h:'🍰 含义', body:'把整体平均分成若干份，取其中 1 份就是几分之一，取几份就是几分之几。'},
      { h:'✏️ 读写', body:'2/5 读"五分之二"；5 是分母，2 是分子。'},
      { h:'➕ 同分母加减', body:'分母不变，分子相加或相减。例：3/7 + 2/7 = 5/7。'},
      { h:'📊 比较', body:'同分母看分子；同分子看分母（分母小的反而大）。'},
      { h:'💯 特殊', body:'d/d = 1；0/d = 0。'},
    ],
    gen: gens.fractionBasic,
  },
  {
    id:'position', term:'下册', title:'位置与方向', tag:'空间',
    desc:'东南西北，简单路线。',
    lessons:[
      { h:'🧭 四方向', body:'地图默认：上北、下南、左西、右东。'},
      { h:'🔄 相反', body:'东↔西；南↔北。'},
      { h:'☀️ 太阳', body:'东升西落。早上面向太阳：前东、后西、左北、右南。'},
      { h:'🗺️ 描述路线', body:'先方向再距离。例：从家向北走 200 米。'},
    ],
    gen: gens.position,
  },
  {
    id:'div2', term:'下册', title:'除数是一位数的除法', tag:'计算',
    desc:'两三位数除以一位数。',
    lessons:[
      { h:'✍️ 竖式', body:'① 从最高位起试商；② 商×除数写下面；③ 相减得余数；④ 落下一位继续。'},
      { h:'0️⃣ 商中间 0', body:'某步被除数比除数小时，商写 0，再落下下一位。'},
      { h:'🔁 验算', body:'无余：商×除数=被除数。有余：商×除数+余数=被除数。'},
      { h:'💡 估算', body:'先看首位数字与除数的关系，估计商的位数。'},
    ],
    gen: gens.divideTwoDigit,
  },
  {
    id:'stat', term:'下册', title:'数据的收集与整理', tag:'统计',
    desc:'统计表/图，简单平均数。',
    lessons:[
      { h:'📊 步骤', body:'收集 → 整理 → 制表/画图 → 分析。'},
      { h:'➕ 平均数', body:'平均数 = 总数 ÷ 项数。反映一组数据的整体水平。'},
      { h:'👀 读图', body:'先看坐标含义，再比较数量，然后回答问题。'},
    ],
    gen: gens.statistics,
  },
  {
    id:'ymd', term:'下册', title:'年、月、日', tag:'时间',
    desc:'月份天数、平年闰年、24 时计时法。',
    lessons:[
      { h:'📅 大月/小月', body:'大月（31 天）：1、3、5、7、8、10、12；<br/>小月（30 天）：4、6、9、11；<br/>2 月：平年 28 天，闰年 29 天。'},
      { h:'🎯 平年/闰年', body:'一般能被 4 整除是闰年；能被 100 整除的必须再能被 400 整除才是闰年。<br/>例：2024 是闰年；2100 是平年；2000 是闰年。'},
      { h:'🕒 24 时计时', body:'下午/晚上时刻加 12。下午 1 点 = 13:00；晚上 8 点半 = 20:30。'},
      { h:'✋ 拳头记月', body:'手背骨凸起是大月，凹陷是小月（2 月除外）。'},
    ],
    gen: gens.yearMonthDay,
  },
  {
    id:'multi2', term:'下册', title:'两位数乘两位数', tag:'计算',
    desc:'竖式计算，整十整百口算。',
    lessons:[
      { h:'✍️ 竖式三步', body:'① 用个位数乘第一个乘数；<br/>② 用十位数乘第一个乘数，<b>结果左移一位</b>；<br/>③ 两层积相加。'},
      { h:'📝 例题', body:'23 × 14：<br/>23 × 4 = 92（第一层）<br/>23 × 10 = 230（第二层，末位对齐十位）<br/>92 + 230 = 322'},
      { h:'0️⃣ 整十整百', body:'先算不带 0 的部分，再在末尾补相同个数的 0。<br/>例：30 × 40 = 3×4=12 → 1200。'},
      { h:'📌 估算', body:'19 × 21 ≈ 20 × 20 = 400。'},
    ],
    gen: gens.multiplyTwoDigit,
  },
  {
    id:'area', term:'下册', title:'面积', tag:'几何',
    desc:'长方形正方形的面积周长。',
    lessons:[
      { h:'🧱 面积公式', body:'长方形：长×宽<br/>正方形：边长×边长'},
      { h:'📏 周长公式', body:'长方形：(长+宽)×2<br/>正方形：边长×4'},
      { h:'🔗 面积单位', body:'常用：平方厘米、平方分米、平方米、公顷、平方千米。<br/>1 平方米 = 100 平方分米 = 10 000 平方厘米。<br/>1 公顷 = 10 000 平方米；1 平方千米 = 100 公顷。'},
      { h:'⚠️ 易错', body:'周长单位是长度（米），面积单位是面积（平方米），不能混。'},
      { h:'📝 例题', body:'长 8 米宽 5 米：面积 8×5=40 平方米；周长 (8+5)×2=26 米。'},
    ],
    gen: gens.area,
  },
  {
    id:'decimal', term:'下册', title:'小数的初步认识', tag:'小数',
    desc:'一位/两位小数、元角分、加减法。',
    lessons:[
      { h:'🔢 含义', body:'把 1 平均分成 10 份，每份是 0.1；分成 100 份，每份是 0.01。'},
      { h:'📖 读写', body:'0.5 读"零点五"；点左整数部分，点右小数部分。'},
      { h:'💰 元角分', body:'1 元 = 10 角 = 100 分。3.5 元 = 3 元 5 角；2.05 元 = 2 元 0 角 5 分。'},
      { h:'📊 比较', body:'先看整数部分；相同再从小数点后一位起逐位比。'},
      { h:'➕ 加减', body:'<b>小数点对齐</b>，按整数方法算，最后在结果上点上小数点。'},
      { h:'📝 例题', body:'2.5 + 1.4 = 3.9；6.8 − 2.3 = 4.5。'},
    ],
    gen: gens.decimalBasic,
  },
  {
    id:'mixed', term:'拓展', title:'四则混合运算', tag:'计算',
    desc:'加减乘除混合，括号优先。',
    lessons:[
      { h:'📌 顺序', body:'① 括号内 → ② 乘除 → ③ 加减 → ④ 同级从左到右。'},
      { h:'📝 例题', body:'20 + 3 × 4 = 20 + 12 = 32；<br/>(20 + 3) × 4 = 23 × 4 = 92。'},
      { h:'💡 简算', body:'乘法分配律：a×(b+c)=a×b+a×c。例：25×(4+8)=100+200=300。'},
    ],
    gen: gens.mixed,
  },
  {
    id:'word', term:'拓展', title:'解决问题', tag:'应用',
    desc:'加减乘除应用题模型。',
    lessons:[
      { h:'🔍 读题四步', body:'① 圈已知；② 画问题；③ 想数量关系；④ 列式检查单位。'},
      { h:'📦 单价×数量=总价', body:'每支 3 元买 4 支：3×4=12 元。'},
      { h:'🏃 速度×时间=路程', body:'每小时 60 千米走 3 小时：60×3=180 千米。'},
      { h:'⚖️ 单产量×数量=总产量', body:'每棵结 80 个果，5 棵结 400 个。'},
      { h:'🧩 平均分', body:'总数÷份数=每份；总数÷每份=份数。'},
    ],
    gen: gens.wordProblem,
  },
  {
    id:'pattern', term:'拓展', title:'找规律', tag:'思维',
    desc:'数列与图形规律。',
    lessons:[
      { h:'🔎 常见规律', body:'① 等差（每次+ 相同数）；② 等比（每次× 相同数）；③ 差自身有规律；④ 平方数、三角数。'},
      { h:'📝 例题', body:'2, 4, 8, 16, ? → ×2 → 32；<br/>1, 3, 6, 10, 15, ? → 差 2,3,4,5 → 6 → 21。'},
      { h:'💡 图形', body:'颜色/形状/数量循环时找出周期。'},
    ],
    gen: gens.pattern,
  },
];
// ============ SPA 状态 & 路由 ============
const app = document.getElementById('app');
let state = { view:'home', term:'全部', chId:null, mode:'practice', stage:1, index:0, total:10, current:null, right:0, wrong:0, currentWrongs: [] };

function nav(view, extra={}) {
  Object.assign(state, extra, { view });
  render();
  window.scrollTo(0, 0);
}

function starHtml(n) {
  return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3-n);
}

function renderHome() {
  const terms = ['全部','上册','下册','拓展'];
  const list = state.term === '全部' ? CHAPTERS : CHAPTERS.filter(c => c.term === state.term);
  let totalStars = 0, wrongTotal = 0;
  for (const c of CHAPTERS) { const r = store.getChapter(c.id); totalStars += r.stars; wrongTotal += (r.wrongList||[]).length; }
  app.innerHTML = `
    <div class="summary">
      <div class="s-item"><div class="s-num">${totalStars}</div><div class="s-lbl">⭐ 星星</div></div>
      <div class="s-item"><div class="s-num">${wrongTotal}</div><div class="s-lbl">📕 错题</div></div>
      <div class="s-item"><div class="s-num">${CHAPTERS.length}</div><div class="s-lbl">📚 章节</div></div>
      <button class="ghost sm" id="reset">🗑️ 清空进度</button>
    </div>
    <div class="tabs">
      ${terms.map(t => `<button class="${t===state.term?'active':''}" data-term="${t}">${t}</button>`).join('')}
    </div>
    <div class="grid">
      ${list.map(c => {
        const r = store.getChapter(c.id);
        return `
        <div class="card" data-id="${c.id}">
          <div class="badge">${c.term} · ${c.tag}</div>
          <h3>${c.title}</h3>
          <p>${c.desc}</p>
          <div class="stars">${starHtml(r.stars)} ${r.wrongList.length?`<span class="wrong-dot">📕 ${r.wrongList.length}</span>`:''}</div>
        </div>`;
      }).join('')}
    </div>
  `;
  app.querySelectorAll('.tabs button').forEach(b => b.onclick = () => nav('home', { term: b.dataset.term }));
  app.querySelectorAll('.card').forEach(el => el.onclick = () => nav('chapter', { chId: el.dataset.id }));
  document.getElementById('reset').onclick = () => {
    if (confirm('确定清空所有星星和错题记录？')) { store.reset(); render(); }
  };
}

function renderChapter() {
  const ch = CHAPTERS.find(c => c.id === state.chId);
  const rec = store.getChapter(ch.id);
  app.innerHTML = `
    <a class="back" id="back">← 返回目录</a>
    <div class="panel">
      <div class="badge">${ch.term} · ${ch.tag}</div>
      <h2 style="margin:6px 0 4px">${ch.title}</h2>
      <div class="stars big">${starHtml(rec.stars)} ${rec.best?`（历史最高 ${rec.best} 分）`:''}</div>
    </div>
    <div class="panel">
      <h3 style="margin-top:0">📘 知识点</h3>
      ${ch.lessons.map(l => `<div class="lesson"><h4>${l.h}</h4><p>${l.body}</p></div>`).join('')}
    </div>
    <div class="panel">
      <h3 style="margin-top:0">🎯 开始学习</h3>
      <div class="row">
        <button class="primary" id="practice">✏️ 练习模式（10 题）</button>
        <button class="primary" id="stage" style="background:#f59e0b">🏆 闯关模式</button>
        ${rec.wrongList.length? `<button class="ghost" id="wrong">📕 错题本 (${rec.wrongList.length})</button>` : ''}
      </div>
      <p style="color:var(--muted);font-size:13px;margin:10px 0 0">
        闯关：3 关递进，每关 5 题全对得 1 颗星，累计 3 颗星通关！
      </p>
    </div>
  `;
  document.getElementById('back').onclick = () => nav('home');
  document.getElementById('practice').onclick = () => {
    nav('quiz', { mode:'practice', total:10, index:0, right:0, wrong:0, current:null, currentWrongs:[] });
  };
  document.getElementById('stage').onclick = () => nav('stage-select');
  const wb = document.getElementById('wrong');
  if (wb) wb.onclick = () => nav('wrongbook');
}

function renderStageSelect() {
  const ch = CHAPTERS.find(c => c.id === state.chId);
  const rec = store.getChapter(ch.id);
  const stages = [
    { n:1, name:'⭐ 初级', desc:'5 题，全对得 1 星', unlock: true },
    { n:2, name:'⭐⭐ 中级', desc:'5 题，全对得 1 星', unlock: rec.stars >= 1 },
    { n:3, name:'⭐⭐⭐ 高级', desc:'5 题，全对得 1 星', unlock: rec.stars >= 2 },
  ];
  app.innerHTML = `
    <a class="back" id="back">← 返回章节</a>
    <div class="panel">
      <h2 style="margin-top:0">🏆 ${ch.title} · 闯关</h2>
      <p>当前进度：${starHtml(rec.stars)}（${rec.stars}/3）</p>
    </div>
    ${stages.map(s => `
      <div class="panel stage-card ${s.unlock?'':'locked'}" data-n="${s.n}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h3 style="margin:0 0 4px">第 ${s.n} 关 · ${s.name}</h3>
            <p style="margin:0;color:var(--muted)">${s.desc}</p>
          </div>
          <div style="font-size:24px">${rec.stars >= s.n ? '✅' : (s.unlock?'▶️':'🔒')}</div>
        </div>
      </div>
    `).join('')}
  `;
  document.getElementById('back').onclick = () => nav('chapter');
  document.querySelectorAll('.stage-card').forEach(el => {
    if (el.classList.contains('locked')) return;
    el.onclick = () => {
      const n = parseInt(el.dataset.n);
      nav('quiz', { mode:'stage', stage:n, total:5, index:0, right:0, wrong:0, current:null, currentWrongs:[] });
    };
  });
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
  const title = state.mode === 'stage' ? `${ch.title} · 第 ${state.stage} 关` : `${ch.title} · 练习`;
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
    </div>${q.hint?`<p class="hint">提示：${q.hint}</p>`:''}`;
  } else {
    inputHtml = `<div class="row">
      <input id="ans" type="text" placeholder="输入答案" autocomplete="off" />
      <button class="primary" id="submit">提交</button>
    </div>${q.hint?`<p class="hint">提示：${q.hint}</p>`:''}`;
  }
  app.innerHTML = `
    <a class="back" id="back">← 退出${state.mode==='stage'?'本关':''}</a>
    <div class="panel">
      <div class="quiz-head">
        <span>${title} · 第 ${state.index+1} / ${state.total} 题</span>
        <span>✅ ${state.right} &nbsp; ❌ ${state.wrong}</span>
      </div>
      <div class="progress"><i style="width:${progress}%"></i></div>
      <div class="q">${q.q}</div>
      ${inputHtml}
      <div id="fb"></div>
    </div>
  `;
  document.getElementById('back').onclick = () => nav(state.mode==='stage'?'stage-select':'chapter');

  const showFeedback = (ok, user) => {
    state.answered = true;
    if (ok) state.right++;
    else {
      state.wrong++;
      const wrongItem = { q: q.q.replace(/<[^>]+>/g,'___'), answer: q.answer, yours: user, at: Date.now() };
      state.currentWrongs.push(wrongItem);
      store.addWrong(ch.id, wrongItem);
    }
    store.incStat(ch.id, ok);
    const fb = document.getElementById('fb');
    fb.innerHTML = `<div class="feedback ${ok?'ok':'bad'}">
      ${ok ? '✅ 太棒了，回答正确！' : `❌ 答错了。正确答案是 <b>${q.answer}</b>${user!==undefined?`（你的答案：${user}）`:''}`}
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
  const rec = store.getChapter(ch.id);
  if (pct > rec.best) store.saveChapter(ch.id, { best: pct });
  let gain = '';
  if (state.mode === 'stage' && state.wrong === 0) {
    if (state.stage > rec.stars) {
      store.saveChapter(ch.id, { stars: state.stage });
      gain = `<p style="color:#f59e0b;font-size:18px;margin:8px 0"><b>🎉 恭喜通过第 ${state.stage} 关！</b>获得 1 颗星！</p>`;
    } else {
      gain = `<p style="color:var(--muted);margin:8px 0">已通过本关（进度：${state.stage} / 3）</p>`;
    }
  }
  const level = pct >= 90 ? '🏆 太棒了！' : pct >= 70 ? '👍 不错' : pct >= 50 ? '💪 继续加油' : '📖 多复习一下';
  app.innerHTML = `
    <a class="back" id="back">← 返回章节</a>
    <div class="panel" style="text-align:center">
      <h2 style="margin-top:0">${state.mode==='stage'?`第 ${state.stage} 关 · `:''}${ch.title}</h2>
      <div style="font-size:56px;margin:6px 0">${pct}<span style="font-size:24px">分</span></div>
      <p>${level}　✅ ${state.right} 题　❌ ${state.wrong} 题</p>
      ${gain}
      <div class="row" style="justify-content:center;margin-top:8px">
        <button class="primary" id="again">🔁 再来一次</button>
        ${state.mode==='stage'?`<button class="ghost" id="stages">🏆 关卡列表</button>`:''}
        <button class="ghost" id="other">📚 换个章节</button>
        ${state.currentWrongs.length?`<button class="ghost" id="review">📕 查看错题</button>`:''}
      </div>
    </div>
  `;
  document.getElementById('back').onclick = () => nav('chapter');
  document.getElementById('again').onclick = () => nav('quiz', { index:0, right:0, wrong:0, current:null, currentWrongs:[] });
  document.getElementById('other').onclick = () => nav('home');
  const sb = document.getElementById('stages'); if (sb) sb.onclick = () => nav('stage-select');
  const rb = document.getElementById('review'); if (rb) rb.onclick = () => nav('wrongbook');
}

function renderWrongbook() {
  const ch = CHAPTERS.find(c => c.id === state.chId);
  const rec = store.getChapter(ch.id);
  const list = rec.wrongList || [];
  app.innerHTML = `
    <a class="back" id="back">← 返回章节</a>
    <div class="panel">
      <h2 style="margin-top:0">📕 ${ch.title} · 错题本</h2>
      <p style="color:var(--muted)">最近 ${list.length} 题</p>
      ${list.length===0? '<p>暂无错题。做题时答错会自动记录到这里。</p>' : ''}
      ${list.map((w,i) => `
        <div class="wrong-item">
          <div class="wq"><b>Q${i+1}.</b> ${w.q}</div>
          <div class="wa">✅ 正确：<b>${w.answer}</b>　❌ 你的：${w.yours ?? '(空)'}</div>
        </div>
      `).join('')}
      ${list.length? '<div style="margin-top:10px"><button class="ghost" id="clr">🗑️ 清空本章错题</button></div>' : ''}
    </div>
  `;
  document.getElementById('back').onclick = () => nav('chapter');
  const clr = document.getElementById('clr');
  if (clr) clr.onclick = () => { if (confirm('清空本章错题记录？')) { store.clearWrong(ch.id); render(); } };
}

function render() {
  const m = { home: renderHome, chapter: renderChapter, quiz: renderQuiz, 'stage-select': renderStageSelect, wrongbook: renderWrongbook };
  (m[state.view] || renderHome)();
}
render();