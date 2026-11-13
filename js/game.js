(() => {
'use strict';
/* ================= 基础 ================= */
const W = 320, H = 180, KEY = 'zero-station-v5';
const $ = id => document.getElementById(id);
const cv = $('cv');
let ctx = cv.getContext('2d');
const PAL = ['#0d0f1a','#1b2036','#2b3358','#40508a','#6b8cc4','#a8d0e6','#f2f0e4','#f4c95d','#e8894a','#c8504a','#7a3050','#3f7a5a','#7ec08a','#5a4636','#8a6c4e','#b79ae8','#ff7ac0','#b0388f','#4a2a78','#6aa8ff','#18c964','#0b6b3a','#9af5c0','#4fb3c4','#2f7d8c'];
let hots = [], tick = 0;

function r(x, y, w, h, c) { ctx.fillStyle = typeof c === 'string' ? c : PAL[c]; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function px(x, y, c) { r(x, y, 1, 1, c); }
function line(x0, y0, x1, y1, c, t = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx - dy;
  for (let i = 0; i < 600; i++) {
    r(x0, y0, t, t, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 > -dy) { e -= dy; x0 += sx; }
    if (e2 < dx) { e += dx; y0 += sy; }
  }
}
function circ(cx, cy, rad, c, fill = true) {
  for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
    const d = x * x + y * y;
    if (fill ? d <= rad * rad + rad * .6 : (d <= rad * rad + rad * .6 && d >= (rad - 1) * (rad - 1) + (rad - 1) * .6)) px(cx + x, cy + y, c);
  }
}
function spr(x, y, rows, s = 1) {
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch !== '.') r(x + i * s, y + j * s, s, s, parseInt(ch, 36)); } });
}
const FONT = {'0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001001001001','8':'111101111101111','9':'111101111001111','.':'000000000000010','-':'000000111000000','_':'000000000000111','C':'111100100100111','O':'111101101101111','K':'101101110101101',' ':'000000000000000'};
function num(x, y, s, c, sc = 1) {
  for (const ch of String(s)) {
    const g = FONT[ch] || FONT[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') r(x + (i % 3) * sc, y + Math.floor(i / 3) * sc, sc, sc, c);
    x += 4 * sc;
  }
}
function hot(x, y, w, h, a, p, tip) { hots.push({ x, y, w, h, a, p, tip }); }
function rnd(seed) { let s = seed; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; }
function starfield(seed, n, x0, y0, w, h) {
  const f = rnd(seed);
  for (let i = 0; i < n; i++) { const x = x0 + f() * w, y = y0 + f() * h, b = f(); px(x, y, b > .85 ? 6 : b > .5 ? 4 : 3); }
}

/* ================= 状态 ================= */
const TT = ['ILTLL','LITII','LLLLI','ITILI','LILIL'];
const TS = [[1,2,0,1,2],[0,0,0,0,0],[1,3,1,3,0],[0,0,0,0,0],[0,1,3,0,0]];
const BASE = { I: 5, L: 3, T: 11 };
const rot = (b, n) => { for (let i = 0; i < n; i++) b = ((b << 1) & 15) | (b >> 3); return b; };
function initTiles() { return TS.map((row, rr) => row.map((v, c) => (v + 1 + ((rr + c) % 3)) % 4)); }
function flow(t) {
  const bits = (rr, c) => rot(BASE[TT[rr][c]], t[rr][c]);
  const lit = new Set(); let ok = false;
  if (!(bits(0, 0) & 8)) return { lit, ok };
  const q = [[0, 0]]; lit.add('0,0');
  const D = [[1,-1,0,4],[2,0,1,8],[4,1,0,1],[8,0,-1,2]];
  while (q.length) {
    const [rr, c] = q.pop(), b = bits(rr, c);
    if (rr === 4 && c === 4 && (b & 2)) ok = true;
    for (const [m, dr, dc, opp] of D) {
      if (!(b & m)) continue;
      const nr = rr + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr > 4 || nc > 4 || !(bits(nr, nc) & opp)) continue;
      const k = nr + ',' + nc;
      if (!lit.has(k)) { lit.add(k); q.push([nr, nc]); }
    }
  }
  return { lit, ok };
}
const freshScale = () => ({ loc: [0,0,0,0,0,0,0,0,0], cand: [0,1,2,3,4,5,6,7,8], left: 2, last: '', acc: false, fake: Math.floor(Math.random() * 9) });
const fresh = () => ({ v: 'map', inv: [], sel: null, f: {}, ch: {}, stars: [], clock: 610, freq: 90, lock: [0,0,0], vault: '', peg: [], tiles: initTiles(), brk: [0, 0, 0, 0, 0], sc: freshScale(), hints: {}, code: '', aff: { z: 0, c: 0 }, word: [], arch: '', chan: null, dial: [0, 0, 0], route: null, end: null, how: {}, facts: [], name: '', shard: [], notes: [], pg: [], rk: [true, true, true, true, true, true, true, true], arr: null, pots: [], srt: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], tk: [[5, 90], [6, 30], [4, 0]], tkn: 0, best: {} });
function load() { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.v && o.tiles && o.sc) return Object.assign(fresh(), o); } catch (e) {} return fresh(); }
const HOWKEY = { scale: 'scale', clock: 'clock', locker: 'locker', console: 'console', tiles: 'tiles', vault: 'vault', inner: 'pass', crate: 'pass', archive: 'pass', mail: 'mail', rules: 'store', nursery: 'nursery', bunk: 'bunk', shaft: 'shaft' };
function markHow() {
  const d = { scale: S.f.scale, clock: S.f.seal_t, locker: S.f.locker, console: S.f.seal_l, tiles: S.f.power, vault: S.f.seal_s, pass: S.f.pass };
  ['mail', 'store', 'nursery', 'bunk', 'shaft'].forEach(k => { d[k] = S.shard.includes(k); });
  for (const k in d) if (d[k] && !S.how[k]) S.how[k] = 'self';
}
function save() { try { markHow(); localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
let S = load();
let shuf = 0;
let ME = null;            // 解密出来的专属内容 {name, easy, lines, from}
const has = id => S.inv.includes(id);
function give(id) { if (!has(id)) S.inv.push(id); sfx('pick'); }
function drop(id) { S.inv = S.inv.filter(x => x !== id); if (S.sel === id) S.sel = null; }
function say(t) { $('cap').textContent = t || ''; }
const who = () => (ME && ME.name) || '旅人';

const LOCK_CODE = [7, 6, 4], VAULT_CODE = '417', FREQ = 96.5, CLOCK_OK = 220;
const TELE = [8, 5, 4, 6, 3], PEG_OK = [0, 3, 4, 2, 5];
const edges = p => { const s = new Set(); for (let i = 1; i < p.length; i++) s.add(Math.min(p[i-1], p[i]) + '-' + Math.max(p[i-1], p[i])); return s; };
const MORSE = {'0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'};
const ITEMS = {
  token: ['代币', '比真硬币轻一点，边上刻着「自动贩卖」。'],
  fuse: ['保险丝', '玻璃管里的细丝完好无损。'],
  lens: ['镜片', '一片磨得很好的物镜。'],
  seed: ['葵花籽', '从画里掉出来的。捏一捏，是真的。'],
  seal_t: ['印章·时', '刻着一只没有指针的钟。'],
  seal_s: ['印章·声', '刻着三道波纹。'],
  seal_l: ['印章·光', '刻着一颗四角星。'],
  pass: ['通行章', '刻着「通行」两个字，印泥还没干。']
};

/* ================= 声音（可有可无） ================= */
let ac = null, master = null, muted = false, bgm = null, mTone = null;
try { muted = localStorage.getItem(KEY + '-mute') === '1'; } catch (e) {}
function audio() {
  if (muted) return;
  if (ac) { try { if (ac.state === 'suspended') ac.resume(); } catch (e) {} return; }
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    ac = new C(); master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
    const mo = ac.createOscillator(); mTone = ac.createGain(); mTone.gain.value = 0; mo.frequency.value = 640; mo.connect(mTone); mTone.connect(master); mo.start();
    bgm = new Audio('audio/bgm.mp3'); bgm.loop = true; bgm.volume = .35;
    bgm.addEventListener('canplaythrough', () => { if (!muted) bgm.play().catch(() => {}); }, { once: true });
    bgm.addEventListener('error', () => { bgm = null; });
  } catch (e) {}
}
function sfx(k) {
  if (k === 'bad') badN++;
  if (!ac || muted) return;
  try {
    const seq = { tap: [1200], click: [330], pick: [660, 880], win: [523, 659, 784, 1047], bad: [160, 120], step: [220] }[k] || [440];
    seq.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * .09; o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(k === 'tap' ? .012 : .035, t); g.gain.exponentialRampToValueAtTime(.0005, t + .14); o.connect(g); g.connect(master); o.start(t); o.stop(t + .16); });
  } catch (e) {}
}
let alarmT = null;
function quiet(msg) { S.f.quiet = 1; alarm(); talk([msg, { who: '温控器', t: '……安静了。谢谢。现在可以倒水了。' }]); save(); }
function alarm() {   // 冷却井的警报：进门就响，关掉声音才停
  const on = S.v === 'shaft' && !S.f.quiet && $('title').hidden;
  if (on && !alarmT) alarmT = setInterval(() => { if (ac && !muted) try { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime; o.type = 'square'; o.frequency.value = 1400; g.gain.setValueAtTime(.02, t); g.gain.exponentialRampToValueAtTime(.0005, t + .25); o.connect(g); g.connect(master); o.start(t); o.stop(t + .3); } catch (e) {} }, 900);
  if (!on && alarmT) { clearInterval(alarmT); alarmT = null; }
}
function tone(on) { try { if (mTone) mTone.gain.setTargetAtTime(on && !muted ? .04 : 0, ac.currentTime, .005); } catch (e) {} }
function setMute(m) {
  if (m && S.v === 'shaft' && !S.f.quiet) setTimeout(() => quiet('你把声音关掉了。警报停了。'), 0);
  muted = m; $('bSnd').textContent = '声音：' + (m ? '关' : '开');
  try { localStorage.setItem(KEY + '-mute', m ? '1' : '0'); } catch (e) {}
  try { if (master) master.gain.value = m ? 0 : 1; if (bgm) m ? bgm.pause() : bgm.play().catch(() => {}); } catch (e) {}
  if (!m) audio();
}

/* ================= 对话（galgame 式） ================= */
let dq = [], dOn = false, dWait = false;
function talk(lines, then) { dq = dq.concat(lines); if (then) dq.push({ fn: then }); if (!dOn) nextLine(); }
function nextLine() {
  const d = dq.shift();
  if (!d) { dOn = false; $('dlg').hidden = true; refresh(); return; }
  if (d.fn) { d.fn(); return nextLine(); }
  dOn = true; $('dlg').hidden = false;
  $('dwho').textContent = d.who || ''; $('dwho').hidden = !d.who;
  $('dtext').textContent = (typeof d === 'string' ? d : d.t).replace('{name}', who());
  const c = $('dch'); c.innerHTML = ''; dWait = !!d.ch; $('dnext').hidden = dWait;
  if (d.ch) d.ch.forEach((o, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = o.t; b.dataset.ch = i; b.onclick = e => { e.stopPropagation(); sfx('click'); o.f && o.f(); save(); nextLine(); }; c.appendChild(b); });
}
$('dlg').onclick = () => { if (!dWait) { sfx('step'); nextLine(); } };
const Z = t => ({ who: '零', t });

const PAWN = {
  t: { item: '一个没睡够的早晨', opts: ['赎回来。我要把觉补上。', '留在这里，让它过去吧。', '送给今天比我更累的人。'] },
  s: { item: '一句没说出口的谢谢', opts: ['赎回来。我想亲口说。', '留下吧，对方大概早就懂了。', '转赠出去，替别人也说一声。'] },
  l: { item: '一个还没兑现的愿望', opts: ['赎回来。今年我自己去兑现。', '留下它，我想换一个新的。', '送出去，让它在别人那里实现。'] }
};
const CH = ['take', 'leave', 'give'];
function askPawn(k) {
  const p = PAWN[k];
  return [Z('印章底下压着一张当票。当物：「' + p.item + '」。当户一栏写的是你，{name}。' + (Object.keys(S.ch).length ? '' : '赎期一栏只有四个字：来日方长。')), { who: '零', t: '要怎么处置它？', ch: p.opts.map((t, i) => ({ t, f: () => { S.ch[k] = CH[i]; } })) }];
}
const ECHO = {
  t: () => S.f.cat ? [Z('登记簿上说，这座钟坏了很多年。'), { who: '螺丝', t: '可它刚才不是走了吗。' }, Z('……也许它没有坏。它只是一直在等人来。')] : [Z('登记簿上说，这座钟坏了很多年。'), Z('可它刚才走了。也许它没有坏，只是一直在等人来。')],
  s: () => [Z('我想起来了。那三段广播是我每晚的点名：清洁臂、导航副机、温控器。'), Z('我播了很久，一直没有人应。你是第一个把它听完的人。')],
  l: () => [Z('这个星座，星图上没有名字。'), Z('是你连出来的，就归你取名。不着急，下次来的时候再告诉我。')]
};
function seal(k, how) {
  S.f['seal_' + k] = 1; give('seal_' + k); sfx('win');
  talk([how, Z(praise())].concat(askPawn(k)).concat([{ fn: () => { talk([Z({ take: '记下了。赎回的东西，后舱会替你备好。', leave: '记下了。留下的东西，站里会一直替你收着。', give: '记下了。它会顺着下一班补给船出发。' }[S.ch[k]] || '记下了。')].concat(ECHO[k]())); } }]));
}
function route() {
  const n = { take: 0, leave: 0, give: 0 };
  ['t', 's', 'l'].forEach(k => { if (S.ch[k]) n[S.ch[k]]++; });
  return n.take >= 2 ? 'take' : n.leave >= 2 ? 'leave' : n.give >= 2 ? 'give' : 'mix';
}
const ROUTES = {
  take: ['赎回者', '你把押在这里的东西一样一样领了回去。早晨、谢谢、愿望，都重新装进了口袋。它们有点沉，但那是你自己的分量。', '零在你身后说：「慢一点走。带着这么多东西的人，值得走慢一点。」'],
  leave: ['轻装者', '你把它们留在了站里。不是丢掉，是放下。舱门在身后合上的时候，你发现肩膀比来时轻了一些。', '零在你身后说：「放心，我会替你收着。哪天想要了，口令还是原来那个。」'],
  give: ['点灯人', '你把它们一件一件送了出去。补给船离港的时候，舷窗外多了三盏很小的灯，朝着别人的方向飞去。', '零在你身后说：「它们会到的。收到的人不会知道是你，但他们会过得好一点。」'],
  mix: ['调音师', '你赎回了一些，放下了一些，又送走了一些。没有哪一种是标准答案，你只是把这一年调到了自己听着舒服的音高。', '零在你身后说：「这样正好。全拿走太重，全留下太空。」']
};

/* ================= 画面零件 ================= */
const ICON = {
  sail: ['....6....','....66...','....666..','....6666.','....66666','....6....','.ddddddd.','..ddddd..','...ddd...'],
  fish: ['.........','..444...4','.444444.4','44644444.','.444444.4','..444...4','.........','.........','.........'],
  key:  ['.........','.77......','7..7.....','7..777777','.77...7.7','.........','.........','.........','.........']
};
function room(wall, wall2, floor, floor2) {
  r(0, 0, W, 120, wall); for (let x = 0; x < W; x += 40) r(x, 0, 1, 120, wall2);
  r(0, 0, W, 4, wall2); r(0, 116, W, 4, 0); r(0, 120, W, 60, floor);
  for (let y = 132; y < H; y += 14) r(0, y, W, 1, floor2);
  for (let x = 20; x < W; x += 50) r(x, 120, 1, 60, floor2);
}
function dimIf(c) { if (c) { ctx.globalAlpha = .38; r(0, 0, W, H, 0); ctx.globalAlpha = 1; } }
function clockFace(cx, cy, rad, m, c, bg, nums) {
  circ(cx, cy, rad, c); circ(cx, cy, rad - 2, bg);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; r(cx + Math.sin(a) * (rad - 5) - (rad > 30 ? 1 : 0), cy - Math.cos(a) * (rad - 5) - (rad > 30 ? 1 : 0), rad > 30 ? 2 : 1, rad > 30 ? 2 : 1, c); }
  if (nums) { num(cx - 3, cy - rad + 10, '12', c); num(cx + rad - 14, cy - 2, '3', c); num(cx - 1, cy + rad - 15, '6', c); num(cx - rad + 11, cy - 2, '9', c); }
  const ha = (m % 720) / 720 * 2 * Math.PI, ma = (m % 60) / 60 * 2 * Math.PI, t = rad > 30 ? 2 : 1;
  line(cx, cy, cx + Math.sin(ha) * rad * .48, cy - Math.cos(ha) * rad * .48, c, t + (rad > 30 ? 1 : 0));
  line(cx, cy, cx + Math.sin(ma) * rad * .76, cy - Math.cos(ma) * rad * .76, c, t);
}
function starGem(x, y) { const c = Math.floor(tick / 3) % 2 ? 7 : 6; px(x, y, c); px(x - 1, y, 7); px(x + 1, y, 7); px(x, y - 1, 7); px(x, y + 1, 7); }
function secret(i, x, y) { if (!S.stars.includes(i)) { starGem(x, y); hot(x - 4, y - 4, 9, 9, 'star', i, '？'); } }
function sealIcon(k, x, y, s = 1) { const c = { t: 7, s: 12, l: 15 }[k]; r(x, y, 10 * s, 10 * s, c); r(x + s, y + s, 8 * s, 8 * s, 1); if (k === 't') { circ(x + 5 * s, y + 5 * s, 3 * s, c, false); } else if (k === 's') { for (let i = 0; i < 3; i++) r(x + 2 * s, y + (2 + i * 2.5) * s, 6 * s, s, c); } else { r(x + 4.5 * s, y + 2 * s, s, 6 * s, c); r(x + 2 * s, y + 4.5 * s, 6 * s, s, c); } }

