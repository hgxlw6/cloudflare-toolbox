/* 打字学习数据
 * - 键位分组：家键 / 上排 / 下排 / 数字 / 符号
 * - 词语课程：分年级 + 分主题
 * - 句子课程：包含常用句、诗句、鼓励语
 */
window.KEY_LAYOUT = [
  { row: 'num',    keys: '`1234567890-=' },
  { row: 'top',    keys: 'qwertyuiop[]\\' },
  { row: 'home',   keys: 'asdfghjkl;\'' },
  { row: 'bottom', keys: 'zxcvbnm,./' }
];
// 手指分配（0-4 分别对应 F1-F5）
window.KEY_FINGER = {
  'q':0,'a':0,'z':0,'1':0,'p':0,';':0,'/':0,'0':0,
  'w':1,'s':1,'x':1,'2':1,'o':1,'l':1,'.':1,'9':1,
  'e':2,'d':2,'c':2,'3':2,'i':2,'k':2,',':2,'8':2,
  'r':3,'f':3,'v':3,'4':3,'t':3,'g':3,'b':3,'5':3,
  'u':3,'j':3,'m':3,'7':3,'y':3,'h':3,'n':3,'6':3,
  ' ':4
};
// 键位关卡（10 关，逐步扩展键位）
window.KEY_STAGES = [
  { id:'k1', name:'家键起步', keys:'fjdksla;', desc:'左手 F D S A / 右手 J K L ;（家键）', tries:30 },
  { id:'k2', name:'加入 G/H', keys:'fjdksla;gh', desc:'加上食指的 G 和 H', tries:30 },
  { id:'k3', name:'上排字母', keys:'qwertyuiop', desc:'上排 10 个字母', tries:30 },
  { id:'k4', name:'下排字母', keys:'zxcvbnm,./', desc:'下排字母', tries:30 },
  { id:'k5', name:'全字母混合', keys:'abcdefghijklmnopqrstuvwxyz', desc:'26 个字母混合练习', tries:40 },
  { id:'k6', name:'数字行', keys:'1234567890', desc:'数字 0-9', tries:30 },
  { id:'k7', name:'空格与句号', keys:'abcdefg .', desc:'加入空格和句号', tries:30 },
  { id:'k8', name:'大小写', keys:'AaBbCcDdEeFf', desc:'大小写切换（Shift 键）', tries:30, shift:true },
  { id:'k9', name:'常用符号', keys:'!?.,;:\'"', desc:'常用标点', tries:20 },
  { id:'k10', name:'综合挑战', keys:'The quick brown fox jumps over the lazy dog.', desc:'经典打字句子', tries:1, sentence:true }
];

