/* 중국어 탐험대 · 2주차 중간 복습 「판다 저택의 다섯 개의 방」 (game.js)
   고치지 않아도 됩니다. 문제와 방은 game-data.js에서 바꿔요. */
(() => {
'use strict';
const D = window.GAME_DATA;
const $ = s => document.querySelector(s);
const Net = window.PandaNet || { enabled:false, push(){}, studentStart(){ return Promise.resolve(null); }, watchBoard(cb){ cb(null); return () => {}; }, onStatus(fn){ fn('off'); }, status(){ return 'off'; }, flush(){}, uid(){ return null; } };
const STORE_KEY = D.saveKey || 'panda-review2', PREF_KEY = 'panda-stage1-prefs';
const SOUNDS = D.audio.sounds;
Object.keys(SOUNDS).forEach(id => { if (!SOUNDS[id].file) SOUNDS[id].file = `audio/${id}.mp3`; });
const ROOMS = D.zones;
const ZONES = ROOMS.map(z => ({ id: z.id, name: z.name }));
const MISSIONS = ROOMS.flatMap((z, zi) => z.missions.map(m => ({ ...m, zone: zi })));
const ALL = MISSIONS;
const QUESTION_COUNT = MISSIONS.length;
const NUM_ID = n => 'n' + n;
const HAND = n => (window.HAND_IMAGES && window.HAND_IMAGES[n]) || `img/hand${n}.jpg`;

/* ================= 저장 (이 기기 + 온라인) ================= */
const store = {
  load(){ try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch(e){ return null; } },
  save(s){ try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); return true; } catch(e){ return false; } }
};
let prefs = { bgm:45, sfx:70, voice:100, mute:false };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch(e){}
const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch(e){} };
const emptyRec = () => ({ first:null, firstCorrect:null, tries:0, wrongs:[], points:0, done:false, doneAt:null, target:null });
function newState(name){
  const results = {}; ALL.forEach(m => results[m.id] = emptyRec());
  return { name, tag:String(Math.floor(1000 + Math.random()*9000)), startedAt:Date.now(), learn:0, starPts:0,
           room:null, rooms:{}, order:[], used:[], hand:0, handOk:0, speed:null, results, finished:false, finishedAt:null };
}
let S = null;
const doneCount = () => MISSIONS.filter(m => S.results[m.id].done).length;
const roomDone = z => z.missions.every(m => S.results[m.id].done);
const roomsCleared = () => ROOMS.filter(z => S.rooms[z.id] && S.rooms[z.id].cleared).length;
function summary(){
  const res = {};
  ALL.forEach(m => { const r = S.results[m.id]; res[m.id] = { first: r.first, firstCorrect: r.firstCorrect, tries: r.tries, wrongs: (r.wrongs || []).slice(0, 12), points: r.points, done: r.done }; });
  const firstCorrect = MISSIONS.filter(m => S.results[m.id].firstCorrect === true).length;
  return { name: S.name, tag: S.tag, lesson: D.lessonId || 'lesson', learn: S.learn, star: S.starPts, total: S.learn + S.starPts,
    bells: doneCount(), bellsTotal: MISSIONS.length, bossDone: !!S.finished,
    finished: !!S.finished, finishedAt: S.finishedAt || null, startedAt: S.startedAt, firstCorrect, questions: QUESTION_COUNT,
    roomsDone: roomsCleared(), roomsTotal: ROOMS.length, order: (S.order || []).join('>'),
    bonus: (S.used || []).length, handTiles: S.hand || 0, handOk: S.handOk || 0, speedOk: S.speed ? S.speed.ok : 0, results: res };
}
const persist = (now) => { if (!S) return; store.save(S); Net.push(summary(), now === true); };
/* ================= 소리 ================= */
const Snd = (() => {
  let ctx = null, master, bgmGain, sfxGain, duck = 1, bgmOn = false, nextNote = 0, step = 0;
  const bad = {}; let lastSource = '';
  function ensure(){
    if (ctx){ if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    bgmGain = ctx.createGain(); bgmGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.connect(master);
    apply();
  }
  function apply(){
    if (!ctx) return; const t = ctx.currentTime;
    master.gain.setTargetAtTime(prefs.mute ? 0 : 1, t, .05);
    bgmGain.gain.setTargetAtTime(prefs.bgm/100 * .2 * duck, t, .15);
    sfxGain.gain.setTargetAtTime(prefs.sfx/100 * .6, t, .05);
  }
  const setDuck = d => { duck = d; apply(); };
  function tone(f, start, dur, type='sine', vol=.3, dest=sfxGain, atk=.01){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, start);
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(vol, start + atk);
    g.gain.exponentialRampToValueAtTime(.0008, start + dur);
    o.connect(g); g.connect(dest); o.start(start); o.stop(start + dur + .05); return o;
  }
  const hz = n => 440 * Math.pow(2, (n - 69)/12);
  // 배경음악: 오음계 반복 곡 (코드로 직접 생성, 저작권 문제 없음)
  const MEL = [76,79,81,79, 76,74,72,74, 76,79,84,81, 79,76,74,-1, 72,74,76,79, 81,79,76,74, 72,76,74,72, 69,72,74,-1];
  const BASS = [48,55,45,52, 48,55,43,50];
  function schedule(){
    if (!ctx || !bgmOn) return;
    const spb = 60/112/2;
    while (nextNote < ctx.currentTime + .25){
      const n = MEL[step % MEL.length];
      if (n > 0) tone(hz(n), nextNote, spb*1.6, 'triangle', .16, bgmGain, .02);
      if (step % 4 === 0) tone(hz(BASS[(step/4) % BASS.length]), nextNote, spb*3.6, 'sine', .22, bgmGain, .03);
      if (step % 2 === 1) tone(hz(96), nextNote, .05, 'square', .01, bgmGain, .002);
      nextNote += spb; step++;
    }
  }
  function startBgm(){ ensure(); if (!ctx || bgmOn) return; bgmOn = true; nextNote = ctx.currentTime + .1; setInterval(schedule, 90); }
  const fx = fn => () => { ensure(); if (ctx) fn(ctx.currentTime); };
  const sfx = {
    correct: fx(t => { [72,76,79,84].forEach((n,i) => tone(hz(n), t+i*.07, .35, 'triangle', .25)); tone(hz(96), t+.3, .5, 'sine', .12); }),
    wrong:   fx(t => { tone(hz(64), t, .18, 'sine', .18); tone(hz(60), t+.12, .25, 'sine', .15); }),
    bell:    fx(t => { [[523,.3],[1046,.14],[1568,.08],[2093,.05]].forEach(([f,v]) => tone(f, t, 2.2, 'sine', v, sfxGain, .003)); }),
    star:    fx(t => { tone(hz(88), t, .08, 'square', .045); tone(hz(93), t+.06, .14, 'square', .045); }),
    jump:    fx(t => { const o = tone(300, t, .16, 'sine', .1); o.frequency.exponentialRampToValueAtTime(620, t+.14); }),
    bump:    fx(t => { const o = tone(220, t, .25, 'triangle', .14); o.frequency.exponentialRampToValueAtTime(110, t+.22); }),
    stomp:   fx(t => { tone(hz(67), t, .1, 'square', .06); tone(hz(74), t+.08, .12, 'square', .06); }),
    place:   fx(t => { tone(hz(79), t, .12, 'triangle', .18); }),
    door:    fx(t => { tone(hz(48), t, 1.2, 'sawtooth', .05); [60,64,67,72,76].forEach((n,i) => tone(hz(n), t+.25+i*.12, .8, 'triangle', .16)); }),
    bonus:   fx(t => { [79,83,86,91,95].forEach((n,i) => tone(hz(n), t+i*.06, .3, 'sine', .18)); }),
    fanfare: fx(t => { [[72,0],[76,.15],[79,.3],[84,.45],[79,.7],[84,.85]].forEach(([n,d]) => tone(hz(n), t+d, .5, 'triangle', .22)); }),
    hop:     fx(t => { const o = tone(420, t, .12, 'sine', .09); o.frequency.exponentialRampToValueAtTime(760, t+.1); }),
    dice:    fx(t => { for (let i = 0; i < 6; i++) tone(hz(84 + (i % 3)*3), t + i*.07, .05, 'square', .03); }),
    back:    fx(t => { const o = tone(520, t, .4, 'triangle', .12); o.frequency.exponentialRampToValueAtTime(200, t+.38); }),
    party:   fx(t => { [[67,0],[67,.18],[69,.36],[67,.6],[72,.84],[71,1.08]].forEach(([n,d]) => tone(hz(n), t+d, .4, 'triangle', .2)); }),
    blip:    fx(t => tone(hz(88), t, .06, 'sine', .08))
  };
  // 중국어 음성: ① 녹음 파일 → ② 온라인 음성 → ③ 기기 내장 음성
  // 휴대폰은 화면을 누르기 전에는 소리를 막아요. 첫 터치 때 재생기 하나를 '깨워 두고' 계속 다시 씁니다.
  const SILENT = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
  const voiceEl = new Audio(); voiceEl.preload = 'auto';
  try { voiceEl.preservesPitch = true; voiceEl.webkitPreservesPitch = true; } catch(e){}
  let unlocked = false;
  function unlock(){
    ensure();
    if (ctx){ try { const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination); src.start(0); } catch(e){} }
    if (unlocked) return; unlocked = true;
    try {
      voiceEl.muted = true; voiceEl.src = SILENT;
      const p = voiceEl.play();
      if (p && p.then) p.then(() => { voiceEl.pause(); voiceEl.muted = false; }).catch(() => { voiceEl.muted = false; unlocked = false; });
    } catch(e){ unlocked = false; }
    try { if (window.speechSynthesis){ const u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u); } } catch(e){}
  }
  ['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture:true, passive:true }));
  const errKind = err => !err ? 'load' : err.name === 'NotAllowedError' ? 'blocked' : err.name === 'AbortError' ? 'abort' : 'load';
  function playUrl(url, rate){
    return new Promise((res, rej) => {
      const a = voiceEl; let started = false, done = false;
      const fail = kind => { const e = new Error(kind); e.kind = kind; return e; };
      const fin = (fn, v) => { if (done) return; done = true; clearTimeout(to); a.onerror = a.onended = a.onplaying = null; fn(v); };
      const to = setTimeout(() => { if (!started){ try { a.pause(); } catch(e){} fin(rej, fail('timeout')); } }, 6000);
      try { a.pause(); } catch(e){}
      a.muted = false; a.volume = prefs.mute ? 0 : prefs.voice/100;
      a.onerror = () => fin(rej, fail('load'));
      a.onended = () => fin(res);
      a.onplaying = () => { started = true; clearTimeout(to); a.playbackRate = rate; };
      a.src = url; a.defaultPlaybackRate = rate; a.playbackRate = rate;
      const p = a.play(); if (p && p.catch) p.catch(err => fin(rej, fail(errKind(err))));
    });
  }
  function synth(text, rate){
    return new Promise((res, rej) => {
      const ss = window.speechSynthesis; if (!ss) return rej(new Error('nosynth'));
      const vs = ss.getVoices();
      const v = vs.find(v => /zh[-_]CN/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)) || vs.find(v => /cmn/i.test(v.lang));
      if (!v && vs.length) return rej(new Error('novoice'));
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN'; if (v) u.voice = v; u.rate = rate < 1 ? .55 : .85; u.volume = prefs.mute ? 0 : prefs.voice/100;
      u.onend = () => res(); u.onerror = e => rej(e);
      ss.cancel(); ss.speak(u); setTimeout(res, 4500);
    });
  }
  let busy = Promise.resolve();
  async function say(id, slow=false){
    const s = SOUNDS[id]; if (!s) return;
    ensure(); setDuck(.12);
    const rate = slow ? (D.audio.slowRate || .7) : 1;
    const blockedErr = () => { lastSource = 'blocked'; const e = new Error('blocked'); e.kind = 'blocked'; return e; };
    try {
      if (D.audio.useLocalFiles && !bad[id]){
        try { await playUrl(s.file, rate); lastSource = 'file'; return; }
        catch(e){ if (e.kind === 'blocked') throw blockedErr(); if (e.kind === 'load') bad[id] = true; }
      }
      if (D.audio.useOnlineVoice && D.audio.onlineVoiceUrl && !bad.online){
        try { await playUrl(D.audio.onlineVoiceUrl + encodeURIComponent(s.text), rate); lastSource = 'online'; return; }
        catch(e){ if (e.kind === 'blocked') throw blockedErr(); if (e.kind === 'load') bad.online = true; }
      }
      await synth(s.text, rate); lastSource = 'device';
    } catch(e){ if (e.kind !== 'blocked') lastSource = 'fail'; throw e; }
    finally { setTimeout(() => setDuck(1), 250); }
  }
  const sayQ = (id, slow) => (busy = busy.catch(() => {}).then(() => say(id, slow)));
  async function saySeq(ids, slow, gap=420){ for (const id of ids){ await sayQ(id, slow); await new Promise(r => setTimeout(r, gap)); } }
  const retry = () => Object.keys(bad).forEach(k => delete bad[k]);
  if (window.speechSynthesis) window.speechSynthesis.getVoices();
  return { ensure, unlock, apply, startBgm, sfx, say:sayQ, saySeq, retry, source:() => lastSource };
})();
const SOURCE_TEXT = {
  file:    ['녹음 파일로 재생 중', true],
  online:  ['임시 음성(온라인 자동 음성, 성조 검수 전)', false],
  device:  ['임시 음성(기기 내장 음성, 성조 검수 전)', false],
  blocked: ['휴대폰이 자동 재생을 막았어요. ▶ 듣기를 눌러 주세요.', false],
  fail:    ['소리를 재생하지 못했어요. 무음 모드와 음량을 확인하고 ↻ 다시를 눌러 주세요.', false]
};
function sourceBadge(){ const v = SOURCE_TEXT[Snd.source()]; if (!v) return '';
  return `<span class="badge-temp ${v[1] ? 'badge-ok' : ''}">${v[1] ? '✔' : '⚠'} ${v[0]}</span>`; }