/* ================= 精致化：通用画材 ================= */
const MT = ['#10131f', '#1a2036', '#262e4c', '#33406a', '#4a5b92', '#7084bd', '#a9b9e0'];   // 金属蓝，暗→亮
const FL = ['#111522', '#181d30', '#20273e', '#2b3452', '#3a4568'];                        // 地板
const RD = ['#3e1418', '#6e2228', '#a33a3a', '#d4594f', '#f08a76'];                        // 红
const YL = ['#5c4012', '#a47a22', '#e0b246', '#f7d77a', '#fff4c4'];                        // 黄
const CY = ['#123a44', '#1f5e6c', '#2f8a9a', '#5cc1cf', '#b4ecf2'];                        // 青
const GR = ['#14301f', '#245238', '#3d7a52', '#62a974', '#a6dba8'];                        // 绿
const PP = ['#efe8d2', '#d8ceb0', '#b3a684'];                                             // 纸
function bevel(x, y, w, h, ramp, k = 2) {     // 有体积的板：左上受光，右下背光，外圈描边
  r(x, y, w, h, ramp[k]); r(x, y, w, 1, ramp[k + 2] || ramp[k + 1]); r(x, y, 1, h, ramp[k + 1]);
  r(x, y + h - 1, w, 1, ramp[k - 1]); r(x + w - 1, y, 1, h, ramp[k - 1]);
}
function rivet(x, y, ramp = MT) { px(x, y, ramp[5]); px(x + 1, y + 1, ramp[1]); px(x + 1, y, ramp[3]); px(x, y + 1, ramp[3]); }
function soft(x, y, rad, rgb, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
function grate(x, y, w, h, ramp = MT) { r(x, y, w, h, ramp[0]); for (let i = 1; i < h - 1; i += 2) r(x + 1, y + i, w - 2, 1, ramp[2]); r(x, y, w, 1, ramp[3]); r(x, y + h - 1, w, 1, ramp[4]); }
function pipeH(x, y, w, t, ramp = MT) { r(x, y, w, t, ramp[2]); r(x, y, w, 1, ramp[4]); r(x, y + t - 1, w, 1, ramp[1]); for (let i = x + 18; i < x + w; i += 46) { r(i, y - 1, 4, t + 2, ramp[3]); r(i, y - 1, 4, 1, ramp[5]); } }
function dust(seed, x0, y0, w, h, n, c = '255,240,210') {     // 光里飘的灰尘
  for (let i = 0; i < n; i++) { const f = rnd(seed + i), sx = f(), sy = f(), sp = .2 + f() * .5, x = x0 + ((sx * w + tick * sp * .6) % w), y = y0 + ((sy * h + Math.sin(tick * .05 + i) * 3) % h); ctx.fillStyle = `rgba(${c},${.25 + .35 * Math.abs(Math.sin(tick * .04 + i))})`; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
}
function hazard(x, y, w, h) { r(x, y, w, h, '#1a1a14'); for (let i = -h; i < w; i += 6) for (let j = 0; j < h; j++) { const xx = i + j; if (xx >= 0 && xx < w) r(x + xx, y + j, 3, 1, YL[2]); } r(x, y, w, 1, YL[3]); }
function metalWall(top, bot, ramp = MT) {   // 金属墙：板缝、铆钉、上沿灯带、下沿护墙
  r(0, top, W, bot - top, ramp[2]);
  for (let x = 0; x < W; x += 40) { r(x, top, 1, bot - top, ramp[1]); r(x + 1, top, 1, bot - top, ramp[3]); rivet(x + 4, top + 6, ramp); rivet(x + 34, top + 6, ramp); rivet(x + 4, bot - 22, ramp); rivet(x + 34, bot - 22, ramp); }
  r(0, top + 46, W, 1, ramp[1]); r(0, top + 47, W, 1, ramp[3]);
  r(0, bot - 16, W, 16, ramp[1]); r(0, bot - 16, W, 1, ramp[4]); for (let x = 6; x < W; x += 20) r(x, bot - 11, 10, 6, ramp[0]);
}
function steelFloor(top, ramp = FL) {
  r(0, top, W, H - top, ramp[2]); r(0, top, W, 2, ramp[0]);
  for (let y = top + 10; y < H; y += 15) { r(0, y, W, 1, ramp[1]); r(0, y + 1, W, 1, ramp[3]); }
  for (let j = 0, y = top + 2; y < H; y += 15, j++) for (let x = (j % 2) * 30; x < W; x += 60) { r(x, y, 1, 15, ramp[1]); rivet(x + 3, y + 3, MT); }
}

/* ================= 码头（精致版） ================= */
function drawDock() {
  // 墙、天花、地
  metalWall(0, 120);
  r(0, 0, W, 5, MT[0]); for (let x = 10; x < W; x += 60) { r(x, 4, 30, 3, MT[3]); r(x + 2, 5, 26, 1, YL[3]); }
  pipeH(0, 9, W, 4); pipeH(0, 15, 96, 3, MT);
  const blink = tick % 40 < 4; r(92, 13, 3, 3, blink ? RD[4] : RD[1]); if (blink) soft(93, 14, 8, '240,120,100', .6);
  steelFloor(120);
  for (let x = 4; x < W; x += 60) soft(x + 15, 6, 34, '255,236,190', .08);

  // 大窗：粗框、螺栓、玻璃反光，窗外星空和小艇
  bevel(100, 12, 120, 78, MT, 3); r(104, 16, 112, 70, MT[0]);
  ctx.save(); ctx.beginPath(); ctx.rect(105, 17, 110, 68); ctx.clip();
  r(105, 17, 110, 68, '#070912'); starfield(11, 60, 105, 17, 110, 68);
  for (let i = 0; i < 6; i++) { const f = rnd(70 + i), x = 105 + ((f() * 110 - tick * (.08 + i * .02)) % 110 + 110) % 110; px(x, 17 + f() * 68, 6); }
  circ(232 - (tick * .01) % 4, 96, 38, '#2a2350'); circ(236 - (tick * .01) % 4, 92, 34, '#3a2f6a'); circ(240, 88, 20, '#4a3d82');
  r(105, 70, 18, 4, MT[3]); r(105, 70, 18, 1, MT[5]); r(120, 72, 10, 2, MT[2]);         // 对接臂
  const by = Math.round(Math.sin(tick * .05) * 1);
  r(131, 49 + by, 10, 12, MT[3]); r(131, 49 + by, 10, 1, MT[5]); r(126, 52 + by, 5, 6, MT[2]);       // 舱门和对接环
  r(140, 44 + by, 58, 26, MT[4]); r(140, 44 + by, 58, 2, MT[6]); r(140, 68 + by, 58, 2, MT[2]); r(140, 56 + by, 58, 1, MT[3]);
  r(198, 46 + by, 4, 22, MT[3]); r(202, 49 + by, 6, 16, MT[2]); r(202, 49 + by, 6, 1, MT[4]);        // 尾部推进器
  const th = 2 + (tick % 6 < 3 ? 1 : 0); r(208, 52 + by, th + 2, 10, CY[3]); r(208, 54 + by, th + 4, 6, CY[4]); soft(210, 57 + by, 10, '120,220,240', .5);
  r(146, 48 + by, 22, 8, '#0b1626'); r(147, 49 + by, 20, 6, CY[1]); line(149, 54 + by, 154, 49 + by, CY[4]); line(152, 54 + by, 157, 49 + by, CY[3]);   // 驾驶舱玻璃
  r(172, 50 + by, 6, 5, '#0b1626'); r(181, 50 + by, 6, 5, '#0b1626'); r(173, 51 + by, 2, 2, YL[3]);
  r(176, 60 + by, 14, 5, MT[2]); txt('07', 183, 60 + by, 5, 6, 'center', true);
  line(160, 44 + by, 162, 37 + by, MT[5]); px(162, 36 + by, tick % 30 < 15 ? RD[4] : RD[2]);
  ctx.restore();
  ctx.globalAlpha = .18; for (let i = 0; i < 3; i++) line(110 + i * 9, 84, 140 + i * 9, 18, '#ffffff'); ctx.globalAlpha = 1;   // 玻璃反光
  [[103, 15], [215, 15], [103, 85], [215, 85], [159, 13], [159, 87]].forEach(([x, y]) => rivet(x, y));
  r(100, 90, 120, 3, MT[1]);
  hot(130, 40, 76, 34, 'go', 'radio', '小艇');
  secret(0, 116, 26);

  // 灭火器
  r(92, 70, 8, 22, RD[2]); r(92, 70, 2, 22, RD[3]); r(98, 70, 2, 22, RD[1]); r(93, 66, 6, 4, MT[1]); r(94, 63, 4, 3, MT[3]); line(99, 66, 102, 74, MT[0]); r(93, 78, 6, 5, PP[0]); r(94, 80, 4, 1, RD[2]);

  factHot(90, 62, 13, 31, 'fire', '灭火器');
  // 告示：胶带、标题、文字行、图钉
  ctx.save(); ctx.translate(142, 103); ctx.rotate(-.04); ctx.translate(-142, -103);
  r(121, 95, 44, 18, PP[2]); r(120, 94, 44, 18, PP[0]); r(120, 94, 44, 3, RD[2]); for (let i = 0; i < 4; i++) r(124, 99 + i * 3, 34 - (i % 2) * 8, 1, MT[2]);
  r(118, 93, 6, 3, 'rgba(240,230,190,.7)'); r(158, 93, 6, 3, 'rgba(240,230,190,.7)');
  ctx.restore();
  hot(120, 94, 44, 18, 'look', '告示：「本站五舱一枢。当户取物，请集齐时、声、光三枚印章，至机房验印。印章依次领取：先时，再声，后光。」', '告示');

  // 储物柜：机身、三扇门、通风百叶、门牌、把手
  r(12, 40, 76, 82, MT[0]); bevel(14, 42, 72, 78, MT, 2);
  ['sail', 'fish', 'key'].forEach((k, i) => {
    const x = 18 + i * 23, open = S.f.locker;
    if (open) { r(x, 48, 20, 70, MT[0]); r(x + 1, 49, 18, 1, MT[2]); r(x + 2, 80, 16, 2, MT[3]); r(x + 9, 52, 2, 6, MT[4]); r(x + 4, 82, 6, 8, CY[1]); r(x + 4, 82, 6, 1, CY[3]); r(x - 3, 48, 3, 70, MT[3]); r(x - 3, 48, 1, 70, MT[5]); }
    else {
      bevel(x, 48, 20, 70, MT, 3); for (let j = 0; j < 4; j++) { r(x + 3, 51 + j * 3, 14, 1, MT[1]); r(x + 3, 52 + j * 3, 14, 1, MT[4]); }
      r(x + 3, 64, 14, 14, MT[1]); r(x + 4, 65, 12, 12, '#d9d4c0'); spr(x + 5, 66, ICON[k]);
      r(x + 15, 86, 3, 10, MT[1]); r(x + 15, 86, 2, 9, MT[5]); px(x + 15, 86, MT[6]);
      r(x + 4, 108, 12, 6, MT[1]); txt(String(i + 1), x + 10, 108, 5, 5, 'center', true);
    }
  });
  r(12, 120, 76, 3, MT[0]);
  hot(14, 44, 72, 76, 'go', 'locker', '储物柜');

  // 自动贩卖机：灯箱、玻璃柜、货、按键、故障条
  soft(262, 122, 40, '255,190,120', .12);
  r(238, 33, 54, 88, '#24141a'); r(234, 32, 54, 88, RD[1]); r(234, 32, 2, 88, RD[2]); r(286, 32, 2, 88, RD[0]);
  r(236, 34, 50, 10, '#ffe7b0'); r(236, 34, 50, 1, '#fff'); txt('DRINK', 261, 35, 7, 0, 'center', true); soft(261, 39, 30, '255,220,150', .25);
  r(239, 46, 32, 46, '#0a0d18'); for (let j = 0; j < 3; j++) { r(240, 58 + j * 14, 30, 2, MT[2]); for (let i = 0; i < 3; i++) { const x = 242 + i * 9, y = 48 + j * 14, c = [[RD[3], RD[1]], [GR[3], GR[1]], [CY[3], CY[1]], [YL[3], YL[1]], [PP[0], PP[2]]][(i + j * 2) % 5]; r(x, y, 6, 10, c[0]); r(x + 4, y, 2, 10, c[1]); r(x, y + 1, 6, 1, '#ffffff'); r(x + 1, y + 10, 4, 1, MT[4]); } }
  ctx.globalAlpha = .25; line(242, 90, 262, 47, '#ffffff'); line(248, 90, 268, 47, '#ffffff'); ctx.globalAlpha = 1;
  bevel(273, 46, 11, 30, MT, 2); for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) r(275 + i * 4, 49 + j * 5, 3, 3, MT[4]); r(275, 69, 7, 3, '#0a0d18'); r(276, 70, 5, 1, YL[2]);
  r(240, 96, 32, 14, '#0a0d18'); r(240, 96, 32, 1, MT[1]); r(242, 98, 28, 1, MT[3]);
  ctx.save(); ctx.translate(262, 66); ctx.rotate(-.35); r(-20, -3, 40, 7, YL[3]); r(-20, -3, 40, 1, YL[4]); txt('故 障', 0, -3, 6, 0, 'center', true); ctx.restore();
  r(234, 118, 54, 3, MT[0]);
  hot(236, 34, 52, 86, 'vend', '', '自动贩卖机');

  // 地上：警示条、线缆、窗光
  hazard(104, 122, 112, 3);
  ctx.globalAlpha = .07; ctx.fillStyle = '#c8dcff'; ctx.beginPath(); ctx.moveTo(104, 125); ctx.lineTo(216, 125); ctx.lineTo(236, 178); ctx.lineTo(84, 178); ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = '#0b0d16'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(88, 122); ctx.quadraticCurveTo(70, 150, 30, 140); ctx.quadraticCurveTo(10, 136, 2, 160); ctx.stroke(); ctx.strokeStyle = MT[3]; ctx.lineWidth = .6; ctx.stroke();
  dust(300, 104, 20, 112, 150, 18);
  hatch('mail', '邮件室');
}

/* ================= 精致化：其余场景 ================= */
const WD = ['#1e130c', '#332015', '#4d3120', '#6c462c', '#8f6139', '#b98450'];          // 木头
const BR = ['#4a3410', '#7a5a1c', '#b08a30', '#d9b450', '#f6e19a'];                     // 黄铜
const PU = ['#1c1030', '#2e1a4e', '#4a2c78', '#7450b0', '#b49ae8'];                     // 紫
function woodFloor(top) {
  r(0, top, W, H - top, WD[2]); r(0, top, W, 2, WD[0]);
  for (let j = 0, y = top + 2; y < H; y += 9, j++) { r(0, y + 8, W, 1, WD[1]); for (let x = (j * 37) % 70 - 70; x < W; x += 70) { r(x, y, 1, 8, WD[1]); r(x + 1, y, 1, 8, WD[3]); } for (let x = (j * 13) % 23; x < W; x += 23) r(x, y + 3 + (x % 3), 6, 1, WD[3]); }
}
function lamp(x, len, warm = true) {
  r(x, 0, 1, len, WD[0]); r(x - 6, len, 13, 4, BR[1]); r(x - 6, len, 13, 1, BR[3]); r(x - 4, len + 4, 9, 2, '#fff3c8');
  soft(x, len + 8, 46, warm ? '255,200,120' : '190,220,255', .22);
}
function jar(x, y, w, h, c, glow) {
  r(x, y + 2, w, h - 2, 'rgba(180,210,230,.25)'); r(x + 1, y + 4, w - 2, h - 6, c); r(x, y + 2, 1, h - 2, 'rgba(255,255,255,.35)'); r(x + w - 1, y + 2, 1, h - 2, 'rgba(0,0,0,.3)');
  r(x + 1, y, w - 2, 2, WD[4]); r(x + 1, y, w - 2, 1, WD[5]); r(x + 1, y + h - 5, w - 2, 3, PP[0]); r(x + 2, y + h - 4, w - 4, 1, MT[3]);
  if (glow) soft(x + w / 2, y + h / 2, 9, glow, .25 + .1 * Math.sin(tick * .1 + x));
}

/* ---- 当铺 ---- */
function drawShop() {
  r(0, 0, W, 120, '#3c1a24'); for (let x = 0; x < W; x += 8) { r(x, 6, 1, 78, '#4a2230'); r(x + 4, 6, 1, 78, '#331620'); }
  for (let y = 14; y < 84; y += 16) for (let x = 4 + ((y / 16) % 2) * 4; x < W; x += 8) { px(x, y, '#5a2a3a'); px(x - 1, y + 1, '#5a2a3a'); px(x + 1, y + 1, '#5a2a3a'); px(x, y + 2, '#5a2a3a'); }
  r(0, 0, W, 6, WD[1]); r(0, 5, W, 1, WD[4]); r(0, 84, W, 32, WD[2]); r(0, 84, W, 2, WD[4]); for (let x = 4; x < W; x += 40) { r(x, 90, 32, 20, WD[1]); r(x + 1, 91, 30, 18, WD[3]); r(x + 1, 91, 30, 1, WD[4]); }
  r(0, 116, W, 4, WD[0]); woodFloor(120);
  ctx.globalAlpha = .55; r(86, 138, 148, 30, RD[1]); ctx.globalAlpha = 1; r(88, 140, 144, 26, RD[2]); r(92, 143, 136, 20, RD[1]); for (let i = 0; i < 9; i++) { const x = 100 + i * 15; r(x, 151, 5, 5, YL[2]); px(x + 2, 150, YL[3]); px(x + 2, 156, YL[3]); } for (let i = 0; i < 34; i++) { px(88 + i * 4.3, 139, YL[1]); px(88 + i * 4.3, 166, YL[1]); }
  lamp(104, 10); lamp(214, 10);

  // 货架和罐子
  [[148, 30], [148, 56]].forEach(([x, y]) => { r(x, y, 116, 4, WD[3]); r(x, y, 116, 1, WD[5]); r(x, y + 4, 116, 2, WD[0]); r(x + 4, y + 4, 3, 5, WD[2]); r(x + 108, y + 4, 3, 5, WD[2]); });
  [[156, 18, 9, 12, RD[3], '255,140,120'], [168, 16, 11, 14, CY[3], 0], [182, 20, 8, 10, YL[3], '255,220,120'], [194, 14, 12, 16, PU[3], '190,150,255'], [210, 18, 9, 12, GR[3], 0], [224, 16, 10, 14, '#e8a0c8', '255,160,210'], [240, 19, 9, 11, CY[2], 0], [251, 17, 8, 13, YL[2], 0],
   [156, 42, 10, 14, PU[3], 0], [170, 44, 9, 12, '#e8894a', '255,170,110'], [184, 41, 12, 15, CY[3], '140,220,240'], [200, 44, 9, 12, RD[3], 0], [213, 42, 10, 14, GR[3], '150,230,160'], [240, 43, 9, 13, YL[3], 0], [252, 45, 8, 11, '#e8a0c8', 0]].forEach(a => jar(...a));
  secret(1, 229, 49);

  // 座钟
  r(14, 26, 34, 94, WD[0]); bevel(16, 28, 30, 92, WD, 3); r(14, 22, 34, 6, WD[3]); r(18, 18, 26, 5, WD[4]); r(28, 14, 6, 5, WD[4]); r(14, 22, 34, 1, WD[5]);
  clockFace(31, 44, 11, S.clock, 6, 1); circ(31, 44, 12, BR[2], false);
  r(22, 60, 18, 52, '#0e0a08'); r(22, 60, 18, 1, WD[1]); const sw = S.f.seal_t ? Math.round(Math.sin(tick / 3) * 4) : 0;
  line(31, 62, 31 + sw, 96, BR[2]); circ(31 + sw, 99, 4, BR[3]); circ(31 + sw, 99, 2, BR[4]);
  ctx.globalAlpha = .2; line(24, 108, 36, 62, '#ffffff'); ctx.globalAlpha = 1; r(16, 114, 30, 6, WD[2]);
  hot(16, 26, 30, 94, 'go', 'clock', '座钟');

  // 电码表
  r(272, 28, 36, 48, WD[1]); r(274, 30, 32, 44, PP[0]); r(274, 30, 32, 5, RD[2]); txt('电码', 290, 30, 5, PP[0], 'center', true);
  for (let j = 0; j < 5; j++) { r(277, 39 + j * 6, 3, 3, '#3a2a20'); for (let i = 0; i < 5; i++) { const dot = i < (j + 1); r(283 + i * 5, 40 + j * 6, dot ? 2 : 4, 1, '#3a2a20'); } }
  r(273, 29, 3, 3, RD[3]); r(304, 29, 3, 3, RD[3]);
  hot(274, 30, 32, 44, 'go', 'morse', '电码表');

  // 档案室门
  const open = S.f.pass && S.route === 'l';
  r(48, 32, 28, 62, WD[0]); r(50, 34, 24, 58, open ? '#0a0806' : WD[3]); if (!open) { r(50, 34, 24, 1, WD[5]); r(52, 38, 20, 22, WD[2]); r(52, 64, 20, 24, WD[2]); r(53, 39, 18, 1, WD[4]); r(53, 65, 18, 1, WD[4]); }
  r(54, 41, 16, 7, BR[2]); r(54, 41, 16, 1, BR[4]); txt('档案', 62, 41, 5, '#3a2410', 'center', true);
  for (let i = 0; i < 3; i++) { r(55 + i * 5, 70, 4, 7, BR[1]); r(55 + i * 5, 70, 4, 1, BR[3]); }
  r(69, 78, 3, 3, BR[3]);
  hot(50, 34, 24, 58, S.route === 'l' ? 'go' : 'look', S.route === 'l' ? 'archive' : '门上的牌子写着「档案」。锁是三只拨轮。零说过，档案室不对当户开放。', '档案室');

  // 柜台
  r(54, 90, 212, 6, WD[4]); r(54, 90, 212, 1, WD[5]); r(54, 95, 212, 1, WD[1]); r(58, 96, 204, 24, WD[2]);
  for (let x = 66; x < 258; x += 38) { r(x, 100, 32, 16, WD[1]); r(x + 1, 101, 30, 14, WD[3]); r(x + 1, 101, 30, 1, WD[4]); r(x + 2, 114, 28, 1, WD[2]); }
  r(58, 118, 204, 2, WD[0]);
  r(228, 84, 22, 6, '#3a1e2a'); r(229, 84, 20, 1, '#5a2e40'); r(230, 85, 18, 4, PP[0]); r(238, 85, 1, 4, PP[2]); line(246, 86, 254, 76, PP[1]);

  // 天平
  r(92, 88, 26, 4, BR[1]); r(94, 86, 22, 2, BR[2]); r(104, 60, 2, 28, BR[2]); r(105, 60, 1, 28, BR[4]); circ(105, 59, 2, BR[3]);
  r(84, 62, 42, 2, BR[3]); r(84, 62, 42, 1, BR[4]); line(86, 64, 80, 78, BR[1]); line(86, 64, 92, 78, BR[1]); line(124, 64, 118, 78, BR[1]); line(124, 64, 130, 78, BR[1]);
  r(78, 78, 16, 3, BR[3]); r(78, 80, 16, 1, BR[1]); r(116, 78, 16, 3, BR[3]); r(116, 80, 16, 1, BR[1]);
  for (let i = 0; i < 3; i++) { r(81 + i * 4, 75, 3, 3, BR[4]); r(119 + i * 4, 75, 3, 3, BR[4]); }
  hot(76, 58, 58, 36, 'go', 'scale', '天平');

  // 保管箱（嵌在柜台里）
  bevel(146, 100, 30, 16, MT, 3); r(150, 103, 22, 10, MT[2]); circ(161, 108, 4, MT[1]); circ(161, 108, 3, BR[2]); px(161, 106, BR[4]); r(167, 107, 3, 2, BR[3]);
  hot(146, 100, 30, 16, 'box', '', '保管箱');
  // 铃
  r(198, 90, 20, 2, WD[1]); circ(208, 85, 6, BR[2]); r(202, 85, 13, 5, BR[2]); r(203, 82, 3, 3, BR[4]); r(207, 77, 2, 3, BR[3]); r(201, 89, 15, 1, BR[1]);
  hot(198, 76, 20, 18, 'look', '叮。没有人来。柜台后面只有一排装着别人心事的罐子。', '铃');
  dust(500, 70, 20, 180, 80, 14);
  hatch('store', '库房');
}

/* ---- 温室 ---- */
function drawGreen() {
  r(0, 0, W, 120, '#071019'); starfield(21, 70, 0, 0, W, 116);
  ctx.globalAlpha = .18; circ(260, 26, 30, '#3a8a6a'); ctx.globalAlpha = 1;
  for (let x = 0; x <= W; x += 40) { r(x, 0, 3, 116, GR[1]); r(x, 0, 1, 116, GR[3]); } for (let y = 0; y < 116; y += 38) { r(0, y, W, 2, GR[1]); r(0, y, W, 1, GR[3]); }
  for (let x = 0; x < W; x += 40) for (let y = 0; y < 116; y += 38) { ctx.globalAlpha = .07; line(x + 6, y + 34, x + 24, y + 4, '#ffffff'); ctx.globalAlpha = 1; }
  // 生长灯
  for (let x = 120; x < 290; x += 56) { r(x, 30, 46, 3, MT[1]); r(x + 2, 33, 42, 2, '#ff7ac0'); soft(x + 23, 38, 30, '255,120,200', .14); }
  // 藤蔓
  for (let k = 0; k < 7; k++) { const x0 = 8 + k * 47, len = 18 + (k * 13) % 22; for (let i = 0; i < len; i++) { const x = x0 + Math.round(Math.sin(i * .35 + k + tick * .02) * 2); px(x, 2 + i, GR[2]); if (i % 4 === 1) { px(x + 1, 2 + i, GR[3]); px(x + 2, 3 + i, GR[3]); } if (i % 4 === 3) { px(x - 1, 2 + i, GR[3]); px(x - 2, 3 + i, GR[4]); } } }
  r(0, 116, W, 4, '#05080c'); r(0, 120, W, 60, '#2a2f2a');
  for (let y = 120; y < H; y += 12) for (let x = ((y / 12) % 2) * 12; x < W; x += 24) { r(x, y, 23, 11, '#353b34'); r(x, y, 23, 1, '#454c43'); }
  r(146, 160, 28, 6, MT[1]); for (let i = 0; i < 6; i++) r(148 + i * 4, 161, 2, 4, MT[0]);
  // 玻璃幕墙（照见钟）
  r(10, 10, 96, 100, GR[1]); bevel(12, 12, 92, 96, GR, 2); r(15, 15, 86, 90, '#1a2a3a'); r(15, 15, 86, 1, CY[2]);
  clockFace(58, 58, 16, 500, 3, 2); ctx.globalAlpha = .25; line(22, 100, 60, 20, '#ffffff'); line(30, 100, 68, 20, '#ffffff'); line(80, 100, 98, 60, '#ffffff'); ctx.globalAlpha = 1;
  hot(12, 12, 92, 96, 'go', 'glass', '玻璃幕墙');
  // 花槽
  const n = [9, 6, 5], fc = [[RD[3], RD[4]], [PU[3], PU[4]], [YL[2], YL[3]]];
  for (let i = 0; i < 3; i++) {
    const x = 120 + i * 56;
    for (let k = 0; k < (S.f.water ? n[i] : 5); k++) {
      const fx = x + 5 + (k % 5) * 8, fy = 62 + Math.floor(k / 5) * 14, sway = Math.round(Math.sin(tick * .05 + k + i) * .8);
      if (S.f.water) { line(fx + 1, fy + 4, fx + 1 + sway, 98, GR[2]); px(fx + 2, fy + 10, GR[3]); px(fx + 3, fy + 9, GR[3]); px(fx - 1, fy + 14, GR[3]); px(fx - 2, fy + 13, GR[4]);
        const [c, l] = fc[i]; px(fx + 1 + sway, fy - 1, c); px(fx + sway, fy, c); px(fx + 2 + sway, fy, c); px(fx + 1 + sway, fy + 2, c); px(fx - 1 + sway, fy + 1, c); px(fx + 3 + sway, fy + 1, c); px(fx + 1 + sway, fy + 1, l); px(fx + 1 + sway, fy, YL[3]); }
      else { line(fx + 1, 84, fx + 1 + (k % 2 ? 3 : -3), 98, '#5a6a3a'); px(fx + 1 + (k % 2 ? 3 : -3), 85, '#7a6a3a'); px(fx + (k % 2 ? 4 : -4), 87, '#6a5a32'); }
    }
    r(x, 100, 46, 16, WD[3]); r(x, 100, 46, 1, WD[5]); r(x, 114, 46, 2, WD[1]); for (let j = 0; j < 3; j++) r(x + 1, 104 + j * 4, 44, 1, WD[2]); r(x + 2, 97, 42, 3, S.f.water ? '#2a1a10' : '#4a3424'); for (let j = 0; j < 8; j++) px(x + 4 + j * 5, 98, S.f.water ? '#3a2818' : '#5a4430');
    r(x + 16, 106, 14, 6, PP[1]); txt(['甲', '乙', '丙'][i], x + 23, 106, 5, WD[1], 'center', true);
    hot(x, 56, 46, 60, 'look', S.f.water ? '花开了。一槽一种颜色，朵数数得清。' : '叶子卷着，土是干的。', '花槽');
  }
  // 喷淋管和开关
  pipeH(118, 24, 172, 3, MT); for (let i = 0; i < 3; i++) { r(140 + i * 56, 27, 4, 3, MT[3]); r(141 + i * 56, 30, 2, 1, MT[5]); }
  r(298, 24, 3, 28, MT[2]); bevel(290, 50, 20, 30, MT, 3); r(294, 54, 12, 8, '#0a0d18'); px(300, 58, S.f.power ? 12 : 9); if (S.f.power) soft(300, 58, 5, '120,220,140', .5);
  r(296, 66, 8, 10, MT[1]); r(297, S.f.water ? 67 : 71, 6, 4, S.f.water ? GR[3] : RD[3]);
  hot(288, 48, 24, 34, 'sprinkle', '', '喷淋开关');
  if (S.f.water) for (let i = 0; i < 3; i++) for (let k = 0; k < 7; k++) { const x = 142 + i * 56 + (k - 3) * 4, y = 31 + ((tick * 2 + k * 5) % 30); ctx.globalAlpha = .7; px(x + (k - 3) * (y - 31) / 12, y, CY[4]); ctx.globalAlpha = 1; }
  // 通风口
  r(246, 32, 34, 20, MT[1]); r(248, 34, 30, 16, '#05070c'); if (S.route !== 'c') for (let i = 0; i < 5; i++) { r(251 + i * 6, 34, 2, 16, MT[3]); r(251 + i * 6, 34, 1, 16, MT[5]); } else { r(248, 50, 30, 3, MT[3]); px(256, 42, 7); px(262, 42, 7); }
  rivet(247, 33); rivet(277, 33); rivet(247, 49); rivet(277, 49);
  hot(248, 34, 30, 16, S.route === 'c' ? 'go' : 'look', S.route === 'c' ? 'cargo' : '通风口的栅栏拧得很紧，里面黑漆漆的。', '通风口');
  // 地上：喷壶、土袋、小盆栽
  r(286, 100, 20, 16, CY[2]); r(286, 100, 20, 1, CY[4]); r(286, 114, 20, 2, CY[1]); r(288, 96, 6, 4, CY[2]); r(290, 94, 2, 2, CY[3]); line(306, 104, 313, 97, CY[2]); r(312, 95, 3, 3, CY[3]);
  r(14, 126, 26, 16, '#8a7448'); r(14, 126, 26, 2, '#a89060'); r(18, 131, 18, 5, '#6a5838'); txt('土', 27, 130, 6, '#3a2a18', 'center', true);
  [[54, 130], [74, 136]].forEach(([x, y], i) => { r(x, y + 6, 10, 8, WD[3]); r(x - 1, y + 5, 12, 2, WD[4]); for (let k = 0; k < 4; k++) { line(x + 5, y + 6, x + 1 + k * 3, y - 3 + (k % 2) * 2, GR[2 + (k % 2)]); } });
  // 画架上的向日葵小油画（画中画）
  line(124, 156, 129, 116, WD[2]); line(142, 156, 137, 116, WD[2]); line(133, 156, 133, 132, WD[1]); r(120, 134, 26, 2, WD[3]);
  r(121, 115, 24, 20, WD[4]); r(122, 116, 22, 18, '#22305a'); r(122, 128, 22, 6, '#3a5a3a');
  line(133, 133, 133, 123, GR[3]); r(130, 127, 3, 2, GR[3]);
  if (!S.f.seed) { [[0,-4],[3,-3],[4,0],[3,3],[0,4],[-3,3],[-4,0],[-3,-3]].forEach(([dx, dy]) => r(135 + dx, 121 + dy, 2, 2, YL[3])); r(135, 120, 3, 3, '#5a3a1a'); r(137, 121, 1, 1, '#7a5a2a'); }
  else { ctx.globalAlpha = .7; r(131, 117, 8, 12, YL[2]); r(133, 125, 4, 6, '#5a3a1a'); ctx.globalAlpha = 1; }
  if (S.f.water && !S.f.seed) { px(124, 117 + (tick % 4), CY[4]); px(141, 119 + ((tick + 2) % 4), CY[4]); }
  hot(119, 113, 28, 44, 'paint', '', '向日葵小画');
  hot(14, 124, 26, 18, 'soil', '', '土箱');
  if (!S.f.cat) { const on = tick % 40 < 3 || (tick % 40 > 5 && tick % 40 < 7); if (on) { r(257, 42, 2, 2, '#ffd84a'); r(266, 42, 2, 2, '#ffd84a'); soft(262, 43, 8, [255, 216, 74], .3); } hot(248, 34, 30, 16, 'eyes', '', '通风口'); }
  if (S.f.sun) {   // 种下的向日葵：花盘朝东（画面右边）
    line(27, 126, 27, 100, GR[3]); r(22, 112, 5, 3, GR[4]); r(28, 106, 5, 3, GR[4]);
    for (let i = 0; i < 12; i++) { const t = i / 12 * 6.283; r(30 + Math.round(Math.cos(t) * 5) - 1, 98 + Math.round(Math.sin(t) * 5) - 1, 3, 3, i % 2 ? YL[2] : YL[3]); }
    r(28, 96, 5, 5, '#5a3a1a'); r(31, 97, 2, 2, '#8a6a3a');
  }
  if (S.f.water) { ctx.globalAlpha = .25; r(150, 170, 40, 2, CY[3]); r(200, 166, 26, 2, CY[3]); ctx.globalAlpha = 1; }
  if (S.f.cat && S.route !== 'c') { catAt(100, 108); hot(98, 104, 20, 16, 'pet', '', '螺丝'); }
  dust(700, 118, 30, 170, 80, 16, '200,255,210');
  hatch('nursery', '苗圃');
}

/* ---- 观星台 ---- */
function drawObs() {
  r(0, 0, W, 120, '#0c0f22'); for (let x = 0; x < W; x += 36) { r(x, 0, 1, 120, '#151a36'); }
  [[18, 96], [300, 20], [310, 70], [6, 12]].forEach(([x, y]) => { px(x, y, MT[5]); px(x + 3, y + 2, MT[4]); });
  // 穹顶窗
  r(48, 4, 224, 86, MT[1]); bevel(50, 6, 220, 82, MT, 3);
  ctx.save(); ctx.beginPath(); ctx.rect(56, 12, 208, 70); ctx.clip();
  const g = ctx.createLinearGradient(56, 12, 264, 82); g.addColorStop(0, '#0a0820'); g.addColorStop(.5, '#1a1240'); g.addColorStop(1, '#081a2a'); ctx.fillStyle = g; ctx.fillRect(56, 12, 208, 70);
  ctx.globalAlpha = .35; for (let i = 0; i < 40; i++) { const f = rnd(900 + i), x = 56 + i * 5.3, y = 30 + Math.sin(i * .4) * 12 + f() * 8; soft(x, y, 7 + f() * 6, i % 3 ? '120,90,200' : '80,170,200', .3); } ctx.globalAlpha = 1;
  starfield(31, 150, 56, 12, 208, 70); for (let i = 0; i < 6; i++) { const f = rnd(40 + i), x = 60 + f() * 200, y = 16 + f() * 60; if ((tick + i * 7) % 20 < 10) { px(x, y, 6); px(x - 1, y, 4); px(x + 1, y, 4); px(x, y - 1, 4); px(x, y + 1, 4); } }
  const ss = (tick % 160); if (ss < 14) { for (let k = 0; k < 8; k++) { ctx.globalAlpha = 1 - k / 8; px(230 - ss * 8 + k * 2, 18 + ss * 2 - k / 2, 6); } ctx.globalAlpha = 1; }
  ctx.restore();
  for (let x = 108; x < 264; x += 52) { r(x, 12, 2, 70, MT[2]); r(x, 12, 1, 70, MT[4]); }
  [[54, 10], [264, 10], [54, 82], [264, 82]].forEach(([x, y]) => rivet(x, y));
  if (!S.stars.includes(2)) { if (S.f.ttl) starGem(236, 24); hot(232, 20, 9, 9, 'star', 2, S.f.ttl ? '？' : null); if (!S.f.ttl) hots[hots.length - 1].hide = 1; }
  // 星图
  r(8, 24, 40, 58, WD[1]); r(10, 26, 36, 54, '#1a2a4a'); for (let i = 1; i < 6; i++) { r(10, 26 + i * 9, 36, 1, '#24365a'); r(10 + i * 6, 26, 1, 54, '#24365a'); }
  [[16, 36], [26, 34], [36, 40], [20, 52], [30, 56], [38, 66], [18, 68]].forEach(([x, y]) => { px(x, y, YL[3]); }); line(16, 36, 26, 34, '#5a7ab0'); line(20, 52, 30, 56, '#5a7ab0');
  r(10, 26, 36, 4, '#24365a'); txt('星图', 28, 26, 4, PP[0], 'center', true); r(9, 25, 2, 2, RD[3]); r(45, 25, 2, 2, RD[3]);
  hot(10, 26, 36, 54, 'go', 'chart', '星图');
  // 地板与转台
  r(0, 116, W, 4, '#05070f'); steelFloor(120, ['#0e1122', '#151a30', '#1c2240', '#262e52', '#33406a']);
  ctx.strokeStyle = '#33406a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(166, 140, 56, 14, 0, 0, 6.3); ctx.stroke(); ctx.strokeStyle = '#4a5b92'; ctx.beginPath(); ctx.ellipse(166, 140, 40, 10, 0, 0, 6.3); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; px(166 + Math.cos(a) * 56, 140 + Math.sin(a) * 14, YL[2]); }
  // 望远镜
  r(146, 116, 28, 4, MT[1]); line(160, 110, 146, 120, MT[3], 2); line(160, 110, 174, 120, MT[3], 2); line(160, 110, 160, 121, MT[2], 2); r(156, 104, 8, 8, MT[3]);
  r(158, 80, 4, 26, MT[4]); r(158, 80, 1, 26, MT[6]);
  line(140, 100, 190, 52, MT[2], 7); line(141, 99, 189, 51, MT[4], 3); line(142, 98, 188, 50, MT[6], 1);
  [[150, 91], [166, 76], [180, 62]].forEach(([x, y]) => { line(x - 3, y - 3, x + 3, y + 3, BR[3], 2); });
  r(185, 44, 12, 12, MT[3]); r(185, 44, 12, 1, MT[5]); r(136, 98, 6, 8, MT[2]); r(134, 104, 4, 3, MT[1]);
  if (S.f.lens) { r(187, 46, 8, 8, CY[3]); r(188, 47, 3, 3, CY[4]); soft(191, 50, 6, '140,230,255', .4); }
  line(150, 92, 138, 88, MT[3]); r(130, 84, 8, 8, MT[1]);
  hot(132, 44, 68, 76, 'go', 'tele', '望远镜');
  // 控制台
  r(240, 82, 68, 38, MT[0]); bevel(244, 84, 60, 34, MT, 3); r(248, 87, 12, 8, '#06140a'); for (let i = 0; i < 3; i++) r(249, 88 + i * 2, 4 + ((tick / 3 + i) % 8), 1, GR[3]);
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const x = 264 + i * 8, y = 92 + j * 8; circ(x, y, 2, MT[1]); px(x, y, S.f.seal_l ? 7 : 5); if (S.f.seal_l) soft(x, y, 4, '255,220,120', .4); }
  r(290, 92, 8, 4, S.f.seal_l ? 12 : 9); for (let i = 0; i < 3; i++) { circ(250 + i * 6, 108, 2, MT[4]); px(250 + i * 6, 107, MT[6]); }
  ctx.strokeStyle = '#1a1f36'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(250, 118); ctx.quadraticCurveTo(244, 132, 228, 128); ctx.stroke(); ctx.strokeStyle = RD[2]; ctx.beginPath(); ctx.moveTo(262, 118); ctx.quadraticCurveTo(258, 136, 236, 136); ctx.stroke();
  hot(244, 84, 60, 34, 'go', 'console', '控制台');
  hatch('bunk', '休息舱');
}

/* ---- 机房 ---- */
function drawCore() {
  metalWall(0, 120, ['#0a0c14', '#11141f', '#181c2c', '#22283e', '#30395a', '#4a5684', '#7080b0']);
  pipeH(0, 38, 90, 4); pipeH(232, 38, 88, 4);
  // 机柜
  for (let i = 0; i < 7; i++) {
    const x = 84 + i * 22; bevel(x, 4, 20, 34, MT, 2); r(x + 2, 6, 16, 30, '#07090f');
    for (let j = 0; j < 6; j++) { r(x + 3, 8 + j * 5, 14, 3, MT[1]); const on = S.f.power ? ((i * 3 + j + Math.floor(tick / 2)) % 4) : -1; px(x + 4, 9 + j * 5, on === 0 ? YL[3] : on > 0 ? GR[3] : '#1a2a1a'); px(x + 6, 9 + j * 5, on === 1 ? RD[3] : '#2a1a1a'); r(x + 9, 9 + j * 5, 6, 1, MT[3]); }
  }
  // 线缆垂下来
  [[92, '#1a2238'], [100, RD[1]], [222, '#1a2238'], [230, CY[1]]].forEach(([x, c], k) => { ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 38); ctx.quadraticCurveTo(x + (k < 2 ? 30 : -30), 90, x + (k < 2 ? 46 : -46), 118); ctx.stroke(); });
  // 零
  const P = S.f.power, pu = P ? Math.round(Math.sin(tick / 4) * 1.5) : 0;
  r(146, 92, 28, 28, MT[2]); r(146, 92, 28, 1, MT[4]); for (let i = 0; i < 4; i++) r(150, 98 + i * 5, 20, 2, MT[0]); r(140, 116, 40, 4, MT[1]);
  if (P) soft(160, 70, 46, '110,200,255', .25);
  circ(160, 70, 24 + pu, MT[1]); circ(160, 70, 22 + pu, MT[3]); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + (P ? tick * .02 : 0); px(160 + Math.cos(a) * 20, 70 + Math.sin(a) * 20, P ? CY[4] : MT[2]); }
  circ(160, 70, 17, '#081420'); circ(160, 70, 13, P ? CY[2] : '#16202e'); circ(160, 70, 9, P ? CY[3] : '#1a2838'); circ(160, 70, 5, P ? CY[4] : '#223040');
  const ex = P ? Math.round(Math.sin(tick / 9) * 2) : 0; circ(160 + ex, 70, 2, P ? '#ffffff' : MT[3]); px(157 + ex, 67, '#ffffff');
  hot(134, 44, 52, 76, 'ai', '', '零');
  if (S.route === 'z') { r(151, 100, 18, 14, S.f.pass ? MT[1] : CY[2]); r(153, 103, 14, 2, MT[0]); r(153, 107, 14, 2, MT[0]); hot(148, 97, 24, 20, 'go', 'inner', '主机日志'); }
  // 配电柜
  r(24, 42, 50, 64, MT[0]); bevel(26, 44, 46, 60, MT, 2); r(30, 48, 38, 52, MT[1]);
  spr(42, 58, ['..77.', '.77..', '7777.', '..77.', '.77..', '77...'], 3);
  r(30, 92, 38, 6, YL[2]); hazard(30, 92, 38, 6); px(66, 50, S.f.power ? 12 : 9); if (S.f.power) soft(66, 50, 5, '120,220,140', .6);
  for (let i = 0; i < 3; i++) { r(32 + i * 6, 50, 4, 6, MT[3]); r(32 + i * 6, S.f.power ? 50 : 53, 4, 3, MT[5]); }
  hot(26, 44, 46, 60, 'go', 'tiles', '配电板');
  // 舱门
  r(200, 52, 44, 68, MT[0]); hazard(200, 52, 44, 4); r(200, 52, 4, 68, YL[2]); r(240, 52, 4, 68, YL[2]); for (let y = 52; y < 120; y += 8) { r(200, y, 4, 4, '#1a1a14'); r(240, y + 4, 4, 4, '#1a1a14'); }
  bevel(204, 56, 36, 64, MT, 3); r(206, 58, 32, 60, S.f.gate ? '#0a0806' : MT[2]);
  ['t', 's', 'l'].forEach((k, i) => { r(210 + i * 9, 63, 7, 7, MT[0]); r(211 + i * 9, 64, 5, 5, S.f.gate ? [7, 12, 15][i] : (S.f['seal_' + k] ? [7, 12, 15][i] : '#0a0a10')); if (S.f['seal_' + k]) soft(213 + i * 9, 66, 5, '255,230,150', .3); });
  if (!S.f.gate) { circ(222, 92, 9, MT[3], false); circ(222, 92, 8, MT[4], false); line(214, 92, 230, 92, MT[4]); line(222, 84, 222, 100, MT[4]); circ(222, 92, 2, MT[5]); }
  else { ctx.globalAlpha = .5; r(210, 80, 24, 38, 8); ctx.globalAlpha = 1; soft(222, 100, 24, '255,180,100', .3); }
  hot(204, 56, 36, 64, 'gate', '', '舱门');
  // 保险柜
  r(254, 58, 48, 64, MT[0]); bevel(256, 60, 44, 60, ['#141008', '#241c10', '#3a2e1c', '#54442a', '#76603c', '#a08658'], 2); r(262, 68, 32, 44, S.f.seal_s ? '#0a0806' : '#3a2e1c');
  if (!S.f.seal_s) { circ(278, 90, 9, '#241c10'); circ(278, 90, 7, BR[2]); circ(278, 90, 5, BR[1]); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; px(278 + Math.cos(a) * 7, 90 + Math.sin(a) * 7, BR[4]); } r(277, 84, 2, 5, BR[4]); r(284, 70, 8, 10, '#0a0806'); r(285, 71, 6, 1, YL[2]); r(264, 100, 3, 8, BR[3]); }
  [[258, 62], [298, 62], [258, 116], [298, 116]].forEach(([x, y]) => rivet(x, y));
  hot(256, 60, 44, 60, 'go', 'vault', '保险柜');
  r(0, 116, W, 4, '#05060a'); steelFloor(120, ['#0a0c16', '#10131f', '#161a2a', '#1e2338', '#2a3150']);
  if (P) { ctx.globalAlpha = .12; ctx.fillStyle = '#6ec8ff'; ctx.beginPath(); ctx.ellipse(160, 132, 50, 8, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
  if (P) dust(900, 120, 40, 90, 70, 10, '160,220,255');
  hatch('shaft', '冷却井');
  dimIf(!S.f.power);
}

/* ---- 后舱 ---- */
function drawBack() {
  const E = S.f.end;
  r(0, 0, W, 130, E ? '#3a1828' : '#140c14'); for (let x = 0; x < W; x += 20) r(x, 0, 1, 130, E ? '#4a2234' : '#1c1220');
  if (E) { soft(160, 80, 130, '255,170,110', .28); soft(160, 80, 60, '255,210,140', .25); }
  // 窗
  r(92, 22, 136, 68, WD[1]); bevel(94, 24, 132, 64, WD, 3); r(100, 30, 120, 52, '#05050c'); starfield(41, 50, 100, 30, 120, 52); r(159, 30, 2, 52, WD[2]); r(100, 55, 120, 2, WD[2]);
  ctx.globalAlpha = .18; line(104, 80, 124, 32, '#ffffff'); line(168, 80, 188, 32, '#ffffff'); ctx.globalAlpha = 1;
  // 彩灯和小旗
  ctx.strokeStyle = '#2a1a20'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, 12); ctx.quadraticCurveTo(80, 30, 160, 14); ctx.quadraticCurveTo(240, 30, 316, 12); ctx.stroke();
  for (let i = 0; i < 20; i++) { const t = i / 19, x = 4 + t * 312, y = t < .5 ? 12 + Math.sin(t * 2 * Math.PI) * 9 : 12 + Math.sin((t - .5) * 2 * Math.PI) * 9; const c = [RD[3], YL[3], CY[3], GR[3], '#ff9ad0'][i % 5], on = (Math.floor(tick / 6) + i) % 3; r(x - 1, y + 1, 3, 3, on ? c : '#2a1a20'); if (on && E) soft(x, y + 2, 6, '255,220,160', .3); }
  const word = '生日快乐'; for (let i = 0; i < 4; i++) { const x = 24 + i * 14, y = 34 + i * 2; ctx.fillStyle = [RD[2], YL[2], CY[2], GR[2]][i]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12, y); ctx.lineTo(x + 6, y + 13); ctx.fill(); txt(word[i], x + 6, y + 1, 6, PP[0], 'center', true); }
  for (let i = 0; i < 4; i++) { const x = 244 + i * 14, y = 40 - i * 2; ctx.fillStyle = [GR[2], CY[2], YL[2], RD[2]][i]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12, y); ctx.lineTo(x + 6, y + 13); ctx.fill(); }
  // 墙上的照片框和小架子
  r(28, 60, 30, 24, WD[3]); r(30, 62, 26, 20, '#2a3a4a'); r(32, 74, 22, 6, GR[2]); circ(48, 68, 3, YL[3]);
  r(250, 66, 50, 3, WD[4]); r(254, 58, 6, 8, CY[3]); r(264, 56, 4, 10, PP[0]); r(272, 60, 10, 6, RD[2]); r(288, 54, 6, 12, GR[3]);
  // 地
  woodFloor(130); ctx.globalAlpha = .7; ctx.fillStyle = '#5a2a3a'; ctx.beginPath(); ctx.ellipse(160, 158, 90, 16, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = YL[1]; ctx.beginPath(); ctx.ellipse(160, 158, 84, 13, 0, 0, 6.3); ctx.stroke();
  // 桌子和桌布
  r(88, 120, 144, 6, WD[4]); r(88, 120, 144, 1, WD[5]); r(98, 126, 6, 42, WD[2]); r(216, 126, 6, 42, WD[2]); r(98, 126, 1, 42, WD[4]);
  r(92, 117, 136, 5, PP[0]); for (let x = 92; x < 228; x += 8) { r(x, 122, 4, 4, PP[0]); px(x + 1, 125, PP[2]); }
  // 蛋糕
  r(126, 116, 68, 3, '#dcd8e8'); r(126, 116, 68, 1, '#ffffff');
  r(132, 98, 56, 18, '#f6e4d0'); r(132, 98, 56, 1, '#fff6ea'); r(132, 108, 56, 3, '#e8a0b8'); for (let i = 0; i < 7; i++) { r(134 + i * 8, 98, 4, 3 + (i % 2) * 2, '#e8a0b8'); }
  r(142, 84, 36, 14, '#fff0e0'); r(142, 84, 36, 1, '#ffffff'); r(142, 92, 36, 2, '#e8a0b8'); for (let i = 0; i < 5; i++) r(144 + i * 7, 84, 3, 2 + (i % 2) * 2, '#e8a0b8');
  [[146, 82], [174, 82], [136, 96], [184, 96]].forEach(([x, y]) => { r(x - 2, y - 1, 4, 3, RD[3]); px(x - 1, y - 1, RD[4]); px(x, y - 2, GR[3]); });
  const n = 1 + S.stars.length;
  for (let i = 0; i < n; i++) { const x = 160 - (n - 1) * 4 + i * 8; r(x - 1, 74, 2, 10, [CY[3], PU[3], GR[3], YL[2]][i]); r(x - 1, 74, 1, 10, '#ffffff'); if (E) { r(x - 1, 70 - (tick % 2), 2, 3, YL[3]); px(x - 1 + (tick % 2), 69 - (tick % 2), '#ffffff'); soft(x, 70, 8, '255,210,120', .5); } }
  hot(124, 66, 72, 58, 'cake', '', '蛋糕');
  r(70, 132, 14, 4, WD[3]); r(70, 112, 3, 22, WD[2]); r(70, 112, 14, 3, WD[3]); r(82, 136, 2, 26, WD[2]); r(70, 136, 2, 26, WD[2]);
  dust(1100, 90, 20, 140, 100, 10, '255,230,200');
}

