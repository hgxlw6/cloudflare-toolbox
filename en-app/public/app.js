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
tts.speakSeq = function(list, i=0){
  if (!('speechSynthesis' in window) || !list || i >= list.length) return;
  try { speechSynthesis.cancel(); } catch(e){}
  const u = new SpeechSynthesisUtterance(list[i]);
  u.rate = this.rate; u.pitch = 1;
  if (this.pref) u.voice = this.pref;
  u.lang = (this.pref && this.pref.lang) || 'en-US';
  u.onend = () => setTimeout(() => tts.speakSeq(list, i+1), 250);
  speechSynthesis.speak(u);
};


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
    id:'u1', title:'Unit 1 · Hello!', term:'上册',
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
    id:'u2', title:'Unit 2 · Colours', term:'上册',
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
    id:'u3', title:'Unit 3 · Look at me!', term:'上册',
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
    id:'u4', title:'Unit 4 · We love animals', term:'上册',
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
    id:'u5', title:'Unit 5 · Let\u2019s eat!', term:'上册',
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
    id:'u6', title:'Unit 6 · Happy birthday!', term:'上册',
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
  {
    id:'u7', title:'Unit 1 · Welcome back to school', term:'下册',
    desc:'开学问候与国家',
    words:[
      {en:'boy', ipa:'/bɔɪ/', cn:'男孩'},
      {en:'girl', ipa:'/ɡɜːrl/', cn:'女孩'},
      {en:'teacher', ipa:'/ˈtiːtʃər/', cn:'老师'},
      {en:'student', ipa:'/ˈstuːdnt/', cn:'学生'},
      {en:'friend', ipa:'/frend/', cn:'朋友'},
      {en:'China', ipa:'/ˈtʃaɪnə/', cn:'中国'},
      {en:'the UK', ipa:'/ðə juː keɪ/', cn:'英国'},
      {en:'the USA', ipa:'/ðə juː es eɪ/', cn:'美国'},
      {en:'Canada', ipa:'/ˈkænədə/', cn:'加拿大'},
      {en:'she', ipa:'/ʃiː/', cn:'她'},
      {en:'he', ipa:'/hiː/', cn:'他'},
      {en:'new', ipa:'/nuː/', cn:'新的'},
      {en:'welcome', ipa:'/ˈwelkəm/', cn:'欢迎'},
      {en:'and', ipa:'/ænd/', cn:'和'},
      {en:'from', ipa:'/frʌm/', cn:'来自'},
    ],
    sentences:[
      {en:'Welcome back to school!', cn:'欢迎回到学校！'},
      {en:'I am from China.', cn:'我来自中国。'},
      {en:'She is my friend.', cn:'她是我的朋友。'},
      {en:'This is Amy. She is a new student.', cn:'这是艾米。她是新同学。'},
      {en:'Nice to meet you.', cn:'很高兴认识你。'},
    ],
    dialogs:[
      { title:"Let's talk", lines:[
        {en:'Hi, I am Amy. I am from the UK.', cn:'嗨，我是艾米。我来自英国。'},
        {en:'Hello, Amy. I am Chen Jie. I am from China.', cn:'你好，艾米。我叫陈杰，来自中国。'},
        {en:'Nice to meet you!', cn:'很高兴认识你！'},
      ]},
    ],
    chants:[
      {en:'I am from China, you are from the UK.', cn:'我来自中国，你来自英国。'},
      {en:'She is from Canada, he is from the USA.', cn:'她来自加拿大，他来自美国。'},
    ],
    spell:{
      pattern:'字母组合 a-e',
      words:[
        {en:'name', ipa:'/neɪm/', cn:'名字'},
        {en:'cake', ipa:'/keɪk/', cn:'蛋糕'},
        {en:'face', ipa:'/feɪs/', cn:'脸'},
        {en:'make', ipa:'/meɪk/', cn:'制作'},
      ],
      tip:'a-e 组合中的 a 通常发 /eɪ/，字母 e 不发音。',
    },
    story:{ title:'Story time', lines:[
      {en:'Zoom: Hi, Zip! This is my friend, Amy.', cn:'祖姆：嗨，齐普！这是我的朋友，艾米。'},
      {en:'Zip: Nice to meet you, Amy.', cn:'齐普：很高兴认识你，艾米。'},
      {en:'Amy: Nice to meet you, too.', cn:'艾米：我也很高兴认识你。'},
    ]},
    mind:`mindmap
  root((Unit 1 School))
    People
      boy
      girl
      teacher
      student
      friend
    Countries
      China
      the UK
      the USA
      Canada
    Pronouns
      she
      he
    Sentence
      I am from ___
      She/He is my ___
      Nice to meet you`
  },
  {
    id:'u8', title:'Unit 2 · My family', term:'下册',
    desc:'家庭成员',
    words:[
      {en:'father', ipa:'/ˈfɑːðər/', cn:'父亲'},
      {en:'dad', ipa:'/dæd/', cn:'爸爸'},
      {en:'mother', ipa:'/ˈmʌðər/', cn:'母亲'},
      {en:'mom', ipa:'/mɑːm/', cn:'妈妈'},
      {en:'man', ipa:'/mæn/', cn:'男人'},
      {en:'woman', ipa:'/ˈwʊmən/', cn:'女人'},
      {en:'grandfather', ipa:'/ˈɡrænfɑːðər/', cn:'（外）祖父'},
      {en:'grandpa', ipa:'/ˈɡrænpɑː/', cn:'爷爷；外公'},
      {en:'grandmother', ipa:'/ˈɡrænmʌðər/', cn:'（外）祖母'},
      {en:'grandma', ipa:'/ˈɡrænmɑː/', cn:'奶奶；外婆'},
      {en:'sister', ipa:'/ˈsɪstər/', cn:'姐妹'},
      {en:'brother', ipa:'/ˈbrʌðər/', cn:'兄弟'},
      {en:'family', ipa:'/ˈfæməli/', cn:'家庭'},
    ],
    sentences:[
      {en:'This is my family.', cn:'这是我的家人。'},
      {en:'This is my father.', cn:'这是我的爸爸。'},
      {en:'She is my mother.', cn:'她是我的妈妈。'},
      {en:'Who is that man?', cn:'那个男人是谁？'},
      {en:'He is my grandpa.', cn:'他是我的爷爷。'},
    ],
    dialogs:[
      { title:"Let's talk", lines:[
        {en:'Look, this is my family.', cn:'看，这是我的家人。'},
        {en:'Wow! Who is that man?', cn:'哇！那个男人是谁？'},
        {en:'He is my father.', cn:'他是我的爸爸。'},
        {en:'And who is that woman?', cn:'那个女人是谁？'},
        {en:'She is my mother.', cn:'她是我的妈妈。'},
      ]},
    ],
    chants:[
      {en:'Father, mother, grandma, grandpa — I love my family!', cn:'爸爸、妈妈、奶奶、爷爷——我爱我的家人！'},
    ],
    spell:{
      pattern:'字母组合 i-e',
      words:[
        {en:'kite', ipa:'/kaɪt/', cn:'风筝'},
        {en:'bike', ipa:'/baɪk/', cn:'自行车'},
        {en:'nice', ipa:'/naɪs/', cn:'好的'},
        {en:'five', ipa:'/faɪv/', cn:'五'},
      ],
      tip:'i-e 组合中的 i 通常发 /aɪ/，字母 e 不发音。',
    },
    story:{ title:'Story time', lines:[
      {en:'Look at my family photo.', cn:'看我的家庭照片。'},
      {en:'This is my dad. He is tall.', cn:'这是我爸爸，他很高。'},
      {en:'This is my mom. She is beautiful.', cn:'这是我妈妈，她很漂亮。'},
      {en:'And this is me!', cn:'这是我！'},
    ]},
    mind:`mindmap
  root((Unit 2 Family))
    Parents
      father / dad
      mother / mom
    Grandparents
      grandfather / grandpa
      grandmother / grandma
    Siblings
      sister
      brother
    Basic
      man
      woman
      family
    Sentence
      This is my ___
      Who is that ___?`
  },
  {
    id:'u9', title:'Unit 3 · At the zoo', term:'下册',
    desc:'动物外貌与形容词',
    words:[
      {en:'tall', ipa:'/tɔːl/', cn:'高的'},
      {en:'short', ipa:'/ʃɔːrt/', cn:'矮的；短的'},
      {en:'long', ipa:'/lɔːŋ/', cn:'长的'},
      {en:'small', ipa:'/smɔːl/', cn:'小的'},
      {en:'big', ipa:'/bɪɡ/', cn:'大的'},
      {en:'giraffe', ipa:'/dʒəˈræf/', cn:'长颈鹿'},
      {en:'deer', ipa:'/dɪr/', cn:'鹿'},
      {en:'lion', ipa:'/ˈlaɪən/', cn:'狮子'},
      {en:'fat', ipa:'/fæt/', cn:'胖的'},
      {en:'thin', ipa:'/θɪn/', cn:'瘦的'},
      {en:'tail', ipa:'/teɪl/', cn:'尾巴'},
      {en:'so', ipa:'/soʊ/', cn:'如此；这么'},
    ],
    sentences:[
      {en:'It is so tall!', cn:'它好高呀！'},
      {en:'The giraffe is tall.', cn:'长颈鹿很高。'},
      {en:'It has a long tail.', cn:'它有一条长尾巴。'},
      {en:'Look at the elephant. It is fat.', cn:'看那头大象，它很胖。'},
    ],
    dialogs:[
      { title:"Let's talk", lines:[
        {en:'Look at the giraffe!', cn:'看那只长颈鹿！'},
        {en:'It is so tall!', cn:'它好高呀！'},
        {en:'And it has a long neck.', cn:'而且它的脖子好长。'},
      ]},
    ],
    chants:[
      {en:'Tall and short, long and small, big and thin — animals in the zoo!', cn:'高矮长短大小胖瘦——都在动物园里！'},
    ],
    spell:{
      pattern:'字母组合 o-e',
      words:[
        {en:'nose', ipa:'/noʊz/', cn:'鼻子'},
        {en:'rose', ipa:'/roʊz/', cn:'玫瑰'},
        {en:'note', ipa:'/noʊt/', cn:'便签'},
        {en:'home', ipa:'/hoʊm/', cn:'家'},
      ],
      tip:'o-e 组合中的 o 通常发 /oʊ/，字母 e 不发音。',
    },
    story:{ title:'Story time', lines:[
      {en:'The zoo is fun.', cn:'动物园很有趣。'},
      {en:'The giraffe is tall.', cn:'长颈鹿很高。'},
      {en:'The rabbit is small.', cn:'兔子很小。'},
      {en:'The elephant is big and fat.', cn:'大象又大又胖。'},
    ]},
    mind:`mindmap
  root((Unit 3 Zoo))
    Adjectives
      tall / short
      long / short
      big / small
      fat / thin
    Animals
      giraffe
      deer
      lion
    Body
      tail
    Sentence
      It is so ___
      The ___ is ___
      It has a ___`
  },
  {
    id:'u10', title:'Unit 4 · Where is my car?', term:'下册',
    desc:'方位介词与玩具',
    words:[
      {en:'on', ipa:'/ɑːn/', cn:'在……上'},
      {en:'in', ipa:'/ɪn/', cn:'在……里'},
      {en:'under', ipa:'/ˈʌndər/', cn:'在……下'},
      {en:'chair', ipa:'/tʃer/', cn:'椅子'},
      {en:'desk', ipa:'/desk/', cn:'书桌'},
      {en:'car', ipa:'/kɑːr/', cn:'小汽车'},
      {en:'boat', ipa:'/boʊt/', cn:'小船'},
      {en:'ball', ipa:'/bɔːl/', cn:'球'},
      {en:'map', ipa:'/mæp/', cn:'地图'},
      {en:'toy', ipa:'/tɔɪ/', cn:'玩具'},
      {en:'box', ipa:'/bɑːks/', cn:'盒子'},
      {en:'plane', ipa:'/pleɪn/', cn:'飞机'},
      {en:'where', ipa:'/wer/', cn:'在哪里'},
      {en:'here', ipa:'/hɪr/', cn:'这里'},
      {en:'there', ipa:'/ðer/', cn:'那里'},
    ],
    sentences:[
      {en:'Where is my car?', cn:'我的小汽车在哪里？'},
      {en:'It is on the desk.', cn:'在书桌上。'},
      {en:'It is in the box.', cn:'在盒子里。'},
      {en:'It is under the chair.', cn:'在椅子下面。'},
      {en:'Here it is!', cn:'在这儿呢！'},
    ],
    dialogs:[
      { title:"Let's talk", lines:[
        {en:'Where is my car?', cn:'我的小汽车在哪里？'},
        {en:'Look! It is under the chair.', cn:'看！在椅子下面。'},
        {en:'Thank you!', cn:'谢谢！'},
      ]},
    ],
    chants:[
      {en:'On the desk, in the box, under the chair — where is my toy?', cn:'桌上、盒里、椅子下——我的玩具在哪里？'},
    ],
    spell:{
      pattern:'字母组合 u-e',
      words:[
        {en:'cute', ipa:'/kjuːt/', cn:'可爱的'},
        {en:'excuse', ipa:'/ɪkˈskjuːz/', cn:'原谅'},
        {en:'use', ipa:'/juːz/', cn:'使用'},
        {en:'huge', ipa:'/hjuːdʒ/', cn:'巨大的'},
      ],
      tip:'u-e 组合中的 u 通常发 /juː/ 或 /uː/，字母 e 不发音。',
    },
    story:{ title:'Story time', lines:[
      {en:'Zoom cannot find his toy car.', cn:'祖姆找不到他的玩具车。'},
      {en:'Zip: Where is your car?', cn:'齐普：你的车在哪里？'},
      {en:'Zoom: I do not know. Oh! It is under the chair!', cn:'祖姆：我不知道。哦！在椅子下面！'},
    ]},
    mind:`mindmap
  root((Unit 4 Where))
    Prepositions
      on
      in
      under
    Places
      chair
      desk
      box
    Toys
      car
      boat
      plane
      ball
      map
      toy
    Question
      Where is my ___?
      It is ___ the ___`
  },
  {
    id:'u11', title:'Unit 5 · Do you like pears?', term:'下册',
    desc:'水果',
    words:[
      {en:'pear', ipa:'/per/', cn:'梨'},
      {en:'apple', ipa:'/ˈæpl/', cn:'苹果'},
      {en:'banana', ipa:'/bəˈnænə/', cn:'香蕉'},
      {en:'orange', ipa:'/ˈɔːrɪndʒ/', cn:'橙子'},
      {en:'watermelon', ipa:'/ˈwɔːtərmelən/', cn:'西瓜'},
      {en:'grape', ipa:'/ɡreɪp/', cn:'葡萄'},
      {en:'strawberry', ipa:'/ˈstrɔːberi/', cn:'草莓'},
      {en:'peach', ipa:'/piːtʃ/', cn:'桃子'},
      {en:'like', ipa:'/laɪk/', cn:'喜欢'},
      {en:'love', ipa:'/lʌv/', cn:'爱；非常喜欢'},
      {en:'have', ipa:'/hæv/', cn:'有；吃'},
      {en:'buy', ipa:'/baɪ/', cn:'买'},
      {en:'thanks', ipa:'/θæŋks/', cn:'谢谢'},
      {en:'sorry', ipa:'/ˈsɔːri/', cn:'对不起'},
      {en:'sure', ipa:'/ʃʊr/', cn:'当然'},
    ],
    sentences:[
      {en:'Do you like pears?', cn:'你喜欢梨吗？'},
      {en:'Yes, I do.', cn:'是的，我喜欢。'},
      {en:'No, I do not.', cn:'不，我不喜欢。'},
      {en:'I like apples.', cn:'我喜欢苹果。'},
      {en:'Have some grapes.', cn:'来点葡萄吧。'},
      {en:'Let us buy some fruit.', cn:'我们买点水果吧。'},
    ],
    dialogs:[
      { title:"Let's talk", lines:[
        {en:'Do you like bananas?', cn:'你喜欢香蕉吗？'},
        {en:'Yes, I do.', cn:'是的，我喜欢。'},
        {en:'Have some, please.', cn:'请来点吧。'},
        {en:'Thanks!', cn:'谢谢！'},
      ]},
    ],
    chants:[
      {en:'Apples, pears, oranges, grapes — fruits are yummy in my plate!', cn:'苹果、梨、橙子、葡萄——盘子里的水果真好吃！'},
    ],
    spell:{
      pattern:'元音字母 e',
      words:[
        {en:'bed', ipa:'/bed/', cn:'床'},
        {en:'red', ipa:'/red/', cn:'红色'},
        {en:'leg', ipa:'/leɡ/', cn:'腿'},
        {en:'pen', ipa:'/pen/', cn:'钢笔'},
      ],
      tip:'短元音 e 发 /e/。',
    },
    story:{ title:'Story time', lines:[
      {en:'Mom: Do you like apples, dear?', cn:'妈妈：亲爱的，你喜欢苹果吗？'},
      {en:'Child: Yes! I love apples.', cn:'孩子：喜欢！我爱苹果。'},
      {en:'Mom: Have this red apple.', cn:'妈妈：吃这个红苹果吧。'},
      {en:'Child: Thanks, Mom!', cn:'孩子：谢谢妈妈！'},
    ]},
    mind:`mindmap
  root((Unit 5 Fruits))
    Common
      apple
      pear
      banana
      orange
    Big
      watermelon
    Small
      grape
      strawberry
      peach
    Sentence
      Do you like ___?
      Yes, I do
      No, I do not
      Have some ___`
  },
  {
    id:'u12', title:'Unit 6 · How many?', term:'下册',
    desc:'11-20 数字与物品数量',
    words:[
      {en:'eleven', ipa:'/ɪˈlevn/', cn:'十一'},
      {en:'twelve', ipa:'/twelv/', cn:'十二'},
      {en:'thirteen', ipa:'/ˌθɜːrˈtiːn/', cn:'十三'},
      {en:'fourteen', ipa:'/ˌfɔːrˈtiːn/', cn:'十四'},
      {en:'fifteen', ipa:'/ˌfɪfˈtiːn/', cn:'十五'},
      {en:'sixteen', ipa:'/ˌsɪksˈtiːn/', cn:'十六'},
      {en:'seventeen', ipa:'/ˌsevnˈtiːn/', cn:'十七'},
      {en:'eighteen', ipa:'/ˌeɪˈtiːn/', cn:'十八'},
      {en:'nineteen', ipa:'/ˌnaɪnˈtiːn/', cn:'十九'},
      {en:'twenty', ipa:'/ˈtwenti/', cn:'二十'},
      {en:'how many', ipa:'/haʊ ˈmeni/', cn:'多少（可数）'},
      {en:'kite', ipa:'/kaɪt/', cn:'风筝'},
      {en:'plane', ipa:'/pleɪn/', cn:'飞机'},
      {en:'boat', ipa:'/boʊt/', cn:'小船'},
      {en:'ball', ipa:'/bɔːl/', cn:'球'},
      {en:'doll', ipa:'/dɑːl/', cn:'洋娃娃'},
    ],
    sentences:[
      {en:'How many kites can you see?', cn:'你能看到多少只风筝？'},
      {en:'I can see twelve.', cn:'我能看到 12 只。'},
      {en:'How many pears do you have?', cn:'你有多少个梨？'},
      {en:'I have fifteen.', cn:'我有 15 个。'},
      {en:'Look at the beautiful kites!', cn:'看那些漂亮的风筝！'},
    ],
    dialogs:[
      { title:"Let's talk", lines:[
        {en:'How many kites can you see?', cn:'你能看到多少只风筝？'},
        {en:'One, two, three… I can see twelve!', cn:'一、二、三……我能看到 12 只！'},
        {en:'Wow, so many!', cn:'哇，好多呀！'},
      ]},
    ],
    chants:[
      {en:'Eleven, twelve, thirteen, fourteen, fifteen — high five!', cn:'十一、十二、十三、十四、十五——击掌！'},
      {en:'Sixteen, seventeen, eighteen, nineteen, twenty — how many?', cn:'十六、十七、十八、十九、二十——多少个？'},
    ],
    spell:{
      pattern:'字母组合 -ee-',
      words:[
        {en:'tree', ipa:'/triː/', cn:'树'},
        {en:'bee', ipa:'/biː/', cn:'蜜蜂'},
        {en:'see', ipa:'/siː/', cn:'看见'},
        {en:'three', ipa:'/θriː/', cn:'三'},
      ],
      tip:'-ee- 组合发 /iː/（长音）。',
    },
    story:{ title:'Story time', lines:[
      {en:'Zip: How many balloons?', cn:'齐普：多少个气球？'},
      {en:'Zoom: One, two, three... eleven, twelve! Twelve balloons!', cn:'祖姆：一、二、三……十一、十二！十二个气球！'},
      {en:'Zip: Great! Let us play.', cn:'齐普：太棒了！我们玩吧。'},
    ]},
    mind:`mindmap
  root((Unit 6 Numbers))
    11-15
      eleven
      twelve
      thirteen
      fourteen
      fifteen
    16-20
      sixteen
      seventeen
      eighteen
      nineteen
      twenty
    Objects
      kite
      plane
      boat
      ball
      doll
    Sentence
      How many ___ can you see?
      I can see ___
      How many ___ do you have?`
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
let state = { view:'home', term:'全部', uid:null, mode:'practice', stage:1, index:0, total:10, current:null, right:0, wrong:0, currentWrongs:[] };

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
  const terms = ['全部','上册','下册'];
  const list = state.term === '全部' ? UNITS : UNITS.filter(u => u.term === state.term);
  app.innerHTML = `
    ${voiceBar()}
    <div class="summary">
      <div class="s-item"><div class="s-num">${totalStars}</div><div class="s-lbl">⭐ 星星</div></div>
      <div class="s-item"><div class="s-num">${wrongTotal}</div><div class="s-lbl">📕 错词</div></div>
      <div class="s-item"><div class="s-num">${UNITS.length}</div><div class="s-lbl">📚 单元</div></div>
      <button class="ghost sm" id="reset">🗑️ 清空进度</button>
    </div>
    <div class="tabs" style="display:flex;gap:8px;margin:8px 0">
      ${terms.map(t => `<button class="${t===state.term?'active':''}" data-term="${t}" style="padding:6px 14px;border:1px solid var(--line);background:${t===state.term?'var(--brand)':'var(--card)'};color:${t===state.term?'#fff':'inherit'};border-radius:999px;cursor:pointer;font-size:14px">${t}</button>`).join('')}
    </div>
    <div class="grid">
      ${list.map(u => {
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
  app.querySelectorAll('.tabs button').forEach(b => b.onclick = () => nav('home', { term: b.dataset.term }));
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
    ${ (u.dialogs && u.dialogs.length) ? u.dialogs.map(d => `
    <div class="panel">
      <h3 style="margin-top:0">🗣️ ${d.title || "Let's talk"}</h3>
      <div class="sent-list">
        ${d.lines.map(l => `
          <div class="sent" data-en="${l.en}">
            <div>
              <div class="en">${l.en}</div>
              <div class="cn">${l.cn}</div>
            </div>
            <span class="spk">🔊</span>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:8px"><button class="ghost" data-play-all='${JSON.stringify(d.lines.map(x=>x.en)).replace(/'/g,"&#39;")}'>▶️ 连续朗读整段</button></div>
    </div>`).join('') : '' }
    ${ (u.chants && u.chants.length) ? `
    <div class="panel">
      <h3 style="margin-top:0">🎵 Chant · 韵律歌谣（点击朗读）</h3>
      <div class="sent-list">
        ${u.chants.map(l => `
          <div class="sent" data-en="${l.en}">
            <div>
              <div class="en">${l.en}</div>
              <div class="cn">${l.cn}</div>
            </div>
            <span class="spk">🔊</span>
          </div>
        `).join('')}
      </div>
    </div>` : '' }
    ${ u.spell ? `
    <div class="panel">
      <h3 style="margin-top:0">🔠 Let's spell · ${u.spell.pattern}</h3>
      <p style="color:var(--muted);margin:0 0 10px">${u.spell.tip}</p>
      <div class="word-grid">
        ${u.spell.words.map(w => `
          <div class="word" data-en="${w.en}">
            <span class="speaker">🔊</span>
            <div class="en">${w.en}</div>
            <div class="ipa">${w.ipa}</div>
            <div class="cn">${w.cn}</div>
          </div>
        `).join('')}
      </div>
    </div>` : '' }
    ${ u.story ? `
    <div class="panel">
      <h3 style="margin-top:0">📖 ${u.story.title || 'Story time'}（点击朗读）</h3>
      <div class="sent-list">
        ${u.story.lines.map(l => `
          <div class="sent" data-en="${l.en}">
            <div>
              <div class="en">${l.en}</div>
              <div class="cn">${l.cn}</div>
            </div>
            <span class="spk">🔊</span>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:8px"><button class="ghost" data-play-all='${JSON.stringify(u.story.lines.map(x=>x.en)).replace(/'/g,"&#39;")}'>▶️ 从头连读故事</button></div>
    </div>` : '' }
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
  app.querySelectorAll('[data-play-all]').forEach(btn => btn.onclick = () => {
    try {
      const arr = JSON.parse(btn.getAttribute('data-play-all').replace(/&#39;/g, "'"));
      tts.speakSeq(arr);
    } catch(e){ console.warn(e); }
  });
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