/* ================= 작은 그림 ================= */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random()*a.length)];
const toneOf = id => SOUNDS[id] && SOUNDS[id].tone;
const wait = ms => new Promise(r => setTimeout(r, ms));

/* 동글동글 폭신한 판다 (SVG). hat: 고깔모자, bow: 리본, mood: happy / wow / sleepy */
let pid = 0;
function pandaSVG(o = {}){
  const u = 'pd' + (++pid), k = `url(#${u}k)`, w = `url(#${u}w)`;
  const mouth = o.mood === 'wow' ? `<ellipse cx="60" cy="70.5" rx="4.2" ry="5" fill="#d9586f"/><ellipse cx="60" cy="72.5" rx="2.6" ry="2.2" fill="#ff9aa9"/>`
    : `<path d="M53.5 67.5q3.2 4.2 6.5 0q3.3 4.2 6.5 0" stroke="#2a2c30" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const eye = (x, d) => o.mood === 'sleepy'
    ? `<path d="M${x - 5} ${51} q5 4 10 0" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    : `<circle cx="${x}" cy="51" r="6.3" fill="#141518"/><circle cx="${x + 2.2*d}" cy="48.4" r="2.6" fill="#fff"/><circle cx="${x - 1.8*d}" cy="54.2" r="1.2" fill="#fff"/>`;
  const hat = o.hat ? `<g transform="rotate(-16 44 6)"><path d="M30 14 L44 -15 L58 14 Z" fill="#ff86ad"/><path d="M36 2 L52 2 M33 9 L55 9" stroke="#fff3a6" stroke-width="3.2"/><circle cx="44" cy="-15" r="5" fill="#ffd54f"/><ellipse cx="44" cy="14" rx="15" ry="3.4" fill="#ff6f9b"/></g>` : '';
  const bow = o.bow ? `<g transform="translate(92 31) rotate(18)"><path d="M0 0 L-13 -8 Q-16 0 -13 8 Z" fill="${o.bowColor || '#ff7aa5'}"/><path d="M0 0 L13 -8 Q16 0 13 8 Z" fill="${o.bowColor || '#ff7aa5'}"/><circle r="4" fill="#ff4f86"/></g>` : '';
  return `<svg class="panda" viewBox="0 -18 120 142" aria-hidden="true">
    <defs>
      <radialGradient id="${u}w" cx="42%" cy="32%" r="72%"><stop offset="0" stop-color="#ffffff"/><stop offset=".72" stop-color="#f7f5f2"/><stop offset="1" stop-color="#e2ddd8"/></radialGradient>
      <radialGradient id="${u}k" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#55585e"/><stop offset="1" stop-color="#1d1f23"/></radialGradient>
      <filter id="${u}f" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.8"/></filter>
    </defs>
    <ellipse cx="60" cy="119" rx="31" ry="4.5" fill="rgba(0,0,0,.13)"/>
    <g filter="url(#${u}f)">
      <ellipse cx="41" cy="110" rx="12.5" ry="9.5" fill="${k}"/><ellipse cx="79" cy="110" rx="12.5" ry="9.5" fill="${k}"/>
      <ellipse cx="60" cy="90" rx="32" ry="27.5" fill="${w}"/>
      <ellipse cx="31" cy="87" rx="10.5" ry="13.5" transform="rotate(28 31 87)" fill="${k}"/><ellipse cx="89" cy="87" rx="10.5" ry="13.5" transform="rotate(-28 89 87)" fill="${k}"/>
      <circle cx="26" cy="19" r="13.5" fill="${k}"/><circle cx="94" cy="19" r="13.5" fill="${k}"/>
      <ellipse cx="60" cy="50" rx="43" ry="37.5" fill="${w}"/>
    </g>
    <circle cx="27" cy="20.5" r="6" fill="#f2a9b8" opacity=".5"/><circle cx="93" cy="20.5" r="6" fill="#f2a9b8" opacity=".5"/>
    <ellipse cx="41" cy="52" rx="11.5" ry="14" transform="rotate(-30 41 52)" fill="#26282c"/><ellipse cx="79" cy="52" rx="11.5" ry="14" transform="rotate(30 79 52)" fill="#26282c"/>
    ${eye(42, 1)}${eye(78, 1)}
    <ellipse cx="31" cy="66" rx="7.5" ry="4.6" fill="#ff98ab" opacity=".62"/><ellipse cx="89" cy="66" rx="7.5" ry="4.6" fill="#ff98ab" opacity=".62"/>
    <ellipse cx="60" cy="61.5" rx="5" ry="3.6" fill="#26282c"/><ellipse cx="58.6" cy="60.4" rx="1.6" ry="1" fill="#8b8f96"/>
    ${mouth}
    <ellipse cx="60" cy="95" rx="18" ry="14" fill="#fff" opacity=".75"/>
    <ellipse cx="37" cy="111" rx="3" ry="2.4" fill="#f2a9b8" opacity=".55"/><ellipse cx="83" cy="111" rx="3" ry="2.4" fill="#f2a9b8" opacity=".55"/>
    ${hat}${bow}
  </svg>`;
}
/* 방마다 소품을 든 판다 */
const roomPanda = (z, o = {}) => `<div class="rpanda">${pandaSVG(o)}<span class="acc">${z.icon}</span></div>`;
function chestSVG(open){
  return `<svg class="chest ${open ? 'open' : ''}" viewBox="0 0 120 100" aria-hidden="true">
    <ellipse cx="60" cy="94" rx="48" ry="5" fill="rgba(0,0,0,.15)"/>
    ${open ? `<g class="glow">${[0,1,2,3,4,5,6].map(i => `<path d="M60 52 L${60 + Math.cos((i/6)*Math.PI + Math.PI)*60} ${52 + Math.sin((i/6)*Math.PI + Math.PI)*60}" stroke="#ffe27a" stroke-width="6" stroke-linecap="round" opacity=".7"/>`).join('')}</g>` : ''}
    <rect x="14" y="48" width="92" height="44" rx="8" fill="#b9733a"/><rect x="14" y="48" width="92" height="9" fill="#9b5a2a"/>
    <rect x="22" y="48" width="9" height="44" fill="#e3ad1f"/><rect x="89" y="48" width="9" height="44" fill="#e3ad1f"/>
    ${open ? `<path d="M14 48 L24 14 H96 L106 48 Z" fill="#8a4f24"/><circle cx="46" cy="44" r="6" fill="#ffd54f"/><circle cx="62" cy="40" r="7" fill="#fff3a6"/><circle cx="76" cy="45" r="5" fill="#ffd54f"/>`
      : `<path d="M14 50 Q14 18 60 18 Q106 18 106 50 Z" fill="#c98446"/><rect x="22" y="22" width="9" height="28" fill="#e3ad1f"/><rect x="89" y="22" width="9" height="28" fill="#e3ad1f"/>`}
    <rect x="50" y="${open ? 50 : 42}" width="20" height="18" rx="4" fill="#e3ad1f"/><circle cx="60" cy="${open ? 58 : 50}" r="3.4" fill="#6b3d17"/>
  </svg>`;
}
function contourSVG(tone, cls='contour', color='#25845f'){
  const X = x => 10 + x*80, Y = l => 52 - (l-1)*10;
  const d = { 1:`M${X(0)} ${Y(5)} L${X(1)} ${Y(5)}`, 2:`M${X(0)} ${Y(3)} L${X(1)} ${Y(5)}`,
              3:`M${X(0)} ${Y(2)} Q${X(.35)} ${Y(.2)} ${X(.5)} ${Y(1.1)} T${X(1)} ${Y(4)}`, 4:`M${X(0)} ${Y(5)} L${X(1)} ${Y(1)}` }[tone];
  const grid = [1,2,3,4,5].map(l => `<line x1="6" x2="94" y1="${Y(l)}" y2="${Y(l)}" stroke="#dbe6d6" stroke-width="1"/>`).join('');
  return `<svg class="${cls}" viewBox="0 0 100 60" aria-hidden="true">${grid}<path d="${d}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function flagSVG(code, cls='flag'){
  const box = inner => `<svg class="${cls}" viewBox="0 0 60 40" role="img" aria-label="${{KR:'한국',CN:'중국',US:'미국',JP:'일본'}[code] || ''} 국기"><rect width="60" height="40" rx="3" fill="#fff" stroke="#c9d3c5"/>${inner}</svg>`;
  if (code === 'JP') return box('<circle cx="30" cy="20" r="9.5" fill="#bc002d"/>');
  if (code === 'CN') return box('<rect width="60" height="40" rx="3" fill="#de2910"/><polygon fill="#ffde00" points="10,5 11.8,10.5 17.5,10.5 12.9,13.9 14.6,19.4 10,16 5.4,19.4 7.1,13.9 2.5,10.5 8.2,10.5"/>'
    + [[20,4],[24,8],[24,14],[20,18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#ffde00"/>`).join(''));
  if (code === 'US'){ let st = ''; for (let i = 0; i < 13; i += 2) st += `<rect y="${i*40/13}" width="60" height="${40/13}" fill="#b22234"/>`;
    let dots = ''; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) dots += `<circle cx="${3 + c*4.6}" cy="${3 + r*4.6}" r=".9" fill="#fff"/>`;
    return box(st + `<rect width="25" height="21.5" fill="#3c3b6e"/>${dots}`); }
  if (code === 'KR'){
    const bars = (x, y, a, pat) => `<g transform="translate(${x} ${y}) rotate(${a})">${pat.map((b, i) => b ? `<rect x="-5" y="${-4 + i*3}" width="10" height="2" fill="#000"/>` : `<rect x="-5" y="${-4 + i*3}" width="4.3" height="2" fill="#000"/><rect x=".7" y="${-4 + i*3}" width="4.3" height="2" fill="#000"/>`).join('')}</g>`;
    return box(`<g transform="rotate(33.7 30 20)"><circle cx="30" cy="20" r="9" fill="#0047a0"/><path d="M21 20a9 9 0 0 1 18 0a4.5 4.5 0 0 1-9 0a4.5 4.5 0 0 0-9 0z" fill="#cd2e3a"/></g>`
      + bars(11, 8, -56.3, [1,1,1]) + bars(49, 32, -56.3, [0,0,0]) + bars(49, 8, 56.3, [1,0,1]) + bars(11, 32, 56.3, [0,1,0]));
  }
  return '';
}
const handImg = (n, cls='hand') => `<img class="${cls}" src="${HAND(n)}" alt="손숫자" draggable="false">`;