/* ================= 主线：按顺序推进，随时知道下一步 ================= */
// 1 时 → 2 通电 → 3 声 → 4 光 → 5 通行章 → 6 验印 → 7 后舱
function chap() { return !S.f.seal_t ? 1 : !S.f.power ? 2 : !S.f.seal_s ? 3 : !S.f.seal_l ? 4 : !S.f.pass ? 5 : !S.f.gate ? 6 : 7; }
const seen = k => S.notes.includes(k);
function goal() {   // [这一步做什么, 去哪个舱段, 更直白的第二句]
  switch (chap()) {
    case 1: return !seen('glass') ? ['去温室，看看玻璃幕墙上映着的那座钟指着几点。', 'green', '温室左边那一大块玻璃。点它。']
      : ['回当铺，把停了的座钟拨到正确的时间，再拉一下钟摆。玻璃里的钟，是镜子里的样子。', 'shop', '镜子里是 8 点 20 分，真正的时间是 3 点 40 分。'];
    case 2: return !S.f.scale ? ['站里的主电断了。先去当铺的天平，从九枚硬币里找出那枚假币。', 'shop', '点硬币放上左盘或右盘，按「称一次」。只能称两次。']
      : !S.f.fuseIn ? ['假币里藏着一片保险丝。去机房，把它插进配电板的插槽。', 'core', '在下方物品栏选中保险丝，再点配电板左上角的插槽。']
      : ['配电板上的电表记录里，有一路的用电比铭牌多。找出它，别让它合着，再合总闸。', 'core', '对不上的两条记录都含「温室摄像」。拉下它，其余四路合上。'];
    case 3: return !S.f.water ? ['灯亮了。去温室打开喷淋，让花开起来。', 'green', '喷淋开关在温室右边的墙上。']
      : !seen('radio') ? ['码头小艇上的收音机有三个频道，各播一个数字的电码。去听一听，对照当铺的电码表译出来。', 'dock', '码头右边的小艇，点它。']
      : ['把三个数字按温室花槽从左到右的颜色排好，去机房打开保险柜。', 'core', '花槽从左到右是红、紫、黄；对应红灯、紫灯、黄灯三个频道。'];
    case 4: return !S.f.locker ? ['去观星台数一数星图上三个星座各有几颗星，再到码头，按储物柜门上图案的顺序拨密码。', !seen('chart') ? 'obs' : 'dock', '亮的点才是星。柜门上的图案从左到右，就是三个数字的顺序。']
      : !S.f.lens ? ['把储物柜里的镜片装回观星台的望远镜。', 'obs', '在物品栏选中镜片，再点望远镜。']
      : ['望远镜里的星座是倒着的。去观星台的控制台，把它正过来连好。', 'obs', '折射式望远镜看到的上下左右都是反的。'];
    case 5: return !S.route ? ['回到地图上。零有话要问你。', '', '']
      : { z: ['零想不起是谁切断了主电。去机房，从主机底座进入它的日志。', 'core', ''], c: ['跟螺丝走：温室的通风口。', 'green', ''], l: ['去当铺，柜台后面有一扇写着「档案」的门。', 'shop', ''] }[S.route];
    case 6: return ['三枚印章和通行章都齐了。去机房的舱门验印。', 'core', ''];
    default: return ['后舱的门开了。去看看。', 'back', ''];
  }
}
const LOCK = { scale: 2, tiles: 2, radio: 3, vault: 3, locker: 4, tele: 4, console: 4 };
const LOCKDONE = { scale: () => S.f.scale, tiles: () => S.f.power, radio: () => S.f.seal_s, vault: () => S.f.seal_s, locker: () => S.f.locker, tele: () => S.f.seal_l, console: () => S.f.seal_l };
const goalPlace = () => { const g = goal()[1]; return g ? V[g].name : '地图'; };
function locked(p) { return LOCK[p] && chap() < LOCK[p] && !LOCKDONE[p](); }

/* ================= 冷知识（已审核） ================= */
const FACTS = {
  fire: ['灭火器', '在空间站里点蜡烛，火焰是一颗蓝色的球。地面上热空气往上走、冷空气补进来，才把火焰拉成水滴形；失重的时候没有这种对流。', '火焰的形状，是重力给的。'],
  mirror: ['镜子', '镜子其实没有把左右对调，它对调的是前后。我们觉得左右反了，是因为下意识想象自己转了个身，走进了镜子里。', '很多「反过来」，是我们自己的视角造成的。'],
  morse: ['电码', '电码里 E 只有一个点，是因为莫尔斯的合作者阿尔弗雷德·维尔去报社数了铅字盒：哪个字母的铅字备得最多，就给它最短的码。电码的大部分功劳，其实是维尔的。', '常用的短、罕用的长，今天的压缩算法也是这个思路。'],
  power: ['电', '铜线里的电子，平均每秒只往前挪零点几毫米，比钟的分针还慢。灯一开就亮，是因为推着它们走的电磁信号，以接近光速沿着导线传了过去。', '「电」和「电子」跑的不是一个速度。'],
  cat: ['猫', '猫尝不出甜味。甜味受体是两个基因造的蛋白拼起来的，猫科动物的其中一个基因早就坏掉了，老虎、猎豹也一样。', '螺丝把草莓放到你的蛋糕上，不是因为馋。'],
  sun: ['向日葵', '只有还在长个子的向日葵会追着太阳转。开花以后，它们就固定朝东了：朝东的花早上暖得快，引来的传粉昆虫是朝西的五倍。', '「向日葵一直追着太阳」，只对了一半。']
};
const FACTIN = { fire: '这只灭火器是地面上的老型号。在这里，它几乎用不上。', power: '配电板角上的小灯泡稳稳地亮着。', mirror: '玻璃里的钟，现在和走廊里那座一起走着。', morse: '电码表的角落里，有人用铅笔写了一行小字：「E 最短，因为 E 最多。」' };
function factHot(x, y, w, h, k, tip) {   // 藏着「原来如此」的物件：没看过时会闪一颗小星
  hot(x, y, w, h, 'fact', k, tip); if (!S.facts.includes(k) && tick % 16 < 8) { r(x + w - 2, y - 1, 1, 3, '#fff6c8'); r(x + w - 3, y, 3, 1, '#fff6c8'); }
}
function fact(k, who = Z) {
  const f = FACTS[k]; if (!f) return [];
  const first = !S.facts.includes(k); if (first) S.facts.push(k);
  return [who('（冷知识 · ' + f[0] + '）' + f[1]), who(f[2])];
}

/* ================= 场景 ================= */
const V = {};
const reg = (id, o) => { V[id] = o; };

reg('map', { name: '全站地图', desc: () => '零号站的结构图。五个舱段围着中枢，点一个舱段就能过去。' + (S.f.gate ? '后舱的灯亮了。' : '还有一个舱段没有亮灯。'),
  draw() {
    r(0, 0, W, H, 0); starfield(7, 150, 0, 0, W, H);
    circ(262, 150, 30, 2); circ(268, 156, 30, 0);                // 远处的行星
    const cor = (x, y, w, h) => { r(x, y, w, h, 2); r(x, y, w, 1, 3); };
    cor(84, 86, 62, 6); cor(125, 54, 6, 28); cor(196, 56, 6, 26); cor(176, 86, 76, 6); cor(190, 100, 6, 26); cor(124, 100, 6, 30);
    circ(160, 90, 18, 3); circ(160, 90, 15, 2); circ(160, 90, 6, S.f.power ? 5 : 1);
    ['t', 's', 'l'].forEach((k, i) => { if (S.f['seal_' + k]) px(152 + i * 8, 76, [7, 12, 15][i]); });
    const mod = (x, y, w, h, c, cl, id, tip, lit = true) => {
      r(x, y, w, h, lit ? c : 1); r(x, y, w, 2, lit ? cl : 2); r(x, y + h - 2, w, 2, 0); r(x, y, 2, h, lit ? cl : 2);
      for (let i = 0; i * 9 + 8 < w - 4; i++) r(x + 6 + i * 9, y + h - 10, 4, 4, lit ? ((i + Math.floor(tick / 8)) % 5 ? 7 : 8) : 0);
      if (id) hot(x, y, w, h, 'go', id, tip);
    };
    mod(36, 68, 50, 40, 3, 4, 'dock', '码头'); r(18, 80, 18, 14, 4); r(14, 84, 4, 6, 5); r(22, 83, 6, 4, 1);          // 小艇
    mod(98, 18, 60, 36, 10, 9, 'shop', '当铺'); circ(128, 32, 5, 7); r(127, 26, 2, 3, 7); circ(128, 32, 2, 10);
    mod(174, 16, 62, 40, 11, 12, 'green', '温室'); r(190, 26, 2, 12, 12); r(186, 24, 10, 4, 12); r(210, 28, 2, 10, 12); r(207, 26, 8, 3, 12);
    circ(270, 88, 22, 4); circ(270, 88, 19, 1); starfield(3, 14, 256, 74, 28, 28); hot(248, 66, 44, 44, 'go', 'obs', '观星台'); r(250, 98, 40, 12, 3); for (let i = 0; i < 4; i++) r(254 + i * 9, 102, 4, 4, 7);
    mod(166, 126, 54, 38, 2, 5, 'core', '机房'); circ(193, 141, 6, S.f.power ? 5 : 3); px(193, 141, 6);
    mod(100, 130, 50, 34, 8, 7, S.f.gate ? 'back' : null, '后舱', !!S.f.gate); if (!S.f.gate) { hot(100, 130, 50, 34, 'look', '这个舱段没有亮灯，门从机房那一侧锁着。', '？？？'); r(122, 142, 6, 8, 2); }
  },
  hint: () => ['下一步：' + goal()[0], goal()[2] || ('下一步：' + goal()[0])] });

reg('dock', { name: '码头', parent: 'map', desc: () => '你的小艇泊在窗外。左边一排储物柜，右边一台贴着「故障」的自动贩卖机。',
  draw() { drawDock(); },
  hint: () => [S.f.locker ? (S.f.power ? '小艇里的收音机有三个频道。通电浇花以后，温室的花会告诉你先听哪一个。' : '码头这里暂时没有别的事了。机房还没通电。') : '储物柜门上画着三个图案。这些图案在观星台的星图上也有。',
    S.f.locker ? '收音机的三个频道各播一个数字。温室三槽花的颜色，从左到右，就是三个数字的顺序。' : '数一数星图上每个星座有几颗星，按柜门图案的顺序拨进去。'] });

reg('shop', { name: '当铺', parent: 'map', desc: () => '柜台上摆着一台天平。墙角立着一座停了的座钟，另一面墙上贴着一张电码表。',
  draw() { drawShop(); },
  hint: () => [!S.f.scale ? '天平上有九枚硬币，其中一枚不一样。' : !S.f.seal_t ? '座钟停了。温室里有一面能照见钟的玻璃。' : '电码表先记着，听收音机的时候用得上。', '当铺里能做的事：称硬币、拨座钟、看电码表。'] });

reg('green', { name: '温室', parent: 'map', desc: () => '三只花槽，一整面玻璃幕墙。' + (S.f.water ? '花开了。' : '植物蔫着，喷淋的开关在右边墙上。'),
  draw() { drawGreen(); },
  hint: () => [!S.f.seal_t ? '玻璃上映着走廊里的钟。镜子里的东西是反的。' : S.f.water ? '三槽花的颜色，从左到右，记下来。小艇的收音机上有三盏同样颜色的灯。' : '喷淋要通电才转。电在机房。', !S.f.seal_t ? '玻璃里是 8 点 20 分，左右翻回来是 3 点 40 分。去当铺拨座钟。' : '从左到右是红、紫、黄。保险柜的三位数，就按这个顺序听收音机的三个频道。'] });

reg('obs', { name: '观星台', parent: 'map', desc: () => '穹顶外是一整片星空。一架望远镜，一张星图，一台布满插孔的控制台。',
  draw() { drawObs(); },
  hint: () => S.f.seal_l && !S.stars.includes(2) ? ['这一题要动的是网页本身：看一眼浏览器标签页上的标题。', (S.f.ttl = 1, '标签页上写着：穹顶玻璃右上角，有一颗星不在星图上。现在它亮出来了。')] : [!S.f.locker ? '星图上有三个星座。码头储物柜的门上也有这三个图案。' : !S.f.lens ? '储物柜里的镜片该装回望远镜了。' : '控制台要你把看到的星座连出来。注意镜筒上的铭牌。', !S.f.seal_l ? '望远镜里的画面上下左右都是反的。把看到的图形转半圈再连。' : '观星台的事办完了。'] });

reg('core', { name: '机房', parent: 'map', desc: () => S.f.power ? '主机的光稳定下来了。零在看着你。' : '机房里很暗。中间的主机只剩一点微光，左边墙上是配电板。',
  draw() { drawCore(); },
  hint: () => [!S.f.power ? '配电板缺一根保险丝。当铺的天平上，有一枚硬币不太对劲。' : !S.f.seal_s ? '保险柜要三位数字。零把它存进了三段广播里，小艇的收音机收得到。' : '集齐三枚印章就去点舱门。', !S.f.power ? '当铺天平找出假币（保险丝藏在里面）→ 回来装上并接通线路。' : '温室通电浇花，记下三槽花的颜色顺序 → 小艇收音机按这个顺序听三个频道 → 对照当铺的电码表 → 保险柜。'] });

reg('back', { name: '后舱', parent: 'map', desc: () => '很小的一间舱室。桌上放着一只蛋糕，不为哪一天，只为你来了。',
  draw() { drawBack(); },
  hint: () => S.stars.length && !S.f.lit && S.f.cakeTry ? ['这一题要动的是网页本身：把屏幕上方的 ✦ 拖到蛋糕上。', '按住 ✦ 不放，拖到蛋糕上再松手。实在不行，再点一次蛋糕，零会替你放。'] : ['点一下蛋糕。', '点一下蛋糕。'] });

/* ---------- 特写 ---------- */
reg('scale', { name: '天平', parent: 'shop', desc: () => S.f.scale ? '假币已经找到了。' : '九枚硬币里有一枚略轻。点硬币可以把它放上左盘、右盘或放回托盘。天平只借两次。',
  draw() {
    const sc = S.sc, d = sc.last === 'L' ? -7 : sc.last === 'R' ? 7 : 0, ly = 34 + d, ry = 34 - d;
    r(0, 0, W, H, 1); r(0, 150, W, 30, 13); r(0, 150, W, 2, 14);
    r(157, 26, 6, 110, 7); r(136, 134, 48, 6, 14); line(80, ly, 240, ry, 7, 3); circ(160, 34, 4, 8);
    const pan = (x, y) => { line(x, y, x - 26, y + 42, 14); line(x, y, x + 26, y + 42, 14); r(x - 32, y + 42, 64, 4, 7); r(x - 28, y + 46, 56, 2, 8); };
    pan(80, ly); pan(240, ry);
    if (shuf > 0) { const f = rnd(tick * 7 + 3), perm = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => f() - .5); perm.forEach((q, i) => { const y = 164 - ((i + tick) % 2) * 8; circ(44 + q * 29, y, 6, 7); circ(44 + q * 29, y, 4, 8, false); }); return; }
    const L = [], R = []; sc.loc.forEach((v, i) => { if (v === 1) L.push(i); if (v === 2) R.push(i); });
    const coin = (i, x, y) => { circ(x, y, 6, 7); circ(x, y, 4, 8, false); num(x - 1, y - 2, i + 1, 0); if (!S.f.scale) hot(x - 7, y - 7, 14, 14, 'coin', i, sc.acc ? '指认' : ''); };
    sc.loc.forEach((v, i) => {
      if (v === 0) coin(i, 44 + i * 29, 164);
      else { const arr = v === 1 ? L : R, j = arr.indexOf(i), n = arr.length, cx = v === 1 ? 80 : 240, py = (v === 1 ? ly : ry) + 35; coin(i, cx - (n - 1) * (n > 4 ? 5.5 : 7) + j * (n > 4 ? 11 : 14), py - (j % 2) * 3); }
    });
  },
  btns: () => S.f.scale || shuf ? [] : [['称量（剩 ' + S.sc.left + ' 次）', 'weigh'], [S.sc.acc ? '现在点一枚硬币' : '指认假币', 'acc'], ['重来', 'screset']],
  hint: () => ['瞎猜是猜不中的：只有称到能确定是哪一枚，指认才算数。', '先三枚对三枚。平了，假币在没上秤的三枚里；不平，在翘起的那一边。再从这三枚里拿两枚一对一。'],
  skip() { winScale(); } });

reg('clock', { name: '座钟', parent: 'shop', desc: () => S.f.seal_t ? '钟走起来了。滴，答。' : '座钟停着。指针可以拨，拨好以后拉一下钟摆。',
  draw() { r(0, 0, W, H, 13); r(90, 0, 140, H, 10); r(90, 0, 2, H, 14); r(228, 0, 2, H, 14); clockFace(160, 78, 62, S.clock, 6, 1, true); r(150, 146, 20, 34, 0); const sw = S.f.seal_t ? Math.round(Math.sin(tick / 3) * 6) : 0; line(160, 146, 160 + sw, 166, 7, 2); circ(160 + sw, 170, 5, 7); },
  btns: () => S.f.seal_t ? [] : [['时针 −', 'ch', -60], ['时针 ＋', 'ch', 60], ['分针 −5', 'ch', -5], ['分针 ＋5', 'ch', 5], ['拉钟摆', 'pend']],
  hint: () => ['正确的时间不在当铺里。温室有一面玻璃。', '玻璃里映出 8 点 20 分，镜像翻回来是 3 点 40 分。拨好后拉钟摆。'],
  skip() { S.clock = CLOCK_OK; A.pend(); } });

reg('glass', { name: '玻璃幕墙', parent: 'green', desc: () => '玻璃上映着你身后走廊里的那座钟。钟面没有数字，只有刻度。',
  draw() { r(0, 0, W, H, 2); for (let i = 0; i < 9; i++) line(-40 + i * 50, H, 30 + i * 50, 0, 3); r(0, 0, W, 6, 11); r(0, H - 6, W, 6, 11); r(0, 0, 6, H, 11); r(W - 6, 0, 6, H, 11); clockFace(160, 90, 58, 500, 5, 2); ctx.globalAlpha = .25; r(40, 20, 240, 140, 4); ctx.globalAlpha = 1; if (S.f.seal_t) factHot(100, 30, 120, 120, 'mirror', '玻璃里的钟'); },
  hint: () => ['镜子里的钟，左右是反的。', '看到的是 8 点 20 分，真正的时间是 3 点 40 分。'] });

reg('locker', { name: '储物柜', parent: 'dock', desc: () => S.f.locker ? '柜子开着，里面空了。' : '三扇柜门共用一把密码锁。每个转轮上方各有一个图案。点转轮可以拨数字。',
  draw() {
    r(0, 0, W, H, 3); r(0, 0, W, 4, 4);
    ['sail', 'fish', 'key'].forEach((k, i) => {
      const x = 44 + i * 82; r(x, 16, 68, 150, S.f.locker ? 0 : 2); r(x, 16, 68, 2, 4);
      if (!S.f.locker) { spr(x + 16, 28, ICON[k], 4); r(x + 20, 92, 28, 44, 0); r(x + 22, 94, 24, 40, 6); num(x + 28, 104, S.lock[i], 0, 4); hot(x + 16, 88, 36, 52, 'wheel', i, '转轮'); }
    });
  },
  btns: () => S.f.locker ? [] : [['开锁', 'unlock']],
  hint: () => ['帆、鱼、钥匙。观星台的星图上有同样的三个星座。', '数星星：帆 7 颗，鱼 6 颗，钥匙 4 颗。密码 764。'],
  skip() { S.lock = LOCK_CODE.slice(); A.unlock(); } });

const CONST = {
  fish: { pts: [[6, 22], [18, 12], [32, 10], [46, 18], [32, 28], [18, 30]], ln: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]] },
  key: { pts: [[6, 12], [20, 20], [34, 20], [48, 28]], ln: [[0,1],[1,2],[2,3]] },
  sail: { pts: [[26, 2], [26, 16], [26, 30], [10, 30], [42, 30], [40, 18], [33, 9]], ln: [[0,1],[1,2],[3,2],[2,4],[0,6],[6,5],[5,1]] }
};
reg('chart', { name: '星图', parent: 'obs', desc: () => '一张手绘星图，画着三个星座：鱼、钥匙、帆。亮的点才是星。',
  draw() {
    r(0, 0, W, H, 1); r(10, 8, 300, 164, 2); r(10, 8, 300, 2, 4);
    ['fish', 'key', 'sail'].forEach((k, i) => {
      const x = 26 + i * 96, y = 60, c = CONST[k];
      spr(x + 22, 22, ICON[k], 2);
      c.ln.forEach(([a, b]) => line(x + c.pts[a][0], y + c.pts[a][1], x + c.pts[b][0], y + c.pts[b][1], 3));
      c.pts.forEach(([sx, sy]) => { r(x + sx - 1, y + sy, 3, 1, 5); r(x + sx, y + sy - 1, 1, 3, 5); px(x + sx, y + sy, 6); });
      r(x, 120, 60, 1, 3);
    });
  },
  hint: () => ['数清每个星座有几颗星，码头的储物柜用得上。', '鱼 6 颗，钥匙 4 颗，帆 7 颗。'] });

const PEGXY = i => [160 + (i % 3 - 1) * 34, 90 + (Math.floor(i / 3) - 1) * 34];
reg('tele', { name: '望远镜', parent: 'obs', desc: () => S.f.lens ? '目镜里是一个由五颗亮星连成的星座。镜筒铭牌上写着：「折射式。所见上下左右皆反。」' : '镜筒里一片模糊。物镜的位置是空的。',
  draw() {
    r(0, 0, W, H, 0); circ(160, 90, 86, 3); circ(160, 90, 82, 0);
    if (!S.f.lens) { const f = rnd(5 + tick); for (let i = 0; i < 260; i++) { const a = f() * 6.283, d = f() * 78; px(160 + Math.cos(a) * d, 90 + Math.sin(a) * d, f() > .5 ? 2 : 1); } hot(74, 4, 172, 172, 'lens', '', '目镜'); return; }
    const f = rnd(77); for (let i = 0; i < 60; i++) { const a = f() * 6.283, d = f() * 78; px(160 + Math.cos(a) * d, 90 + Math.sin(a) * d, 2); }
    for (let i = 1; i < TELE.length; i++) { const [x0, y0] = PEGXY(TELE[i - 1]), [x1, y1] = PEGXY(TELE[i]); line(x0, y0, x1, y1, 3); }
    for (let i = 0; i < 9; i++) { const [x, y] = PEGXY(i), on = TELE.includes(i); if (on) { r(x - 2, y, 5, 1, 7); r(x, y - 2, 1, 5, 7); px(x, y, 6); } else px(x, y, 3); }
  },
  hint: () => [S.f.lens ? '把这个图形记下来，去控制台连。别忘了铭牌上的话。' : '缺一片镜片。码头的储物柜里有。', S.f.lens ? '上下左右皆反，等于把图形转半圈。' : '先解开储物柜（星图数星星）。'] });

reg('console', { name: '控制台', parent: 'obs', desc: () => S.f.seal_l ? '九个插孔都暗了下去，控制台完成了它的工作。' : '九个插孔排成三行三列。依次点插孔可以拉线，把星座连出来再确认。',
  draw() {
    r(0, 0, W, H, 2); r(70, 16, 180, 150, 3); r(70, 16, 180, 2, 4); r(74, 20, 172, 142, 1);
    const p = S.f.seal_l ? PEG_OK : S.peg;
    for (let i = 1; i < p.length; i++) { const [x0, y0] = PEGXY(p[i - 1]), [x1, y1] = PEGXY(p[i]); line(x0, y0, x1, y1, S.f.seal_l ? 7 : 5, 2); }
    for (let i = 0; i < 9; i++) { const [x, y] = PEGXY(i), on = p.includes(i); circ(x, y, 6, 3); circ(x, y, 4, on ? (S.f.seal_l ? 7 : 5) : 0); if (!S.f.seal_l) hot(x - 9, y - 9, 18, 18, 'peg', i, ''); }
  },
  btns: () => S.f.seal_l ? [] : [['清除', 'pegclr'], ['确认', 'pegok']],
  hint: () => ['要连的图形在望远镜里。望远镜看到的是倒过来的。', '正确的连法：左上 → 左中 → 正中 → 右上 → 右中。'],
  skip() { S.peg = PEG_OK.slice(); A.pegok(); } });

const CHL = [[7, '黄灯'], [9, '红灯'], [15, '紫灯']], CHD = [7, 4, 1];
reg('radio', { name: '小艇 · 收音机', parent: 'dock', desc: () => '小艇仪表台上的收音机有三个频道，各有一盏不同颜色的灯。每个频道都在循环播同一个数字的电码：短的是点，长的是划。',
  draw() {
    r(0, 0, W, H, 2); r(0, 0, W, 50, 0); starfield(51, 50, 0, 0, W, 50); r(0, 48, W, 4, 4);
    r(40, 62, 240, 104, 13); r(40, 62, 240, 3, 14); circ(86, 114, 30, 0); for (let i = 0; i < 7; i++) r(62, 94 + i * 6, 48, 2, 13);
    r(130, 72, 140, 34, 0); r(132, 74, 136, 30, 1);
    if (S.chan == null) txt('选一个频道', 200, 82, 10, 4, 'center'); else { txt(CHL[S.chan][1] + '频道', 140, 78, 9, CHL[S.chan][0]); txt('循环播一个数字', 140, 91, 7, 4, 'left', false); circ(248, 89, 10, 14); circ(248, 89, 8, mOn ? 6 : 0); }
    CHL.forEach(([c, n], i) => { const x = 134 + i * 46, on = S.chan === i; r(x, 116, 40, 38, on ? 6 : 14); r(x + 2, 118, 36, 34, 1); circ(x + 20, 130, 7, c); if (on) { ctx.globalAlpha = .35; circ(x + 20, 130, 10, c); ctx.globalAlpha = 1; } txt(n, x + 20, 141, 7, on ? 6 : 4, 'center'); hot(x, 116, 40, 38, 'chan', i, n + '频道'); });
  },
  btns: () => [['黄灯频道', 'chan', 0], ['红灯频道', 'chan', 1], ['紫灯频道', 'chan', 2], ['关掉', 'chan', '-']],
  skip() { S.chan = null; say('零替你把三段广播都听完了：红灯频道是 4，紫灯频道是 1，黄灯频道是 7。先后顺序，看温室的花。'); },
  hint: () => ['每个频道播的是一个数字。当铺墙上有电码表，对着小灯的长短抄下来。三个数字谁先谁后，这里看不出来。', '红灯是 ····—（4），紫灯是 ·————（1），黄灯是 ——···（7）。温室的花从左到右是红、紫、黄，所以保险柜是 417。'] });

