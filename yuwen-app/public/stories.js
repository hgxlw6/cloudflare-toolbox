/* 三年级语文 · 故事屋
 * - 8 个经典故事（寓言 + 神话）
 * - 每个故事分幕：SVG 场景 + emoji 角色 CSS 动画 + TTS 逐句跟读
 * - 结束提示「寓意」+「生字词」小复盘
 */
window.STORIES = [
  {
    id:'s1', kind:'寓言', title:'亡羊补牢', emoji:'🐑', color:'#fbbf24',
    moral:'出了问题及时补救，还不算晚。',
    tags:['羊','狼','牧人','篱笆','洞'],
    scenes:[
      { bg:'linear-gradient(180deg,#fde68a,#a7f3d0)', text:'从前，有个牧羊人养了一群羊。',
        chars:[{e:'🧑‍🌾',cls:'stand',x:20,y:60},{e:'🐑',cls:'graze',x:55,y:65},{e:'🐑',cls:'graze',x:70,y:70},{e:'🐑',cls:'graze',x:82,y:62}] },
      { bg:'linear-gradient(180deg,#312e81,#0f172a)', text:'一天夜里，羊圈破了一个洞，狼钻进来叼走了一只羊。',
        chars:[{e:'🌙',cls:'float',x:80,y:15},{e:'🐺',cls:'walk-left',x:60,y:65},{e:'🐑',cls:'shake',x:35,y:70},{e:'🕳️',cls:'stand',x:20,y:78}] },
      { bg:'linear-gradient(180deg,#fef3c7,#d1fae5)', text:'第二天，邻居劝他：快把羊圈修一修吧！',
        chars:[{e:'🧑‍🌾',cls:'stand',x:25,y:60},{e:'👨‍🦳',cls:'stand',x:60,y:60},{e:'💬',cls:'float',x:50,y:35}] },
      { bg:'linear-gradient(180deg,#fef3c7,#d1fae5)', text:'牧羊人却说：羊已经丢了，修它干什么？',
        chars:[{e:'🧑‍🌾',cls:'shake',x:40,y:60},{e:'❌',cls:'float',x:60,y:35}] },
      { bg:'linear-gradient(180deg,#312e81,#0f172a)', text:'又一晚，狼再次钻进来，又叼走了一只羊。',
        chars:[{e:'🌙',cls:'float',x:80,y:15},{e:'🐺',cls:'walk-right',x:30,y:65},{e:'🐑',cls:'shake',x:65,y:70}] },
      { bg:'linear-gradient(180deg,#fde68a,#86efac)', text:'牧羊人后悔极了，赶快把破洞补好。从此，再也没丢过羊。',
        chars:[{e:'🧑‍🌾',cls:'bounce',x:30,y:60},{e:'🔨',cls:'shake',x:45,y:55},{e:'🐑',cls:'graze',x:65,y:65},{e:'🐑',cls:'graze',x:78,y:70},{e:'✨',cls:'float',x:88,y:20}] }
    ]
  },
  {
    id:'s2', kind:'寓言', title:'守株待兔', emoji:'🐇', color:'#86efac',
    moral:'不能靠运气过日子，要靠自己努力。',
    tags:['农夫','兔子','树桩','庄稼'],
    scenes:[
      { bg:'linear-gradient(180deg,#bae6fd,#bbf7d0)', text:'古时候，宋国有个农夫在田里干活。',
        chars:[{e:'☀️',cls:'float',x:80,y:15},{e:'🧑‍🌾',cls:'bounce',x:35,y:62},{e:'🌾',cls:'stand',x:55,y:70},{e:'🌾',cls:'stand',x:70,y:72},{e:'🪵',cls:'stand',x:15,y:75}] },
      { bg:'linear-gradient(180deg,#bae6fd,#bbf7d0)', text:'忽然，一只兔子飞奔过来，一头撞在树桩上死了。',
        chars:[{e:'🐇',cls:'walk-fast',x:60,y:68},{e:'🪵',cls:'shake',x:25,y:75},{e:'💥',cls:'float',x:28,y:60}] },
      { bg:'linear-gradient(180deg,#bae6fd,#bbf7d0)', text:'农夫捡起兔子，高兴地回家美餐一顿。',
        chars:[{e:'🧑‍🌾',cls:'bounce',x:40,y:60},{e:'🐇',cls:'stand',x:55,y:55},{e:'😋',cls:'float',x:50,y:30}] },
      { bg:'linear-gradient(180deg,#bae6fd,#bbf7d0)', text:'他想：以后天天守在这儿，说不定还能再捡到兔子！',
        chars:[{e:'🧑‍🌾',cls:'stand',x:40,y:62},{e:'💭',cls:'float',x:55,y:30},{e:'🪵',cls:'stand',x:20,y:75}] },
      { bg:'linear-gradient(180deg,#a3a3a3,#525252)', text:'从此他不种田了，天天守着树桩。庄稼都荒了，也没等到第二只兔子。',
        chars:[{e:'🧑‍🌾',cls:'shake',x:35,y:62},{e:'🪵',cls:'stand',x:25,y:75},{e:'🥀',cls:'stand',x:60,y:70},{e:'🥀',cls:'stand',x:75,y:72},{e:'❌',cls:'float',x:85,y:25}] }
    ]
  },
  {
    id:'s3', kind:'寓言', title:'龟兔赛跑', emoji:'🐢', color:'#a7f3d0',
    moral:'骄傲使人落后，坚持使人成功。',
    tags:['乌龟','兔子','比赛','终点'],
    scenes:[
      { bg:'linear-gradient(180deg,#bbf7d0,#fef3c7)', text:'兔子笑话乌龟走得慢，乌龟不服气，要和它赛跑。',
        chars:[{e:'🐇',cls:'bounce',x:30,y:65},{e:'🐢',cls:'stand',x:55,y:70},{e:'😤',cls:'float',x:60,y:40}] },
      { bg:'linear-gradient(180deg,#bbf7d0,#fef3c7)', text:'比赛开始！兔子飞快地跑到了前面。',
        chars:[{e:'🚩',cls:'stand',x:12,y:55},{e:'🐇',cls:'walk-fast',x:65,y:65},{e:'🐢',cls:'walk-right',x:25,y:70},{e:'🏁',cls:'stand',x:88,y:55}] },
      { bg:'linear-gradient(180deg,#fed7aa,#fbbf24)', text:'兔子想：乌龟那么慢，我先睡一觉吧。',
        chars:[{e:'☀️',cls:'float',x:80,y:15},{e:'🐇',cls:'stand',x:55,y:70},{e:'💤',cls:'float',x:60,y:45},{e:'🌳',cls:'stand',x:75,y:65}] },
      { bg:'linear-gradient(180deg,#fed7aa,#fbbf24)', text:'乌龟一步一步地爬，超过了睡着的兔子。',
        chars:[{e:'🐇',cls:'stand',x:35,y:72},{e:'💤',cls:'float',x:40,y:50},{e:'🐢',cls:'walk-right',x:60,y:70}] },
      { bg:'linear-gradient(180deg,#fef3c7,#f9a8d4)', text:'乌龟先到达终点！兔子醒来时后悔极了。',
        chars:[{e:'🏁',cls:'stand',x:20,y:55},{e:'🐢',cls:'bounce',x:25,y:70},{e:'🏆',cls:'float',x:30,y:40},{e:'🐇',cls:'shake',x:70,y:70},{e:'😱',cls:'float',x:75,y:45}] }
    ]
  },
  {
    id:'s4', kind:'寓言', title:'狐假虎威', emoji:'🦊', color:'#fca5a5',
    moral:'借别人的威风吓唬人，最终会被识破。',
    tags:['狐狸','老虎','森林','狡猾'],
    scenes:[
      { bg:'linear-gradient(180deg,#166534,#65a30d)', text:'一只老虎在森林里抓住了一只狐狸。',
        chars:[{e:'🐅',cls:'stand',x:35,y:65},{e:'🦊',cls:'shake',x:60,y:70},{e:'🌳',cls:'stand',x:15,y:60},{e:'🌳',cls:'stand',x:82,y:58}] },
      { bg:'linear-gradient(180deg,#166534,#65a30d)', text:'狐狸眼珠一转：你不能吃我！我是天帝派来管百兽的。',
        chars:[{e:'🦊',cls:'bounce',x:40,y:65},{e:'🐅',cls:'stand',x:65,y:65},{e:'💡',cls:'float',x:45,y:35}] },
      { bg:'linear-gradient(180deg,#166534,#65a30d)', text:'不信？你跟在我后面走，看看谁不怕我！',
        chars:[{e:'🦊',cls:'walk-right',x:30,y:65},{e:'🐅',cls:'walk-right',x:55,y:65}] },
      { bg:'linear-gradient(180deg,#166534,#4d7c0f)', text:'狐狸大摇大摆走在前面，动物们看见老虎，都吓跑了。',
        chars:[{e:'🦊',cls:'bounce',x:20,y:65},{e:'🐅',cls:'walk-right',x:45,y:65},{e:'🦌',cls:'walk-fast',x:75,y:70},{e:'🐒',cls:'walk-fast',x:85,y:60}] },
      { bg:'linear-gradient(180deg,#166534,#65a30d)', text:'老虎信以为真：原来大家真的怕狐狸！它不知道，动物们怕的是它自己。',
        chars:[{e:'🐅',cls:'shake',x:45,y:65},{e:'❓',cls:'float',x:55,y:35},{e:'🦊',cls:'bounce',x:20,y:65}] }
    ]
  },
  {
    id:'s5', kind:'寓言', title:'拔苗助长', emoji:'🌱', color:'#86efac',
    moral:'违背规律急于求成，反而办坏事。',
    tags:['农夫','禾苗','长高','枯萎'],
    scenes:[
      { bg:'linear-gradient(180deg,#bae6fd,#bbf7d0)', text:'古时候有个农夫，希望自己的禾苗快快长高。',
        chars:[{e:'🧑‍🌾',cls:'stand',x:30,y:60},{e:'🌱',cls:'stand',x:50,y:75},{e:'🌱',cls:'stand',x:60,y:75},{e:'🌱',cls:'stand',x:70,y:75},{e:'💭',cls:'float',x:40,y:30}] },
      { bg:'linear-gradient(180deg,#bae6fd,#bbf7d0)', text:'他天天去看，可是禾苗好像一点也没有长。',
        chars:[{e:'🧑‍🌾',cls:'shake',x:35,y:60},{e:'🌱',cls:'stand',x:55,y:75},{e:'🌱',cls:'stand',x:65,y:75},{e:'⏳',cls:'float',x:50,y:35}] },
      { bg:'linear-gradient(180deg,#fef3c7,#fbbf24)', text:'他终于想出个办法：把禾苗一棵一棵往上拔！',
        chars:[{e:'🧑‍🌾',cls:'bounce',x:35,y:60},{e:'🌾',cls:'shake',x:55,y:70},{e:'💡',cls:'float',x:45,y:30}] },
      { bg:'linear-gradient(180deg,#fef3c7,#fbbf24)', text:'一天下来累坏了，他得意地告诉儿子：禾苗都长高了一大截！',
        chars:[{e:'🧑‍🌾',cls:'bounce',x:30,y:60},{e:'🧒',cls:'stand',x:55,y:62},{e:'😅',cls:'float',x:40,y:35}] },
      { bg:'linear-gradient(180deg,#a3a3a3,#78350f)', text:'儿子跑到田里一看——禾苗全枯死了！',
        chars:[{e:'🧒',cls:'shake',x:35,y:60},{e:'🥀',cls:'stand',x:55,y:75},{e:'🥀',cls:'stand',x:65,y:75},{e:'🥀',cls:'stand',x:75,y:75},{e:'😭',cls:'float',x:40,y:35}] }
    ]
  },
  {
    id:'s6', kind:'寓言', title:'井底之蛙', emoji:'🐸', color:'#93c5fd',
    moral:'眼界要放宽，不要以为自己看到的就是全世界。',
    tags:['青蛙','井','海龟','天空'],
    scenes:[
      { bg:'linear-gradient(180deg,#7dd3fc,#22d3ee)', text:'一只青蛙住在井里，觉得天空只有井口那么大。',
        chars:[{e:'⭕',cls:'float',x:50,y:20},{e:'🐸',cls:'stand',x:48,y:70},{e:'🧱',cls:'stand',x:20,y:60},{e:'🧱',cls:'stand',x:80,y:60}] },
      { bg:'linear-gradient(180deg,#7dd3fc,#22d3ee)', text:'一天，一只海龟经过井边，青蛙热情地邀请它下来玩。',
        chars:[{e:'🐢',cls:'stand',x:65,y:35},{e:'🐸',cls:'bounce',x:48,y:70},{e:'💬',cls:'float',x:55,y:50}] },
      { bg:'linear-gradient(180deg,#0ea5e9,#0369a1)', text:'海龟告诉它：外面的大海，宽千里，深千丈！',
        chars:[{e:'🐢',cls:'stand',x:30,y:60},{e:'🌊',cls:'float',x:60,y:70},{e:'🌊',cls:'float',x:75,y:65},{e:'🐟',cls:'walk-right',x:50,y:75},{e:'🐬',cls:'walk-right',x:70,y:55}] },
      { bg:'linear-gradient(180deg,#7dd3fc,#22d3ee)', text:'青蛙听完，惊得说不出话来。',
        chars:[{e:'🐸',cls:'shake',x:48,y:70},{e:'😲',cls:'float',x:52,y:45},{e:'❗',cls:'float',x:38,y:40}] }
    ]
  },
  {
    id:'s7', kind:'神话', title:'精卫填海', emoji:'🐦', color:'#fca5a5',
    moral:'坚持不懈，永不放弃。',
    tags:['精卫','大海','石头','树枝'],
    scenes:[
      { bg:'linear-gradient(180deg,#fde68a,#fbbf24)', text:'很久以前，炎帝的小女儿女娃到东海游玩。',
        chars:[{e:'☀️',cls:'float',x:80,y:15},{e:'👧',cls:'bounce',x:30,y:65},{e:'🌊',cls:'float',x:65,y:75}] },
      { bg:'linear-gradient(180deg,#0369a1,#1e3a8a)', text:'不幸的是，海浪突然翻涌，把她淹没了。',
        chars:[{e:'🌊',cls:'shake',x:40,y:65},{e:'🌊',cls:'shake',x:60,y:70},{e:'💧',cls:'float',x:50,y:45}] },
      { bg:'linear-gradient(180deg,#fed7aa,#fca5a5)', text:'女娃变成一只小鸟，名叫精卫。',
        chars:[{e:'🐦',cls:'float',x:50,y:40},{e:'✨',cls:'float',x:45,y:30},{e:'✨',cls:'float',x:60,y:35}] },
      { bg:'linear-gradient(180deg,#7dd3fc,#0369a1)', text:'她每天从西山衔来石头和树枝，投进大海。',
        chars:[{e:'🐦',cls:'walk-right',x:30,y:35},{e:'🪨',cls:'stand',x:33,y:33},{e:'🌊',cls:'float',x:65,y:75}] },
      { bg:'linear-gradient(180deg,#7dd3fc,#0369a1)', text:'她要把大海填平，为自己讨回公道，永远也不停下。',
        chars:[{e:'🐦',cls:'float',x:45,y:35},{e:'🌊',cls:'float',x:70,y:75},{e:'💪',cls:'float',x:35,y:50}] }
    ]
  },
  {
    id:'s8', kind:'神话', title:'后羿射日', emoji:'🏹', color:'#fbbf24',
    moral:'为民除害，勇敢担当。',
    tags:['后羿','太阳','弓箭','大地'],
    scenes:[
      { bg:'linear-gradient(180deg,#fecaca,#fbbf24)', text:'远古时候，天上有十个太阳，把大地都烤焦了。',
        chars:[{e:'☀️',cls:'float',x:15,y:15},{e:'☀️',cls:'float',x:30,y:18},{e:'☀️',cls:'float',x:45,y:15},{e:'☀️',cls:'float',x:60,y:18},{e:'☀️',cls:'float',x:75,y:15},{e:'🔥',cls:'shake',x:50,y:70}] },
      { bg:'linear-gradient(180deg,#fecaca,#a3a3a3)', text:'河水干了，庄稼枯了，人们没法生活。',
        chars:[{e:'🥀',cls:'stand',x:30,y:75},{e:'🥀',cls:'stand',x:50,y:75},{e:'🥀',cls:'stand',x:70,y:75},{e:'😰',cls:'float',x:45,y:40}] },
      { bg:'linear-gradient(180deg,#fecaca,#fbbf24)', text:'一位英雄叫后羿，他张开神弓，一箭射下一个太阳！',
        chars:[{e:'☀️',cls:'float',x:25,y:15},{e:'☀️',cls:'float',x:75,y:15},{e:'🏹',cls:'bounce',x:40,y:60},{e:'💫',cls:'float',x:60,y:30}] },
      { bg:'linear-gradient(180deg,#fef3c7,#bbf7d0)', text:'他一连射下九个太阳，只留下一个。',
        chars:[{e:'☀️',cls:'float',x:50,y:15},{e:'🏹',cls:'bounce',x:40,y:60},{e:'🎯',cls:'float',x:60,y:30}] },
      { bg:'linear-gradient(180deg,#bbf7d0,#86efac)', text:'从此，风调雨顺，人们过上了安稳的日子。',
        chars:[{e:'☀️',cls:'float',x:75,y:15},{e:'🏹',cls:'bounce',x:30,y:60},{e:'👨‍🌾',cls:'bounce',x:55,y:65},{e:'🌾',cls:'stand',x:70,y:72},{e:'✨',cls:'float',x:20,y:30}] }
    ]
  }
];