/* ================= 화면 번쩍 · 알림 ================= */
function flash(kind='win'){ const el = $('#flash'); el.className = ''; void el.offsetWidth; el.className = kind; }
let toastTimer;
function toast(txt, ms=2400){ const el = $('#toast'); el.textContent = txt; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, ms); }
function confetti(n = 40){
  const box = $('#confetti'); if (!box) return;
  for (let i = 0; i < n; i++){ const c = document.createElement('i');
    c.style.left = Math.random()*100 + '%'; c.style.background = pick(['#ff7aa5', '#ffd54f', '#7ec8e3', '#9ccc6e', '#b79cff']);
    c.style.animationDelay = (Math.random()*.5) + 's'; c.style.setProperty('--r', (Math.random()*720 - 360) + 'deg'); c.style.setProperty('--x', (Math.random()*80 - 40) + 'px');
    box.appendChild(c); setTimeout(() => c.remove(), 2600); }
}
function floatPts(txt, el){
  const host = $('#stage'); if (!host) return;
  const hr = host.getBoundingClientRect(), r = el ? el.getBoundingClientRect() : { left: hr.left + hr.width/2, width: 0, top: hr.top + hr.height/2 };
  const p = document.createElement('div'); p.className = 'floatpts'; p.textContent = txt;
  p.style.left = (r.left - hr.left + r.width/2) + 'px'; p.style.top = (r.top - hr.top) + 'px';
  host.appendChild(p); setTimeout(() => p.remove(), 1400);
}
function addStar(n, ico, el){ S.starPts += n; persist(true); renderHud(); floatPts(`${ico || '⭐'} +${n}`, el); Snd.sfx.star(); }