reg('morse', { name: '电码表', parent: 'shop', desc: () => '一张旧式数字电码表。短的是点，长的是划，数字之间停顿更久。',
  draw() {
    r(0, 0, W, H, 13); r(30, 6, 260, 168, 6); r(30, 6, 260, 10, 14);
    const row = (d, x, y) => { num(x, y, d, 0, 3); let cx = x + 18; for (const ch of MORSE[d]) { if (ch === '.') { r(cx, y + 5, 5, 5, 0); cx += 9; } else { r(cx, y + 5, 14, 5, 0); cx += 18; } } };
    ['1', '2', '3', '4', '5'].forEach((d, i) => row(d, 42, 26 + i * 29)); ['6', '7', '8', '9', '0'].forEach((d, i) => row(d, 168, 26 + i * 29));
    if (S.f.seal_s) { txt('E 最短，因为 E 最多', 280, 160, 7, 14, 'right', false); factHot(200, 152, 84, 14, 'morse', '铅笔小字'); }
  },
  hint: () => ['听收音机的时候回来对照。', '如果实在抄不下来，机房保险柜那里可以再点提示。'] });

// 配电板：断电前的电表记录里，有两条读数和铭牌对不上。多吃电的是「温室摄像」那一路（清洁臂动过手脚）。
const BRK = [['码头', 2], ['当铺', 2], ['温室灯', 3], ['温室摄像', 1], ['观星台', 2]], BRK_REAL = [2, 2, 3, 5, 2], FUSE_MAX = 10, BRK_OK = [1, 1, 1, 0, 1];
const TAPE = [[[0, 1, 2], 7], [[1, 3, 4], 9], [[0, 3], 7], [[2, 4], 5]];
reg('tiles', { name: '配电板', parent: 'core', desc: () => S.f.power ? '五路闸里，四路合着，「温室摄像」那一路拉着。' : S.f.fuseIn ? '五路分闸，每路的铭牌上写着它该用几格电。保险丝最多扛 10 格。右边夹着一卷断电前的电表记录。合好分闸，再合总闸。' : '五路分闸，每路的铭牌上写着它该用几格电。总闸下面的保险丝插槽是空的。',
  draw() {
    r(0, 0, W, H, MT[0]); bevel(10, 8, 206, 164, MT, 2); r(14, 12, 198, 156, MT[1]);
    // 保险丝和总闸
    txt('保险丝 · 10 格', 24, 18, 7, MT[5]); r(24, 30, 48, 18, '#07090f'); if (S.f.fuseIn) { r(30, 35, 36, 8, '#cfe8f0'); r(30, 35, 5, 8, BR[3]); r(61, 35, 5, 8, BR[3]); r(35, 38, 26, 1, S.f.power ? YL[4] : MT[3]); }
    hot(20, 26, 56, 26, 'fuseSlot', '', '保险丝插槽');
    r(150, 24, 52, 30, MT[0]); txt('总闸', 176, 16, 7, MT[5], 'center'); r(168, 28, 16, 22, MT[2]); r(172, S.f.power ? 30 : 40, 8, 8, S.f.power ? GR[3] : RD[3]);
    // 五路分闸
    BRK.forEach(([n, w], i) => { const x = 22 + i * 38, on = S.f.power ? BRK_OK[i] : S.brk[i];
      r(x, 64, 32, 92, MT[2]); r(x, 64, 32, 1, MT[4]); txt(n, x + 16, 68, 7, PP[0], 'center');
      r(x + 10, 86, 12, 40, '#07090f'); r(x + 11, on ? 88 : 110, 10, 14, on ? GR[3] : MT[4]); r(x + 11, on ? 88 : 110, 10, 1, '#ffffff');
      txt(on ? '合' : '断', x + 16, 130, 7, on ? GR[4] : MT[5], 'center'); txt('额定 ' + w, x + 16, 142, 7, YL[3], 'center');
      if (!S.f.power) hot(x, 64, 32, 92, 'brk', i, n); });
    // 电表记录（纸带）
    r(224, 10, 88, 160, PP[1]); r(222, 8, 88, 160, PP[0]); r(222, 8, 88, 3, RD[2]); txt('断电前的电表记录', 266, 14, 7, '#3a2a20', 'center');
    TAPE.forEach(([set, v], k) => { const y = 30 + k * 32; txt(set.map(i => BRK[i][0]).join('+'), 228, y, 7, '#3a2a20', 'left', false); txt('读数 ' + v, 304, y + 12, 7, '#3a2a20', 'right'); r(228, y + 25, 76, 1, PP[2]); });
    txt('……之后熔断', 266, 158, 7, RD[2], 'center', false);
    if (S.f.power) factHot(160, 22, 50, 34, 'power', '总闸的指示灯');
  },
  btns: () => S.f.power ? [] : [['合上总闸', 'mains']],
  hint: () => ['断电前的电表记录里，有两条读数比铭牌加起来多。多出来的电，出在两条里都有、正常的两条里都没有的那一路。', '对不上的两条都含「温室摄像」，对得上的两条都不含它。把「温室摄像」拉下来，其余四路合上，再合总闸。'],
  skip() { S.brk = BRK_OK.slice(); if (S.f.fuseIn) A.mains(); else say('分闸已经摆好了，但还缺保险丝。'); } });

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];
reg('vault', { name: '保险柜', parent: 'core', desc: () => S.f.seal_s ? '保险柜开着，里面空了。' : '保险柜要三位数字。',
  draw() {
    r(0, 0, W, H, 13); r(40, 14, 240, 152, 14); r(40, 14, 240, 2, 6); r(52, 30, 104, 40, 0); num(62, 40, S.f.seal_s ? 'OK' : (S.vault + '___').slice(0, 3), S.f.seal_s ? 12 : 9, 5);
    circ(104, 118, 26, 13); circ(104, 118, 22, 14); r(102, 98, 4, 20, 6); circ(104, 118, 4, 6);
    KEYS.forEach((k, i) => { const x = 180 + (i % 3) * 30, y = 26 + Math.floor(i / 3) * 34; r(x, y, 26, 28, 1); r(x, y, 26, 2, 3); num(x + (k === 'OK' ? 6 : 10), y + 9, k, k === 'OK' ? 12 : k === 'C' ? 7 : 6, 2); if (!S.f.seal_s) hot(x, y, 26, 28, 'vk', k, ''); });
  },
  hint: () => ['零把这三个数字存进了三段广播。小艇的收音机有三个频道，一个频道一个数字。先后顺序看温室的花。', '花从左到右是红、紫、黄。红灯频道是 4，紫灯频道是 1，黄灯频道是 7。密码 417。'],
  skip() { S.vault = VAULT_CODE; A.vk('OK'); } });

/* ---------- 第二幕：三条线各自的场景 ---------- */
const C = t => ({ who: '螺丝', t });
const CAT = ['..5.....5.....', '.555...555....', '.5555555555...', '.5575555755..5', '.55555555555.5', '..5555555555.5', '..55555555555.', '..55.55..55.5.', '..5..5...5..5.'];
const sealsN = () => ['t', 's', 'l'].filter(k => S.f['seal_' + k]).length;
const ITEMNAME = { knife: '蝴蝶刀', shuttle: '羽毛球', cherry: '樱桃', cake: '蛋糕', roll: '花卷', flower: '白色的花', ghost: '小幽灵手办' };
const ITEMTEXT = {
  knife: '一把蝴蝶刀。刀柄磨得发亮，甩起来一定很顺手。标签上写着：「代为保管，等你上线。」',
  shuttle: '一只羽毛球。羽毛有点旧了，球头却很干净。标签上写着：「下次还是你发球。」',
  cherry: '一对樱桃，还带着梗。在这座站里，它们一直没有坏。标签上写着：「最甜的留给你。」',
  cake: '一小块蛋糕，奶油上压着一颗樱桃。标签上写着：「不是生日也可以吃。」',
  roll: '一只花卷，还是热的。没人知道它为什么一直是热的。标签上写着：「趁热。」',
  ghost: '一只小幽灵手办，巴掌大，白白的，底座上有一道磕痕。在这座站里，它每晚都自己换一个方向站着。标签上写着：「不吓人，只陪人。」',
  flower: '一朵白色的花，插在一只小玻璃瓶里。标签上写着：「开得刚刚好。」'
};
const BMP = {};
function mkBmp(f, N = 32) {
  const g = Array.from({ length: N }, () => Array(N).fill('.'));
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < N && y >= 0 && y < N) g[y][x] = c.toString(36); };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); };
  const disc = (cx, cy, rx, ry, c) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + .3) + (y * y) / (ry * ry + .3) <= 1) set(cx + x, cy + y, c); };
  const get = (x, y) => (g[y] && g[y][x]) || '.';
  f({ set, rect, disc, get });
  return g.map(r => r.join(''));
}
function knifeBmp(N) {
  // CS2 butterfly knife (Gamma-Doppler emerald look), traced from a reference silhouette. k = resolution multiplier over the 48 grid.
  const k = N / 48;
  return mkBmp(({ set, get }) => {
    const T = ([x, y]) => [((x - 72) * .098 + 3.2) * k, ((y - 110) * .098 + 4.2) * k];
    const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
    const P0 = T([290, 262]), P1 = T([372, 328]), P2 = T([476, 440]);
    const bez = (t) => [(1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
    const nrm = (t) => { const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]), l = Math.hypot(dx, dy); return [-dy / l, dx / l, dx / l, dy / l]; };
    const stamp = (t, off, rad, c) => { const [cx, cy] = bez(t), [nx, ny] = nrm(t), ox = cx + nx * off * k, oy = cy + ny * off * k, R = rad * k, m = Math.ceil(R) + 1; for (let y = -m; y <= m; y++) for (let x = -m; x <= m; x++) if (x * x + y * y <= R * R) set(Math.round(ox) + x, Math.round(oy) + y, c); };
    const dt = .002 / k;
    // handle: two separate halves split by a seam
    for (let t = 0; t <= 1; t += dt) { stamp(t, -1.35, 1.25, 1); stamp(t, 1.35, 1.25, 1); }
    for (let t = .05; t <= 1; t += dt) { stamp(t, -2.55, .38, 3); stamp(t, 2.55, .38, 2); }                       // rim light / shade
    for (let t = .05; t <= .97; t += dt) stamp(t, 0, .34, 0);                                                    // seam
    for (let t = .16; t <= .86; t += dt) { stamp(t, 1.35, .85, 24); stamp(t, 1.25, .6, 23); stamp(t, .95, .18, 22); } // teal inlay with a bright line
    for (let t = .16; t <= .86; t += dt) { stamp(t, -.45, .22, 2); }                  // inlay rails on the far half
    for (let i = 0; i < 7; i++) { const t = .11 + i * .12; stamp(t, -1.45, .62, 0); stamp(t, -1.45, .24, 2); }        // holes in the far half
    for (let t = .03; t <= .2; t += .018) stamp(t, -2.1, .26, 4);                                                 // thumb-ridge serration near the pivot
    for (const t of [.06, .96]) { stamp(t, -1.35, .5, 6); stamp(t, 1.35, .5, 6); stamp(t, -1.35, .2, 3); stamp(t, 1.35, .2, 3); } // pins
    // pivot housing and latch hook
    const pv = T([292, 250]), pr = 2.5 * k; for (let y = -4 * k; y <= 4 * k; y++) for (let x = -4 * k; x <= 4 * k; x++) if (x * x + y * y <= pr * pr) set(pv[0] + x, pv[1] + y, 0);
    for (let y = -2 * k; y <= 2 * k; y++) for (let x = -2 * k; x <= 2 * k; x++) if (x * x + y * y <= (1.2 * k) ** 2) set(pv[0] + x, pv[1] + y, x + y < 0 ? 6 : 4);
    { const h = T([252, 290]); for (let i = 0; i < 3.5 * k; i++) { const x = h[0] + Math.sin(i / (3.5 * k) * 1.4) * 1.6 * k, y = h[1] + i; for (let w = 0; w < Math.max(1, k); w++) set(x + w, y, i < 2 * k ? 22 : i < 4 * k ? 20 : 11); } }
    // blade
    const slim = ([x, y]) => { const ax = 74, ay = 112, dx = .83, dy = .56, nx = -.56, ny = .83, u = (x - ax) * dx + (y - ay) * dy, v = ((x - ax) * nx + (y - ay) * ny) * .82; return [ax + dx * u + nx * v, ay + dy * u + ny * v]; };
    const B = [[74, 112], [88, 130], [118, 146], [165, 162], [218, 184], [258, 208], [284, 240], [284, 268], [258, 286], [220, 272], [172, 252], [128, 225], [98, 195], [82, 165], [76, 136]].map(slim).map(T);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inPoly(B, x + .5, y + .5)) {
      const X = x / k, Y = y / k;
      const sw = Math.sin(X * .7 + Y * .5) + Math.sin(Y * 1.2 - X * .35) + Math.sin((X - Y) * .45) + Math.sin(X * .25 + Y * .9) * .6 + (k > 1 ? Math.sin(x * .55 - y * .8) * .35 + Math.sin(x * .3 + y * 1.1) * .25 : 0);
      set(x, y, sw > 1.7 ? 22 : sw > .9 ? 20 : sw > .2 ? 11 : sw > -.5 ? 12 : sw > -1.3 ? 21 : 20);
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (get(x, y) !== '.' && inPoly(B, x + .5, y + .5)) {
      for (let d = 1; d <= Math.max(1, Math.round(k * 1.3)); d++) {
        if (!inPoly(B, x + .5 - d, y + .5 + d) && !inPoly(B, x + .5, y + .5 + d)) set(x, y, d === 1 ? 22 : 20);      // sharpened bevel on the belly
        if (!inPoly(B, x + .5 + d, y + .5 - d) && !inPoly(B, x + .5, y + .5 - d)) set(x, y, d === 1 ? 21 : 11);     // dark spine
      }
    }
    // grind line along the blade
    for (let u = 25; u < 250; u += 1.2 / k) { const q = [74 + .83 * u - .56 * 20, 112 + .56 * u + .83 * 20], [gx, gy] = T(q); if (inPoly(B, gx + .5, gy + .5) && inPoly(B, gx + .5 + 1.2 * k, gy + .5 - 1.2 * k)) { set(gx, gy, 22); if (k > 1) set(gx + 1, gy, 22); } }
    // holes through the blade near the pivot
    { const h = T([246, 252]); for (let y = -k; y <= k; y++) for (let x = -k; x <= k; x++) if (x * x + y * y <= k * k) set(h[0] + x, h[1] + y, 0); }
    const out = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (get(x, y) === '.') for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const g = get(x + dx, y + dy); if (g !== '.' && g !== undefined) { out.push([x, y]); break; } }
    out.forEach(([x, y]) => set(x, y, 0));
  }, N);
}
BMP.knife96 = () => knifeBmp(96);
BMP.knife48 = () => knifeBmp(48);
BMP.ghost = () => mkBmp(({ set, rect, disc, get }) => {
  disc(16, 12, 9, 9, 6); rect(7, 12, 19, 13, 6);                                   // 身体
  for (let x = 7; x < 26; x++) { const w = Math.round(Math.sin((x - 7) / 18 * Math.PI * 3) * 2); for (let y = 25; y < 27 + w; y++) set(x, y, 6); }   // 波浪下摆
  for (let y = 4; y < 28; y++) { if (get(24, y) === '6') set(24, y, 5); if (get(25, y) === '6') set(25, y, 5); }   // 右侧暗面
  rect(11, 10, 3, 4, 0); rect(18, 10, 3, 4, 0); set(11, 10, 1); set(18, 10, 1); rect(14, 16, 4, 2, 0); set(15, 18, 0); set(16, 18, 0);   // 眼睛和嘴
  rect(9, 14, 2, 1, 16); rect(21, 14, 2, 1, 16);                                   // 腮红
  rect(3, 15, 4, 3, 6); rect(26, 13, 3, 3, 6);                                     // 小手
  rect(8, 29, 17, 2, 14); rect(6, 30, 21, 2, 13); set(22, 30, 0);                  // 底座和磕痕
});
BMP.cherry = () => mkBmp(({ set, rect, disc, get }) => {
  const bez = (p0, p1, p2, c, w) => { for (let t = 0; t <= 1; t += .02) { const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]; set(x, y, c); if (w) set(x + 1, y, c); } };
  // stems: left from left cherry up to joint, right from right cherry up to joint
  bez([9, 18], [10, 8], [18, 3], 11, 0); bez([23, 16], [24, 8], [18, 3], 11, 0);
  bez([9, 18], [10, 8], [18, 3], 11, 0);
  // leaf
  for (let i = 0; i < 9; i++) { const x = 19 + i, y = 3 - Math.round(Math.sin(i / 8 * Math.PI) * 2.2) + Math.floor(i / 5); rect(x, y, 1, 3 - (i > 6 ? 1 : 0), 12); set(x, y + 2, 11); }
  rect(18, 3, 2, 1, 11); set(18, 2, 11);
  // cherries
  const cher = (cx, cy) => {
    disc(cx, cy, 7, 7, 10); disc(cx - 1, cy - 1, 6, 6, 9);
    disc(cx + 2, cy + 3, 3, 2, 10);                            // shadow side shading
    set(cx, cy - 6, 10); set(cx - 1, cy - 6, 10);                // dimple
    set(cx - 4, cy - 3, 6); set(cx - 3, cy - 4, 6); set(cx - 4, cy - 2, 6); set(cx - 3, cy - 3, 6);
    set(cx - 2, cy - 4, 6);
    for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) if (get(cx + x, cy + y) === 'a' && x * x + y * y >= 40) set(cx + x, cy + y, 10);
  };
  cher(10, 24); cher(23, 22);
  // stem attachments on cherries
  rect(9, 17, 2, 3, 11); rect(22, 15, 2, 3, 11);
});
BMP.roll = () => mkBmp(({ set, rect, disc, get }) => {
  const cx = 16, cy = 13, rx = 14, ry = 9, h = 8;
  // body (steamed side) then top face
  for (let y = 0; y <= h; y++) disc(cx, cy + y, rx, ry, y > h - 2 ? 14 : 6);
  for (let y = 0; y < h; y += 1) { }
  disc(cx, cy, rx, ry, 6);
  // soft shading at bottom-right of body
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (get(x, y) === '6' && y > cy + ry - 1 && (x + y) % 2 === 0) set(x, y, 14);
  // top face shading ring and highlight
  for (let a = 0; a < 6.3; a += .05) set(cx + Math.cos(a) * (rx - 1), cy + Math.sin(a) * (ry - 1), 5);
  // spiral on the top face (rolled layers), with scallion flecks
  let n = 0;
  for (let t = 0; t < 4 * Math.PI + 1; t += .04) {
    const r = 1 + t * .72, x = cx + Math.cos(t) * r * (rx / 11), y = cy + Math.sin(t) * r * (ry / 11);
    if (r * (rx / 11) > rx - 2.5 || r * (ry / 11) > ry - 2) break;
    set(x, y, 14); n++;
    if (n % 11 === 0) { set(x, y, 12); set(x + 1, y, 11); }
  }
  // side layer lines (coil edges on the side)
  for (let y = cy + ry + 2; y < cy + h + ry - 3; y += 3) for (let x = cx - rx + 2; x < cx + rx - 1; x++) { if (get(x, y) === '6' || get(x, y) === 'e') { const yy = y + Math.round(Math.sin((x - cx) / rx * Math.PI) * 0) ; set(x, yy, (x % 4 < 2) ? 14 : 6); } }
});
function drawItem(k, x, y, s) {
  if (k === 'knife') k = s >= 4 ? 'knife96' : 'knife48';
  if (BMP[k]) { if (typeof BMP[k] === 'function') BMP[k] = BMP[k](); const n = BMP[k].length, sc = Math.max(1, Math.round(s * 16 / n * (n > 32 ? 1.5 : .5))); return spr(x + Math.round((16 * s - n * sc) / 2), y + Math.round((16 * s - n * sc) / 2), BMP[k], sc); }
  const R = (a, b, w, h, c) => r(x + a * s, y + b * s, w * s, h * s, c);
  if (k === 'shuttle') { R(3, 1, 10, 3, 6); R(4, 4, 8, 3, 6); R(5, 7, 6, 3, 6); R(6, 1, 1, 9, 5); R(9, 1, 1, 9, 5); R(6, 10, 4, 1, 9); R(6, 11, 4, 4, 6); R(7, 14, 2, 1, 5); }
  else if (k === 'cake') { R(1, 14, 14, 1, 5); R(2, 8, 12, 6, 6); R(2, 7, 12, 2, 9); R(2, 11, 12, 1, 9); R(3, 9, 2, 1, 9); R(7, 9, 2, 1, 9); R(11, 9, 2, 1, 9); R(7, 4, 2, 3, 9); R(8, 2, 1, 2, 11); }
  else if (k === 'flower') { R(7, 8, 1, 8, 11); R(8, 11, 3, 1, 12); R(4, 12, 3, 1, 12); R(6, 1, 3, 7, 6); R(4, 3, 7, 3, 6); R(5, 2, 5, 5, 6); R(7, 4, 1, 1, 7); }
}

reg('box', { name: '保管箱', parent: 'shop', desc: () => (ME && (ME.itemText || ITEMTEXT[ME.item])) || '保管箱里垫着绒布。',
  draw() { r(0, 0, W, H, 13); r(60, 14, 200, 152, 14); r(60, 14, 200, 2, 6); r(72, 26, 176, 128, 10); r(72, 26, 176, 2, 9); ctx.globalAlpha = .25; circ(160, 92, 46, 7); ctx.globalAlpha = 1; if (ME && ME.item) drawItem(ME.item, 160 - 40, 92 - 42 + Math.round(Math.sin(tick / 5) * 2), 5); },
  hint: () => ['这是站里替你收着的东西。', '这是站里替你收着的东西。走的时候记得带上。'] });

const LOGS = ['清洁臂的日志：「不是我。断电的时候，我在码头擦地。」', '导航副机的日志：「是温控器干的。」', '温控器的日志：「导航副机在撒谎。」'];
reg('inner', { name: '主机日志', parent: 'core', desc: () => S.f.pass ? '日志已经归档。' : '零的内存里浮着三条日志。零说：「是谁切断了主电，我想不起来了。我只确定一件事：这三条里，只有一条是真话。」点日志可以读。',
  draw() {
    r(0, 0, W, H, 0); const f = rnd(9); for (let i = 0; i < 40; i++) { const x = f() * W, y = (f() * H + tick * (1 + i % 3)) % H; r(x, y, 1, 3 + i % 4, i % 5 ? 2 : 3); }
    ['清洁臂', '导航副机', '温控器'].forEach((n, i) => { const x = 26 + i * 98; r(x, 40, 76, 96, 2); r(x, 40, 76, 2, 5); r(x + 6, 50, 64, 30, 1); if (i === 0) { r(x + 30, 54, 4, 18, 4); r(x + 24, 70, 16, 6, 4); } else if (i === 1) { circ(x + 38, 64, 10, 4, false); line(x + 38, 64, x + 44, 58, 7); } else { r(x + 34, 54, 6, 20, 4); r(x + 35, 62 + (tick % 8 < 4 ? 0 : 3), 4, 10, 9); }
      for (let j = 0; j < 5; j++) r(x + 8, 90 + j * 8, 40 + ((i * 7 + j * 13) % 20), 2, 4); hot(x, 40, 76, 96, 'look', LOGS[i], n); });
  },
  btns: () => S.f.pass ? [] : [['指认：清洁臂', 'culprit', 0], ['指认：导航副机', 'culprit', 1], ['指认：温控器', 'culprit', 2]],
  hint: () => ['只有一条是真话。逐个假设谁是真凶，看哪种情况下恰好只有一条为真。', '假设是清洁臂：它自己的话是假的，导航副机的话是假的，温控器的话是真的。恰好一条。'],
  skip() { A.culprit(0); } });

const TILES9 = ['好', '林', '休', '思', '息', '明', '体', '想', '安'], WORD_OK = '好好休息';
const RIDDLE = ['箱子上的粉笔字：「女儿和儿子站在一起。这个字，要用两遍。」', '箱子上的粉笔字：「一个人，靠着一棵树。」', '箱子上的粉笔字：「自己的心。」'];
reg('cargo', { name: '货舱', parent: 'green', desc: () => S.f.pass ? '螺丝的窝敞着，里面堆满了别人落下的小东西。' : '通风管的尽头是一间货舱。三只小箱子上各有一行粉笔字，最大的那只箱子上了一把字锁。',
  draw() {
    room(1, 0, 13, 0); r(130, 6, 60, 10, 0); for (let i = 0; i < 6; i++) r(134 + i * 9, 6, 2, 10, 3);
    [[30, 78], [118, 84], [206, 78]].forEach(([x, y], i) => { r(x, y, 50, 40, 14); r(x, y, 50, 2, 8); r(x + 4, y + 6, 42, 2, 13); r(x + 4, y + 30, 42, 2, 13); r(x + 10, y + 13, 30, 12, 6); for (let j = 0; j < 3; j++) r(x + 13, y + 16 + j * 3, 20 - j * 4, 1, 0); hot(x, y, 50, 40, 'look', RIDDLE[i], '小箱子'); });
    r(262, 60, 52, 60, 13); r(262, 60, 52, 3, 14); r(262, 88, 52, 3, 14); r(280, 80, 16, 14, S.f.pass ? 0 : 7); if (S.f.pass) { r(266, 64, 44, 22, 0); r(270, 78, 10, 6, 9); r(284, 76, 8, 8, 5); r(296, 79, 9, 5, 12); }
    hot(262, 60, 52, 60, 'go', 'crate', '大箱子');
    catAt(150, 110); hot(146, 106, 22, 16, 'pet', '', '螺丝');
  },
  hint: () => ['三条粉笔字都是字谜：把两个字拼成一个字。', '女＋子＝好，人＋木＝休，自＋心＝息。'] });
reg('crate', { name: '字锁', parent: 'cargo', desc: () => S.f.pass ? '锁开着。' : '锁上有四个空格，要填四个字。现在是：' + (S.word.join(' ') + ' ＿ ＿ ＿ ＿').trim().split(' ').slice(0, 4).join(' '),
  draw() { r(0, 0, W, H, 13); r(40, 30, 240, 120, 14); r(40, 30, 240, 3, 8); for (let i = 0; i < 4; i++) { r(64 + i * 50, 64, 42, 52, 0); r(66 + i * 50, 66, 38, 48, i < S.word.length || S.f.pass ? 7 : 1); if (i < S.word.length || S.f.pass) { r(72 + i * 50, 74, 26, 32, 6); ctx.fillStyle = PAL[0]; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(S.f.pass ? WORD_OK[i] : S.word[i], 85 + i * 50, 91); } } },
  btns: () => S.f.pass ? [] : TILES9.map(t => [t, 'tile9', t]).concat([['清除', 'wordclr']]),
  hint: () => ['女＋子、人＋木、自＋心。第一个字用两遍。', '答案是：好好休息。'],
  skip() { S.word = WORD_OK.split(''); A.wordok(); } });

const DIALOPT = ['赎回', '留下', '转赠'];
reg('archive', { name: '档案室的门', parent: 'shop', desc: () => S.f.pass ? '档案室的门开着。你的档案已经盖过章了。' : '门后是一整面抽屉。没有名字，每只抽屉只按三张当票的去向编号。把三只拨轮拨成你自己当初的决定，再拉开抽屉。',
  draw() {
    r(0, 0, W, H, 13); r(14, 10, 292, 160, 14); r(14, 10, 292, 2, 6);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 9; i++) { r(22 + i * 31, 16 + j * 13, 28, 11, 13); r(34 + i * 31, 20 + j * 13, 4, 2, 7); }
    ['t', 's', 'l'].forEach((k, i) => { const x = 24 + i * 94, done = !!S.ch[k]; r(x, 62, 84, 96, 1); r(x, 62, 84, 2, 3); txt(['时', '声', '光'][i] + '之当票', x + 42, 66, 8, 7, 'center'); txt(PAWN[k].item.replace('一个', '').replace('一句', ''), x + 42, 80, 7, 5, 'center', false);
      r(x + 12, 98, 60, 30, 0); r(x + 14, 100, 56, 26, S.f.pass ? 11 : 2); txt(S.f.pass ? DIALOPT[CH.indexOf(S.ch[k])] : DIALOPT[S.dial[i]], x + 42, 106, 12, 6, 'center'); txt(done ? '点拨轮切换' : '这张当票你还没拿到', x + 42, 138, 7, done ? 4 : 9, 'center', false);
      if (!S.f.pass) hot(x, 62, 84, 96, 'dial', i, '拨轮'); });
  },
  btns: () => S.f.pass ? [] : [['拉开抽屉', 'drawer']],
  hint: () => ['答案只有你自己知道：三张当票，你当初各是怎么处置的？每一次零都说过「记下了」。', '零替你查了登记簿：' + ['t', 's', 'l'].map((k, i) => ['时', '声', '光'][i] + '——' + (S.ch[k] ? DIALOPT[CH.indexOf(S.ch[k])] : '还没处置')).join('，') + '。'],
  skip() { S.dial = ['t', 's', 'l'].map(k => Math.max(0, CH.indexOf(S.ch[k]))); A.drawer(); } });

function getPass(lines) { talk(lines.concat([Z(praise()), { fn: () => { S.f.pass = 1; give('pass'); sfx('win'); save(); } }])); }
function events() {
  if (dOn || !$('title').hidden || !$('end').hidden || !$('slide').hidden) return;
  if (S.v === 'bunk' && !S.f.bunkIntro) {
    S.f.bunkIntro = 1; save();
    return talk([Z('{name}，桌上留给你的那颗草莓不见了。盘子倒是被擦得很干净。'), '通风口的栅栏后面，亮起两点黄光。' + (S.f.cat ? '' : '是一只巴掌大的机械猫，外壳上用记号笔写着「螺丝」。'), C('是我拿的。我不吃东西。我想把它放到你的蛋糕上。'), C('别告诉大眼睛。……既然来了，帮我个忙。')]);
  }
  if (S.f.water && S.v === 'green' && !S.f.cat) {
    S.f.cat = 1; save();
    return talk(['水雾刚落下来，通风口里就传来一声短促的：', C('喵——！'), '一只巴掌大的机械猫从栅栏里钻了出来，被浇得透湿，使劲甩了甩头。外壳上用记号笔写着「螺丝」。', S.f.eyes ? '尾巴尖上一闪一闪的，正是那两点黄光。' : '它盯着你，尾巴尖的指示灯一闪一闪。', '（耳机里，零没有出声。温室的摄像头还黑着。）',
      { who: '螺丝', t: '你，不是站里的。你会告诉那个大眼睛吗？', ch: [{ t: '蹲下来，伸手让它闻一闻。', f: () => { S.aff.c += 2; } }, { t: '「大眼睛是说零吗？你为什么躲着它？」', f: () => { S.aff.c += 1; S.aff.z += 1; } }, { t: '后退一步。「我只是来取东西的。」', f: () => { S.aff.z += 1; } }] },
      C('……随你。那里待不住了，我去灯底下晒干。别踩我尾巴。')]);
  }
  if (S.f.cat && sealsN() >= 2 && !S.route && S.v === 'map') {
    return talk([Z('{name}，占用你一点时间。'), Z('站里有一个没有登记的热源。它一直躲着我的摄像头。'),
      { who: '零', t: '你见过它吗？', ch: [
        { t: '「见过，在温室。是一只机械猫。」', f: () => { S.route = 'z'; S.aff.z += 2; talk([Z('谢谢你告诉我。'), Z('别担心，我不是要回收它。我想给它补一张登记卡。可规程要求我先查清一件事：是谁切断了主电。'), Z('我自己想不起来。进来帮我看看日志吧，入口在主机的底座上。')]); } },
        { t: '「没见过。」', f: () => { S.route = 'c'; S.aff.c += 2; talk([Z('……好。如果见到了，请告诉我。'), '通讯挂断以后，你的裤脚被什么东西扯了一下。', C('你没说。喵。'), C('跟我来。温室的通风口，我带你看点东西。')]); } },
        { t: '「见过。但这是你们之间的事，我不掺和。」', f: () => { S.route = 'l'; talk([Z('明白了。我尊重你的决定。'), '你想起当铺的柜台后面，有一扇写着「档案」的门。', '也许有些事，得自己去查。']); } }] }]);
  }
}

/* ================= 夸奖与鼓励 ================= */
let skipping = false, badN = 0;
const pick = a => a[Math.floor(Math.random() * a.length)];
function praise() {
  const n = who();
  return skipping ? pick(['没关系，' + n + '，这一步我替你走了。接着往前。', n + '，先看故事也很好。下一题再试试。', '这一关算我的，' + n + '。你只管往前走。'])
    : pick(['漂亮，' + n + '！', n + '，干得好。', '就是这样，' + n + '。', n + '，这道题难不倒你。', '厉害啊，' + n + '。', n + '，你比我想的还快。']);
}
const encourage = () => pick(['（别急，' + who() + '。重来一遍，仔细看看题目和画面上的字。）', '（' + who() + '，答错会重置，不是你的错。线索可能在别的舱段，翻翻笔记。）', '（慢慢来，' + who() + '。卡住了可以点两次提示。）']);

