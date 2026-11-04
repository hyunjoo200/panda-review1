/* =====================================================================
   중국어 탐험대 · 2주차 중간 복습 「판다 저택의 다섯 개의 방」 — 설정 파일 (game-data.js)
   ---------------------------------------------------------------------
   선생님이 고쳐도 되는 곳은 이 파일뿐입니다. (온라인 연결은 firebase-config.js)
   - 따옴표(' ') 안의 글자와 숫자만 바꾸고, 쉼표(,)와 괄호는 지우지 마세요.
   - GitHub에서 연필(✏️) 버튼으로 고친 뒤 Commit changes 하면 반영됩니다.
   - 방 안 물건의 자리: x = 왼쪽에서 몇 %, y = 위에서 몇 % (0~100)
   ===================================================================== */

window.GAME_DATA = {

  /* ---------- 1. 이름과 문구 ---------- */
  lessonId: 'review2',               // 결과 저장 이름 (선생님 화면 '차시' 칸에 이 글자를 써요)
  saveKey: 'panda-review2',          // 이 기기에 저장할 때 쓰는 이름
  stageLabel: '2주차 중간 복습 · 1~6차시',
  title: '판다 저택의 다섯 개의 방',
  subtitle: '열쇠 다섯 개를 모아라!',
  story: [
    '판다 탐험대가 대나무 숲 속 오래된 저택에 도착했어요.',
    '저택 복도에는 문이 다섯 개! 방마다 지금까지 배운 중국어 문제가 숨어 있대요.',
    '어느 방부터 가도 좋아요. 방 안에서 반짝이는 물건 3개를 찾아 문제를 풀고, 열쇠 5개를 모아 보물 상자를 열어요!'
  ],

  /* ---------- 2. 점수 ---------- */
  points: { firstTry: 100, retry: 60, bonus: 10, chestPerfect: 30, chest: 10, hand: 20, speedHand: 5, speedMax: 10 },
  //  bonus: 방 안 숨은 물건(✨)을 누르면 받는 별 · chestPerfect: 방의 문제를 모두 한 번에 맞히면 받는 별 · chest: 그 밖의 방 클리어 별

  /* ---------- 3. 중국어 음성 ----------
     audio 폴더에 같은 이름의 MP3가 있으면 그 파일을 먼저 씁니다.
     없으면 온라인 자동 음성 → 기기 내장 음성 순서로 씁니다. (검수 전 임시 음성)
     flag: 국기 그림 (KR 한국, CN 중국, US 미국, JP 일본), pic: 카드 그림, num: 숫자   */
  audio: {
    useLocalFiles: true,
    useOnlineVoice: true,
    onlineVoiceUrl: 'https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=',
    slowRate: 0.7,
    sounds: {
      // 1차시 성조
      ma1: { text: '妈', pinyin: 'mā', tone: 1, pic: '👩' },
      ma2: { text: '麻', pinyin: 'má', tone: 2, pic: '🌿' },
      ma3: { text: '马', pinyin: 'mǎ', tone: 3, pic: '🐴' },
      ma4: { text: '骂', pinyin: 'mà', tone: 4, pic: '😠' },
      mian: { text: '面', pinyin: 'miàn', tone: 4, pic: '🍜' },
      mamamama: { text: '妈妈骂马', pinyin: 'māma mà mǎ' },
      // 1·2차시 인사
      nihao:      { text: '你好',   pinyin: 'nǐ hǎo' },
      laoshihao:  { text: '老师好', pinyin: 'lǎoshī hǎo' },
      tongxuemenhao: { text: '同学们好', pinyin: 'tóngxuémen hǎo' },
      xiexie:     { text: '谢谢',   pinyin: 'xièxie' },
      bukeqi:     { text: '不客气', pinyin: 'bú kèqi' },
      duibuqi:    { text: '对不起', pinyin: 'duìbuqǐ' },
      meiguanxi:  { text: '没关系', pinyin: 'méi guānxi' },
      zaoshanghao:{ text: '早上好', pinyin: 'zǎoshang hǎo' },
      wanan:      { text: '晚安',   pinyin: 'wǎn’ān' },
      mingtianjian:{ text: '明天见', pinyin: 'míngtiān jiàn' },
      zaijian:    { text: '再见',   pinyin: 'zàijiàn' },
      // 3·4차시 이름과 나라
      nijiao:     { text: '你叫什么名字？', pinyin: 'Nǐ jiào shénme míngzi?' },
      wojiaoxiaoming: { text: '我叫小明。', pinyin: 'Wǒ jiào Xiǎomíng.' },
      nine:       { text: '你呢？', pinyin: 'Nǐ ne?' },
      wangxiaoming: { text: '王小明', pinyin: 'Wáng Xiǎomíng' },
      hanguo:     { text: '韩国', pinyin: 'Hánguó',   flag: 'KR' },
      zhongguo:   { text: '中国', pinyin: 'Zhōngguó', flag: 'CN' },
      meiguo:     { text: '美国', pinyin: 'Měiguó',   flag: 'US' },
      riben:      { text: '日本', pinyin: 'Rìběn',    flag: 'JP' },
      ananzhongguo: { text: '我叫安安，我是中国人。', pinyin: 'Wǒ jiào Ān’ān, wǒ shì Zhōngguó rén.' },
      // 5차시 숫자
      n0:  { text: '零', pinyin: 'líng', num: 0, pic: '0' },
      n1:  { text: '一', pinyin: 'yī',   num: 1, pic: '1' },
      n2:  { text: '二', pinyin: 'èr',   num: 2, pic: '2' },
      n3:  { text: '三', pinyin: 'sān',  num: 3, pic: '3' },
      n4:  { text: '四', pinyin: 'sì',   num: 4, pic: '4' },
      n5:  { text: '五', pinyin: 'wǔ',   num: 5, pic: '5' },
      n6:  { text: '六', pinyin: 'liù',  num: 6, pic: '6' },
      n7:  { text: '七', pinyin: 'qī',   num: 7, pic: '7' },
      n8:  { text: '八', pinyin: 'bā',   num: 8, pic: '8' },
      n9:  { text: '九', pinyin: 'jiǔ',  num: 9, pic: '9' },
      n10: { text: '十', pinyin: 'shí',  num: 10, pic: '10' },
      wuerling: { text: '五二零', pinyin: 'wǔ èr líng' },
      woaini:   { text: '我爱你', pinyin: 'wǒ ài nǐ' },
      // 6차시 생일
      nideshengri: { text: '你的生日是几月几号？', pinyin: 'Nǐ de shēngrì shì jǐ yuè jǐ hào?' },
      d1109: { text: '十一月九号', pinyin: 'shíyī yuè jiǔ hào' },
      d0911: { text: '九月十一号', pinyin: 'jiǔ yuè shíyī hào' },
      d0119: { text: '一月十九号', pinyin: 'yī yuè shíjiǔ hào' },
      wode1230: { text: '我的生日是十二月三十号。', pinyin: 'Wǒ de shēngrì shì shí’èr yuè sānshí hào.' },
      card_panda:  { text: '3月8号',   pinyin: 'sān yuè bā hào',        pic: '🐼' },
      card_rabbit: { text: '8月17号',  pinyin: 'bā yuè shíqī hào',      pic: '🐰' },
      card_bear:   { text: '12月30号', pinyin: 'shí’èr yuè sānshí hào', pic: '🐻' },
      changshoumian: { text: '长寿面', pinyin: 'chángshòumiàn' },
      shengrikuaile: { text: '生日快乐！', pinyin: 'Shēngrì kuàilè!' }
    }
  },

  /* ---------- 4. 다섯 개의 방 (방마다 문제 3개) ----------
     door: 문 색깔 · icon: 문패 그림 · lessons: 문패 아래 글자
     wall/floor: 방 벽과 바닥 색 · deco: 그냥 꾸미는 물건
     spot: 문제가 숨어 있는 물건 (반짝여요) · bonus: 누르면 별과 문화 이야기가 나오는 물건  */
  zones: [
    { id: 'tone', name: '성조의 방', icon: '🎵', lessons: '1차시', door: '#7cc4a4', wall: '#e4f4ea', floor: '#c7e3cf',
      host: '음악 판다', hello: '높게, 올라가게, 내려갔다 올라가게, 내려가게! 소리의 높낮이를 잘 들어 봐!',
      deco: [ { e: '🎋', x: 6, y: 30, s: 1.6 }, { e: '🪴', x: 92, y: 74, s: 1.2 }, { e: '🎼', x: 44, y: 14, s: 1.1 } ],
      bonus: [
        { id: 'b_tone', e: '🎹', x: 80, y: 40, title: '피아노 소리', text: '중국어는 같은 ma라도 높낮이(성조)가 다르면 뜻이 달라져요. 妈 엄마, 麻 삼, 马 말, 骂 꾸짖다!', sound: ['ma1', 'ma2', 'ma3', 'ma4'] },
        { id: 'b_mama', e: '🐴', x: 30, y: 78, title: '잰말놀이', text: '妈妈骂马 māma mà mǎ — 엄마가 말을 꾸짖어요. 성조에 조심해서 따라 해 봐요!', sound: 'mamamama' }
      ],
      missions: [
        { id: 'q1', type: 'numberCode', place: '성조 금고', spot: { e: '🧰', x: 22, y: 52 },
          question: '세 소리를 듣고, 성조 번호를 순서대로 눌러 금고를 열어요.',
          sets: [ ['ma2','ma4','ma1'], ['ma3','ma1','ma4'], ['ma4','ma2','ma3'] ],
          hint: '한 소리씩 끊어서 다시 들어 보세요. 손가락으로 높낮이를 그려 봐도 좋아요.' },
        { id: 'q2', type: 'hearPick', place: '그림 액자', spot: { e: '🖼️', x: 66, y: 22 }, sound: 'ma3', answer: 'ma3', toneHint: true,
          options: ['ma1', 'ma2', 'ma3', 'ma4'],
          question: 'ma 소리를 들어요. 어떤 그림의 글자일까요?',
          hint: '내려갔다 올라오는 3성 소리예요. 3성 ma는 동물이에요.' },
        { id: 'q3', type: 'choiceText', place: '국수 그릇', spot: { e: '🍜', x: 56, y: 70 }, sound: 'mian', toneHint: true,
          scene: '🍜 面',
          question: '面(국수) 소리를 들어요. 몇 성일까요?',
          options: [ { text: '1성' }, { text: '2성' }, { text: '3성' }, { text: '4성', correct: true } ],
          hint: '높은 곳에서 아래로 뚝! 떨어지는 소리예요.' }
      ]},
    { id: 'hello', name: '인사의 방', icon: '👋', lessons: '1·2차시', door: '#f2a65a', wall: '#fff1df', floor: '#f2d6b3',
      host: '인사 판다', hello: '만나면 인사, 헤어질 때도 인사! 상황에 맞는 인사말을 골라 봐.',
      deco: [ { e: '🛋️', x: 78, y: 70, s: 1.6 }, { e: '🕰️', x: 88, y: 20, s: 1 } ],
      bonus: [
        { id: 'b_morning', e: '☀️', x: 20, y: 18, title: '아침 창문', text: '아침에 만나면 早上好 zǎoshang hǎo! "좋은 아침이에요"라는 뜻이에요.', sound: 'zaoshanghao' },
        { id: 'b_bye', e: '🚪', x: 8, y: 66, title: '헤어질 때', text: '헤어질 때는 再见 zàijiàn! 내일 또 만나면 明天见 míngtiān jiàn!', sound: ['zaijian', 'mingtianjian'] }
      ],
      missions: [
        { id: 'q4', type: 'choiceText', place: '선생님 칠판', spot: { e: '🧑‍🏫', x: 48, y: 30 },
          scene: '🏫 🧑‍🏫  교실에 선생님이 들어오셨어요',
          question: '선생님께 드리는 인사로 알맞은 것은?',
          options: [
            { text: '老师好！', sub: 'lǎoshī hǎo', sound: 'laoshihao', correct: true },
            { text: '同学们好！', sub: 'tóngxuémen hǎo', sound: 'tongxuemenhao' },
            { text: '晚安！', sub: 'wǎn’ān', sound: 'wanan' }
          ],
          hint: '老师는 "선생님"이에요. 同学们好는 선생님이 학생들에게 하는 인사예요.' },
        { id: 'q5', type: 'matchScenes', place: '그림 카드 상자', spot: { e: '🗃️', x: 26, y: 72 },
          question: '인사말을 눌러 듣고, 어울리는 그림에 놓아요.',
          pairs: [
            { scene: '☀️🏫', label: '아침에 만났어요', sound: 'zaoshanghao' },
            { scene: '🌙🛏️', label: '잠자리에 들어요', sound: 'wanan' },
            { scene: '✏️🙏', label: '연필을 빌려줬어요', sound: 'xiexie' }
          ],
          hint: '해와 학교는 아침, 달과 침대는 잠자기 전, 고마울 때는 谢谢예요.' },
        { id: 'q6', type: 'choiceText', place: '떨어진 공책', spot: { e: '📓', x: 70, y: 68 }, sound: 'duibuqi',
          scene: '🐼 💥📓 🐰  "对不起!"',
          question: '판다가 토끼 공책을 떨어뜨리고 "对不起!"라고 했어요. 토끼는 뭐라고 대답할까요?',
          options: [
            { text: '没关系', sub: 'méi guānxi', sound: 'meiguanxi', correct: true },
            { text: '不客气', sub: 'bú kèqi', sound: 'bukeqi' },
            { text: '早上好', sub: 'zǎoshang hǎo', sound: 'zaoshanghao' }
          ],
          hint: '미안하다는 말에는 "괜찮아"라고 다독여 줘요. 不客气는 고맙다는 말에 하는 대답이에요.' }
      ]},
    { id: 'intro', name: '자기소개 방', icon: '🏷️', lessons: '3·4차시', door: '#6aa8e0', wall: '#e6f1fb', floor: '#c4dbef',
      host: '기자 판다', hello: '안녕! 나는 기자야. 이름이 뭐야? 어느 나라 사람이야?',
      deco: [ { e: '🗺️', x: 50, y: 16, s: 1.6 }, { e: '🎙️', x: 86, y: 62, s: 1.2 }, { e: '🪑', x: 12, y: 78, s: 1.3 } ],
      bonus: [
        { id: 'b_name', e: '🪪', x: 86, y: 30, title: '이름표', text: '王小明 Wáng Xiǎomíng — 중국 이름도 우리처럼 성(王)을 앞에 써요!', sound: 'wangxiaoming' },
        { id: 'b_guo', e: '🌐', x: 10, y: 40, title: '나라 국(国)', text: '韩国·中国·美国에는 모두 国 guó(나라)가 들어 있어요. 우리가 쓰는 國을 중국에서는 간단하게 国로 써요.', sound: ['hanguo', 'zhongguo', 'meiguo'] }
      ],
      missions: [
        { id: 'q7', type: 'wordOrder', place: '질문 쪽지', spot: { e: '📝', x: 30, y: 46 }, sound: 'nijiao',
          question: '"이름이 뭐야?"를 중국어로 만들어요. 조각을 순서대로 눌러요.',
          tiles: ['你', '叫', '什么', '名字'], extra: ['我'], ending: '？',
          hint: '너(你)가 → 불리다(叫) → 무엇(什么) → 이름(名字) 순서예요.' },
        { id: 'q8', type: 'matchScenes', place: '국기 서랍', spot: { e: '🗄️', x: 70, y: 52 },
          question: '나라 이름을 눌러 듣고, 알맞은 국기에 놓아요.',
          pairs: [
            { flag: 'KR', label: '한국', sound: 'hanguo' },
            { flag: 'CN', label: '중국', sound: 'zhongguo' },
            { flag: 'US', label: '미국', sound: 'meiguo' },
            { flag: 'JP', label: '일본', sound: 'riben' }
          ],
          hint: '韩国 한국, 中国 중국, 美国 미국, 日本 일본이에요.' },
        { id: 'q9', type: 'hearPick', place: '친구의 녹음기', spot: { e: '📻', x: 44, y: 68 }, sound: 'ananzhongguo', answer: 'zhongguo',
          options: ['hanguo', 'zhongguo', 'meiguo', 'riben'],
          question: '새 친구 안안이 자기소개를 해요. 안안은 어느 나라 사람일까요?',
          hint: '我叫 다음은 이름, 我是 다음은 나라예요. 人 앞에 나오는 나라 이름을 잘 들어 보세요.' }
      ]},
    { id: 'number', name: '숫자의 방', icon: '🔢', lessons: '5차시', door: '#b58ce0', wall: '#f1e9fb', floor: '#d9c7ef',
      host: '수학 판다', hello: '一二三四五! 손가락으로도 숫자를 말할 수 있지?',
      deco: [ { e: '🧮', x: 12, y: 30, s: 1.4 }, { e: '📚', x: 88, y: 76, s: 1.3 }, { e: '🔢', x: 52, y: 14, s: 1.1 } ],
      bonus: [
        { id: 'b_hand', e: '🖐️', x: 86, y: 34, type: 'hand', title: '손숫자 퀴즈' },
        { id: 'b_520', e: '💌', x: 12, y: 72, title: '숫자 암호 520', text: '520 wǔ èr líng은 중국 온라인에서 我爱你(사랑해)를 뜻하는 숫자 암호예요. 소리가 완전히 같지는 않지만 비슷해서 약속처럼 써요.', sound: ['wuerling', 'woaini'] }
      ],
      missions: [
        { id: 'q10', type: 'digitCode', place: '숫자 자물쇠', spot: { e: '🔐', x: 32, y: 52 },
          question: '숫자 세 개를 듣고, 순서대로 눌러 자물쇠를 열어요.',
          sets: [ ['n7','n0','n4'], ['n9','n3','n6'], ['n1','n8','n2'] ],
          hint: '한 숫자씩 끊어서 다시 들어 보세요. 四 sì와 十 shí, 七 qī와 一 yī를 헷갈리기 쉬워요.' },
        { id: 'q11', type: 'digitCode', hands: true, place: '손가락 금고', spot: { e: '🗝️', x: 64, y: 40 },
          question: '손 모양을 보고 숫자 암호를 눌러요.',
          sets: [ [8,0,6], [7,2,9], [6,9,3] ],
          hint: '엄지와 새끼손가락은 6, 손가락 끝 셋을 모으면 7, 엄지와 검지는 8, 검지를 구부리면 9, 주먹은 0이에요.' },
        { id: 'q12', type: 'hearPick', place: '숫자 풍선', spot: { e: '🎈', x: 56, y: 68 }, sound: 'n10', answer: 'n10',
          options: ['n4', 'n10', 'n7'],
          question: '풍선이 숫자를 말해요. 어떤 숫자일까요?',
          hint: '四 sì(4)는 입을 옆으로, 十 shí(10)는 혀를 말아 소리 내요.' }
      ]},
    { id: 'birthday', name: '생일의 방', icon: '🎂', lessons: '6차시', door: '#f07fa6', wall: '#ffeaf1', floor: '#f6c7d6',
      host: '파티 판다', hello: '오늘은 누구 생일일까? 你的生日是几月几号？',
      deco: [ { e: '🎈', x: 10, y: 22, s: 1.4 }, { e: '🎉', x: 90, y: 18, s: 1.2 }, { e: '🎁', x: 84, y: 78, s: 1.3 } ],
      bonus: [
        { id: 'b_noodle', e: '🍜', x: 14, y: 74, title: '장수면', text: '长寿面 chángshòumiàn — 중국에서는 생일에 긴 국수를 먹기도 해요. 오래오래 건강하라는 뜻!', sound: 'changshoumian' },
        { id: 'b_clock', e: '⏰', x: 60, y: 14, title: '시계 선물?', text: '钟 zhōng(시계)을 선물한다는 말(送钟)이 좋지 않은 뜻의 말과 소리가 같아서, 생일 선물로 시계를 피하는 경우가 있대요.' }
      ],
      missions: [
        { id: 'q13', type: 'choiceText', place: '달력', spot: { e: '📅', x: 34, y: 34 },
          scene: '📅 11월 9일',
          question: '11월 9일을 중국어로 바르게 쓴 것은?',
          options: [
            { text: '十一月九号', sub: 'shíyī yuè jiǔ hào', sound: 'd1109', correct: true },
            { text: '九月十一号', sub: 'jiǔ yuè shíyī hào', sound: 'd0911' },
            { text: '一月十九号', sub: 'yī yuè shíjiǔ hào', sound: 'd0119' }
          ],
          hint: '중국어도 "월(月)"을 먼저, "일(号)"을 나중에 말해요. 11 = 十一.' },
        { id: 'q14', type: 'wordOrder', place: '초대장', spot: { e: '💌', x: 66, y: 48 }, sound: 'nideshengri',
          question: '"너의 생일은 몇 월 며칠이야?"를 중국어로 만들어요.',
          tiles: ['你的', '生日', '是', '几月', '几号'], extra: ['我的'], ending: '？',
          hint: '너의(你的) → 생일(生日) → ~이다(是) → 몇 월(几月) → 며칠(几号) 순서예요.' },
        { id: 'q15', type: 'hearPick', place: '생일 케이크', spot: { e: '🎂', x: 72, y: 66 }, sound: 'wode1230', answer: 'card_bear',
          options: ['card_panda', 'card_rabbit', 'card_bear'],
          question: '친구가 자기 생일을 말해요. 누구의 생일 카드일까요?',
          hint: '十二月는 12월, 三十号는 30일이에요.' }
      ]}
  ],

  /* ---------- 5. 마지막 보물 상자 ---------- */
  treasure: {
    title: '보물의 문',
    locked: '열쇠가 모두 모이면 열려요!',
    open: '열쇠 다섯 개를 모두 모았어요! 보물 상자를 열어 볼까요?',
    end: '짝짝짝! 1~6차시를 모두 복습했어요. 판다 친구들이 인사해요.'
  }
};