/* ================= 복도: 다섯 개의 문 ================= */
let curRoom = null;   // 지금 들어가 있는 방 번호 (복도면 null)
function renderHall(){
  curRoom = null; S.room = null; persist();
  $('#toast').hidden = true;
  $('#room').hidden = true; $('#hall').hidden = false;
  const keys = roomsCleared(), all = keys === ROOMS.length;
  $('#hall').innerHTML = `<div class="hallIn">
    <button class="tdoor ${all ? 'ready' : ''}" type="button" id="treasureDoor">
      <span class="tchest">${chestSVG(false)}</span>
      <span class="ttext"><b>${esc(D.treasure.title)}</b><small>${all ? '열쇠가 다 모였어요! 눌러서 열어요' : esc(D.treasure.locked)}</small></span>
      <span class="tkeys">${ROOMS.map(z => `<i class="${S.rooms[z.id] && S.rooms[z.id].cleared ? 'on' : ''}" title="${esc(z.name)}">🔑</i>`).join('')}</span>
    </button>
    <div class="doors">${ROOMS.map((z, zi) => {
      const n = z.missions.filter(m => S.results[m.id].done).length, cl = S.rooms[z.id] && S.rooms[z.id].cleared;
      return `<button class="door ${cl ? 'cleared' : n ? 'started' : ''}" type="button" data-room="${zi}" style="--dc:${z.door}">
        <span class="arch"><span class="plaque">${z.icon}</span></span>
        <span class="dname">${esc(z.name)}</span><span class="dles">${esc(z.lessons)}</span>
        <span class="dprog">${z.missions.map(m => `<i class="${S.results[m.id].done ? 'on' : ''}"></i>`).join('')}</span>
        <span class="knob"></span>
        ${cl ? '<span class="stamp">🔑 클리어!</span>' : ''}
      </button>`; }).join('')}</div>
    <div class="hallguide">${pandaSVG({ mood: all ? 'wow' : 'happy' })}<div class="bubble"><p>${all ? '열쇠 다섯 개를 다 모았어! 위의 보물의 문으로 가자!' : keys ? `열쇠 ${keys}개! 다음은 어느 방으로 갈까?` : '어느 방부터 갈까? 문을 눌러 들어가 봐!'}</p></div></div>
  </div>`;
  $('#hall').querySelectorAll('.door').forEach(b => b.onclick = () => openDoor(+b.dataset.room, b));
  $('#treasureDoor').onclick = () => { if (roomsCleared() === ROOMS.length) openTreasure(); else { Snd.sfx.wrong(); toast(`🔑 열쇠 ${roomsCleared()} / ${ROOMS.length} · 다섯 방을 모두 클리어하면 열려요.`); } };
  renderHud();
}
async function openDoor(zi, el){
  if (busy) return; busy = true;
  Snd.ensure(); Snd.startBgm(); Snd.sfx.door();
  if (el) el.classList.add('opening');
  await wait(520);
  busy = false;
  enterRoom(zi);
}

/* ================= 방 안 ================= */
let busy = false;
function enterRoom(zi){
  const z = ROOMS[zi]; curRoom = zi; S.room = z.id;
  if (!S.order.includes(z.id)) S.order.push(z.id);
  persist();
  $('#hall').hidden = true; $('#room').hidden = false;
  renderRoom(true);
}
function renderRoom(greet){
  const z = ROOMS[curRoom], solved = z.missions.filter(m => S.results[m.id].done).length, done = solved === z.missions.length;
  const cleared = S.rooms[z.id] && S.rooms[z.id].cleared;
  const spot = (o, cls, attr, label) => `<button class="obj ${cls}" type="button" ${attr} style="left:${o.x}%;top:${o.y}%;--s:${o.s || 1}" aria-label="${esc(label)}"><span class="oe">${o.e}</span></button>`;
  $('#room').innerHTML = `
    <div class="roombar" style="--dc:${z.door}">
      <button class="btn backbtn" type="button" id="backHall">← 복도</button>
      <div class="rtitle"><b>${z.icon} ${esc(z.name)}</b><small>${esc(z.lessons)} 복습</small></div>
      <div class="rprog">${z.missions.map(m => `<i class="${S.results[m.id].done ? 'on' : ''}">${S.results[m.id].done ? '✔' : '?'}</i>`).join('')}</div>
    </div>
    <div class="scene3" style="--wall:${z.wall};--floor:${z.floor};--dc:${z.door}">
      <div class="wall"></div><div class="floor"></div>
      ${(z.deco || []).map(o => `<span class="deco2" style="left:${o.x}%;top:${o.y}%;--s:${o.s || 1}">${o.e}</span>`).join('')}
      ${(z.bonus || []).map(b => spot(b, `bonus ${S.used.includes(b.id) ? 'used' : ''}`, `data-bonus="${b.id}"`, b.title)).join('')}
      ${z.missions.map(m => spot(m.spot, `quest ${S.results[m.id].done ? 'done' : ''}`, `data-m="${m.id}"`, m.place)).join('')}
      ${done ? `<button class="chestbtn ${cleared ? 'opened' : ''}" type="button" id="chestBtn" aria-label="보물 상자">${chestSVG(cleared)}</button>` : ''}
    </div>
    <div class="hostbar">${roomPanda(z, { mood: done ? 'wow' : 'happy' })}<div class="bubble"><b>${esc(z.host)}</b><p id="hostLine">${
      cleared ? '이 방은 클리어! 🔑 열쇠를 얻었어. 복도로 나가서 다른 방에 가 보자!'
      : done ? '문제를 다 풀었어! 가운데 보물 상자를 눌러 열어 봐!'
      : solved ? `반짝이는 물건이 ${z.missions.length - solved}개 남았어! ✨ 작은 반짝이도 눌러 봐.`
      : esc(z.hello) + ' 반짝이는 <b>?</b> 물건을 눌러 봐!'}</p></div>
      ${cleared ? '<button class="btn primary" type="button" id="outBtn">복도로 나가기</button>' : ''}</div>`;
  $('#backHall').onclick = () => { Snd.sfx.blip(); renderHall(); };
  if ($('#outBtn')) $('#outBtn').onclick = () => { Snd.sfx.blip(); renderHall(); };
  $('#room').querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    const m = MISSIONS.find(x => x.id === b.dataset.m);
    if (S.results[m.id].done){ toast(`✔ ${m.place} · 이미 풀었어요!`); return; }
    openQuiz(m);
  });
  $('#room').querySelectorAll('[data-bonus]').forEach(b => b.onclick = () => openBonus(z.bonus.find(x => x.id === b.dataset.bonus), b));
  if ($('#chestBtn')) $('#chestBtn').onclick = openChest;
  renderHud();
}
async function openBonus(b, el){
  if (busy) return;
  const first = !S.used.includes(b.id);
  if (b.type === 'hand'){
    if (!first){ toast('🖐️ 이미 도전한 손숫자 퀴즈예요.'); return; }
    S.used.push(b.id); persist(); busy = true; await handTile(); busy = false; renderRoom(); return;
  }
  busy = true;
  await eventCard(b.e, b.title, esc(b.text) + (first ? `<br>별 <b>+${D.points.bonus}</b>` : ''), b.sound);
  busy = false;
  if (first){ S.used.push(b.id); addStar(D.points.bonus, '✨', el); renderRoom(); }
}
function eventCard(ico, title, html, sound){
  return new Promise(res => {
    const sounds = sound ? [].concat(sound) : [];
    $('#evt').innerHTML = `<div class="card evtcard"><div class="evtico">${ico}</div><h2>${esc(title)}</h2><p>${html}</p>
      <div class="row center">${sounds.length ? `<button class="btn" type="button" id="evtSay">▶ 듣기</button>` : ''}<button class="btn primary" type="button" id="evtOk">좋아!</button></div></div>`;
    $('#evt').hidden = false; Snd.sfx.bonus();
    const say = () => Snd.saySeq(sounds, false, 450).then(updateSrc).catch(() => {});
    if (sounds.length){ $('#evtSay').onclick = say; setTimeout(say, 300); }
    $('#evtOk').onclick = () => { $('#evt').hidden = true; res(); };
  });
}
/* 🖐️ 손숫자 퀴즈: 한 번에 맞히면 별 */
function handTile(){
  return new Promise(res => {
    const v = pick([0, 6, 7, 8, 9, 10]), opts = shuffle([v, ...shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => x !== v)).slice(0, 2)]);
    S.hand = (S.hand || 0) + 1; persist();
    $('#evt').innerHTML = `<div class="card evtcard"><div class="evtico">🖐️</div><h2>손숫자 퀴즈!</h2>
      <div class="handbig">${handImg(v)}</div><p>이 손은 몇일까요? 한 번에 맞히면 별 <b>+${D.points.hand}</b></p>
      <div class="numpick wide">${opts.map(n => `<button type="button" class="np" data-n="${n}"><b>${n}</b><small>${SOUNDS[NUM_ID(n)].text}</small></button>`).join('')}</div>
      <p class="feedback" id="handFb"></p></div>`;
    $('#evt').hidden = false; Snd.sfx.bonus();
    let doneOnce = false;
    $('#evt').querySelectorAll('.np').forEach(b => b.onclick = async () => {
      if (doneOnce) return; doneOnce = true;
      const n = +b.dataset.n, ok = n === v, s = SOUNDS[NUM_ID(v)];
      if (ok){ b.classList.add('right'); S.handOk = (S.handOk || 0) + 1; }
      else { b.classList.add('wrong'); $('#evt').querySelector(`.np[data-n="${v}"]`).classList.add('right'); Snd.sfx.wrong(); }
      $('#handFb').className = 'feedback ' + (ok ? 'good' : 'bad');
      $('#handFb').innerHTML = ok ? `정답! <span class="zhl">${s.text}</span> ${esc(s.pinyin)}` : `아쉬워요! 정답은 ${v} <span class="zhl">${s.text}</span> ${esc(s.pinyin)}`;
      Snd.say(NUM_ID(v)).then(updateSrc).catch(() => {});
      persist();
      await wait(ok ? 1300 : 2000);
      $('#evt').hidden = true; if (ok) addStar(D.points.hand, '🖐️'); res();
    });
  });
}
async function openChest(){
  const z = ROOMS[curRoom];
  if (S.rooms[z.id] && S.rooms[z.id].cleared){ toast('🔑 이 방 열쇠는 이미 받았어요!'); return; }
  if (busy) return; busy = true;
  const perfect = z.missions.every(m => S.results[m.id].firstCorrect === true);
  const pts = perfect ? D.points.chestPerfect : D.points.chest;
  S.rooms[z.id] = { cleared: true, at: Date.now(), perfect };
  const btn = $('#chestBtn'); btn.innerHTML = chestSVG(true); btn.classList.add('opened', 'popopen');
  Snd.sfx.fanfare(); confetti(40); flash('win');
  S.starPts += pts; persist(true); renderHud();
  await wait(900);
  const left = ROOMS.length - roomsCleared();
  await eventCard('🔑', `${z.name} 열쇠 획득!`,
    `${perfect ? `모든 문제를 한 번에 맞혔어요! <b>완벽 보너스</b> 별 +${pts}` : `방 클리어 별 +${pts}`}<br>${left ? `남은 열쇠 <b>${left}</b>개! 복도에서 다른 문을 골라요.` : '열쇠 다섯 개를 모두 모았어요! <b>보물의 문</b>으로 가요!'}`);
  busy = false;
  renderHall();
}