/* ================= 行为 ================= */
function winScale() { S.f.scale = 1; S.sc.acc = false; give('fuse'); sfx('win'); say(praise() + '就是它，分量不对。掰开一看，这根本不是硬币：两片薄壳中间卷着一根保险丝。有人把它藏进了硬币堆里。'); return; say('翻过来一看，这根本不是硬币，是一枚自动贩卖机的代币。'); }
function powerOn() { S.f.power = 1; S.brk = BRK_OK.slice(); sfx('win'); talk(['你把「温室摄像」那一路拉了下来，合上总闸。', '啪。整座空间站的灯依次亮了起来。', Z(praise())].concat([Z('温室摄像那一路，比铭牌多吃了四格电。像是有人故意让它把保险丝烧断。'), Z('……先不接它了。温室那边，我又成了瞎子。'),Z('……主电恢复了。谢谢你，{name}。我刚才说话是不是断断续续的？'), Z('现在温室的喷淋可以转了。另外，我左手边的保险柜里锁着一枚印章，密码我自己也忘了，只记得把它存进了三段广播里。码头小艇上的收音机收得到。')])); }
const A = {
  box() { if (!ME) return say('柜台下面是一排保管箱，每只上面都有名牌。没有一只写着「访客」。'); S.f.box = 1; S.v = 'box'; sfx('pick'); say(V.box.desc() + ' 零说，它一直替你收着，走的时候记得带上。'); },
  pet() {
    const it = ME && ME.item && !S.f.catItem;
    if (it) { S.f.catItem = 1; S.aff.c += 1; return talk([C('你身上有' + ITEMNAME[ME.item] + '的味道。'), C('是好东西。收好。')]); }
    if (S.f.cat && S.f.bunkIntro && !S.facts.includes('cat')) return talk([C('草莓？我又尝不出甜。我只是觉得它红红的，放在蛋糕上好看。')].concat(fact('cat')));
    talk([C(['喵。', '尾巴，别踩。', '大眼睛其实不坏。它只是太听规程的话。', '我修过这座站里所有的灯。'][Math.floor(Math.random() * 4)])]);
  },
  culprit(i) {
    if (S.f.pass) return;
    if (+i === 0) return getPass(['零沉默了很久。', Z('是清洁臂。它是故意的。'), Z('主电一断，我的摄像头就全黑了。旧规程写着：未登记的机械体，一律回收。它是在替那只猫关灯。'), Z('规程是我在执行，可规程不是我写的。{name}，我现在把这一条改掉。'), '主机的出卡口吐出一枚新刻的章，上面两个字：通行。']);
    sfx('bad'); say(+i === 1 ? '零：「如果是导航副机，那清洁臂和温控器说的就都是真话了。不对，只能有一条。」' : '零：「如果是温控器，那清洁臂和导航副机说的就都是真话了。不对，只能有一条。」');
  },
  tile9(t) { if (S.word.length < 4) { S.word.push(t); sfx('click'); } if (S.word.length === 4) return A.wordok(); say(V.crate.desc()); },
  wordclr() { S.word = []; say(V.crate.desc()); },
  wordok() {
    if (S.word.join('') === WORD_OK) { S.word = []; return getPass(['四个字对上了：好好休息。锁弹开了。', '箱子里是一个用旧毛毯垫成的窝，堆满了别人落在站里的小东西：一只手套，半块橡皮，一枚纽扣。', C('这些都没人来领。我替它们找了个地方。'), C('灯是清洁臂帮我关的。零的规程说，没登记的要回收。我没登记。'), C('这个给你，门上要用。我捡的。'), '螺丝用鼻子把一枚刻着「通行」的章推到你脚边。']); }
    S.word = []; sfx('bad'); say('锁没有开，四个格子又空了。');
  },
  dial(i) { S.dial[+i] = (S.dial[+i] + 1) % 3; sfx('click'); },
  drawer() {
    if (S.f.pass) return;
    if (!['t', 's', 'l'].every(k => S.ch[k])) { sfx('bad'); return say('三张当票你还没有全部处置过，抽屉的编号凑不齐。先去把三枚印章都找到。'); }
    if (['t', 's', 'l'].every((k, i) => CH[S.dial[i]] === S.ch[k])) return getPass(['抽屉滑开了。里面只有一个档案袋，封面上是你的口令。', '最上面是一页事故记录：主电是清洁臂切断的，为的是让摄像头照不到一只没登记的机械猫。', '再往下是你自己的当户档案，三张当票的去向一笔一笔记着，和你拨的一模一样。', '最后一栏「通行」是空的，旁边放着一枚章和一盒印泥。你给自己盖了章。']);
    sfx('bad'); say('这只抽屉里是别人的档案。有人把三样东西都留下了，有人全都送了出去。不是你的。');
  },
  go(p) { if (locked(p)) { sfx('click'); return talk([Z('这个先放一放，还没到它。现在该去' + goalPlace() + '。'), Z('不知道做什么，就点「提示」。')]); } sim = null; S.v = p; sfx('step'); say(V[p].desc() + (SUB[p] && !S.f['seen_' + p] ? ' 地板上还有一个舱口，通往' + V[SUB[p]].name + '。' : '')); if (SUB[p]) S.f['seen_' + p] = 1; },
  look(p) { say(p); },
  star(i) { if (!S.stars.includes(+i)) { S.stars.push(+i); sfx('pick'); say('你捡到了一粒星屑。（' + S.stars.length + ' / 3）它在手心里是温的。'); } },
  vend() { say('投币口上贴着一张纸条：「故障」。字迹很工整，像是清洁臂写的。里面的货还亮着灯。'); },
  wheel(i) { S.lock[+i] = (S.lock[+i] + 1) % 10; sfx('click'); },
  unlock() {
    if (S.lock.every((v, i) => v === LOCK_CODE[i])) { S.f.locker = 1; give('lens'); sfx('win'); return say(praise() + '咔哒。柜门弹开，里面用绒布包着一片镜片。'); }
    sfx('bad'); say('锁没有反应。');
  },
  lens() { if (S.sel === 'lens') { drop('lens'); S.f.lens = 1; sfx('pick'); say(V.tele.desc()); } else say('镜筒里一片模糊。物镜的位置是空的。'); },
  peg(i) { i = +i; if (S.peg[S.peg.length - 1] !== i && S.peg.length < 9) { S.peg.push(i); sfx('click'); } },
  pegclr() { S.peg = []; say('线都收了回去。'); },
  pegok() {
    const a = edges(S.peg), b = edges(PEG_OK);
    if (a.size === b.size && [...a].every(e => b.has(e))) { S.peg = []; return seal('l', '九个插孔同时亮了一下。控制台侧面弹出一只小抽屉，里面是一枚印章，刻着一颗四角星。'); }
    const t = edges(TELE); S.peg = []; sfx('bad');
    say(a.size === t.size && [...a].every(e => t.has(e)) ? '星星没有回应。你连的和望远镜里看到的一模一样，可铭牌上说，望远镜里看到的是反的。' : '星星没有回应。线都收了回去。');
  },
  coin(i) {
    const sc = S.sc; i = +i;
    if (shuf) return;
    if (sc.acc) {
      if (sc.cand.length === 1 && sc.cand[0] === i) return winScale();
      const sure = sc.cand.length === 1;
      S.sc = freshScale(); shuf = 14; sfx('bad');
      return say(sure ? '不是这一枚。老板把九枚硬币收回去洗了一遍，重新从左到右摆好。' : '你还没有称到能确定是哪一枚。老板把九枚硬币收回去洗了一遍，假币换了位置。靠猜的话，每猜一次都得从头再来，所以挨个试在这里行不通。');
    }
    sc.loc[i] = (sc.loc[i] + 1) % 3; sfx('click'); say(['放回托盘。', '放上左盘。', '放上右盘。'][sc.loc[i]]);
  },
  weigh() {
    const sc = S.sc, L = [], R = []; sc.loc.forEach((v, i) => { if (v === 1) L.push(i); if (v === 2) R.push(i); });
    if (shuf) return;
    if (!L.length || L.length !== R.length) return say('两边要放同样多的硬币，而且不能空着。');
    if (sc.left <= 0) return say('天平只借两次。要么指认，要么重来。');
    const res = L.includes(sc.fake) ? 'L' : R.includes(sc.fake) ? 'R' : '=';
    sc.cand = sc.cand.filter(i => res === 'L' ? L.includes(i) : res === 'R' ? R.includes(i) : !L.includes(i) && !R.includes(i));
    sc.last = res; sc.left--; sfx('click');
    say(res === '=' ? '两边一样重。' : res === 'L' ? '左盘轻，翘了起来。' : '右盘轻，翘了起来。');
  },
  acc() { S.sc.acc = !S.sc.acc; say(S.sc.acc ? '点你认定的那一枚。' : ''); },
  screset() { if (shuf) return; S.sc = freshScale(); say('硬币放回托盘，天平重新借你两次。'); },
  ch(p) { S.clock = (S.clock + +p + 720) % 720; sfx('click'); const h = Math.floor(S.clock / 60) || 12, m = S.clock % 60; say('现在指着 ' + h + ' 点 ' + (m < 10 ? '0' : '') + m + ' 分。'); },
  pend() {
    if (S.clock === CLOCK_OK) return seal('t', '钟摆荡了起来。钟面下方的小门弹开，里面是一枚印章，刻着一只没有指针的钟。');
    sfx('bad'); say('钟摆晃了两下，又停了。时间不对。');
  },
  sprinkle() {
    if (!S.f.power) return say('按下去没有反应。整座站的主电是断的。');
    if (S.f.water) return say('喷淋还在转，细细的水雾落在花上。');
    S.f.water = 1; sfx('win'); say('喷淋转了起来。干卷的叶子慢慢舒开，三只花槽里的花，一朵接一朵地开了。');
  },
  chan(p) { stopMorse(); S.chan = p === '-' ? null : +p; sfx('click'); say(S.chan == null ? '收音机安静了。' : CHL[S.chan][1] + '频道：一串有节奏的滴答声，循环往复。小灯跟着一明一灭。'); },
  fuseSlot() {
    if (S.f.fuseIn) return say('保险丝已经装好。');
    if (S.sel === 'fuse') { drop('fuse'); S.f.fuseIn = 1; sfx('pick'); return say('保险丝装上了。上一根就是这么熔断的——合总闸之前，先想想哪几路该合上。'); }
    say('插槽空着，缺一根保险丝。');
  },
  brk(i) { S.brk[i] = S.brk[i] ? 0 : 1; sfx('click'); const sum = S.brk.reduce((a, v, k) => a + (v ? BRK[k][1] : 0), 0); say('铭牌合计：' + sum + ' 格。保险丝最多 ' + FUSE_MAX + ' 格。'); },
  mains() {
    if (S.f.power) return;
    if (!S.f.fuseIn) return say('总闸推上去又弹了回来。保险丝插槽是空的。');
    const real = S.brk.reduce((a, v, k) => a + (v ? BRK_REAL[k] : 0), 0);
    if (real > FUSE_MAX) { sfx('bad'); return say('啪！保险丝闪了一下，总闸自己跳了回来。好在没熔断。零：「超载了。有一路的用电，比铭牌上写的多。」'); }
    if (S.brk.join() !== BRK_OK.join()) { sfx('bad'); return say(S.brk[3] ? '总闸合上了，可有几个舱段还是黑的。零：「每个舱段的灯都要亮。」' : '总闸合上了，可' + BRK.filter((b, k) => k !== 3 && !S.brk[k]).map(b => b[0]).join('、') + '还是黑的。零：「每个舱段的灯都要亮。」'); }
    powerOn();
  },
  vk(k) {
    if (k === 'C') { S.vault = ''; return; }
    if (k === 'OK') {
      if (S.vault === VAULT_CODE) { S.vault = ''; return seal('s', '保险柜的转盘自己转了半圈，门开了。里面是一枚印章，刻着三道波纹。'); }
      S.vault = ''; sfx('bad'); return say('转盘纹丝不动。');
    }
    if (S.vault.length < 3) { S.vault += k; sfx('click'); }
  },
  ai() {
    if (!S.f.power) return talk([Z('……主电……断了……'), Z('……配电板……在我左边……缺一根……保险丝……')]);
    const pend = ['t', 's', 'l'].filter(k => S.f['seal_' + k] && !S.ch[k]);
    if (pend.length) return talk(askPawn(pend[0]).concat([Z('记下了。')]));
    const n = ['t', 's', 'l'].filter(k => S.f['seal_' + k]).length;
    if (S.f.gate) return talk([Z('后舱的门开着。去吧，{name}，有东西在等你。')]);
    if (n === 3) return talk([Z('三枚都齐了。把它们按在我右边那扇舱门上。')]);
    talk([Z('这座站替人保管三样东西：时间、声音和光。每一样都有一枚印章。'), Z('你已经找到 ' + n + ' 枚。' + (S.f.seal_s ? '' : '「声」在我左手边的保险柜里。') + (S.f.seal_t ? '' : '「时」在当铺那座停了的钟里。') + (S.f.seal_l ? '' : '「光」在观星台。')), Z('不用急。这里的东西不会过期。')]);
  },
  gate() {
    if (S.f.gate) { S.v = 'back'; return say(V.back.desc()); }
    const need = ['seal_t', 'seal_s', 'seal_l'];
    if (need.every(has) && has('pass')) { need.concat('pass').forEach(drop); S.f.gate = 1; sfx('win'); return talk(['三枚印章依次按进了门上的凹槽。时、声、光。最后是那枚「通行」。', Z('验印无误。后舱的门开了。'), Z('里面的东西是给你的，{name}。我只是替人保管。')]); }
    if (need.every(has)) return talk([Z('三枚印章都对。可是这扇门还要一枚「通行」章。'), Z({ z: '帮我查完日志，我就能给你刻一枚。入口在主机底座上。', c: '……我没有权限直接给你。也许站里有谁捡到过一枚。', l: '通行章收在档案室。那里不对当户开放，除非你自己打得开门。' }[S.route] || '再等一等。')]);
    const n = need.filter(has).length;
    say('舱门上有三个方形凹槽，旁边还有一个圆的。' + (n ? '你手里有 ' + n + ' 枚印章，还不够。' : '你手里一枚印章也没有。'));
  },
  cake() {
    if (S.f.end) return showEnd(false);
    if (S.stars.length && !S.f.lit) {
      S.f.cakeTry = (S.f.cakeTry || 0) + 1;
      if (S.f.cakeTry === 1) return talk(['蛋糕上只插着一根蜡烛，还没有点。', Z('站里没有火。……不过，你一路捡的星屑还在发光。'), S.f.cat && S.route !== 'z' ? C('就是你头顶上那一串 ✦。把它们拿下来，放到蛋糕上。') : Z('就是你头顶上那一串 ✦。把它们拿下来，放到蛋糕上。')]);
      if (!S.assist && S.f.cakeTry < 3) return say('零：「这一题要动的是网页本身。按住屏幕上方的 ✦，拖到蛋糕上再松手。」');
      S.f.lit = 1; say('零：「那我替你放上去。」');
    }
    const n = S.stars.length;
    talk([n ? '你把捡到的星屑放在蛋糕上。它们立了起来，变成了蜡烛。' : '蛋糕上只有一根蜡烛。', '桌上除了蛋糕，还有一只空盘子，一把叉子。', Z('我没有手，点不了火。'), '话音刚落，烛芯自己亮了。'].concat(FINAL[S.route] || []).concat([{ fn: () => { S.f.end = 1; if (!S.end) S.end = 'l1'; sfx('win'); save(); setTimeout(() => runSlides(() => runCG(() => showEnd(false))), 500); } }]));
  }
};

/* ================= 第二场景、支线、笔记本、宝箱 ================= */
function txt(s, x, y, size, c, align = 'left', bold = true) { size = Math.max(size, 7); ctx.fillStyle = typeof c === 'string' ? c : PAL[c]; ctx.font = (bold ? 'bold ' : '') + size + 'px "PingFang SC","Microsoft YaHei","Noto Sans SC",monospace'; ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.fillText(s, x, y); }
const SUB = { dock: 'mail', shop: 'store', green: 'nursery', obs: 'bunk', core: 'shaft' };
function hatch(id, tip) {
  r(266, 139, 50, 30, MT[0]); bevel(268, 140, 46, 27, MT, 3); r(272, 144, 38, 19, '#07090f');
  for (let i = 0; i < 4; i++) { r(276, 147 + i * 4, 30, 1, MT[3]); r(276, 148 + i * 4, 30, 1, MT[1]); }
  [[270, 142], [311, 142], [270, 164], [311, 164]].forEach(([x, y]) => rivet(x, y));
  hazard(268, 166, 46, 2);
  const b = Math.round(Math.sin(tick * .2) * 1.5); soft(291, 134 + b, 9, '255,210,110', .35); r(287, 131 + b, 8, 2, YL[3]); r(288, 133 + b, 6, 2, YL[2]); r(289, 135 + b, 4, 1, YL[2]); r(290, 136 + b, 2, 1, YL[1]);
  hot(266, 130, 50, 40, 'go', id, '舱口 · ' + tip);
}
const SHARDS = ['mail', 'store', 'nursery', 'bunk', 'shaft'];
function shard(k, msg) {
  if (S.shard.includes(k)) return;
  S.shard.push(k); sfx('win');
  talk([msg, Z(praise()), '你得到了一块记忆碎片。（' + S.shard.length + ' / 5）它是半透明的，里面好像有人在笑。', S.shard.length === 3 ? Z('三块了。当铺库房的那只宝箱，应该能打开了。') : S.shard.length < 3 ? '当铺库房里有一只宝箱，箱盖上有三个碎片形状的凹槽。' : '多出来的碎片，也许以后用得上。']);
}
function shardGem(x, y, on) { const c = on ? (Math.floor(tick / 4) % 2 ? 15 : 22) : 1; r(x + 2, y, 3, 1, c); r(x + 1, y + 1, 5, 2, c); r(x, y + 3, 7, 2, c); r(x + 1, y + 5, 5, 2, c); r(x + 2, y + 7, 3, 1, c); if (on) px(x + 2, y + 2, 6); }

/* 库房：宝箱 + 规程簿入口 */
reg('store', { name: '库房', parent: 'shop', desc: () => '当铺后面的库房。架子上堆着六件还没上架的当物，旁边立着零的规程簿。角落里有一只上了锁的宝箱。',
  draw() {
    room(13, 14, 1, 0);
    r(150, 30, 160, 4, 14); r(150, 74, 160, 4, 14);
    [5, 3, 15, 4, 6, 7].forEach((c, i) => { const x = 158 + i * 25, hh = [22, 16, 20, 26, 10, 18][i]; r(x, 74 - hh, 17, hh, c); r(x, 74 - hh, 17, 2, 6); });
    r(206, 86, 48, 30, 6); r(206, 86, 48, 5, 9); for (let i = 0; i < 4; i++) r(211, 95 + i * 5, 38 - (i % 2) * 8, 1, 13); r(228, 116, 4, 12, 13); txt('规程', 230, 87, 6, 6, 'center');
    hot(150, 26, 160, 100, 'go', 'rules', '规程簿');
    const op = S.f.chest;
    r(24, 92, 96, 50, 14); r(24, 92, 96, 4, 8); r(24, 112, 96, 3, 13); r(28, 96, 88, 14, op ? 0 : 13);
    if (op) { ctx.globalAlpha = .4 + (tick % 6) * .05; r(30, 80, 84, 14, 7); ctx.globalAlpha = 1; r(24, 70, 96, 12, 14); r(24, 70, 96, 3, 8); }
    for (let i = 0; i < 3; i++) shardGem(46 + i * 22, 98, i < Math.min(3, S.shard.length));
    r(66, 116, 12, 12, op ? 1 : 7); r(70, 120, 4, 5, 0);
    hot(20, 70, 104, 76, 'chest', '', '宝箱');
    hatch('shop', '回当铺');
  },
  hint: () => [S.shard.includes('store') ? (S.shard.length < 3 ? '宝箱要三块记忆碎片。每个舱段地板上的舱口下面，都有一位站员在等人帮忙。' : '去点宝箱，输入你的口令。') : '架子旁边的规程簿可以翻开。零需要你帮它理一理规程。', '碎片在：码头下的邮件室、温室下的苗圃、观星台下的休息舱、机房下的冷却井，还有这里的规程簿。'] });

/* ---- 支线：五位站员的委托（达标即可，没有唯一答案）---- */
let sim = null;
const RATE = ['够用', '利落', '漂亮'], DX4 = [1, 0, -1, 0], DY4 = [0, 1, 0, -1], CNUM = ['一', '二', '三', '四', '五', '六', '七', '八'];
function sideWin(k, tier, msg, crewLine, metric) {
  const first = !S.shard.includes(k); tier = skipping ? 0 : tier;
  if (!S.best[k] || tier > S.best[k].tier) S.best[k] = { tier, metric };
  const rate = skipping ? [] : [Z('这个做法，我的评语是「' + RATE[tier] + '」。' + (tier < 2 ? '还有更省的做法，想试随时可以再来。' : '我想不出更好的了。'))];
  sfx('win'); talk([].concat(msg).concat(first ? [crewLine] : []).concat(rate));
  if (first) shard(k, '它身后的地板上，落着一块半透明的东西。');
}
const bestTxt = k => S.best[k] ? '　目前评语：' + RATE[S.best[k].tier] : '';

/* ① 邮件室 · 导航副机：给信使写一段循环程序 */
const DMAPS = [['#S#....', '......#', '.......', '....##.', '..#..G.'], ['S.....#', '..#....', '..#.##G', '.....#.', '#......'], ['.#..#..', '.....#.', '.#...G.', '.S.....', '..#....']];
const DCMD = { F: '前进', L: '左转', R: '右转', A: '撞则左转', B: '撞则右转' }, DMAX = 8, DSTEPS = 64;
const dFind = (m, ch) => { for (let j = 0; j < 5; j++) { const i = m[j].indexOf(ch); if (i >= 0) return [i, j]; } };
const dBlocked = (m, x, y) => x < 0 || x >= 7 || y < 0 || y >= 5 || m[y][x] === '#';
function dStep(m, st, c) {
  const nx = st.x + DX4[st.d], ny = st.y + DY4[st.d], b = dBlocked(m, nx, ny);
  if (c === 'L') st.d = (st.d + 3) % 4; else if (c === 'R') st.d = (st.d + 1) % 4; else if (c === 'A') { if (b) st.d = (st.d + 3) % 4; } else if (c === 'B') { if (b) st.d = (st.d + 1) % 4; } else if (!b) { st.x = nx; st.y = ny; }
  const g = dFind(m, 'G'); if (st.x === g[0] && st.y === g[1]) st.done = true;
}
const dStart = () => DMAPS.map(m => { const s = dFind(m, 'S'); return { x: s[0], y: s[1], d: 0, done: false }; });
reg('mail', { name: '邮件室', parent: 'dock', desc: () => '导航副机的委托：「三封信，三张航图，可信使无人机只装得下一段程序。」用下面的按钮给它写最多 8 条指令。程序会从头到尾一遍遍循环，三张航图上同时试飞。' + bestTxt('mail'),
  draw() {
    r(0, 0, W, H, 1); r(0, 0, W, 12, 2); txt('信使无人机 · 航线程序', 312, 2, 8, 5, 'right');
    const sts = sim && sim.kind === 'drone' ? sim.st : dStart();
    DMAPS.forEach((m, k) => {
      const x0 = 10 + k * 103, y0 = 26, c = 13; txt('航图' + CNUM[k], x0 + (k ? 0 : 50), 15, 7, 4); r(x0 - 1, y0 - 1, 7 * c + 2, 5 * c + 2, sts[k].done ? 12 : 3); r(x0, y0, 7 * c, 5 * c, 0);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) {
        const x = x0 + i * c, y = y0 + j * c, ch = m[j][i]; px(x + 6, y + 6, 2);
        if (ch === '#') { circ(x + 6, y + 6, 5, 13); circ(x + 5, y + 5, 3, 14); px(x + 4, y + 4, 6); }
        if (ch === 'G') { r(x + 2, y + 4, 9, 6, 7); r(x + 2, y + 4, 9, 1, 6); line(x + 2, y + 4, x + 6, y + 7, 8); line(x + 10, y + 4, x + 6, y + 7, 8); }
        if (ch === 'S') { r(x + 1, y + 11, 11, 1, 4); }
      }
      const s = sts[k], cx = x0 + s.x * c + 6, cy = y0 + s.y * c + 6; r(cx - 3, cy - 3, 7, 7, 5); r(cx - 2, cy - 2, 5, 5, 4); r(cx + DX4[s.d] * 4 - 1, cy + DY4[s.d] * 4 - 1, 3, 3, 6);
      if (s.done) txt('送到', x0 + 7 * c - 2, 15, 7, 12, 'right');
    });
    txt('程序（循环执行）', 10, 97, 7, 4); txt(S.pg.length + ' / ' + DMAX + ' 条', 310, 97, 7, 7, 'right');
    for (let i = 0; i < DMAX; i++) { const x = 10 + i * 38, on = sim && sim.kind === 'drone' && S.pg.length && (sim.i % S.pg.length) === i; r(x, 107, 35, 16, on ? 7 : 3); r(x + 1, 108, 33, 14, i < S.pg.length ? 2 : 0); txt(String(i + 1), x + 17, 124, 7, on ? 7 : 3, 'center'); if (i < S.pg.length) txt(DCMD[S.pg[i]], x + 18, 111, 7, on ? 7 : 6, 'center'); }
    txt('撞则左转：前面有陨石或航图边界时才转，否则这一步什么也不做。', 10, 138, 7, 4, 'left', false);
    txt('前进时前面被挡住，就原地不动。无人机出发时都朝右。', 10, 148, 7, 4, 'left', false);
    if (sim && sim.kind === 'drone') txt('第 ' + sim.i + ' / ' + DSTEPS + ' 步', 310, 160, 7, 7, 'right');
  },
  btns: () => sim ? [] : [['前进', 'dc', 'F'], ['左转', 'dc', 'L'], ['右转', 'dc', 'R'], ['撞则左转', 'dc', 'A'], ['撞则右转', 'dc', 'B'], ['删一条', 'dc', '-'], ['清空', 'dc', '0'], ['试飞', 'dfly']],
  hint: () => ['每张图单独都不难，难的是同一段程序。先找三张图的共同点：信箱都在出发点的右下方。', '「前进、撞了就转」这种贴着障碍走的写法最通用。试试把「撞则右转」和「前进」交替着用，再加一个「左转」。'],
  sol: () => '<p>一种 5 条指令的写法（最短就是 5 条，一共有 8 种）：</p><ol><li>前进</li><li>撞则右转</li><li>前进</li><li>左转</li><li>撞则右转</li></ol><p>思路：无人机一边往前，一边在撞到东西时向右拐，中间插一个左转把方向掰回来，结果是沿着障碍物的边一路向右下方走。6 条指令的写法有 22 种，不必和这个一样。</p>',
  skip() { S.pg = ['F', 'B', 'F', 'L', 'B']; sideWin('mail', 0, '零把一段程序传给了无人机。三封信都送到了。', NAVLINE); } });
const NAVLINE = { who: '导航副机', t: '收到。三封信都投进去了。我算了很多年航线，头一回有人替我写程序。' };

/* ② 库房 · 零：互相打架的上架规程 */
const IT6 = [{ n: '玻璃罐', f: 1, h: 0, o: '甲', old: 1 }, { n: '铁砧', f: 0, h: 1, o: '甲', old: 0 }, { n: '八音盒', f: 1, h: 0, o: '乙', old: 1 }, { n: '石像', f: 0, h: 1, o: '乙', old: 1 }, { n: '信封', f: 0, h: 0, o: '丙', old: 0 }, { n: '灯泡', f: 1, h: 0, o: '丙', old: 0 }];
const RTXT = ['易碎的不放下层', '重的只放下层', '同一位当户的放同一层', '旧当物不放下层', '两件易碎的不放同一层', '上层只放轻的', '新当物不放上层', '同一层不放同一位当户的'];
const pairs = f => IT6.every((a, i) => IT6.every((b, j) => i === j || f(a, b, i, j)));
const RFN = [a => IT6.every((t, i) => !t.f || a[i] !== 2), a => IT6.every((t, i) => !t.h || a[i] === 2), a => pairs((x, y, i, j) => x.o !== y.o || a[i] === a[j]), a => IT6.every((t, i) => !t.old || a[i] !== 2),
  a => pairs((x, y, i, j) => !(x.f && y.f) || a[i] !== a[j]), a => IT6.every((t, i) => a[i] !== 0 || !t.h), a => IT6.every((t, i) => t.old || a[i] !== 0), a => pairs((x, y, i, j) => x.o !== y.o || a[i] !== a[j])];
function shelve(keep) { let out = null; (function rec(a, c) { if (out) return; if (a.length === 6) { if (keep.every((k, i) => !k || RFN[i](a))) out = a.slice(); return; } for (let t = 0; t < 3; t++) if (c[t] < 2) { c[t]++; a.push(t); rec(a, c); a.pop(); c[t]--; } })([], [0, 0, 0]); return out; }
reg('rules', { name: '规程簿', parent: 'store', desc: () => '零的委托：「六件当物，三层架子，每层两件。我的八条规程互相打架，怎么摆都违规。」点右边的规程可以划掉或恢复，至少留四条，然后请零按留下的规程上架。' + bestTxt('store'),
  draw() {
    r(0, 0, W, H, 13); r(6, 6, 146, 168, 6); r(6, 6, 146, 11, 14); txt('待上架的当物', 148, 7, 8, 0, 'right');
    IT6.forEach((t, i) => { const y = 22 + i * 13; r(10, y + 1, 7, 7, { 甲: 9, 乙: 4, 丙: 11 }[t.o]); txt(t.n, 20, y, 8, 0); txt((t.f ? '易碎' : '结实') + ' · ' + (t.h ? '重' : '轻') + ' · ' + t.o + ' · ' + (t.old ? '旧' : '新'), 148, y + 1, 7, 13, 'right', false); });
    r(10, 102, 138, 1, 14); txt('架子', 10, 106, 8, 0);
    ['上层', '中层', '下层'].forEach((n, k) => { const y = 118 + k * 17; r(10, y, 138, 15, 14); r(11, y + 1, 136, 13, 13); txt(n, 14, y + 3, 7, 7); txt(S.arr ? IT6.filter((t, i) => S.arr[i] === k).map(t => t.n).join('　') : '（空）', 44, y + 3, 8, S.arr ? 6 : 14); });
    r(158, 6, 156, 168, 1); r(158, 6, 156, 11, 2); txt('上架规程', 162, 7, 8, 5);
    RTXT.forEach((t, i) => { const y = 21 + i * 17, on = S.rk[i]; r(162, y, 148, 15, on ? 3 : 0); r(163, y + 1, 146, 13, on ? 2 : 0); txt(CNUM[i], 167, y + 3, 8, on ? 7 : 2); txt(t, 180, y + 3, 8, on ? 6 : 3, 'left', on); if (!on) r(178, y + 7, 124, 1, 9); hot(162, y, 148, 16, 'rk', i, on ? '划掉' : '恢复'); });
    txt('留下 ' + S.rk.filter(Boolean).length + ' 条（至少 4 条）', 310, 160, 7, 7, 'right');
  },
  btns: () => [['请零上架', 'rkgo'], ['全部恢复', 'rkall']],
  hint: () => ['先找互相打架的：第一、二、三条不能同时成立（甲的玻璃罐不能放下层，甲的铁砧只能放下层，可它们得在同一层）。第三条和第八条更是正好相反。', '易碎的有三件，架子只有三层：留着第五条，就必有一件易碎的在下层，所以第一条和第五条也只能留一条。'],
  sol: () => '<p>八条全留是摆不出来的。能留下的最多是 5 条，只有一种留法：</p><p><b>留第一、四、六、七、八条</b>（划掉二、三、五）。</p><p>只留 4 条的话有 10 种留法，比如：一、二、六、七；或者三、四、五、七。</p><p>为什么：第三条和第八条相反；第一、二、三条凑不齐；第一条和第五条凑不齐；第二条和第四条也凑不齐（石像又重又旧）。</p>',
  skip() { S.rk = [1, 0, 0, 1, 0, 1, 1, 1].map(Boolean); A.rkgo(); } });
const ZEROLINE = Z('被你划掉的那几条，我会从规程里删去。……原来规程是可以改的。');