// 二三年级常见字（拼音打字：输入拼音 → 显示汉字）
// 选自人教版小学二年级、三年级课本高频字
window.PIN_STAGES = [
  {
    id:'p1', grade:'二年级', name:'家庭·身体',
    items: [
      {han:'爸', py:'ba'},{han:'妈', py:'ma'},{han:'哥', py:'ge'},{han:'姐', py:'jie'},
      {han:'弟', py:'di'},{han:'妹', py:'mei'},{han:'手', py:'shou'},{han:'脚', py:'jiao'},
      {han:'头', py:'tou'},{han:'眼', py:'yan'},{han:'耳', py:'er'},{han:'口', py:'kou'}
    ]
  },
  {
    id:'p2', grade:'二年级', name:'自然·天气',
    items: [
      {han:'太阳', py:'taiyang'},{han:'月亮', py:'yueliang'},{han:'星星', py:'xingxing'},
      {han:'白云', py:'baiyun'},{han:'下雨', py:'xiayu'},{han:'刮风', py:'guafeng'},
      {han:'彩虹', py:'caihong'},{han:'雪花', py:'xuehua'},{han:'春天', py:'chuntian'},
      {han:'秋天', py:'qiutian'}
    ]
  },
  {
    id:'p3', grade:'二年级', name:'动物园',
    items: [
      {han:'老虎', py:'laohu'},{han:'狮子', py:'shizi'},{han:'大象', py:'daxiang'},
      {han:'熊猫', py:'xiongmao'},{han:'长颈鹿', py:'changjinglu'},{han:'猴子', py:'houzi'},
      {han:'兔子', py:'tuzi'},{han:'松鼠', py:'songshu'},{han:'蝴蝶', py:'hudie'},
      {han:'蜜蜂', py:'mifeng'}
    ]
  },
  {
    id:'p4', grade:'三年级', name:'学校生活',
    items: [
      {han:'教室', py:'jiaoshi'},{han:'黑板', py:'heiban'},{han:'课本', py:'keben'},
      {han:'铅笔', py:'qianbi'},{han:'橡皮', py:'xiangpi'},{han:'书包', py:'shubao'},
      {han:'同学', py:'tongxue'},{han:'老师', py:'laoshi'},{han:'作业', py:'zuoye'},
      {han:'考试', py:'kaoshi'}
    ]
  },
  {
    id:'p5', grade:'三年级', name:'节日·传统',
    items: [
      {han:'春节', py:'chunjie'},{han:'元宵', py:'yuanxiao'},{han:'清明', py:'qingming'},
      {han:'端午', py:'duanwu'},{han:'中秋', py:'zhongqiu'},{han:'国庆', py:'guoqing'},
      {han:'月饼', py:'yuebing'},{han:'饺子', py:'jiaozi'},{han:'汤圆', py:'tangyuan'},
      {han:'鞭炮', py:'bianpao'}
    ]
  },
  {
    id:'p6', grade:'三年级', name:'生活·情感',
    items: [
      {han:'开心', py:'kaixin'},{han:'快乐', py:'kuaile'},{han:'难过', py:'nanguo'},
      {han:'生气', py:'shengqi'},{han:'惊讶', py:'jingya'},{han:'勇敢', py:'yonggan'},
      {han:'努力', py:'nuli'},{han:'骄傲', py:'jiaoao'},{han:'谦虚', py:'qianxu'},
      {han:'感谢', py:'ganxie'}
    ]
  }
];

// 句子/短文课程（英文+拼音混合）
window.SENTENCE_STAGES = [
  { id:'s1', name:'英文短句 · 家常', items:[
    'I love my family.',
    'The sun is shining.',
    'Reading makes me happy.',
    'Practice makes perfect.',
    'Time flies fast.'
  ]},
  { id:'s2', name:'英文短句 · 校园', items:[
    'Study hard every day.',
    'Be a good student.',
    'Help each other.',
    'Never give up.',
    'Believe in yourself.'
  ]},
  { id:'s3', name:'诗句拼音 · 唐诗', items:[
    'chuang qian ming yue guang',   // 床前明月光
    'yi shi di shang shuang',        // 疑是地上霜
    'ju tou wang ming yue',           // 举头望明月
    'di tou si gu xiang'              // 低头思故乡
  ]},
  { id:'s4', name:'诗句拼音 · 春天', items:[
    'chun mian bu jue xiao',       // 春眠不觉晓
    'chu chu wen ti niao',          // 处处闻啼鸟
    'ye lai feng yu sheng',         // 夜来风雨声
    'hua luo zhi duo shao'          // 花落知多少
  ]},
  { id:'s5', name:'鼓励语（英文）', items:[
    'You can do it!',
    'Great job today.',
    'One step at a time.',
    'Mistakes help us learn.',
    'Keep going, little hero.'
  ]}
];

// 陨石模式的词库（简单英文单词 + 拼音）
window.METEOR_WORDS = [
  // Level 1 短词
  ['cat','dog','sun','fun','run','book','pen','red','blue','tree','fish','bird','moon','star','play','rain','snow','wind','love','home'],
  // Level 2 中词
  ['apple','happy','smile','music','water','light','sweet','peace','brave','friend','learn','study','dream','magic','panda','tiger','earth','ocean'],
  // Level 3 拼音
  ['xuexi','pengyou','kuaile','laoshi','tongxue','ziyou','yonggan','meili','shengri','zhongguo','beijing','shanghai','xuexiao','chunjie']
];