/* ================= 퀴즈 ================= */
let quizOpen = false, Q = null;
function picCard(id, big){ const s = SOUNDS[id]; return `<div class="wordpic ${big ? 'big' : ''}">${s.flag ? flagSVG(s.flag) : ''}<span class="emo">${s.pic || ''}</span><span class="zh">${esc(s.text)}</span></div>`; }
function openQuiz(m){
  const rec = S.results[m.id];
  Q = { m, rec, locked:false, sel:null, build:[], code:[], placed:{} };
  switch (m.type){
    case 'numberCode':
      if (rec.target == null){ rec.target = Math.floor(Math.random()*m.sets.length); persist(); }
      Q.seq = m.sets[rec.target]; Q.answer = Q.seq.map(toneOf).join('-'); break;
    case 'digitCode':
      if (rec.target == null){ rec.target = Math.floor(Math.random()*m.sets.length); persist(); }
      if (m.hands){ Q.hands = m.sets[rec.target]; Q.len = Q.hands.length; Q.answer = Q.hands.join('-'); }
      else { Q.seq = m.sets[rec.target]; Q.len = Q.seq.length; Q.answer = Q.seq.map(id => SOUNDS[id].num).join('-'); }
      break;
    case 'hearPick': Q.answer = m.answer || m.sound; Q.main = m.sound; Q.opts = shuffle(m.options); break;
    case 'choiceText': Q.opts = m.keepOrder || /성$/.test(m.options[0].text) ? m.options.map((o, i) => ({ ...o, i })) : shuffle(m.options.map((o, i) => ({ ...o, i }))); Q.answer = String(m.options.findIndex(o => o.correct)); Q.main = m.sound; break;
    case 'wordOrder': Q.answer = m.tiles.join('|'); Q.opts = shuffle([...m.tiles, ...(m.extra || [])]); Q.main = m.sound; Q.build = []; break;
    case 'matchScenes': Q.opts = shuffle(m.pairs.map(p => p.sound)); Q.scenes = shuffle(m.pairs); break;
  }
  quizOpen = true;
  renderQuiz(); $('#quiz').hidden = false;
  Snd.ensure(); Snd.startBgm();
  setTimeout(() => { if (quizOpen && Q && Q.m === m && (Q.main || Q.seq)) playMain(false); }, 380);
}
function playMain(slow){
  const p = Q.seq ? Snd.saySeq(Q.seq, slow, 560) : Snd.say(Q.main, slow);
  return p.then(updateSrc).catch(showPlayError);
}
function updateSrc(){ const el = $('#srcnote'); if (el) el.innerHTML = sourceBadge(); const qp = $('#qplay'); if (qp && Snd.source() !== 'blocked') qp.classList.remove('pulse'); }
function showPlayError(){ const el = $('#srcnote'); if (el) el.innerHTML = sourceBadge(); const qp = $('#qplay'); if (qp) qp.classList.add('pulse'); }
function renderQuiz(){
  const { m } = Q, box = $('#qbox'), z = ROOMS[m.zone], k = z.missions.findIndex(x => x.id === m.id);
  let h = `<div class="stars" id="stars"></div>
    <div class="qhead"><span class="place">${m.spot ? m.spot.e + ' ' : ''}${esc(m.place)}</span><span class="count">${z.icon} ${esc(z.name)} · ${k + 1} / ${z.missions.length}</span>
    <button class="qclose" id="qclose" type="button" aria-label="닫기">✕</button></div>`;
  h += `<div class="qtext">${esc(m.question)}</div>`;
  const listen = `<div class="listen"><button class="btn play" type="button" id="qplay">▶ 듣기</button>
    <button class="btn" type="button" id="qslow">🐢 천천히</button><button class="btn" type="button" id="qretry">↻ 다시</button></div>
    <div class="srcnote" id="srcnote">${sourceBadge()}</div>`;
  const src = `<div class="srcnote" id="srcnote">${sourceBadge()}</div>`;
  if (m.scene && m.type !== 'choiceText') h += `<div class="scene">${esc(m.scene)}</div>`;
  switch (m.type){
    case 'numberCode':
      h += listen + `<div class="codeSlots" id="codeSlots">${Q.seq.map((_, i) => `<span class="slotN" data-i="${i}">?</span>`).join('')}</div>
        <div class="keypad">${[1,2,3,4].map(k => `<button class="key" type="button" data-key="${k}"><b>${k}</b>${contourSVG(k, 'mini')}</button>`).join('')}</div>
        <div class="row center"><button class="btn ghost" type="button" id="codeClear">지우기</button></div>`; break;
    case 'digitCode':
      if (Q.hands) h += `<div class="handrow">${Q.hands.map((d, i) => `<div><span class="hn">${i + 1}</span>${handImg(d)}</div>`).join('')}</div>`;
      else h += listen;
      h += `<div class="codeSlots" id="codeSlots">${Array.from({ length: Q.len }, (_, i) => `<span class="slotN" data-i="${i}">?</span>`).join('')}</div>
        <div class="keypad ten">${[1,2,3,4,5,6,7,8,9,0].map(k => `<button class="key" type="button" data-key="${k}"><b>${k}</b><small>${SOUNDS[NUM_ID(k)].text}</small></button>`).join('')}</div>
        <div class="row center"><button class="btn ghost" type="button" id="codeClear">지우기</button></div>`; break;
    case 'hearPick':
      h += listen + `<div class="choices c${Q.opts.length}">${Q.opts.map(id => `<button class="opt word" type="button" data-v="${id}">${picCard(id)}<span class="py">${esc(SOUNDS[id].pinyin)}</span></button>`).join('')}</div>`; break;
    case 'choiceText':
      if (m.scene) h += `<div class="scene">${esc(m.scene)}</div>`;
      h += (Q.main ? listen : src) + `<div class="choices ${Q.opts.length === 3 ? 'c3' : Q.opts.length === 4 && !Q.opts[0].sub ? 'c4' : 'c2'} textopts">${Q.opts.map(o => `<div class="topt" data-wrap="${o.i}">
          <button class="opt" type="button" data-v="${o.i}"><span class="lbl ${/[一-鿿]/.test(o.text) ? 'zhl' : 'big'}">${esc(o.text)}</span>${o.sub ? `<span class="sub py">${esc(o.sub)}</span>` : ''}</button>
          ${o.sound ? `<button class="mini-listen" type="button" data-say="${o.sound}" aria-label="${esc(o.text)} 듣기">▶ 듣기</button>` : ''}</div>`).join('')}</div>`; break;
    case 'wordOrder':
      h += listen + `<div class="sentence" id="sentence">${m.tiles.map((_, i) => `<span class="wslot" data-i="${i}">　</span>`).join('')}<span class="wend">${esc(m.ending || '')}</span></div>
        <div class="tiles">${Q.opts.map((t, i) => `<button class="tile" type="button" data-tile="${esc(t)}" data-ti="${i}"><span class="zhl">${esc(t)}</span></button>`).join('')}</div>
        <div class="row center"><button class="btn ghost" type="button" id="wordClear">다시 놓기</button></div>`; break;
    case 'matchScenes':
      h += src + `<div class="phrases">${Q.opts.map(id => `<button class="phrase" type="button" data-phrase="${id}"><span class="zhl">${esc(SOUNDS[id].text)}</span><span class="py">${esc(SOUNDS[id].pinyin)}</span><span class="spk">▶</span></button>`).join('')}</div>
        <div class="scenecards">${Q.scenes.map(p => `<button class="scenecard" type="button" data-scene="${p.sound}"><span class="emo">${p.flag ? flagSVG(p.flag, 'flag big') : esc(p.scene)}</span><span class="lab">${esc(p.label)}</span><span class="put" id="put-${p.sound}"></span></button>`).join('')}</div>
        <p class="note center">① 위의 말을 눌러 들어요 → ② 어울리는 그림을 눌러요</p>`; break;
  }
  h += `<div class="feedback" id="feedback" aria-live="polite"></div><div id="hintArea"></div>`;
  box.innerHTML = h;
  $('#qclose').onclick = () => closeQuiz();
  const qp = $('#qplay');
  if (qp){ qp.onclick = () => playMain(false); $('#qslow').onclick = () => playMain(true); $('#qretry').onclick = () => { Snd.retry(); playMain(false); }; }
  box.querySelectorAll('.opt[data-v]').forEach(b => b.onclick = () => {
    const ok = String(b.dataset.v) === String(Q.answer);
    const val = m.type === 'choiceText' ? m.options[+b.dataset.v].text : (SOUNDS[b.dataset.v] ? SOUNDS[b.dataset.v].text : b.dataset.v);
    submit(val, ok, b);
  });
  box.querySelectorAll('[data-say]').forEach(b => b.onclick = () => Snd.say(b.dataset.say).then(updateSrc).catch(showPlayError));
  if (m.type === 'numberCode' || m.type === 'digitCode'){
    const len = Q.len || Q.seq.length;
    const paint = () => box.querySelectorAll('.slotN').forEach((s, i) => { s.textContent = Q.code[i] ?? '?'; s.classList.toggle('on', Q.code[i] != null); });
    box.querySelectorAll('[data-key]').forEach(b => b.onclick = () => {
      if (Q.locked || Q.code.length >= len) return;
      Q.code.push(b.dataset.key); Snd.sfx.blip(); paint();
      if (Q.code.length === len){ const v = Q.code.join('-'); const ok = v === Q.answer;
        submit(v, ok, $('#codeSlots'), { keepEl:true }); if (!ok) setTimeout(() => { if (Q){ Q.code = []; paint(); } }, 700); }
    });
    $('#codeClear').onclick = () => { if (!Q.locked){ Q.code = []; paint(); } };
  }
  if (m.type === 'wordOrder'){
    const paint = () => { box.querySelectorAll('.wslot').forEach((sl, i) => { sl.textContent = Q.build[i] ? Q.build[i].t : '　'; sl.classList.toggle('on', !!Q.build[i]); });
      box.querySelectorAll('.tile').forEach(b => b.disabled = Q.build.some(x => x.i === b.dataset.ti)); };
    box.querySelectorAll('.tile').forEach(b => b.onclick = () => {
      if (Q.locked || Q.build.length >= m.tiles.length) return;
      Q.build.push({ t: b.dataset.tile, i: b.dataset.ti }); Snd.sfx.place(); paint();
      if (Q.build.length === m.tiles.length){
        const v = Q.build.map(x => x.t).join('|'), ok = v === Q.answer;
        submit(Q.build.map(x => x.t).join(' '), ok, $('#sentence'), { keepEl:true });
        if (ok){ $('#sentence').classList.add('done'); }
        else { $('#sentence').classList.add('shake'); setTimeout(() => { if (!Q) return; $('#sentence').classList.remove('shake'); Q.build = []; paint(); }, 800); }
      }
    });
    $('#wordClear').onclick = () => { if (!Q.locked){ Q.build = []; paint(); } };
  }
  if (m.type === 'matchScenes'){
    box.querySelectorAll('[data-phrase]').forEach(b => b.onclick = () => {
      if (Q.locked || b.classList.contains('done')) return;
      Snd.say(b.dataset.phrase).then(updateSrc).catch(showPlayError);
      box.querySelectorAll('.phrase').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); Q.sel = b;
    });
    box.querySelectorAll('[data-scene]').forEach(sc => sc.onclick = () => {
      if (Q.locked || sc.classList.contains('done')) return;
      if (!Q.sel){ toast('먼저 위의 말을 눌러 들어요.'); return; }
      const id = Q.sel.dataset.phrase, ok = id === sc.dataset.scene;
      if (ok){
        Snd.sfx.place(); Q.sel.classList.remove('sel'); Q.sel.classList.add('done'); sc.classList.add('done');
        $('#put-' + id).innerHTML = `<span class="zhl">${esc(SOUNDS[id].text)}</span>`; Q.placed[id] = true; Q.sel = null;
        if (Object.keys(Q.placed).length === m.pairs.length) submit('모두 맞게 놓음', true, sc, { keepEl:true });
      } else {
        const lab = (m.pairs.find(p => p.sound === sc.dataset.scene) || {}).label || '';
        submit(`${SOUNDS[id].text}→${lab}`, false, sc, { keepEl:true }); sc.classList.add('shake'); setTimeout(() => sc.classList.remove('shake'), 500);
      }
    });
  }
}
function submit(v, correct, el, opt={}){
  if (!Q || Q.locked || !el) return;
  if (!opt.keepEl && el.classList.contains('wrong')) return;
  Snd.ensure();
  const { m, rec } = Q;
  if (!rec.done){
    rec.tries += 1;
    if (rec.first === null){ rec.first = String(v); rec.firstCorrect = correct; }
    if (!correct) rec.wrongs.push(String(v));
    persist();
  }
  if (correct){
    Q.locked = true; if (!opt.keepEl) el.classList.add('right');
    const pts = rec.wrongs.length === 0 ? D.points.firstTry : D.points.retry;
    if (!rec.done){ rec.points = pts; rec.done = true; rec.doneAt = Date.now(); S.learn += pts; persist(); }
    Snd.sfx.correct(); setTimeout(Snd.sfx.bell, 300);
    const fb = $('#feedback'); fb.className = 'feedback good'; fb.textContent = `정답! 학습 점수 +${pts}`;
    burst(pts);
    if (m.type === 'wordOrder' && m.sound) setTimeout(() => Snd.say(m.sound).catch(() => {}), 350);
    setTimeout(() => {
      closeQuiz(true); flash('win'); persist(true); renderHud();
      if (curRoom != null){ renderRoom(); const z = ROOMS[curRoom];
        if (roomDone(z)){ confetti(24); toast('🎁 보물 상자가 나타났어요! 눌러서 열어요.', 3000); }
        else toast('통과! ✨ 다른 반짝이는 물건을 찾아요.'); }
    }, 1600);
  } else {
    if (!opt.keepEl) el.classList.add('wrong');
    if (m.type === 'numberCode' || m.type === 'digitCode'){ el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 500); }
    Snd.sfx.wrong();
    const fb = $('#feedback'); fb.className = 'feedback bad'; fb.textContent = m.type === 'matchScenes' ? '어울리지 않아요! 다시 골라 봐요.' : '아깝다! 힌트를 보고 다시 해 봐요.';
    let hint = `<div class="hint"><span>💡</span><div><b>힌트</b> ${esc(m.hint)}`;
    if (m.type === 'numberCode' || m.toneHint) hint += `<div class="contour-ref">${[1,2,3,4].map(k => `<div>${contourSVG(k)}${k}성</div>`).join('')}</div>`;
    if (m.type === 'digitCode' && m.hands) hint += `<div class="handref">${[0, 6, 7, 8, 9].map(k => `<div>${handImg(k)}<b>${k}</b></div>`).join('')}</div>`;
    $('#hintArea').innerHTML = hint + '</div></div>';
  }
}
function burst(pts){
  const st = $('#stars'); if (!st) return;
  for (let i = 0; i < 18; i++){ const s = document.createElement('i'), a = Math.random()*Math.PI*2, r = 90 + Math.random()*120;
    s.style.left = '50%'; s.style.top = '45%'; s.style.setProperty('--dx', Math.cos(a)*r + 'px'); s.style.setProperty('--dy', Math.sin(a)*r + 'px'); st.appendChild(s); }
  if (pts > 0){ const p = document.createElement('div'); p.className = 'plus'; p.textContent = '+' + pts; st.appendChild(p); }
}
function closeQuiz(solved){
  if (Q && !Q.rec.done && solved !== true) toast('반짝이는 물건을 다시 누르면 이어서 풀 수 있어요.', 2600);
  $('#quiz').hidden = true; quizOpen = false; Q = null;
}
$('#quiz').addEventListener('click', e => { if (e.target.id === 'quiz' && Q && !Q.finale) closeQuiz(); });