/* ③ 苗圃 · 清洁臂：只会直着滑 */
const NROWS = ['........', '........', '...f....', '...ff...', 'f.#.....', 'S....f..'], NW = 8, NH = 6, NMAX = 4;
function slidePath(blocks) {
  const B = new Set(blocks.map(b => b[0] + ',' + b[1])), wall = (x, y) => x < 0 || x >= NW || y < 0 || y >= NH || NROWS[y][x] === '#' || B.has(x + ',' + y);
  let x = 0, y = 5, d = 0; const seen = new Set(), path = [[x, y]];
  for (let turns = 0; turns < 40;) { const nx = x + DX4[d], ny = y + DY4[d]; if (wall(nx, ny)) { const k = x + ',' + y + ',' + d; if (seen.has(k)) break; seen.add(k); d = (d + 1) % 4; turns++; continue; } x = nx; y = ny; path.push([x, y]); }
  return path;
}
reg('nursery', { name: '苗圃', parent: 'green', desc: () => '清洁臂的委托：「我想替它们浇水。可我只会直着滑，撞到东西才会向右转。」点空地可以放一只空花盆当挡板，最多 ' + NMAX + ' 只。摆好以后让清洁臂开动，它得经过每一盆干着的花。' + bestTxt('nursery'),
  draw() {
    r(0, 0, W, H, 21); const x0 = 80, y0 = 8, c = 20; r(x0 - 3, y0 - 3, NW * c + 6, NH * c + 6, 13); r(x0, y0, NW * c, NH * c, 11);
    const run = sim && sim.kind === 'slide', done = new Set(), n = run ? sim.i : 0; if (run) for (let i = 0; i <= n && i < sim.path.length; i++) done.add(sim.path[i][0] + ',' + sim.path[i][1]);
    for (let j = 0; j < NH; j++) for (let i = 0; i < NW; i++) {
      const x = x0 + i * c, y = y0 + j * c, ch = NROWS[j][i], k = i + ',' + j; r(x, y, c, 1, 21); r(x, y, 1, c, 21);
      if (run && done.has(k)) { ctx.globalAlpha = .35; r(x + 7, y + 7, 6, 6, 5); ctx.globalAlpha = 1; }
      if (ch === '#') { r(x + 2, y + 2, 16, 16, 3); r(x + 2, y + 2, 16, 3, 4); txt('柱', x + 10, y + 6, 8, 5, 'center'); }
      else if (ch === 'f') { const wet = (run && done.has(k)) || (!run && S.f.nurse); r(x + 5, y + 12, 10, 6, 8); r(x + 4, y + 11, 12, 2, 14); line(x + 10, y + 11, x + 10, y + 6, 12); if (wet) { r(x + 7, y + 2, 6, 6, [16, 7, 15, 9, 5][(i + j) % 5]); px(x + 9, y + 4, 6); px(x + 10, y + 4, 6); } else { r(x + 9, y + 4, 3, 3, 13); } }
      else if (S.pots.some(p => p[0] === i && p[1] === j)) { r(x + 4, y + 6, 12, 11, 8); r(x + 3, y + 5, 14, 3, 14); r(x + 6, y + 8, 8, 2, 13); if (!sim) hot(x, y, c, c, 'pt', k, '收回花盆'); }
      else if (ch === '.' && !sim) hot(x, y, c, c, 'pt', k, '');
    }
    const p = run ? sim.path[Math.min(n, sim.path.length - 1)] : [0, 5], ax = x0 + p[0] * c, ay = y0 + p[1] * c; r(ax + 3, ay + 4, 14, 13, 4); r(ax + 3, ay + 4, 14, 2, 5); r(ax + 8, ay + 8, 4, 4, 7); if (!run) { r(ax + 17, ay + 9, 3, 3, 6); }
    txt('花盆', 12, 30, 8, 5); for (let i = 0; i < NMAX; i++) { const y = 46 + i * 16; r(14, y, 12, 11, i < NMAX - S.pots.length ? 8 : 21); r(13, y - 1, 14, 3, i < NMAX - S.pots.length ? 14 : 21); }
    txt('还剩 ' + (NMAX - S.pots.length), 12, 112, 7, 6, 'left', false);
    txt('出发时朝右', 250, 150, 7, 5, 'left', false); txt('撞到就右转', 250, 160, 7, 5, 'left', false);
    txt('干的花 5 盆', 12, 150, 7, 5, 'left', false); if (run) txt('已浇 ' + [...done].filter(k => { const [i, j] = k.split(','); return NROWS[j][i] === 'f'; }).length, 12, 160, 7, 7, 'left', false);
  },
  btns: () => sim ? [] : [['让清洁臂开动', 'ptgo'], ['收回全部花盆', 'ptclr']],
  hint: () => ['不放花盆的话，它只会贴着四面墙转圈，只浇得到 2 盆。要让它拐进中间，得在它滑行的路上提前放一只花盆。', '两只花盆就够。第一只放在最左边那一列，让它沿左墙往上滑的时候提前拐弯。'],
  sol: () => '<p>最少要 2 只花盆，有 4 种摆法。其中一种（列从左往右数，行从上往下数）：</p><ol><li>第 1 列、第 3 行</li><li>第 3 列、第 6 行</li></ol><p>路线：它先向右滑，撞到第二只花盆……每撞一次就右转，最后把 5 盆花都经过一遍。用 3 只花盆的摆法有一百多种，随便试也能试出来。</p>',
  skip() { S.pots = [[0, 2], [2, 5]]; S.f.nurse = 1; sideWin('nursery', 0, '零把两只花盆的位置发给了清洁臂。五盆花都浇到了。', ARMLINE); } });
const ARMLINE = { who: '清洁臂', t: '都浇到了。擦了这么多年地，原来我也能照顾点什么。' };

/* ④ 休息舱 · 螺丝：怎么分都行，但得有规矩 */
const SATTR = [['颜色', ['红', '蓝', '黄']], ['形状', ['圆', '方', '三角']], ['大小', ['大', '小']], ['材质', ['金属', '木头']]];
const SIT = [[0, 0, 0, 0], [0, 1, 1, 1], [0, 2, 0, 1], [0, 0, 1, 0], [1, 1, 0, 0], [1, 0, 1, 1], [1, 2, 1, 0], [1, 1, 0, 1], [2, 2, 0, 0], [2, 0, 0, 1], [2, 1, 1, 0], [2, 2, 1, 1]];
const sName = it => it.map((v, a) => SATTR[a][1][v]).join(' · ');
function sortRule(b) {
  const fn = (idx, a) => { const m = {}; return idx.every(i => { const v = SIT[i][a]; if (m[v] === undefined) m[v] = b[i]; return m[v] === b[i]; }); };
  const all = SIT.map((_, i) => i), used = new Set(b);
  if (used.size < 2) return null;
  for (let a = 0; a < 4; a++) if (fn(all, a)) return { tier: 1, t: '你是按' + SATTR[a][0] + '分的。' };
  for (let a = 0; a < 4; a++) for (let v = 0; v < SATTR[a][1].length; v++) {
    const inn = all.filter(i => SIT[i][a] === v), out = all.filter(i => SIT[i][a] !== v); if (!inn.length || new Set(inn.map(i => b[i])).size !== 1) continue;
    const box = b[inn[0]]; if (out.some(i => b[i] === box) || new Set(out.map(i => b[i])).size !== 2) continue;
    for (let a2 = 0; a2 < 4; a2++) if (a2 !== a && fn(out, a2)) return { tier: 2, t: SATTR[a][1][v] + '的单独一盒，剩下的按' + SATTR[a2][0] + '分。这个规矩，我没想到。' };
  }
  return null;
}
function drawThing(i, x, y) {
  const [col, sh, sz, mat] = SIT[i], c = [9, 4, 7][col], d = [16, 3, 8][col], s = sz ? 4 : 7, cx = x + 9, cy = y + 9;
  if (sh === 0) circ(cx, cy, s, c); else if (sh === 1) r(cx - s, cy - s, s * 2 + 1, s * 2 + 1, c); else for (let k = 0; k <= s * 2; k++) r(cx - k / 2, cy - s + k, k + 1, 1, c);
  if (mat === 0) { r(cx - 1, cy - (sh === 2 ? 0 : s - 2), 2, 2, 6); px(cx + 1, cy + (sh === 2 ? 3 : 0), 6); } else { for (let k = -s + 2; k < s; k += 3) r(cx - (sh === 2 ? (k + s) / 2 : s - 1), cy + k + (sh === 2 ? 1 : 0), sh === 2 ? k + s : s * 2 - 1, 1, d); }
}
reg('bunk', { name: '休息舱', parent: 'obs', desc: () => '螺丝的委托：「我捡的十二件东西，替我收进盒子。怎么分你定，可得有个规矩，我要猜得出来。」点一件东西，它会依次换到盒一、盒二、盒三、再回到桌上。鼠标停在上面能看清它是什么。' + bestTxt('bunk'),
  draw() {
    room(1, 2, 2, 1); r(40, 8, 240, 60, 14); r(40, 8, 240, 3, 8); r(44, 12, 232, 52, 13);
    const cnt = [0, 0, 0, 0];
    SIT.forEach((it, i) => { const b = S.srt[i], k = cnt[b]++; let x, y; if (!b) { x = 52 + (i % 6) * 37; y = 15 + Math.floor(i / 6) * 25; } else { x = 14 + (b - 1) * 102 + (k % 4) * 22; y = 96 + Math.floor(k / 4) * 22; } drawThing(i, x, y); hot(x - 1, y - 1, 21, 21, 'so', i, sName(it)); });
    for (let b = 1; b <= 3; b++) { const x = 10 + (b - 1) * 102; ctx.globalAlpha = .9; r(x, 90, 96, 4, 14); r(x, 90, 3, 74, 14); r(x + 93, 90, 3, 74, 14); r(x, 161, 96, 4, 14); ctx.globalAlpha = 1; txt('盒' + CNUM[b - 1], x + 48, 80, 8, 7, 'center'); }
    catAt(294, 68); txt('金属的有反光，木头的有木纹', 160, 168, 7, 4, 'center', false);
  },
  btns: () => [['分好了', 'sook'], ['全部倒回桌上', 'soclr']],
  hint: () => ['没有标准答案。挑一样特征（颜色、形状、大小或材质），让同一种的进同一只盒子就行。有一只盒子空着也可以。', '想让螺丝吃惊，就用两样特征：比如红的单独一盒，剩下的按大小分。'],
  sol: () => '<p>这一题怎么分都行，只要讲得出规矩。最简单的三种：</p><ul><li>按颜色：红、蓝、黄各一盒。</li><li>按形状：圆、方、三角各一盒。</li><li>按大小或材质：分成两盒，第三只盒子空着。</li></ul><p>想拿「漂亮」的评语，用两步的规矩：先把某一种（比如红的）单独放一盒，剩下的再按另一样特征分成两盒。</p>',
  skip() { S.srt = SIT.map(it => it[0] + 1); A.sook(); } });
const CATLINE = { who: '螺丝', t: '行。这下我的东西有地方放了。……草莓还你，我本来就是想放到你蛋糕上的。' };

/* ⑤ 冷却井 · 温控器：倒来倒去，凑出 42 度 */
const TCAP = [10, 6, 4], TINIT = [[5, 90], [6, 30], [4, 0]], TN = ['甲', '乙', '丙'];
const tfmt = t => (Math.round(t * 100) / 100).toString();
reg('shaft', { name: '冷却井', parent: 'core', desc: () => '温控器的委托：「冷却液要正好 42 度。我只会量，不会倒。」三只水箱的水可以互相倒：一直倒到对方满，或者自己空。两股水混在一起，温度按水量平均。让任意一只水箱恰好 42 度。' + bestTxt('shaft'),
  draw() {
    r(0, 0, W, H, 0); for (let i = 0; i < 5; i++) { r(6 + i * 7, 0, 2, H, 2); r(W - 8 - i * 7, 0, 2, H, 2); }
    r(46, 6, 228, 168, 1); r(46, 6, 228, 2, 4); if (!S.f.quiet) { const on = tick % 8 < 4; r(150, 0, 20, 5, on ? '#ff3030' : '#501010'); if (on) soft(160, 4, 22, [255, 40, 40], .35); }
    txt('目标：任意一箱 = 42°', 54, 12, 9, 7); txt('已倒 ' + S.tkn + ' 次', 266, 13, 8, 5, 'right');
    S.tk.forEach(([v, t], i) => {
      const x = 66 + i * 70, h = TCAP[i] * 10, y = 142 - h, fh = Math.round(v * 10), col = t < 25 ? 4 : t < 45 ? 23 : t < 65 ? 8 : 9, hit = v > 0 && Math.abs(t - 42) < 1e-6;
      r(x - 2, y - 2, 52, h + 4, hit ? 7 : 3); r(x, y, 48, h, 0); if (v > 0) { r(x, 142 - fh, 48, fh, col); r(x, 142 - fh, 48, 2, 6); }
      for (let k = 1; k < TCAP[i]; k++) r(x, 142 - k * 10, 4, 1, 3);
      txt(TN[i], x + 24, y - 14, 9, 6, 'center'); txt(v > 0 ? tfmt(t) + '°' : '空', x + 24, 146, 10, hit ? 7 : 6, 'center'); txt(v + ' / ' + TCAP[i] + ' 升', x + 24, 159, 7, 4, 'center', false);
    });
  },
  btns: () => [['甲→乙', 'pour', '01'], ['甲→丙', 'pour', '02'], ['乙→甲', 'pour', '10'], ['乙→丙', 'pour', '12'], ['丙→甲', 'pour', '20'], ['丙→乙', 'pour', '21'], ['重来', 'pourclr']],
  hint: () => !S.f.quiet ? ['这一题要动的是网页本身：温控器的警报和网页的声音是连着的。', '点网页上的「声音：开」，把它关掉。关掉以后可以再打开，警报不会再响。'] : ['90 度太热，0 度太冷。先用丙箱的冷水把甲箱压下来：5 升 90 度加 4 升 0 度，是 9 升 50 度。', '甲箱 50 度以后，再想办法让它和 30 度的水按 2 比 1 混在一起：(48×4 + 30×2) ÷ 6 = 42。'],
  sol: () => '<p>最少 4 次，一共有 9 种倒法。其中一种：</p><ol><li>丙→甲：甲变成 9 升 50°</li><li>乙→丙：丙变成 4 升 30°，乙剩 2 升 30°</li><li>丙→甲：甲变成 10 升 48°，丙剩 3 升</li><li>甲→乙：乙变成 6 升，(2×30 + 4×48) ÷ 6 = 42°</li></ol>',
  skip() { S.tk = [[6, 48], [6, 42], [3, 30]]; S.tkn = 4; sideWin('shaft', 0, '零替你把水倒好了。乙箱正好 42 度。', TEMPLINE); } });
const TEMPLINE = { who: '温控器', t: '四十二度整。我量了一辈子温度，这是头一次有人照着我说的数来。' };

function simStep() {
  if (!sim) return;
  if (sim.kind === 'drone') {
    const c = S.pg[sim.i % S.pg.length]; DMAPS.forEach((m, k) => { if (!sim.st[k].done) dStep(m, sim.st[k], c); }); sim.i++;
    if (sim.st.every(s => s.done)) { const n = S.pg.length; sim = null; sideWin('mail', n <= 5 ? 2 : n <= 6 ? 1 : 0, '三架无人机都把信投进了信箱。你的程序有 ' + n + ' 条指令。', NAVLINE); refresh(); save(); }
    else if (sim.i >= DSTEPS) { const bad = sim.st.map((s, k) => s.done ? '' : '航图' + CNUM[k]).filter(Boolean).join('、'); sim = null; sfx('bad'); say('飞了 ' + DSTEPS + ' 步，' + bad + '上的信还没送到。同一段程序要让三张图都送到。' + encourage()); refresh(); }
  } else if (sim.kind === 'slide') {
    sim.i += 2;
    if (sim.i >= sim.path.length + 3) {
      const got = new Set(sim.path.filter(([x, y]) => NROWS[y][x] === 'f').map(p => p + '')).size, n = S.pots.length; sim = null;
      if (got === 5) { S.f.nurse = 1; sideWin('nursery', n <= 2 ? 2 : n === 3 ? 1 : 0, '清洁臂滑了一圈，五盆花都浇到了。你用了 ' + n + ' 只花盆。', ARMLINE); save(); }
      else { sfx('bad'); say('清洁臂绕回了走过的路，停下了。还有 ' + (5 - got) + ' 盆花没浇到。换个地方放花盆再试。' + encourage()); }
      refresh();
    }
  }
}
Object.assign(A, {
  eyes() {
    S.f.eyes = (S.f.eyes || 0) + 1;
    if (S.f.eyes === 1) return talk(['栅栏后面，两点黄光一闪，灭了。', Z('……温室的热感应器这阵子老是误报。断电以后，我的摄像头只看得见一半。'), Z('大概是哪个指示灯的反光。')]);
    say(S.f.eyes === 2 ? '你凑近栅栏。里面黑漆漆的，有一股机油味，还有一点……草莓味？' : '栅栏后面静悄悄的。你觉得有什么东西正屏住呼吸。');
  },
  paint() {
    if (S.f.seed) return say('画上的花盘被水化开了，只剩一团黄。' + (S.f.sun ? '真的那一株，在土箱里朝着东边。' : '种子在你手里。'));
    if (!S.f.water) return say('一幅巴掌大的油画：一株向日葵，花盘朝着画框右边。画框背面用铅笔写着一个字：东。颜料摸上去还有点黏，像是很怕水。');
    S.f.seed = 1; give('seed');
    talk(['喷淋的水雾一阵阵落在画布上。颜料化开了，花盘正中滚出来一粒葵花籽，落进你手心。', '是真的。', Z('……画里的东西也能拿出来？这座站里的怪事很多，我已经习惯了。'), Z('左边那只土箱里有土。')]);
  },
  soil() {
    if (S.f.sun) return say('向日葵长得很快，花盘一直朝着东边，没有再转过。');
    if (S.sel !== 'seed') return say(has('seed') ? '一箱培养土。先在下面的物品栏里选中葵花籽，再点土箱。' : '一箱培养土，松松软软的，什么也没种。');
    drop('seed'); S.f.sun = 1; sfx('win');
    talk(['你把葵花籽按进土里。补光灯一亮，它就冒了芽，一节一节往上长，开出一朵花。', '花盘转了半圈，朝着东边停住了。', Z('画框背面那个「东」字，原来是这个意思。')].concat(fact('sun')));
  },
  fact(k) { sfx('pick'); talk([FACTIN[k]].concat(fact(k))); },
  dc(c) { if (sim) return; if (c === '0') S.pg = []; else if (c === '-') S.pg.pop(); else if (S.pg.length < DMAX) S.pg.push(c); else return say('无人机只装得下 ' + DMAX + ' 条指令。'); sfx('click'); },
  dfly() { if (sim) return; if (!S.pg.length) return say('程序还是空的。'); if (!S.pg.includes('F')) return say('程序里一条「前进」都没有，无人机只会原地打转。'); sim = { kind: 'drone', st: dStart(), i: 0 }; sfx('step'); say('三架无人机同时起飞，照着同一段程序飞。'); },
  rk(i) { S.rk[+i] = !S.rk[+i]; S.arr = null; sfx('click'); },
  rkall() { S.rk = RTXT.map(() => true); S.arr = null; say('八条规程都恢复了。'); },
  rkgo() {
    const n = S.rk.filter(Boolean).length; if (n < 4) { sfx('bad'); return say('零：「规程删得太多，就不叫规程了。至少留四条。」'); }
    const a = shelve(S.rk); if (!a) { S.arr = null; sfx('bad'); return say('零把九十种摆法都试了一遍，没有一种能同时满足你留下的 ' + n + ' 条规程。留下的规程里还有互相打架的。' + encourage()); }
    S.arr = a; sideWin('store', n >= 5 ? 2 : 1, '零照着你留下的 ' + n + ' 条规程，把六件当物都放上了架子，一条也没有违反。', ZEROLINE);
  },
  pt(p) { if (sim) return; const [x, y] = p.split(',').map(Number), i = S.pots.findIndex(q => q[0] === x && q[1] === y); if (i >= 0) S.pots.splice(i, 1); else if (S.pots.length < NMAX) S.pots.push([x, y]); else return say('花盆用完了。点已经放下的花盆可以收回来。'); sfx('click'); },
  ptclr() { if (sim) return; S.pots = []; say('花盆都收回来了。'); },
  ptgo() { if (sim) return; sim = { kind: 'slide', path: slidePath(S.pots), i: 0 }; sfx('step'); say('清洁臂开动了。'); },
  so(i) { S.srt[+i] = (S.srt[+i] + 1) % 4; sfx('click'); say(sName(SIT[+i]) + '：' + ['放回桌上', '放进盒一', '放进盒二', '放进盒三'][S.srt[+i]] + '。'); },
  soclr() { S.srt = SIT.map(() => 0); say('十二件东西都倒回了桌上。'); },
  sook() {
    if (S.srt.some(b => !b)) return say('桌上还有东西没收进盒子。');
    const res = sortRule(S.srt); if (!res) { sfx('bad'); return talk([C('我看不出规矩。'), C('同一只盒子里的东西，总得有点一样的地方。一样的东西，也不该分在两处。再想想。')]); }
    S.aff.c += S.shard.includes('bunk') ? 0 : 1; sideWin('bunk', res.tier, ['螺丝绕着三只盒子转了一圈，挨个闻了闻。', C(res.t)], CATLINE);
  },
  pour(p) {
    if (!S.f.quiet) {
      S.f.alarmTry = (S.f.alarmTry || 0) + 1;
      if (muted) { quiet('你那边的声音本来就关着。温控器侧耳听了听，警报也跟着停了。'); return; }
      if (S.f.alarmTry >= (S.assist ? 2 : 3)) { quiet('零：「我替你把警报按掉了。」'); }
      else return talk([{ who: '温控器', t: '嘀——嘀——这警报响了三年，我量不准。能让它安静一会儿吗？' }, Z(S.f.alarmTry > 1 ? '这一题要动的是网页本身。网页上有一个声音开关。' : '它的警报，和你那边的声音是连在一起的。')]);
    }
    const i = +p[0], j = +p[1], s = S.tk, amt = Math.min(s[i][0], TCAP[j] - s[j][0]); if (amt <= 0) return say(s[i][0] <= 0 ? TN[i] + '箱是空的。' : TN[j] + '箱已经满了。');
    s[j][1] = (s[j][0] * s[j][1] + amt * s[i][1]) / (s[j][0] + amt); s[j][0] += amt; s[i][0] -= amt; S.tkn++; sfx('click');
    const k = s.findIndex(t => t[0] > 0 && Math.abs(t[1] - 42) < 1e-6);
    if (k >= 0) return sideWin('shaft', S.tkn <= 4 ? 2 : S.tkn <= 6 ? 1 : 0, TN[k] + '箱的表针停在了 42 度。你一共倒了 ' + S.tkn + ' 次。', TEMPLINE);
    say('倒了 ' + amt + ' 升。' + TN[j] + '箱现在 ' + s[j][0] + ' 升，' + tfmt(s[j][1]) + ' 度。');
  },
  pourclr() { S.tk = TINIT.map(t => t.slice()); S.tkn = 0; say('三只水箱恢复了原样。'); }
});

/* ---- 笔记本 ---- */
const NOTES = {
  dock: '码头告示：集齐时、声、光三枚印章，到机房验印。印章依次领取：先时，再声，后光。',
  scale: '当铺天平：九枚硬币里有一枚略轻，天平只能借两次。',
  clock: '当铺座钟：停着。拨到正确的时间，再拉钟摆。',
  glass: '温室玻璃：映着走廊里的钟，看上去是 8 点 20 分。镜子里的东西左右是反的。',
  locker: '码头储物柜：三位密码。转轮上方依次画着 帆、鱼、钥匙。',
  chart: '观星台星图：鱼、钥匙、帆三个星座。亮的点才算星。',
  tele: '望远镜铭牌：「折射式。所见上下左右皆反。」',
  console: '观星台控制台：九个插孔三行三列，要把星座连出来。',
  tiles: '机房配电板：五路分闸，保险丝最多扛 10 格。断电前的电表记录里，有两条读数和铭牌对不上。',
  vault: '机房保险柜：三位数字。零把它存进了三段广播里。',
  radio: '小艇收音机：黄灯、红灯、紫灯三个频道，各循环播一个数字的电码。',
  morse: '电码表（点短、划长）：1 ·————　2 ··———　3 ···——　4 ····—　5 ·····　6 —····　7 ——···　8 ———··　9 ————·　0 —————',
  flowers: '温室的花开了：从左到右三槽，红、紫、黄。',
  inner: '主机日志（只有一条是真话）：' + LOGS.join(' '),
  cargo: '货舱的粉笔字：' + RIDDLE.map(t => t.replace('箱子上的粉笔字：', '')).join(' '),
  archive: '档案室：抽屉按三张当票的去向编号。拨成你自己当初的决定。',
  mail: '邮件室 · 导航副机：给无人机写一段最多 8 条指令的循环程序，同一段程序要在三张航图上都把信送到。',
  store: '库房规程簿 · 零：八条规程互相打架。划掉几条（至少留四条），让六件当物都能上架。',
  chest: '库房宝箱：要三块记忆碎片，再输入你的口令。',
  nursery: '苗圃 · 清洁臂：它只会直着滑，撞到东西向右转。放最多 4 只花盆当挡板，让它经过 5 盆干着的花。',
  bunk: '休息舱 · 螺丝：把十二件东西分进盒子。怎么分都行，但要有规矩。',
  shaft: '冷却井 · 温控器：三只水箱互相倒水，让任意一只恰好 42 度。甲 10 升、乙 6 升、丙 4 升。',
c_plate: '　· 盘子：擦得锃亮，贴着「已清洁」。', c_print: '　· 地上：梅花形的小油印，通往通风口。', c_duty: '　· 导航副机整晚在驾驶舱值班。', c_order: '　· 清洁臂不进食，擦完东西就贴贴纸。', c_vent: '　· 通风口栅栏上挂着草莓蒂。'
};
const has_ = k => S.shard.includes(k);
const NDONE = { dock: () => S.f.gate, scale: () => S.f.scale, clock: () => S.f.seal_t, glass: () => S.f.seal_t, locker: () => S.f.locker, chart: () => S.f.locker, tele: () => S.f.seal_l, console: () => S.f.seal_l,
  tiles: () => S.f.power, vault: () => S.f.seal_s, radio: () => S.f.seal_s, morse: () => S.f.seal_s, flowers: () => S.f.seal_s, inner: () => S.f.pass, cargo: () => S.f.pass, archive: () => S.f.pass,
  mail: () => has_('mail'), store: () => has_('store'), chest: () => S.f.chest, nursery: () => has_('nursery'), bunk: () => has_('bunk'), shaft: () => has_('shaft') };
const ndone = k => { const b = k.startsWith('c_') ? 'bunk' : k; return !!(NDONE[b] && NDONE[b]()); };
let toastT = null;
function note(id) {
  if (!NOTES[id] || S.notes.includes(id) || ndone(id)) return;
  S.notes.push(id); const t = $('ntoast'); t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 1600);
}
function autoNotes() { note(S.v === 'tele' && !S.f.lens ? '' : S.v === 'rules' ? 'store' : S.v); if (S.f.water) note('flowers'); if (S.v === 'store') note('chest'); }
function showNotes() {
  const order = Object.keys(NOTES), all = order.filter(k => S.notes.includes(k)), got = all.filter(k => !ndone(k)), gone = all.filter(k => ndone(k) && !k.startsWith('c_')).length;
  const nn = got.filter(k => !k.startsWith('c_')).map(k => `<li>${esc(NOTES[k])}${k === 'bunk' ? got.filter(c => c.startsWith('c_')).map(c => '<br>' + esc(NOTES[c])).join('') : ''}</li>`).join('');
  $('notebox').innerHTML = `<h2>笔记</h2><p class="sub">看过的线索会自动记在这里</p><p class="goal"><b>下一步</b>　${esc(goalPlace())}</p><p>印章：${['t', 's', 'l'].map(k => S.f['seal_' + k] ? ['时', '声', '光'][['t', 's', 'l'].indexOf(k)] : '＿').join(' ')}　·　星屑 ${S.stars.length} / 3　·　记忆碎片 ${S.shard.length} / 5</p>${nn ? `<ul class="notes">${nn}</ul>` : '<p style="color:#6b8cc4">' + (gone ? '手上的线索都用完了。' : '还没有记下任何东西。') + '</p>'}${gone ? `<p style="color:#6b8cc4;font-size:13px">已经解开、后面用不上的 ${gone} 条线索划掉了。</p>` : ''}<div class="row"><button type="button" class="pri" id="nClose">合上</button></div>`;
  $('notes').hidden = false; $('nClose').onclick = () => { $('notes').hidden = true; };
}

/* ---- 宝箱与相框 ---- */
function askCode(title, cb) {
  $('askt').textContent = title; $('askin').value = ''; $('askmsg').textContent = ''; $('ask').hidden = false; $('askin').focus();
  $('askOk').onclick = () => cb($('askin').value); $('askNo').onclick = () => { $('ask').hidden = true; };
  $('askin').onkeydown = e => { if (e.key === 'Enter') cb($('askin').value); };
}
async function photoImg() {
  if (!ME || !ME.photo || !window.PHOTOS) return null;
  const e = window.PHOTOS[ME.photo.n]; if (!e) return null;
  const k = await crypto.subtle.importKey('raw', b64(ME.photo.k), 'AES-GCM', false, ['decrypt']);
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(e.i) }, k, b64(e.c));
  const url = URL.createObjectURL(new Blob([buf], { type: 'image/jpeg' }));
  return await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });
}
async function showPhoto() {
  const im = await photoImg().catch(() => null);
  const P = 8, B = 7 * P, iw = im ? im.width : 600, ih = im ? im.height : 600;
  const c = $('pcv'); c.width = iw + B * 2; c.height = ih + B * 2 + 8 * P;
  const g = c.getContext('2d'), old = ctx; ctx = g; g.imageSmoothingEnabled = false;
  const R = (x, y, w, h, col) => { g.fillStyle = PAL[col]; g.fillRect(x * P, y * P, w * P, h * P); };
  const cw = c.width / P, ch = c.height / P, fh = (ih + B * 2) / P;
  g.fillStyle = PAL[0]; g.fillRect(0, 0, c.width, c.height);
  R(0, 0, cw, fh, 14); R(0, 0, cw, 1, 7); R(0, 0, 1, fh, 7); R(0, fh - 1, cw, 1, 13); R(cw - 1, 0, 1, fh, 13);
  R(1, 1, cw - 2, 1, 8); R(1, 1, 1, fh - 2, 8); R(1, fh - 2, cw - 2, 1, 13); R(cw - 2, 1, 1, fh - 2, 13);
  for (let i = 3; i < cw - 3; i += 4) { R(i, 2, 2, 1, (i / 4) % 2 ? 7 : 8); R(i, fh - 3, 2, 1, (i / 4) % 2 ? 7 : 8); }
  for (let j = 3; j < fh - 3; j += 4) { R(2, j, 1, 2, (j / 4) % 2 ? 7 : 8); R(cw - 3, j, 1, 2, (j / 4) % 2 ? 7 : 8); }
  R(4, 4, cw - 8, fh - 8, 6); R(5, 5, cw - 10, fh - 10, 13);
  [[2, 2], [cw - 4, 2], [2, fh - 4], [cw - 4, fh - 4]].forEach(([x, y]) => { R(x, y, 2, 2, 7); R(x, y, 1, 1, 6); });
  if (im) g.drawImage(im, B, B, iw, ih);
  else { g.fillStyle = PAL[6]; g.fillRect(B, B, iw, ih); g.fillStyle = PAL[13]; g.font = 'bold 34px "PingFang SC","Microsoft YaHei",sans-serif'; g.textAlign = 'center'; g.fillText(ME ? '这一格，留给下一张合照' : '这只宝箱认的不是你', B + iw / 2, B + ih / 2); }
  const cat = PCAT.sit[0]; for (let y = 0; y < cat.length; y++) for (let x = 0; x < cat[y].length; x++) if (cat[y][x] !== '.') R(cw - 20 + x, y, 1, 1, parseInt(cat[y][x], 36));
  R(0, fh, cw, ch - fh, 0); R(Math.floor(cw / 2) - 34, fh + 1, 68, 6, 14); R(Math.floor(cw / 2) - 34, fh + 1, 68, 1, 7); R(Math.floor(cw / 2) - 34, fh + 6, 68, 1, 13);
  g.fillStyle = PAL[0]; g.font = 'bold 26px "PingFang SC","Microsoft YaHei",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('零号站 · 记忆存档' + (ME ? ' · ' + ME.name : ''), c.width / 2, (fh + 4) * P);
  ctx = old;
  $('photo').hidden = false;
  $('pSave').hidden = !im; $('pSave').onclick = () => { const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = '零号站记忆存档.png'; a.click(); };
  $('pClose').onclick = () => { $('photo').hidden = true; };
}