/* ================= 보물의 문 (마지막) ================= */
async function openTreasure(){
  if (busy) return; busy = true;
  Snd.sfx.door();
  $('#qbox').innerHTML = `<div class="stars" id="stars"></div><h2 class="center">${esc(D.treasure.title)}</h2>
    <div class="tscene"><div class="tchestbig" id="tchest">${chestSVG(false)}</div>
      <div class="tkeys big" id="tkeysBig">${ROOMS.map(z => `<span class="tk" style="--dc:${z.door}"><i>🔑</i><small>${z.icon}</small></span>`).join('')}</div></div>
    <p class="center" id="tline">${esc(D.treasure.open)}</p>
    <div class="row center"><button class="btn primary" type="button" id="tOpen">🔑 열쇠 꽂기!</button></div>`;
  $('#quiz').hidden = false; quizOpen = true; Q = null;
  busy = false;
  $('#tOpen').onclick = async () => {
    $('#tOpen').disabled = true;
    const ks = document.querySelectorAll('#tkeysBig .tk');
    for (const k of ks){ k.classList.add('in'); Snd.sfx.place(); await wait(380); }
    Snd.sfx.fanfare(); confetti(70); flash('win'); burst(0);
    $('#tchest').innerHTML = chestSVG(true); $('#tchest').classList.add('popopen');
    await wait(900);
    $('#tkeysBig').outerHTML = `<div class="pandaparade">${ROOMS.map((z, i) => roomPanda(z, { mood: i % 2 ? 'wow' : 'happy', bow: i === 4 })).join('')}</div>`;
    $('#tline').innerHTML = esc(D.treasure.end);
    $('#tOpen').outerHTML = `<button class="btn primary reply" type="button" id="byeBig"><span class="zhl">再见！</span><small>zàijiàn · 다음에 또 만나요!</small></button>`;
    Snd.say('zaijian').catch(() => {});
    $('#byeBig').onclick = () => { Snd.say('zaijian').catch(() => {}); $('#quiz').hidden = true; quizOpen = false; finishGame(); };
  };
}