Object.assign(A, {
  chest() {
    if (S.f.chest) return showPhoto();
    if (S.shard.length < 3) return say('宝箱的盖子上有三个碎片形状的凹槽，下面还有一把要口令的锁。你现在有 ' + S.shard.length + ' 块记忆碎片。');
    askCode('三块碎片嵌进了凹槽。锁上亮起一行字：「请输入当户的口令」', v => {
      if (!ME) { $('askmsg').textContent = '锁没有反应。这只宝箱只认当户的口令，访客打不开。'; return; }
      if (norm(v) !== S.code) { sfx('bad'); $('askmsg').textContent = '口令不对。这只宝箱只认它主人的口令。'; return; }
      $('ask').hidden = true; S.f.chest = 1; sfx('win'); save(); refresh();
      talk([ME.photo ? '箱盖弹开了。里面躺着一只小小的相框。' : '箱盖弹开了。里面是一只空相框。', ME.photo ? Z('这是站里替你存着的一段记忆。不知道是谁寄来的，只写着要交给你。') : Z('这一格空着。我猜，是留给下一张合照的。')], () => showPhoto());
    });
  }
});

/* ================= 电码 ================= */
let mT = null, mOn = false;
function stopMorse() { if (mT) { clearTimeout(mT); mT = null; } mOn = false; tone(false); }
function startMorse() {
  if (mT) return;
  const U = 250, seq = [];
  for (const d of String(CHD[S.chan])) { for (const ch of MORSE[d]) { seq.push([1, ch === '.' ? U : U * 3]); seq.push([0, U]); } seq.push([0, U * 4]); }
  seq.push([0, U * 8]);
  let i = 0;
  const step = () => { const [on, d] = seq[i]; mOn = !!on; tone(mOn); draw(); i = (i + 1) % seq.length; mT = setTimeout(step, d); };
  step();
}

/* ================= 物品栏、界面 ================= */
const iconURL = {};
function mkIcons() {
  const c = document.createElement('canvas'); c.width = c.height = 12; const old = ctx;
  const mk = (id, fn) => { ctx = c.getContext('2d'); ctx.clearRect(0, 0, 12, 12); fn(); iconURL[id] = c.toDataURL(); };
  mk('token', () => { circ(6, 6, 5, 7); circ(6, 6, 3, 8, false); });
  mk('fuse', () => { r(1, 4, 10, 4, 5); r(1, 4, 2, 4, 6); r(9, 4, 2, 4, 6); r(3, 6, 6, 1, 8); });
  mk('seed', () => { r(4, 1, 4, 10, '#1c1a16'); r(3, 3, 6, 6, '#1c1a16'); r(5, 2, 1, 8, '#e8e0c8'); r(7, 3, 1, 6, '#9a9080'); r(4, 4, 1, 4, '#9a9080'); });
  mk('lens', () => { circ(6, 6, 5, 4); circ(6, 6, 3, 5); px(4, 4, 6); });
  ['t', 's', 'l'].forEach(k => mk('seal_' + k, () => sealIcon(k, 1, 1)));
  mk('pass', () => { circ(6, 6, 5, 9); circ(6, 6, 3, 6, false); px(6, 6, 6); });
  ctx = old;
}
function invClick(id) { audio(); S.sel = S.sel === id ? null : id; sfx('click'); say(S.sel ? ITEMS[id][0] + '：' + ITEMS[id][1] + '（已选中，点场景里的东西来使用）' : ''); refresh(); save(); }
let K = 4;
function fitCanvas(c, k0) { const dpr = window.devicePixelRatio || 1, w = c.clientWidth || 960, k = Math.max(2, Math.min(6, Math.round(w * dpr / 320))); if (c.width !== 320 * k) { c.width = 320 * k; c.height = 180 * k; } return k; }
const HAND = (() => { try {
  const m = ['....##..........', '...#oo#.........', '...#oo#.........', '...#oo#.........', '...#oo####......', '...#oo#oo#oo##..', '.###oo#oo#oo#o#.', '#oo#oooooooo#o#.', '#ooooooooooooo#.', '.#ooooooooooo#..', '..#oooooooooo#..', '..#ooooooooo#...', '...#oooooooo#...', '....#oooooo#....', '....########....'];
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
  m.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = ch === '#' ? '#10141e' : '#f4f0e6'; g.fillRect(x * 2, y * 2, 2, 2); } }));
  return 'url(' + c.toDataURL() + ') 9 0, pointer'; } catch (e) { return 'pointer'; } })();
let mx = -1, my = -1, puffs = [];
const SECXY = { dock: [66, 84], shop: [128, 34], green: [204, 32], obs: [269, 82], core: [192, 141], back: [124, 145] };   // 箭头尖的位置：舱段顶边上方
function feel() {
  if (S.v === 'map' && !dOn) { const g = SECXY[goal()[1]]; if (g) { const y = g[1] - 22 - (tick % 8 < 4 ? 0 : 2); r(g[0] - 4, y - 1, 9, 7, '#10141e'); r(g[0] - 3, y, 7, 2, '#ffd84a'); r(g[0] - 2, y + 2, 5, 1, '#ffd84a'); r(g[0] - 1, y + 3, 3, 1, '#ffd84a'); r(g[0], y + 4, 1, 1, '#ffd84a'); } }   // 手感：悬停的热区四角描白边，点击处冒一点像素灰
  if (!dOn && mx >= 0) { let h = null; for (let i = hots.length - 1; i >= 0; i--) { const o = hots[i]; if (mx >= o.x && mx < o.x + o.w && my >= o.y && my < o.y + o.h) { h = o; break; } }
    if (h && h.w < 200 && !h.hide) { const a = tick % 4 < 2 ? '#ffffff' : '#c8d8ff', L = Math.min(4, Math.floor(h.w / 3), Math.floor(h.h / 3)), x0 = Math.floor(h.x) - 1, y0 = Math.floor(h.y) - 1, x1 = Math.ceil(h.x + h.w), y1 = Math.ceil(h.y + h.h);
      [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, dx, dy]) => { r(dx > 0 ? x : x - L + 1, y, L, 1, a); r(x, dy > 0 ? y : y - L + 1, 1, L, a); }); } }
  puffs = puffs.filter(p => p.t-- > 0); puffs.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .3; r(Math.round(p.x), Math.round(p.y), 1, 1, p.t > 2 ? '#ffffff' : '#8a9ab8'); });
}
function puff(x, y) { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + Math.random() * .5; puffs.push({ x, y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2 - 1, t: 4 }); } }
function tabTitle() {   // 第四面墙：观星台的线索写在浏览器标签页上
  const t = S.v === 'obs' && !S.stars.includes(2) && $('title').hidden ? (tick % 24 < 12 ? '零号站 · 观星台' : '✦ 穹顶玻璃右上角，有一颗星不在星图上') : '零号站';
  if (document.title !== t) document.title = t;
}
function draw() { tabTitle(); hots = []; K = fitCanvas(cv); ctx.setTransform(K, 0, 0, K, 0, 0); ctx.imageSmoothingEnabled = false; V[S.v].draw(); feel(); }
window.addEventListener('resize', () => { try { draw(); } catch (e) {} });
function refresh() {
  const v = V[S.v];
  if (S.v === 'radio' && S.chan != null) startMorse(); else stopMorse(); alarm();
  draw();
  $('goal').textContent = '下一步：' + goalPlace(); $('goal').hidden = !$('title').hidden;
  $('where').textContent = v.name; $('back').hidden = !v.parent;
  $('labs').innerHTML = S.v === 'map' ? [['码头', 61, 111], ['当铺', 128, 57], ['温室', 205, 59], ['观星台', 270, 113], ['机房', 193, 167], [S.f.gate ? '后舱' : '？？？', 125, 167]].map(([t, x, y]) => `<span class="lab" style="left:${x / 3.2}%;top:${y / 1.8}%">${t}</span>`).join('') : '';
  $('stars').textContent = (S.stars.length ? '✦'.repeat(S.stars.length) : '') + (S.shard.length ? '　◆' + S.shard.length : ''); if ($('title').hidden) autoNotes();
  $('inv').innerHTML = S.inv.map(id => `<button type="button" class="slot${S.sel === id ? ' sel' : ''}" data-id="${id}" aria-pressed="${S.sel === id}"><img src="${iconURL[id]}" alt="">${ITEMS[id][0]}</button>`).join('');
  $('pb').innerHTML = (v.btns ? v.btns() : []).map(([t, a, p]) => `<button type="button" data-a="${a}" data-p="${p === undefined ? '' : p}">${t}</button>`).join('');
  const solved = { scale: S.f.scale, clock: S.f.seal_t, locker: S.f.locker, console: S.f.seal_l, tiles: S.f.power, vault: S.f.seal_s, radio: S.f.seal_s, inner: S.f.pass, crate: S.f.pass, archive: S.f.pass, mail: S.shard.includes('mail'), rules: S.shard.includes('store'), nursery: S.shard.includes('nursery'), bunk: S.shard.includes('bunk'), shaft: S.shard.includes('shaft') }[S.v];
  $('bSkip').hidden = !(v.skip && !solved && !shuf && (S.assist || (S.hints[S.v] || 0) >= 2));
  $('bSkip').textContent = S.assist ? '请零代劳' : '跳过这一步';
  $('bSol').hidden = !(v.sol && !sim && (S.assist || (S.hints[S.v] || 0) >= 2));
  if (!dOn) events();
}
function act(a, p) { audio(); if (dOn) return; if (sim && a !== 'go') return; const fn = A[a]; if (!fn) return; const b0 = badN; fn(p); if (badN > b0 && !dOn) { S.fails = (S.fails || 0) + 1; if (S.fails % 2 === 0) $('cap').textContent += ' ' + encourage(); } refresh(); save(); }
function at(e) {
  const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) * W / b.width, y = (e.clientY - b.top) * H / b.height;
  for (let i = hots.length - 1; i >= 0; i--) { const h = hots[i]; if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) return h; }
  const pad = b.width < 560 ? 9 : 0; let best = null, bd = pad;      // 小屏幕上手指粗，放宽到最近的热区
  for (const h of hots) { const dx = Math.max(h.x - x, 0, x - h.x - h.w), dy = Math.max(h.y - y, 0, y - h.y - h.h), d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = h; } }
  return best;
}
cv.addEventListener('click', e => { if (dOn) { if (!dWait) nextLine(); return; } const h = at(e); if (h) { const b = cv.getBoundingClientRect(); puff((e.clientX - b.left) * W / b.width, (e.clientY - b.top) * H / b.height); sfx('tap'); act(h.a, h.p); } });
cv.addEventListener('mousemove', e => { const b = cv.getBoundingClientRect(); mx = (e.clientX - b.left) * W / b.width; my = (e.clientY - b.top) * H / b.height; const h = dOn ? null : at(e); cv.style.cursor = h ? HAND : 'default'; $('tip').hidden = !(h && h.tip); if (h && h.tip) $('tip').textContent = h.tip; });
$('stars').draggable = true;
$('stars').addEventListener('dragstart', e => { if (!S.stars.length) return e.preventDefault(); e.dataTransfer.setData('text/plain', '✦'); e.dataTransfer.effectAllowed = 'move'; });
cv.addEventListener('dragover', e => { if (S.v === 'back' && S.stars.length && !S.f.lit) e.preventDefault(); });
cv.addEventListener('drop', e => {
  e.preventDefault(); if (dOn || S.v !== 'back' || S.f.lit || !S.stars.length) return;
  const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) * W / b.width, y = (e.clientY - b.top) * H / b.height;
  if (x < 110 || x > 210 || y < 50 || y > 130) return say('星屑落在了桌上。再往蛋糕那边一点。');
  puff(x, y); S.f.lit = 1; sfx('pick'); act('cake');
});
cv.addEventListener('mouseleave', () => { mx = my = -1; $('tip').hidden = true; });
$('inv').addEventListener('click', e => { const el = e.target.closest('[data-id]'); if (el && !dOn) invClick(el.dataset.id); });
$('pb').addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (el) act(el.dataset.a, el.dataset.p); });
$('back').onclick = () => { if (dOn) return; const p = V[S.v].parent; if (p) act('go', p); };
const SECT = ['map', 'dock', 'shop', 'green', 'obs', 'core', 'back'];
const special = () => (S.v === 'obs' && S.f.seal_l && !S.stars.includes(2)) || (S.v === 'back' && S.stars.length && !S.f.lit && S.f.cakeTry);
$('bHint').onclick = () => { if (dOn) return; const v = V[S.v], useG = SECT.includes(S.v) && !special(), hk = useG ? 'g:' + goal()[0] : S.v, g = goal(), t = useG ? [g[0], g[2] || g[0]] : v.hint ? v.hint() : ['四处点点看。'], n = S.hints[hk] || 0; say('提示：' + t[Math.min(n, t.length - 1)] + (v.skip && !S.assist && n === 0 ? '（在这个画面再点一次提示，就会出现「跳过这一步」' + (v.sol ? '和「看解答」' : '') + '。）' : '')); S.hints[hk] = n + 1; refresh(); save(); };
$('bSkip').onclick = () => { if (dOn) return; const v = V[S.v]; if (v.skip) { const hk = HOWKEY[S.v]; if (hk && !S.how[hk]) S.how[hk] = S.assist ? 'zero' : 'skip'; skipping = true; try { v.skip(); } finally { skipping = false; } refresh(); save(); } };
$('bSnd').onclick = () => setMute(!muted);
$('bMenu').onclick = () => { stopMorse(); showTitle(); };
$('bNote').onclick = () => { if (!dOn) showNotes(); };
$('bSol').onclick = () => { const v = V[S.v]; if (dOn || !v.sol) return; $('notebox').innerHTML = `<h2>解答</h2><p class="sub">${v.name} · 想自己再试试的话，现在合上还来得及</p>${v.sol()}<div class="row"><button type="button" class="pri" id="nClose">合上</button></div>`; $('notes').hidden = false; $('nClose').onclick = () => { $('notes').hidden = true; }; };
$('bGuide').onclick = $('tGuide').onclick = () => { $('guide').hidden = false; };
$('gClose').onclick = () => { $('guide').hidden = true; };

/* ================= 专属内容的解密 ================= */
const te = new TextEncoder(), td = new TextDecoder();
const norm = s => String(s || '').trim().toLowerCase();
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const normName = s => String(s || '').replace(/\s+/g, '').toLowerCase();
async function unlock(name, code) {
  code = norm(code); name = normName(name);
  if (!code || !name || !window.ENDINGS || !window.crypto || !crypto.subtle) return null;
  for (const e of window.ENDINGS) {
    try {
      const km = await crypto.subtle.importKey('raw', te.encode(name + '|' + code), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(e.s), iterations: 60000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      return JSON.parse(td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(e.i) }, key, b64(e.c))));
    } catch (err) {}
  }
  return null;
}
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ENDS = {
  z1: ['新同事', '登记卡打印出来的时候，螺丝叼着它绕主机跑了三圈。从今天起，零号站有两名在编人员。零说，下次你来，会有一只猫在码头接你。'],
  z2: ['一家人', '职务那一栏空着，备注里多了两个字：家人。零把这张卡贴在了自己的外壳上。它说规程里没有这个词，所以它新建了一条。'],
  c1: ['同行', '螺丝钻进了你的包里，只露出一截闪着灯的尾巴。小艇离港的时候，频道里传来零的声音：「它怕冷。还有，那条规程我删掉了。想回来的时候，随时回来。」'],
  c2: ['守站', '螺丝蹲在舷窗边，看着你的小艇离港。后来零的日志里多了一行：「摄像头前常有一只猫经过。未登记。不处理。」'],
  l1: ['带走', '你把自己的档案夹在腋下，走出了后舱。它比想象的薄。原来一年也就这么几页，剩下的都在你自己身上。'],
  l2: ['留白', '你在档案最后夹了一页白纸，写上明年的日期。零问那一页要记什么。你说，还不知道，所以才要留着。']
};
const FINAL = {
  z: [Z('登记卡我做好了。可是「职务」这一栏，我不知道该给螺丝填什么。你来定吧。'), { who: '零', t: '填什么？', ch: [{ t: '「站长助理。」', f: () => { S.end = 'z1'; } }, { t: '「不填职务。备注里写：家人。」', f: () => { S.end = 'z2'; } }] }],
  c: [Z('{name}，有件事我该告诉你。我的摄像头其实一直看得见。尾巴尖的那盏灯，很亮。'), Z('规程要我立刻上报。我没有删那一条，只是把它的执行时间改成了四个字：来日方长。'), C('……大眼睛，你早说啊。'), C('你要走了。'), { who: '螺丝', t: '那我呢？', ch: [{ t: '「跟我走。」', f: () => { S.end = 'c1'; } }, { t: '「留下来，替我陪着零。它一个人太久了。」', f: () => { S.end = 'c2'; } }] }],
  l: [Z('{name}，猫的事你没有交给我，也没有瞒我。你是自己去查的。'), Z('档案室以前不对当户开放。从今天起，那扇门我不锁了。自己的事，本来就该自己能查。'), '你手里是自己的档案。', { t: '怎么处理它？', ch: [{ t: '带走它。', f: () => { S.end = 'l1'; } }, { t: '留一页空白在这里，明年再来写。', f: () => { S.end = 'l2'; } }] }]
};
let slides = [], si = 0, slideDone = null;
const sctx = $('scv').getContext('2d');
function buildSlides() {
  const st = () => { for (let i = 0; i < 34; i++) { const f = rnd(i * 31 + 5), x = f() * 160, y = f() * 90; px(x, y, (i + Math.floor(tick / 4)) % 5 ? 3 : 6); } };
  const fw = (n, seed) => { for (let k = 0; k < n; k++) { const age = (tick + k * 7) % 22, f = rnd(seed + k * 97 + Math.floor((tick + k * 7) / 22) * 13), cx = 16 + f() * 128, cy = 10 + f() * 38, c = [7, 9, 5, 12, 15, 8][Math.floor(f() * 6)]; if (age < 4) { r(cx, 86 - age * ((86 - cy) / 4), 1, 3, 6); continue; } const rad = (age - 3) * 2.1; for (let j = 0; j < 20; j++) { const a = j * Math.PI / 10; if (age < 18 || (j + age) % 2) px(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad + (age - 3) * (age - 3) * .03, age > 14 ? 3 : c); if (age < 12) px(cx + Math.cos(a) * rad * .55, cy + Math.sin(a) * rad * .55, 6); } } };
  const cake = y => { r(50, y + 26, 60, 3, 14); r(62, y + 10, 36, 16, 6); r(62, y + 10, 36, 4, 9); for (let i = 0; i < 4; i++) r(64 + i * 9, y + 14, 5, 2, 9); r(68, y, 24, 10, 6); r(68, y, 24, 3, 7); [74, 80, 86].forEach((x, i) => { r(x, y - 8, 2, 8, [5, 15, 12][i]); r(x, y - 12 - (tick + i) % 2, 2, 3, 7); px(x, y - 11, 6); }); };
  const A_ = [
    [() => { st(); r(77, 40, 6, 30, 6); r(77, 40, 6, 3, 5); r(79, 36, 2, 4, 0); const f = tick % 2; r(78, 28 - f, 4, 8 + f, 7); r(79, 31, 2, 4, 6); ctx.globalAlpha = .15; circ(80, 32, 16 + f, 7); ctx.globalAlpha = 1; r(60, 70, 40, 3, 14); }, '愿你被人好好记着。'],
    [() => { st(); clockFace(80, 45, 30, 220 + Math.floor(tick / 8) % 60, 6, 1); }, '愿你睡得够，醒来不必赶时间。'],
    [() => { for (let i = 0; i < 24; i++) { const h = 6 + Math.abs(Math.sin(i * .6 + tick * .35)) * 34; r(22 + i * 5, 45 - h / 2, 3, h, i % 3 ? 12 : 5); } }, '愿你想说的话，都有人在听。'],
    [() => { st(); const b = tick % 6 < 3 ? 7 : 6; r(79, 24, 3, 42, b); r(59, 44, 43, 3, b); r(74, 39, 13, 13, 7); r(77, 42, 7, 7, 6); ctx.globalAlpha = .18; circ(80, 45, 26 + tick % 3, 7); ctx.globalAlpha = 1; }, '愿你许过的愿，一个一个兑现。'],
    [() => { r(0, 70, 160, 20, 13); catAt(52, 34, 4); r(120, 20, 10, 14, 7); ctx.globalAlpha = .2; circ(125, 26, 14, 7); ctx.globalAlpha = 1; }, '愿你身边总有谁，肯为你关一盏灯，也肯为你留一盏灯。'],
    [() => { st(); const m = (x, y, w, h, c) => { r(x, y, w, h, c); r(x, y, w, 1, 6); for (let i = 0; i * 6 + 6 < w; i++) r(x + 3 + i * 6, y + h - 5, 3, 3, (i + Math.floor(tick / 3)) % 4 ? 7 : 8); }; r(40, 52, 80, 3, 2); r(62, 36, 3, 34, 2); r(96, 36, 3, 34, 2); circ(80, 53, 8, 3); circ(80, 53, 4, 5); m(16, 44, 26, 18, 3); m(48, 24, 30, 16, 10); m(86, 24, 30, 16, 11); m(118, 44, 26, 18, 4); m(48, 66, 30, 16, 8); m(86, 66, 30, 16, 2); ctx.globalAlpha = .12; circ(80, 53, 46 + tick % 4, 7); ctx.globalAlpha = 1; }, '愿你去过的每一个地方，都为你亮过灯。']
  ];
  const TK = { 1: ['t', { take: '那个没睡够的早晨，你赎回去了。这一次，先把觉补上。', leave: '那个没睡够的早晨，就留在站里吧。往后愿你睡得够，醒来不必赶时间。', give: '你把那个早晨送给了更累的人。也愿你自己睡得够，醒来不必赶时间。' }],
    2: ['s', { take: '那句没说出口的谢谢，你带回去了。愿你亲口说的时候，对方正好在听。', leave: '那句谢谢留在了站里。往后愿你想说的话，都有人在听。', give: '你替别人也说了一声谢谢。愿你想说的话，都有人在听。' }],
    3: ['l', { take: '那个愿望，你赎回去了。今年，愿你亲手把它兑现。', leave: '旧的愿望留下了。愿你新许的愿，一个一个兑现。', give: '你把愿望送了出去。愿它在别处实现，也愿你的下一个不落空。' }] };
  slides = A_.map(([art, t], i) => ({ art, t: (TK[i] && TK[i][1][S.ch[TK[i][0]]]) || t }));
  slides.push({ art: () => { st(); fw(5, 11); r(0, 84, 160, 6, 1); catAt(18, 66, 2); circ(136, 70, 9, 3); circ(136, 70, 6, 4); circ(136 + Math.round(Math.sin(tick / 6) * 2), 70, 2, 6); r(132, 79, 8, 5, 2); cake(56); }, t: '零号站全体成员，在这里一起祝你：', big: true });
  slides.push({ art: () => { st(); fw(9, 29); fw(6, 71); r(0, 84, 160, 6, 1); cake(56); }, t: (ME ? ME.name + '，' : '') + '祝你一切都好！', sub: '“王”携　零 · 螺丝 · 清洁臂 · 导航副机 · 温控器' + (ME && ME.from ? ' · ' + ME.from : '') + '　敬上', big: true });
}
function drawSlide() { const old = ctx, sl = slides[si]; ctx = sctx; ctx.imageSmoothingEnabled = false; r(0, 0, 160, 90, 0); sl.art(); ctx = old; $('stext').textContent = sl.t; $('stext').className = sl.big ? 'big' : ''; $('ssub').textContent = sl.sub || ''; $('scount').textContent = (si + 1) + ' / ' + slides.length + '　' + (si === slides.length - 1 ? '点击结束 ▸' : '点击继续 ▸'); }
function runSlides(done) { buildSlides(); si = 0; slideDone = done; $('slide').hidden = false; drawSlide(); }
$('slide').onclick = () => { si++; sfx(si >= slides.length - 2 ? 'win' : 'pick'); if (si >= slides.length) { $('slide').hidden = true; slideDone && slideDone(); } else drawSlide(); };
function showEnd(direct) {
  let h = '';
  if (direct) h = `<h2>零号站</h2><p class="sub">站里还有一整座空间站可以逛</p>` + (ME && ME.photo && !S.f.chest ? `<p style="color:#f4c95d">当铺的库房里有一只写着你名字的宝箱。五个舱段的地板下各藏着一块记忆碎片，集齐三块，再输入你的口令，就能打开它。</p>` : '');
  else {
    const e = ENDS[S.end] || ['离站', '你离开了零号站。'], L = { take: '赎回', leave: '留下', give: '转赠' };
    const cn = v => ['t', 's', 'l'].filter(k => S.ch[k] === v).length, hw = v => Object.values(S.how).filter(x => x === v).length;
    const remark = cn('take') === 3 ? '零说，你是那种什么都想自己扛回去的人。记得偶尔也放一放。' : cn('leave') === 3 ? '零说，放得下也是一种本事。留下的东西，它会一直替你收着。' : cn('give') === 3 ? '螺丝说，你把好东西都分给了别人。所以它把自己最喜欢的那枚纽扣，塞进了你的口袋。' : '零说，有的带走，有的放下，这样刚刚好。';
    const bond = S.aff.c > S.aff.z + 1 ? '离站的时候，你发现小艇的舷窗上多了一个梅花形的油印。' : S.aff.z > S.aff.c + 1 ? '离站的时候，码头的灯跟着你的小艇，亮了很远。' : '';
    const solved = `这一趟，你自己解开了 ${hw('self')} 道谜题` + (hw('zero') ? `，零替你代劳了 ${hw('zero')} 道` : '') + (hw('skip') ? `，跳过了 ${hw('skip')} 道` : '') + '。';
    h = `<h2>${e[0]}</h2><p class="sub">零号站 · 结局 ${Object.keys(ENDS).indexOf(S.end) + 1} / 6</p><p>${e[1]}</p><h3>你的当票</h3><ul>${['t', 's', 'l'].map(k => `<li>${PAWN[k].item}：${L[S.ch[k]] || '未处置'}</li>`).join('')}</ul><p>${remark}${bond}</p><p style="color:#6b8cc4;font-size:13px">${solved}</p>`;
    if (ME && ME.photo && !S.f.chest) h += `<p style="color:#f4c95d">当铺的库房里还有一只写着你名字的宝箱。站里五个舱段的地板下各藏着一块记忆碎片，集齐三块，再输入你的口令，就能打开它。</p>`;
  if (S.stars.length === 3) h += `<h3>星屑</h3><p>你把三粒星屑都找到了。它们本来是别人许了一半、没来得及许完的愿。现在它们在你的蛋糕上烧着，很亮。零说，这种时候可以替所有人许一个。</p>`;
    else h += `<p style="color:#6b8cc4;font-size:13px">站里还散落着 ${3 - S.stars.length} 粒没被捡起的星屑。另外五个结局，取决于你怎么回答零和螺丝。</p>`;
  }
  if (!ME) h += `<div class="bless"><p>后舱里还有一封写给某个人的信，要全名和口令才能拆开。</p><label for="ename">全名</label><input id="ename" autocomplete="off"><label for="ecode">口令</label><input id="ecode" autocomplete="off" autocapitalize="off"><p id="emsg"></p><div class="row"><button type="button" class="pri" id="eGo">拆信</button></div></div>`;
  h += `<div class="memo"><h3>写在最后</h3><p>借 AI 创作之力一用，想了一点小点子，合成了这个小游戏，愿它能带给你们一些小乐趣，也希望以后的生活里，不乏这样的小确幸。</p><p>感谢你的参与。游戏内容也许有些无聊冗杂，但我的心意不变。这也是我在 20 岁之前的一次尝试。</p><p class="sig">我们来日方长${ME ? '，' + esc(ME.call || ME.name) : ''}。<br>—— 王</p></div>`;
  h += `<div class="row"><button type="button" id="eAgain">再看一遍祝福</button><button type="button" id="eCG">再看一遍完结动画</button><button type="button" id="eBack">${direct ? '进站看看' : '回到站里'}</button>${direct ? '' : '<button type="button" id="eNew">从头再来，走另一条线</button>'}</div>`;
  $('endbox').innerHTML = h; $('end').hidden = false;
  $('eBack').onclick = () => { $('end').hidden = true; if (direct) startGame(); };
  $('eAgain').onclick = () => { $('end').hidden = true; runSlides(() => showEnd(direct)); };
  $('eCG').onclick = () => { $('end').hidden = true; runCG(() => showEnd(direct)); };
  if ($('eNew')) $('eNew').onclick = () => { const code = S.code, nm = S.name, as = S.assist; S = fresh(); S.code = code; S.name = nm; S.assist = as; save(); $('end').hidden = true; startGame(); };
  if ($('eGo')) $('eGo').onclick = async () => { $('emsg').textContent = '正在拆信……'; const m = await unlock($('ename').value, $('ecode').value); if (m) { ME = m; S.code = norm($('ecode').value); S.name = $('ename').value.trim(); save(); $('end').hidden = true; runSlides(() => showEnd(direct)); } else $('emsg').textContent = '这个名字和口令打不开任何一封信。'; };
}

/* ================= 完结 CG：一镜到底 ================= */
const WANG = [
  '{name}，生日快乐！',
  '新的一岁，愿你钱包鼓鼓，睡眠足足，快乐多多。',
  '想去的地方说走就走，想见的人随时都见得到。',
  '熬过的夜都有回报，许过的愿都不落空。',
  '永远年轻，永远热泪盈眶，永远有人陪你闹。',
  '—— 王'
];
const CG_ROOMS = [
  { line: '你来的那天，站里的灯只亮了一半。', wall: 3, floor: 1 },
  { line: '这里替很多人保管过时间。', wall: 10, floor: 13 },
  { line: '也照顾过没人记得浇水的花。', wall: 21, floor: 13 },
  { line: '你看过的每一颗星，都记得你。', wall: 1, floor: 2 },
  { line: '所以这一次，换我们把灯一盏一盏为你点亮。', wall: 2, floor: 1 },
  { line: '', wall: 10, floor: 13 }
];
let CK = 3; const RW = 260, FLOOR = 150, CEIL = 24;          // 画布 960×540，世界坐标 ×3
const CAKE_X = 5 * RW + 130, CAKE_Y = 100;
const CANDLE = k => [5 * RW + 121 + k * 7, 84];            // 第 k 根蜡烛的烛芯（世界坐标）
// 完结动画时间表（秒）。调节奏只改这里，画面、字幕、配乐、烟花声都从这里取时间。
const TL = { caption: 1, capGap: 4.8, pan: 3, panDur: 24, zoomIn: 27, zoomInDur: 2.6, song: 30, lights: [33, 34.5, 36, 39.5], songEnd: 42.6,
  outro: 44, zoomOut: 44.4, zoomOutDur: 2.4, wishEnd: 46, rise: 46.6, riseDur: 5.6, fireworks: 50, bless: 52, blessGap: 3.2 };