/* ================= 점수판 ================= */
function renderHud(){
  $('#learnScore').textContent = S.learn; $('#starScore').textContent = S.starPts;
  $('#zoneName').textContent = curRoom == null ? '저택 복도' : ROOMS[curRoom].name;
  $('#bells').innerHTML = ROOMS.map(z => `<i class="hk ${S.rooms[z.id] && S.rooms[z.id].cleared ? 'on' : ''}">🔑</i>`).join('');
  $('#total').textContent = `${doneCount()}/${QUESTION_COUNT}`;
  $('#who').textContent = `${S.name} #${S.tag}`;
}
const NET_TEXT = { online: ['on', '선생님께 연결됨'], connecting: ['wait', '연결 중…'], offline: ['wait', '인터넷이 끊겼어요. 다시 연결되면 자동으로 보내요'], error: ['bad', '연결 오류 (결과는 이 기기에 저장돼요)'], off: ['off', '이 기기에만 저장 중'] };
Net.onStatus(st => { const el = $('#netDot'); if (!el) return; const v = NET_TEXT[st] || NET_TEXT.off; el.className = 'netdot ' + v[0]; el.title = v[1]; el.setAttribute('aria-label', v[1]); });

/* ================= 반 순위표 ================= */
const SHOW_RANK = window.SHOW_RANKING !== false;
function rankRows(list){
  if (!list) return `<p class="note center">${Net.enabled ? '순위를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.' : '선생님이 온라인 저장을 켜면 반 친구들의 순위가 보여요.'}</p>
    ${S ? `<ol class="ranklist"><li class="me"><span class="rk">-</span><span class="nm">${esc(S.name)} #${esc(S.tag)} (나)</span><span class="sc">${S.learn + S.starPts}</span></li></ol>` : ''}`;
  if (!list.length) return '<p class="note center">아직 아무도 없어요. 첫 번째 탐험가가 되어 보세요!</p>';
  let rank = 0, prev = null;
  const uid = Net.uid();
  return `<ol class="ranklist">${list.map((r, i) => { if (r.total !== prev){ rank = i + 1; prev = r.total; }
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    return `<li class="${r.id === uid ? 'me' : ''}"><span class="rk">${medal}</span><span class="nm">${esc(r.name || '?')} #${esc(r.tag || '')}${r.id === uid ? ' (나)' : ''}${r.finished ? ' 💎' : ''}</span><span class="pr">❓${r.bells || 0}</span><span class="sc">${r.total || 0}</span></li>`; }).join('')}</ol>`;
}
let rankUnsub = null, endRankUnsub = null;
function openRanking(){
  $('#rankPanel').hidden = false;
  $('#rankList').innerHTML = '<p class="note center">불러오는 중…</p>';
  if (rankUnsub) rankUnsub();
  rankUnsub = Net.watchBoard(list => { $('#rankList').innerHTML = rankRows(list); });
}
function closeRanking(){ $('#rankPanel').hidden = true; if (rankUnsub){ rankUnsub(); rankUnsub = null; } }