const SONG_T = TL.song, BEAT = .5, LIGHTS = TL.lights, SONG_END = TL.songEnd;
const LIGHT_AT = k => LIGHTS[k];
let cgOn = false, cgT0 = 0, cgDone = null, cgRaf = 0, cgLast = -1, cgLit = [];
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const lerp = (a, b, k) => a + (b - a) * k;
function cgCam(t) {
  let x = lerp(130, CAKE_X, ease((t - TL.pan) / TL.panDur)), y = 90, z = 1;
  const zin = ease((t - TL.zoomIn) / TL.zoomInDur), zout = ease((t - TL.zoomOut) / TL.zoomOutDur);
  z = lerp(1, 1.85, zin); y = lerp(90, CAKE_Y + 4, zin);
  z = lerp(z, 1, zout); y = lerp(y, 90, zout);
  y = lerp(y, -62, ease((t - TL.rise) / TL.riseDur));
  return { x, y, z };
}
function cgWorld(t, cam) {
  const g = ctx, left = cam.x - 160 / cam.z;
  g.setTransform(CK, 0, 0, CK, 0, 0); r(0, 0, W, H, 0); const S3 = CK / 3;
  for (let i = 0; i < 160; i++) { const f = rnd(i * 17 + 3), x = ((f() * 900 - cam.x * .25) % 320 + 320) % 320, y = ((f() * 500 - cam.y * .35 - 230) % 420 + 420) % 420 - 120; if (y >= 0 && y < H) px(x, y, (i + Math.floor(t * 3)) % 7 ? 3 : 6); }
  const s = CK * cam.z; g.setTransform(s, 0, 0, s, Math.round(160 * CK - cam.x * s), Math.round(90 * CK - cam.y * s));
  circ(1350 + cam.x * .1, -90, 34, 2); circ(1360 + cam.x * .1, -84, 34, 0);
  r(-80, 12, 6 * RW + 160, 162, 2); r(-80, 12, 6 * RW + 160, 2, 4);
  for (let x = -60; x < 6 * RW + 80; x += 22) r(x, 16, 10, 3, Math.floor(x / 22 + t * 2) % 5 ? 3 : 7);
  CG_ROOMS.forEach((m, i) => {
    const x0 = i * RW; if (cgLit[i] < 0 && cam.x > x0 + 70) cgLit[i] = t;
    r(x0 + 4, CEIL, RW - 8, FLOOR - CEIL, m.wall); for (let x = x0 + 4; x < x0 + RW - 4; x += 32) r(x, CEIL, 1, FLOOR - CEIL, 0);
    r(x0 + 4, FLOOR, RW - 8, 12, m.floor); r(x0 + 4, FLOOR, RW - 8, 1, 0);
    if (i < 5) cgRoom(i, x0, t); else cgBack(x0, t);
    let dark = cgLit[i] < 0 ? .62 : 0;
    if (i === 5 && cgLit[i] >= 0) dark = .6 * (1 - [0, 1, 2, 3].reduce((a, k) => a + ease((t - LIGHT_AT(k)) / .9), 0) / 4);
    if (dark > 0) { g.globalAlpha = dark; r(x0 + 4, CEIL, RW - 8, FLOOR - CEIL + 12, 0); g.globalAlpha = 1; }
    else if (i < 5 && t - cgLit[i] < .5) { g.globalAlpha = .18 * (1 - (t - cgLit[i]) / .5); r(x0 + 4, CEIL, RW - 8, FLOOR - CEIL, 7); g.globalAlpha = 1; }
    r(x0 - 2, CEIL, 6, 70, 3); r(x0 - 2, CEIL + 108, 6, FLOOR - CEIL - 108, 3);
  });
  const sx = 5 * RW + 100; r(sx, 12, 60, CEIL - 12 + 2, 0); r(sx - 2, 12, 2, CEIL - 12, 4); r(sx + 60, 12, 2, CEIL - 12, 4);
  // 螺丝：一路跟着镜头跑，到了后舱走到桌边坐下
  const camX = tt => lerp(130, CAKE_X, ease((tt - TL.pan) / TL.panDur)), catX = camX(t) - 75, v = (camX(t + .1) - camX(t - .1)) / .2;
  const mode = v > 30 ? 'run' : v > 5 ? 'walk' : 'sit';
  pcat(catX + 7, FLOOR, t, mode, t > LIGHT_AT(0));
  cgGlow(t);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
// 像素机械猫，朝右（前进方向）。5 机身、4 暗部、7 眼睛、1 鼻尖、n 尾巴指示灯
const PCAT = {
  run: [[
    'n..........5...5.',
    '.5.........55.55.',
    '.5........555555.',
    '..5.......5557555',
    '...55555555555551',
    '...555555555555..',
    '...5455555545....',
    '..44.......55....',
    '.44.........55...',
    '44...........5...'
  ], [
    '...........5...5.',
    'n..........55.55.',
    '.5........555555.',
    '.5........5557555',
    '..5555555555555 1'.replace(' ', '5'),
    '...555555555555..',
    '...5455555545....',
    '....54....545....',
    '....4.4..5.5.....',
    '...4...4.5..5....'
  ]],
  sit: [[
    '......5...5.',
    '......55.55.',
    '.....555555.',
    '.....5557555',
    '.....5555551',
    '......5555..',
    '.....555555.',
    '....5545555.',
    '....5555.55.',
    'n...5555.55.',
    '.5555555.55.'
  ], [
    '......5...5.',
    '......55.55.',
    '.....555555.',
    '.....5557555',
    '.....5555551',
    '......5555..',
    '.....555555.',
    '....5545555.',
    '....5555.55.',
    '....5555.55.',
    'n5555555.55.'
  ]]
};
function catAt(x, y, s = 1) {   // 游戏场景里坐着的螺丝；(x, y) 是旧造型的左上角，底边对齐
  let rows = PCAT.sit[Math.floor(tick / 6) % 2]; if (tick % 24 < 2) rows = rows.map(rw => rw.replace('7', '5'));
  spr(x + s, y - 2 * s, rows, s);
}
function pcat(x, y, t, mode, warm) {
  const blink = Math.floor(t * 1.7) % 6 === 0 && (t * 1.7) % 1 < .18;
  let rows, dy = 0;
  if (mode === 'sit') rows = PCAT.sit[Math.floor(t * 1.6) % 2];
  else { const f = Math.floor(t * (mode === 'run' ? 9 : 4.5)) % 2; rows = PCAT.run[f]; dy = mode === 'run' && f === 0 ? -1 : 0; }
  if (blink) rows = rows.map(rw => rw.replace('7', '5'));
  const w = rows[0].length, x0 = Math.round(x - w / 2), y0 = Math.round(y - rows.length + dy);
  rows.forEach((rw, j) => { for (let i = 0; i < rw.length; i++) if (rw[i] !== '.') { ctx.fillStyle = PAL[parseInt(rw[i], 36)]; ctx.fillRect(x0 + i - .02, y0 + j - .02, 1.04, 1.04); } });
  if (warm) { const k = rows.findIndex(rw => rw.includes('7')); if (k >= 0 && !blink) { ctx.globalAlpha = .35; r(x0 + rows[k].indexOf('7') - 1, y0 + k - 1, 3, 3, 7); ctx.globalAlpha = 1; } }
}
function cgBack(x0, t) {
  r(x0 + 70, 126, 120, 5, 14); r(x0 + 78, 131, 5, 19, 13); r(x0 + 178, 131, 5, 19, 13);
  r(x0 + 102, 120, 56, 6, 6); r(x0 + 106, 104, 48, 16, 6); r(x0 + 106, 104, 48, 4, 9); for (let k = 0; k < 5; k++) r(x0 + 108 + k * 9, 108, 5, 3, 9); r(x0 + 116, 92, 28, 12, 6); r(x0 + 116, 92, 28, 3, 7);
  for (let k = 0; k < 4; k++) { const [x] = CANDLE(k); r(x - 1, 84, 2, 8, [5, 15, 12, 7][k]); r(x - 1, 84, 1, 8, 6); px(x - 1, 83, 0); }
}
// 平滑绘制的部分：引火的光点、火苗、暖光
function soft(x, y, rad, rgb, a) { const g = ctx, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 6.2832); g.fill(); }
function orbAt(t) {
  // 30–32.4 秒：从天窗落下，绕着蛋糕转两圈半，越绕越近；之后跟着歌，一句一句去点烛芯
  const OE = 32.4;
  if (t < SONG_T) return null;
  const orbit = k => { const a = k * Math.PI * 5 - Math.PI / 2, rad = lerp(46, 13, ease(k)); return [CAKE_X + Math.cos(a) * rad, lerp(18, 90, ease(Math.min(1, k * 2))) + Math.sin(a) * rad * .38]; };
  if (t < OE) { const [x, y] = orbit((t - SONG_T) / (OE - SONG_T)); return [x, y, 1]; }
  for (let j = 0; j < 4; j++) {
    const t1 = LIGHT_AT(j), t0 = j ? LIGHT_AT(j - 1) + .15 : OE;
    if (t < t1) { const [ax, ay] = j ? CANDLE(j - 1) : orbit(1), [bx, by] = CANDLE(j), k = ease((t - t0) / (t1 - t0)), hop = 5 + (t1 - t0) * 4; return [lerp(ax, bx, k) + Math.sin(k * Math.PI * 2) * (t1 - t0 > 2 ? 14 : 0), lerp(ay, by - 2, k) - Math.sin(k * Math.PI) * hop, 1]; }
    if (t < t1 + .15) { const [x, y] = CANDLE(j); return [x, y - 2, 1]; }
  }
  const k = (t - LIGHT_AT(3) - .15) / 1.2; if (k < 1) { const [x, y] = CANDLE(3); return [x + Math.sin(k * 9) * 3, y - 2 - k * 26, 1 - k]; }
  return null;
}
function flame(x, y, t, k) {
  const g = ctx, f = 1 + .14 * Math.sin(t * 21 + x) + .06 * Math.sin(t * 37 + x * 3), h = 5.5 * k * f, w = 1.9 * k;
  soft(x, y - h * .45, 9 * k, '255,190,90', .32);
  const gr = g.createLinearGradient(x, y - h, x, y + 1); gr.addColorStop(0, 'rgba(255,240,190,.95)'); gr.addColorStop(.55, 'rgba(255,196,80,.95)'); gr.addColorStop(1, 'rgba(255,110,40,.9)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x + Math.sin(t * 9 + x) * .5 * k, y - h); g.quadraticCurveTo(x + w * 1.2, y - h * .35, x, y + .8); g.quadraticCurveTo(x - w * 1.2, y - h * .35, x + Math.sin(t * 9 + x) * .5 * k, y - h); g.fill();
  g.fillStyle = 'rgba(255,255,240,.9)'; g.beginPath(); g.ellipse(x, y - h * .32, w * .35, h * .22, 0, 0, 6.2832); g.fill();
}
function cgGlow(t) {
  const g = ctx; g.save(); g.globalCompositeOperation = 'lighter';
  // 光点和它的拖尾
  for (let i = 18; i >= 0; i--) { const p = orbAt(t - i * .035); if (!p) continue; const a = (1 - i / 19) * p[2]; soft(p[0], p[1], i ? 2.6 : 7, '255,236,170', i ? .45 * a : .9 * a); if (!i) soft(p[0], p[1], 2, '255,255,255', a); }
  // 点燃瞬间的闪光
  for (let k = 0; k < 4; k++) { const d = t - LIGHT_AT(k); if (d > 0 && d < .6) { const [x, y] = CANDLE(k); soft(x, y - 2, 6 + d * 30, '255,220,140', .6 * (1 - d / .6)); } }
  // 全部点亮后的暖光
  const warm = ease((t - LIGHT_AT(3)) / 1.6); if (warm > 0) soft(CAKE_X, 88, 120, '255,170,90', .22 * warm);
  g.restore();
  for (let k = 0; k < 4; k++) { const d = t - LIGHT_AT(k); if (d > 0) { const [x, y] = CANDLE(k); flame(x, y - .5, t, Math.min(1, .3 + d * 2.2)); } }
}
function cgRoom(i, x0, t) {
  cgRoom0(i, x0, t);
  const star = (k, x, y) => { if (!S.shard.includes(k)) return; const b = Math.round(Math.sin(t * 5 + x) * 2); r(x - 1, y - 3 + b, 3, 7, 7); r(x - 3, y - 1 + b, 7, 3, 7); r(x, y + b, 1, 1, 6); };
  if (i === 0) star('nursery', x0 + 179, 96); if (i === 3) star('mail', x0 + 210, 92); if (i === 4) { star('shaft', x0 + 212, 100); star('store', x0 + 130, 62); }
}
function cgRoom0(i, x0, t) {
  const S2 = Math.sin(t * 3);
  if (i === 0) {
    r(x0 + 80, 36, 100, 56, 3); r(x0 + 84, 40, 92, 48, 0); for (let k = 0; k < 18; k++) { const f = rnd(k + 50); px(x0 + 84 + f() * 92, 40 + f() * 48, 6); }
    const bx = x0 + 104 + Math.round(Math.max(0, 3 - t) * 18); r(bx, 58, 46, 14, 4); r(bx, 58, 46, 2, 5); r(bx + 10, 62, 10, 5, 1); r(bx + 26, 62, 10, 5, 1);
    for (let k = 0; k < 3; k++) { r(x0 + 14 + k * 18, 50, 16, 98, 2); r(x0 + 14 + k * 18, 50, 16, 1, 4); r(x0 + 26 + k * 18, 90, 2, 6, 5); }
    r(x0 + 200, 46, 40, 104, 9); r(x0 + 200, 46, 40, 3, 8); for (let k = 0; k < 6; k++) r(x0 + 206 + (k % 3) * 9, 54 + Math.floor(k / 3) * 12, 6, 9, [7, 12, 5, 15, 8, 16][k]);
    // 清洁臂在挥手
    r(x0 + 170, 132, 18, 18, 4); r(x0 + 170, 132, 18, 2, 5); r(x0 + 176, 120, 6, 12, 3); line(x0 + 179, 120, x0 + 179 + Math.round(Math.cos(t * 5) * 10), 106, 5, 2); px(x0 + 175, 138, 7);
  } else if (i === 1) {
    r(x0 + 16, 40, 30, 110, 13); r(x0 + 16, 40, 30, 2, 14); clockFace(x0 + 31, 58, 11, 220 + Math.floor(t * 20) % 720, 6, 1); line(x0 + 31, 76, x0 + 31 + Math.round(S2 * 4), 110, 7); circ(x0 + 31 + Math.round(S2 * 4), 112, 3, 7);
    r(x0 + 104, 70, 2, 46, 7); r(x0 + 84, 72, 42, 2, 7); r(x0 + 78, 90 + Math.round(S2), 16, 3, 7); r(x0 + 116, 90 - Math.round(S2), 16, 3, 7); r(x0 + 96, 116, 18, 4, 14);
    r(x0 + 150, 50, 96, 3, 14); r(x0 + 150, 86, 96, 3, 14); [7, 12, 5, 15, 8, 16, 9].forEach((c, k) => { r(x0 + 154 + k * 13, 38, 9, 12, c); r(x0 + 154 + k * 13, 74, 9, 12, [16, 5, 7, 12, 15, 9, 8][k]); });
    r(x0 + 60, 120, 190, 6, 14); r(x0 + 64, 126, 182, 24, 13);
  } else if (i === 2) {
    r(x0 + 12, 32, 70, 100, 11); r(x0 + 15, 35, 64, 94, 2); clockFace(x0 + 47, 80, 14, 500, 3, 2);
    for (let b = 0; b < 3; b++) { const bx = x0 + 96 + b * 52; r(bx, 132, 44, 16, 14); r(bx, 132, 44, 2, 8); for (let k = 0; k < 5; k++) { const fx = bx + 4 + k * 8, open = t > 3 + 2 * 4.6 + 1.2 + k * .15; line(fx + 1, 132, fx + 1, 112, 11); if (open) { r(fx - 1, 106, 5, 5, [9, 15, 7][b]); px(fx + 1, 108, 6); } else r(fx, 108, 3, 4, 12); } }
    if (t > 13 && t < 20) for (let k = 0; k < 10; k++) px(x0 + 100 + k * 14 + Math.floor(t * 10) % 3, 70 + (k * 7 + Math.floor(t * 30)) % 30, 5);
  } else if (i === 3) {
    r(x0 + 30, 30, 200, 60, 3); r(x0 + 34, 34, 192, 52, 0); for (let k = 0; k < 40; k++) { const f = rnd(k + 300); px(x0 + 34 + f() * 192, 34 + f() * 52, k % 6 ? 4 : 7); }
    [[0, 3], [3, 4], [4, 2], [2, 5]].forEach(([a, b]) => { const P = j => [x0 + 100 + (j % 3) * 30, 44 + Math.floor(j / 3) * 16]; const [ax, ay] = P(a), [bx, by] = P(b); line(ax, ay, bx, by, 7); });
    r(x0 + 120, 136, 28, 8, 3); line(x0 + 110, 130, x0 + 156, 98, 4, 5); r(x0 + 152, 92, 8, 8, 3);
    const hy = 112 + Math.round(Math.sin(t * 2.5) * 3); circ(x0 + 210, hy, 9, 4); circ(x0 + 210, hy, 6, 1); px(x0 + 210 + Math.round(Math.sin(t) * 2), hy, 7); r(x0 + 206, hy + 10, 8, 2, 5);
  } else if (i === 4) {
    for (let k = 0; k < 6; k++) { r(x0 + 30 + k * 34, 30, 22, 30, 1); for (let j = 0; j < 4; j++) px(x0 + 34 + k * 34 + (j % 2) * 8, 36 + j * 6, (k + j + Math.floor(t * 4)) % 3 ? 12 : 7); }
    const pu = Math.round(Math.sin(t * 2) * 1.5); circ(x0 + 130, 98, 26 + pu, 2); circ(x0 + 130, 98, 21, 3); circ(x0 + 130, 98, 14, 4); circ(x0 + 130, 98, 7, 5); circ(x0 + 130 + Math.max(-4, Math.min(4, Math.round((cgCam(t).x - x0 - 130) / 50))), 98, 3, 6);
    r(x0 + 120, 124, 20, 26, 2);
    r(x0 + 206, 112, 12, 38, 4); r(x0 + 208, 120 + Math.round(Math.sin(t * 3) * 3), 8, 26, 9); r(x0 + 204, 146, 16, 4, 3);
    r(x0 + 30, 90, 40, 50, 2); r(x0 + 30, 90, 40, 2, 4);
  }
}
function cgFireworks(t) {
  for (let k = 0; k < 10; k++) {
    const per = 2.4, ph = t + k * .37, age = (ph % per) / per, cyc = Math.floor(ph / per), f = rnd(k * 131 + cyc * 17), cx = 30 + f() * 260, cy = 16 + f() * 80, c = [7, 9, 16, 12, 15, 8, 5, 22][Math.floor(f() * 8)];
    if (age < .2) { r(cx, 180 - age / .2 * (180 - cy), 1, 4, 6); continue; }
    const rad = (age - .2) * 52; for (let j = 0; j < 32; j++) { const a = j * Math.PI / 16; if (age < .85 || j % 2) px(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad + (age - .2) * (age - .2) * 18, age > .75 ? 3 : c); if (age < .55) { px(cx + Math.cos(a) * rad * .55, cy + Math.sin(a) * rad * .55, 6); px(cx + Math.cos(a) * rad * .8, cy + Math.sin(a) * rad * .8 + 1, c); } }
  }
}
function cgFrame() {
  const t = (performance.now() - cgT0) / 1000, old = ctx; CK = fitCanvas($('cgv')); ctx = $('cgv').getContext('2d'); ctx.imageSmoothingEnabled = false;
  cgWorld(t, cgCam(t));
  if (t > TL.fireworks) { ctx.setTransform(CK, 0, 0, CK, 0, 0); ctx.globalAlpha = ease((t - TL.fireworks) / 2); cgFireworks(t); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0); }
  ctx = old;
  let line = '', big = false;
  const nm = s => s.replace('{name}', ME ? ME.name : '你');
  if (t < TL.zoomIn) { if (t > TL.caption) line = CG_ROOMS[Math.max(0, Math.min(4, Math.floor((t - TL.caption) / TL.capGap)))].line; }
  else if (t > SONG_T && t < SONG_END) { line = '♪ 祝你生日快乐 ♪'; big = true; } else if (t >= SONG_END && t < TL.wishEnd) line = '好了，现在许个愿吧。';
  else if (t > TL.bless) { const k = Math.floor((t - TL.bless) / TL.blessGap); line = WANG.slice(0, Math.min(k + 1, WANG.length)).map(nm).join('\n'); big = true; if (k >= WANG.length) $('cgEnd').hidden = false; }
  if (line !== $('cgt').textContent) { $('cgt').textContent = line; $('cgt').className = big ? 'big' : ''; }
  cgBoom(t);
  if (cgOn) cgRaf = requestAnimationFrame(cgFrame);
}
let cgAud = null, noiseBuf = null, fwSeen = {};
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
const CHORD = { C: [60, 64, 67], Am: [57, 60, 64], F: [53, 57, 60], G: [55, 59, 62], Em: [52, 55, 59], G7: [55, 59, 65] };
const SONG = [  // [MIDI, 拍]
  [[67, .75], [67, .25], [69, 1], [67, 1], [72, 1], [71, 2]],
  [[67, .75], [67, .25], [69, 1], [67, 1], [74, 1], [72, 2]],
  [[67, .75], [67, .25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2]],
  [[77, .75], [77, .25], [76, 1], [72, 1], [74, 1], [72, 2]]];
const SONG_CH = [[['C', 0], ['G', 3]], [['G', 0], ['C', 3]], [['C', 0], ['F', 3], ['F', 5]], [['F', 0], ['C', 2], ['G7', 3], ['C', 4]]];
function cgAudioStart(tNow) {
  if (!ac || muted) return;
  const out = ac.createGain(); out.gain.value = 0; out.connect(master); out.gain.linearRampToValueAtTime(1.6, ac.currentTime + .8);
  const base = ac.currentTime - tNow, nodes = [];
  if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.2, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const box = (tt, n, dur, vol, type = 'sine') => {        // 八音盒音色：基音 + 高八度泛音，快起慢落
    if (tt < tNow - .05) return; const t0 = base + tt;
    [[1, vol, type], [2, vol * .28, 'sine'], [3, vol * .08, 'sine']].forEach(([m, v, ty]) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = ty; o.frequency.value = NOTE(n) * m; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .008); g.gain.exponentialRampToValueAtTime(v * .25, t0 + Math.min(dur, .5)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur + .9); o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur + 1); nodes.push(o); });
  };
  const arp = (t0, ch, bars, step, vol, oct = 0) => { const c = CHORD[ch], pat = [0, 1, 2, 3, 2, 1, 0, 1]; for (let b = 0; b < bars * 8; b++) { const i = pat[b % 8], n = (i === 3 ? c[0] + 12 : c[i]) + oct; box(t0 + b * step, n, step * 2, vol * (b % 4 ? .7 : 1)); } };
  // 一、开场：横移时的八音盒（C–Am–F–G）
  ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'F', 'G'].forEach((c, i) => arp(i * 2, c, 1, .25, .045, 12));
  [[72, 0], [76, 2], [77, 4], [74, 6], [72, 8], [76, 10], [77, 12], [79, 14], [84, 16], [81, 18], [77, 20], [79, 22], [77, 24], [79, 26]].forEach(([n, tt]) => box(tt + .02, n + 12, 1.6, .03));
  // 二、点蜡烛：生日快乐歌（4 句，一句点一根）
  let tt = SONG_T;
  SONG.forEach((ln, li) => { let b = 0; const st = tt; ln.forEach(([n, d]) => { box(tt, n, d * BEAT, .13, 'triangle'); tt += d * BEAT; b += d; }); SONG_CH[li].forEach(([c, at]) => CHORD[c].forEach(n => box(st + at * BEAT, n, BEAT * 2, .03, 'triangle'))); });
  // 三、升空、烟花与祝福：明亮的分解和弦
  ['F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C', 'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C', 'F', 'G', 'C', 'C'].forEach((c, i) => arp(TL.outro + i * 2, c, 1, .25, .05, 12));
  [[79, 52], [81, 54], [84, 56], [83, 58], [81, 60], [79, 62], [84, 64], [84, 66.5], [79, 68], [81, 70], [84, 72], [88, 74], [86, 76], [84, 78], [84, 80]].forEach(([n, t2]) => box(t2 - 52 + TL.bless, n, 1.8, .06, 'triangle'));
  const verb = ac.createConvolver(), ir = ac.createBuffer(2, ac.sampleRate * 2.6, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2) * .5; }
  verb.buffer = ir; const wet = ac.createGain(); wet.gain.value = .5; verb.connect(wet); wet.connect(out);
  cgAud = { out, nodes, verb };
}
function cgAudioStop() { if (!cgAud) return; const a = cgAud; cgAud = null; try { a.out.gain.cancelScheduledValues(ac.currentTime); a.out.gain.setTargetAtTime(0, ac.currentTime, .12); setTimeout(() => { a.nodes.forEach(o => { try { o.stop(); } catch (e) {} }); a.out.disconnect(); }, 900); } catch (e) {} }
function boom(vol, pan, at) {
  // 远处的烟花：先是一声闷闷的「咚」，带一点空气里的余响，再是一串慢慢散开的细碎噼啪声
  if (!cgAud || !noiseBuf || vol < .02) return; const t0 = (at === undefined ? ac.currentTime : at) + .05, A = cgAud;
  const p = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain(); if (p.pan) p.pan.value = Math.max(-.8, Math.min(.8, pan));
  const dry = ac.createGain(); dry.gain.value = .55; p.connect(dry); dry.connect(A.out); p.connect(A.verb);
  const n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  n.buffer = noiseBuf; f.type = 'lowpass'; f.Q.value = .5; f.frequency.setValueAtTime(700, t0); f.frequency.exponentialRampToValueAtTime(180, t0 + 1.2);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol * .42, t0 + .045); g.gain.exponentialRampToValueAtTime(vol * .08, t0 + .45); g.gain.exponentialRampToValueAtTime(.0001, t0 + 1.9);
  n.connect(f); f.connect(g); g.connect(p); n.start(t0, Math.random() * .3); n.stop(t0 + 2);
  const N = 26 + Math.floor(Math.random() * 14);
  for (let i = 0; i < N; i++) {
    const k = Math.pow(Math.random(), 1.6), tc = t0 + .35 + k * 1.9, c = ac.createBufferSource(), bf = ac.createBiquadFilter(), cg = ac.createGain();
    c.buffer = noiseBuf; bf.type = 'bandpass'; bf.frequency.value = 2200 + Math.random() * 3800; bf.Q.value = 1.4;
    const v = vol * .07 * (1 - k * .8), len = .012 + Math.random() * .02;
    cg.gain.setValueAtTime(0, tc); cg.gain.linearRampToValueAtTime(v, tc + .002); cg.gain.exponentialRampToValueAtTime(.0001, tc + len);
    c.connect(bf); bf.connect(cg); cg.connect(p); c.start(tc, Math.random()); c.stop(tc + len + .01);
  }
}
function whistle(vol, at) { if (!cgAud || vol < .02) return; const t0 = at === undefined ? ac.currentTime : at, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(700, t0); o.frequency.exponentialRampToValueAtTime(1500, t0 + .5); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol * .012, t0 + .15); g.gain.exponentialRampToValueAtTime(.0001, t0 + .5); o.connect(g); g.connect(cgAud.out); o.start(t0); o.stop(t0 + .55); }
function cgBoom(t, at) {
  if (t < TL.fireworks || !cgAud) return; const vol = ease((t - TL.fireworks) / 2);
  for (let k = 0; k < 10; k++) { const per = 2.4, ph = t + k * .37, cyc = Math.floor(ph / per), age = (ph % per) / per, f = rnd(k * 131 + cyc * 17), cx = 30 + f() * 260;
    if (fwSeen[k] !== cyc && age >= .2) { fwSeen[k] = cyc; if (k % 2 === 0 || k < 4) boom(vol, (cx - 160) / 200, at); }
    if (fwSeen['w' + k] !== cyc && age < .2 && k % 3 === 0) { fwSeen['w' + k] = cyc; whistle(vol, at); } }
}
function runCG(done) {
  cgOn = true; cgDone = done; cgT0 = performance.now(); cgLast = -1; cgLit = [-1, -1, -1, -1, -1, -1]; fwSeen = {}; audio(); cgAudioStart(0); try { if (bgm) bgm.pause(); } catch (e) {} $('cgEnd').hidden = true; $('cgt').textContent = ''; $('cg').hidden = false; audio(); cgRaf = requestAnimationFrame(cgFrame);
}
function endCG() { if (!cgOn) return; cgOn = false; cgAudioStop(); try { if (bgm && !muted) bgm.play().catch(() => {}); } catch (e) {} cancelAnimationFrame(cgRaf); $('cg').hidden = true; const d = cgDone; cgDone = null; d && d(); }
$('cgSkip').onclick = e => { e.stopPropagation(); endCG(); };
$('cg').onclick = () => { if (!$('cgEnd').hidden) endCG(); };

/* ================= 标题 ================= */
const started = () => S.inv.length || Object.keys(S.f).length || S.stars.length;
function showTitle() { $('assist').checked = !!S.assist; $('title').hidden = false; $('code').value = S.code || ''; $('pname').value = S.name || ''; $('bGo').textContent = started() ? '继续' : '进站'; $('bNew').hidden = !started(); $('tmsg').textContent = ''; }
function startGame() {
  $('title').hidden = true; audio(); say(V[S.v].desc()); refresh();
  if (!S.f.intro) { S.f.intro = 1; save(); talk(['小艇靠上了码头。对接舱的灯只亮了一半。', Z('……有人……来了？'), Z('欢迎来到零号站，{name}。我是这里的管理员，他们叫我「零」。'), Z('站里的主电断了，我说话可能断断续续。不过你要取的东西还在。'), Z('集齐时、声、光三枚印章，后舱的门就会为你打开。'), Z('每一步要做什么，我都写在画面下方那一行「下一步」里；地图上也会标出该去哪。'), Z('先从温室开始吧。那里的玻璃上，映着一座钟。'), Z('对了，当铺柜台下面有一只写着你名字的保管箱。有空可以去看看。'),].concat(S.assist ? [Z('还有，你这次是「陪同模式」。意思是：每道谜题的右上角都有一个「请零代劳」，点一下，我就替你解开。'), Z('故事和选择还是你自己的。想自己解也完全可以，不点那个按钮就行；想关掉，去右上角的菜单。')] : []).concat([ Z('还有，每个舱段的地板上都有一个舱口，下面各有一间小屋。不去也能离站，去了会有别的收获。'), '（右上角的「笔记」会自动记下你看到的线索。）',]).concat([ '（点地图上的舱段进入。右上角有提示，卡住了不丢人。）'])); }
}
async function enter(direct) {
  const code = $('code').value, nm = $('pname').value, any = norm(code) || normName(nm);
  if (any && !(norm(code) && normName(nm))) { $('tmsg').textContent = '全名和口令要一起填。都不填的话，就以访客身份进站。'; return; }
  $('tmsg').textContent = any ? '正在核对……' : '';
  const m = await unlock(nm, code);
  if (any && !m) { $('tmsg').textContent = '站里没有这个名字和口令对应的当票。检查一下有没有打错字，或者都清空后以访客身份进站。'; return; }
  if (direct && !m) { $('tmsg').textContent = '要先填上你的全名和口令，才能找到给你的话。'; return; }
  ME = m; S.code = norm(code); S.name = nm.trim(); S.assist = $('assist').checked || (S.assist === undefined && !!(m && m.easy)); save(); $('tmsg').textContent = '';
  if (direct) { $('title').hidden = true; audio(); runSlides(() => runCG(() => showEnd(true))); } else startGame();
}
$('bGo').onclick = () => enter(false);
$('bBless').onclick = () => enter(true);
$('bNew').onclick = () => { S = fresh(); save(); enter(false); };
$('code').addEventListener('keydown', e => { if (e.key === 'Enter') enter(false); });
$('pname').addEventListener('keydown', e => { if (e.key === 'Enter') $('code').focus(); });

mkIcons(); $('bSnd').textContent = '声音：' + (muted ? '关' : '开'); draw(); showTitle();
setInterval(() => { tick++; if (sim && !dOn) simStep(); if (shuf > 0) { shuf--; if (!shuf) refresh(); } if (!$('slide').hidden) drawSlide(); else if ($('title').hidden && $('end').hidden && $('photo').hidden && $('cg').hidden) draw(); }, 125);
async function renderCGAudio(dur) {
  const keep = [ac, master, cgAud, muted, noiseBuf, fwSeen], oc = new OfflineAudioContext(2, 44100 * dur, 44100);
  ac = oc; master = oc.createGain(); master.connect(oc.destination); muted = false; noiseBuf = null; fwSeen = {};
  cgAudioStart(0); for (let t = TL.fireworks; t < dur; t += 1 / 30) cgBoom(t, t);
  const buf = await oc.startRendering(); [ac, master, cgAud, muted, noiseBuf, fwSeen] = keep;
  const n = buf.length, L = buf.getChannelData(0), Rr = buf.getChannelData(1), out = new DataView(new ArrayBuffer(44 + n * 4)), w = (o, t) => { for (let i = 0; i < t.length; i++) out.setUint8(o + i, t.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, 44100, true); out.setUint32(28, 44100 * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 4, true);
  let peak = 0; for (let i = 0; i < n; i++) { peak = Math.max(peak, Math.abs(L[i]), Math.abs(Rr[i])); out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, Rr[i])) * 32767, true); }
  let bin = ''; const u = new Uint8Array(out.buffer); for (let i = 0; i < u.length; i += 32768) bin += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
  return { peak, b64: btoa(bin) };
}
window.__G = { get sim() { return sim; }, get tick() { return tick; }, renderCGAudio, runCG, endCG, get cgOn() { return cgOn; }, set cgT(v) { cgT0 = performance.now() - v * 1000; fwSeen = {}; }, photoImg, get ME() { return ME; }, get S() { return S; }, get shuf() { return shuf; }, get hots() { return hots; }, get dOn() { return dOn; }, flow, TS, LOCK_CODE, PEG_OK, unlock, route };
})();