/* ================= 화면 흐름 ================= */
function show(id){ ['#startScreen','#storyScreen','#play','#endScreen'].forEach(s => $(s).hidden = s !== id); }
const cleanName = v => v.replace(/[<>"'&]/g, '').trim().slice(0, 12);
function fixState(s){
  ALL.forEach(m => { if (!s.results[m.id]) s.results[m.id] = emptyRec(); });
  s.used = s.used || []; s.rooms = s.rooms || {}; s.order = s.order || [];
  return s;
}
function initStart(){
  $('#stageLabel').textContent = `중국어 탐험대 · ${D.stageLabel}`;
  $('#gameTitle').innerHTML = `${esc(D.title)}<small>${esc(D.subtitle)}</small>`;
  $('#heroArt').innerHTML = `<div class="minidoors">${ROOMS.map(z => `<span style="--dc:${z.door}">${z.icon}</span>`).join('')}</div>${pandaSVG({ mood:'wow' })}`;
  $('#zoneList').innerHTML = [...ROOMS.map(z => `${z.icon} ${z.name} (${z.lessons})`), `문제 ${QUESTION_COUNT}개`].map(t => `<span>${esc(t)}</span>`).join('');
  if (!SHOW_RANK) $('#rankBtn').hidden = true;
  const saved = store.load();
  if (saved && saved.name && saved.results){
    $('#resumeBox').hidden = false; $('#newBox').hidden = true;
    $('#resumeBtn').textContent = `이어서 하기 (${saved.name} #${saved.tag})`;
  }
  $('#resumeBtn').onclick = () => { Snd.ensure(); Snd.startBgm(); S = fixState(saved);
    Net.studentStart(D.lessonId).then(() => persist(true));
    if (S.finished) finishGame(); else enterPlay(); };
  $('#newBtn').onclick = () => { $('#resumeBox').hidden = true; $('#newBox').hidden = false; $('#nameInput').focus(); };
  $('#testBtn').onclick = () => {
    Snd.ensure(); $('#testResult').textContent = '재생 중…';
    Snd.say('nihao').then(() => $('#testResult').innerHTML = '들리나요? ' + sourceBadge()).catch(() => $('#testResult').innerHTML = sourceBadge());
  };
  $('#startBtn').onclick = startNew;
  $('#nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') startNew(); });
}
function startNew(){
  const name = cleanName($('#nameInput').value);
  if (!name){ $('#nameInput').focus(); $('#nameInput').placeholder = '이름을 먼저 써 주세요!'; return; }
  Snd.ensure(); Snd.startBgm();
  S = newState(name); persist();
  Net.studentStart(D.lessonId).then(() => persist(true));
  storyStep = 0; show('#storyScreen'); renderStory();
}
let storyStep = 0;
function renderStory(){
  $('#storyText').textContent = D.story[storyStep];
  $('#storyDots').innerHTML = D.story.map((_, i) => `<b class="${i === storyStep ? 'on' : ''}"></b>`).join('');
  $('#nextBtn').textContent = storyStep === D.story.length - 1 ? '저택으로 들어가기!' : '다음';
  $('#storyArt').innerHTML = storyStep === 0 ? `<div class="house">🏯</div>${pandaSVG({ mood:'wow' })}`
    : storyStep === 1 ? `<div class="minidoors big">${ROOMS.map(z => `<span style="--dc:${z.door}">${z.icon}</span>`).join('')}</div>`
    : `${pandaSVG({})}<div class="storykeys">🔑🔑🔑🔑🔑</div><div class="storychest">${chestSVG(false)}</div>`;
}
$('#nextBtn').onclick = () => { Snd.sfx.blip(); if (storyStep < D.story.length - 1){ storyStep++; renderStory(); } else enterPlay(); };
$('#skipBtn').onclick = () => enterPlay();
function enterPlay(){
  show('#play');
  const zi = ROOMS.findIndex(z => z.id === S.room);
  if (zi >= 0){ curRoom = zi; $('#hall').hidden = true; $('#room').hidden = false; renderRoom(); }
  else { renderHall(); if (!doneCount()) toast('🚪 문을 하나 골라 들어가요!', 2600); }
}
function finishGame(){
  if (!S.finished){ S.finished = true; S.finishedAt = Date.now(); }
  S.room = null; persist(true);
  Snd.sfx.fanfare(); show('#endScreen');
  const first = MISSIONS.filter(m => S.results[m.id].firstCorrect === true).length;
  $('#endArt').innerHTML = `${pandaSVG({ hat:true })}${chestSVG(true)}${pandaSVG({ bow:true, mood:'wow' })}`;
  $('#endLearn').textContent = S.learn; $('#endStar').textContent = S.starPts; $('#endTotal').textContent = S.learn + S.starPts;
  $('#endName').textContent = `${S.name} #${S.tag}`;
  $('#endFirst').textContent = `처음에 맞힌 문제 ${first} / ${MISSIONS.length}`;
  $('#endZones').innerHTML = ROOMS.map(z => `<div><small>${z.icon} ${esc(z.name)}</small><b>${z.missions.filter(m => S.results[m.id].firstCorrect).length}/${z.missions.length}</b></div>`).join('');
  const perfect = ROOMS.filter(z => S.rooms[z.id] && S.rooms[z.id].perfect).length;
  $('#endBonus').textContent = `완벽한 방 ${perfect}개 · 숨은 물건 ${S.used.length}개 · 손숫자 퀴즈 ${S.handOk || 0}/${S.hand || 0}`;
  $('#saveStatus').innerHTML = !Net.enabled ? '💾 결과가 이 기기에 저장되었어요.' : Net.status() === 'online' ? '✅ 결과를 선생님께 보냈어요.' : '⏳ 결과를 선생님께 보내는 중이에요. 인터넷이 연결되면 자동으로 보내요.';
  Net.onStatus(s2 => { if ($('#endScreen').hidden || !Net.enabled) return; $('#saveStatus').innerHTML = s2 === 'online' ? '✅ 결과를 선생님께 보냈어요.' : '⏳ 결과를 선생님께 보내는 중이에요. 인터넷이 연결되면 자동으로 보내요.'; });
  renderSpeedBtn();
  $('#endRank').hidden = !SHOW_RANK;
  if (SHOW_RANK){ if (endRankUnsub) endRankUnsub(); setTimeout(() => { endRankUnsub = Net.watchBoard(list => {
    $('#endRankList').innerHTML = rankRows(list ? list.slice(0, 10) : list);
    const uid = Net.uid(), mine = list && list.findIndex(r => r.id === uid);
    $('#myRank').textContent = list && mine >= 0 ? `나는 ${list.length}명 중 ${list.filter(r => r.total > list[mine].total).length + 1}등!` : ''; }); }, 600); }
}
$('#byeBtn').onclick = () => Snd.say('zaijian').catch(() => {});

/* ================= 끝난 뒤: 손숫자 스피드 도전 (한 번만, 별 점수) ================= */
function renderSpeedBtn(){
  const sp = S.speed;
  $('#speedBox').innerHTML = sp && sp.done
    ? `<p class="note center">🖐️ 손숫자 스피드 도전: ${sp.ok} / ${D.points.speedMax} 맞힘 (별 +${sp.ok*D.points.speedHand})</p>`
    : `<button class="btn primary" type="button" id="speedBtn">🖐️ 손숫자 스피드 도전 (별 보너스!)</button><p class="note center">친구들을 기다리는 동안 한 번 도전할 수 있어요. 손 모양 ${D.points.speedMax}개, 맞히면 하나에 별 +${D.points.speedHand}</p>`;
  const b = $('#speedBtn'); if (b) b.onclick = speedRun;
}
async function speedRun(){
  if (S.speed && S.speed.done) return;
  S.speed = { done:false, ok:0, n:0 }; persist();
  const N = D.points.speedMax;
  let last = -1;
  for (let k = 0; k < N; k++){
    let v; do { v = Math.floor(Math.random()*11); } while (v === last); last = v;
    const opts = shuffle([v, ...shuffle([0,1,2,3,4,5,6,7,8,9,10].filter(x => x !== v)).slice(0, 3)]);
    const ok = await new Promise(res => {
      $('#evt').innerHTML = `<div class="card evtcard"><div class="qhead"><span class="place">🖐️ 스피드 도전</span><span class="count">${k + 1} / ${N} · 맞힘 ${S.speed.ok}</span></div>
        <div class="handbig">${handImg(v)}</div>
        <div class="numpick wide four">${opts.map(n => `<button type="button" class="np" data-n="${n}"><b>${n}</b><small>${SOUNDS[NUM_ID(n)].text}</small></button>`).join('')}</div>
        <p class="feedback" id="handFb"></p></div>`;
      $('#evt').hidden = false;
      let once = false;
      $('#evt').querySelectorAll('.np').forEach(b => b.onclick = () => {
        if (once) return; once = true;
        const r = +b.dataset.n === v;
        b.classList.add(r ? 'right' : 'wrong'); if (!r){ $('#evt').querySelector(`.np[data-n="${v}"]`).classList.add('right'); Snd.sfx.wrong(); } else Snd.sfx.star();
        const s = SOUNDS[NUM_ID(v)]; $('#handFb').className = 'feedback ' + (r ? 'good' : 'bad'); $('#handFb').innerHTML = `${v} = <span class="zhl">${s.text}</span> ${esc(s.pinyin)}`;
        setTimeout(() => res(r), r ? 650 : 1300);
      });
    });
    if (ok){ S.speed.ok++; S.starPts += D.points.speedHand; }
    S.speed.n = k + 1; persist();
  }
  S.speed.done = true; persist(true);
  $('#evt').hidden = true;
  Snd.sfx.fanfare();
  $('#endStar').textContent = S.starPts; $('#endTotal').textContent = S.learn + S.starPts;
  renderSpeedBtn();
}

/* ================= 설정·도움말 ================= */
function syncSliders(){
  ['bgm','sfx','voice'].forEach(k => { const id = 'vol' + k[0].toUpperCase() + k.slice(1); $('#' + id).value = prefs[k]; $('#' + id + 'V').textContent = prefs[k]; });
  $('#muteAll').checked = prefs.mute;
  const src = SOURCE_TEXT[Snd.source()];
  $('#voiceSourceNote').textContent = '중국어 소리: ' + (src ? src[0] : '아직 재생 전');
  $('#renameInput').value = S ? S.name : ''; $('#renameMsg').textContent = '';
}
['bgm','sfx','voice'].forEach(k => { const id = 'vol' + k[0].toUpperCase() + k.slice(1);
  $('#' + id).addEventListener('input', e => { prefs[k] = +e.target.value; $('#' + id + 'V').textContent = prefs[k]; Snd.apply(); savePrefs(); }); });
$('#muteAll').addEventListener('change', e => { prefs.mute = e.target.checked; Snd.apply(); savePrefs(); });
$('#soundBtn').onclick = () => { syncSliders(); $('#soundPanel').hidden = false; };
$('#soundClose').onclick = () => $('#soundPanel').hidden = true;
$('#renameBtn').onclick = () => { const n = cleanName($('#renameInput').value); if (!n){ $('#renameMsg').textContent = '이름을 써 주세요.'; return; } S.name = n; persist(); renderHud(); $('#renameMsg').textContent = '저장했어요.'; };
$('#helpBtn').onclick = () => {
  $('#helpHands').innerHTML = [0,1,2,3,4,5,6,7,8,9,10].map(n => `<div>${handImg(n)}<b>${n}</b><small>${SOUNDS[NUM_ID(n)].text} ${esc(SOUNDS[NUM_ID(n)].pinyin)}</small></div>`).join('');
  $('#helpPanel').hidden = false; };
$('#helpClose').onclick = () => $('#helpPanel').hidden = true;
$('#rankBtn').onclick = openRanking;
$('#rankClose').onclick = closeRanking;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ if (quizOpen && Q) closeQuiz(); $('#soundPanel').hidden = true; $('#helpPanel').hidden = true; closeRanking(); }
});

window.__PANDA = { state: () => S, missions: MISSIONS, rooms: ROOMS };   // 테스트용 (읽기 전용)
initStart();
})();
