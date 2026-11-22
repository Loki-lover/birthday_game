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
const fresh = () => ({ v: 'map', inv: [], sel: null, f: {}, ch: {}, stars: [], clock: 610, freq: 90, lock: [0,0,0], vault: '', peg: [], tiles: initTiles(), brk: [0, 0, 0, 0, 0], nb: [], nbInk: 'k', rk2: [], no: [], hd: null, tsw: 0, kd: [0, 0, 0], sw: [0, 0, 0], swh: [0, 0, 0], sc: freshScale(), hints: {}, code: '', aff: { z: 0, c: 0 }, word: [], arch: '', chan: null, dial: [0, 0, 0], route: null, end: null, how: {}, facts: [], name: '', shard: [], notes: [], pg: [], rk: [true, true, true, true, true], arr: null, pots: [], srt: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], tk: [[5, 90], [6, 30], [4, 0]], tkn: 0, best: {} });
/* 存档：每个「名字＋口令」各占一格（访客一格）；KEY 本身是旧版的单格存档，第一次登录时迁过去 */
const okSave = o => !!(o && o.v && o.tiles && o.sc);
const slotKey = sl => sl ? KEY + '@' + sl : KEY;
const slotOf = (nm, code) => { const t = String(nm || '').replace(/\s+/g, '').toLowerCase() + '|' + String(code || '').trim().toLowerCase(); if (t === '|') return 'guest'; let h = 0x811c9dc5; for (const ch of t) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
let curSlot = null; try { curSlot = localStorage.getItem(KEY + '-last'); } catch (e) {}
function readSlot(sl) { try { const o = JSON.parse(localStorage.getItem(slotKey(sl)) || 'null'); if (okSave(o)) return o; if (sl) { const l = JSON.parse(localStorage.getItem(KEY) || 'null'); if (okSave(l) && slotOf(l.name, l.code) === sl) return l; } } catch (e) {} return null; }
function load(sl = curSlot) { const o = readSlot(sl); return o ? Object.assign(fresh(), o) : fresh(); }
const HOWKEY = { scale: 'scale', clock: 'clock', locker: 'locker', console: 'console', tiles: 'tiles', vault: 'vault', inner: 'pass', crate: 'pass', vent: 'pass', archive: 'pass', mail: 'mail', rules: 'store', nursery: 'nursery', bunk: 'bunk', shaft: 'shaft', board: 'board', night: 'night' };
function markHow() {
  const d = { board: S.f.nt2, night: S.f.night, scale: S.f.scale, clock: S.f.seal_t, locker: S.f.locker, console: S.f.seal_l, tiles: S.f.power, vault: S.f.seal_s, pass: S.f.pass };
  ['mail', 'store', 'nursery', 'bunk', 'shaft'].forEach(k => { d[k] = S.shard.includes(k); });
  for (const k in d) if (d[k] && !S.how[k]) S.how[k] = 'self';
}
function save() { try { markHow(); localStorage.setItem(slotKey(curSlot), JSON.stringify(S)); if (curSlot) localStorage.setItem(KEY + '-last', curSlot); } catch (e) {} }
let S = load();
let shuf = 0;
let ME = null;            // 解密出来的专属内容 {name, easy, lines, from}
const has = id => S.inv.includes(id);
function give(id) { if (!has(id)) S.inv.push(id); S.f.hadItem = 1; sfx('pick'); }
function drop(id) { S.inv = S.inv.filter(x => x !== id); if (S.sel === id) S.sel = null; }
function say(t) { $('cap').textContent = t || ''; }
const who = () => (ME && ME.name) || '旅人';
const callName = () => ME ? (ME.call || ME.name + '同学') : '';   // 祝福里的称呼：有称呼用称呼，没有就「全名＋同学」

const LOCK_CODE = [7, 6, 4], VAULT_CODE = '417', FREQ = 96.5, CLOCK_OK = 220;
const TELE = [8, 5, 4, 6, 3], PEG_OK = [0, 3, 4, 2, 5];
const edges = p => { const s = new Set(); for (let i = 1; i < p.length; i++) s.add(Math.min(p[i-1], p[i]) + '-' + Math.max(p[i-1], p[i])); return s; };
const MORSE = {'0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'};
const ITEMS = {
  token: ['代币', '比真硬币轻一点，边上刻着「自动贩卖」。'],
  fuse: ['备用保险丝', '玻璃管里的细丝完好无损，管身贴着「备件」标签。'],
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
    const seq = { tap: [1200], click: [330], pick: [660, 880], win: [523, 659, 784, 1047], stamp: [392, 523, 659, 784, 1047, 1319], bad: [160, 120], step: [220] }[k] || [440];
    // 点击类用三角波（柔和），成功和出错保留方波；每个音都有 6ms 起音，避免「啪」的爆音
    const big = k === 'stamp', soft = k !== 'win' && k !== 'bad' && !big, peak = k === 'tap' ? .02 : soft ? .07 : .03;
    seq.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * (big ? .075 : k === 'win' ? .08 : .07), len = big || k === 'win' ? (i === seq.length - 1 ? (big ? .9 : .45) : .16) : .12;
      o.type = soft ? 'triangle' : 'square'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(peak, t + .006); g.gain.exponentialRampToValueAtTime(.0005, t + len); o.connect(g); g.connect(master); o.start(t); o.stop(t + len + .02);
      if (big && i === seq.length - 1) [f / 2, f * 3 / 4].forEach(h => { const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = 'triangle'; o2.frequency.value = h; g2.gain.setValueAtTime(.0001, t); g2.gain.linearRampToValueAtTime(.05, t + .01); g2.gain.exponentialRampToValueAtTime(.0005, t + len); o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t + len + .02); }); });
  } catch (e) {}
}
let alarmT = null;
function quiet(msg) { S.f.quiet = 1; alarm(); talk([msg, { who: '温控器', t: '……安静了。谢谢。现在可以倒水了。' }]); save(); }
function alarm() {   // 冷却井的警报：进门就响，关掉声音才停
  const on = false;
  if (on && !alarmT) alarmT = setInterval(() => { if (ac && !muted) try { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime; o.type = 'square'; o.frequency.value = 1400; g.gain.setValueAtTime(.02, t); g.gain.exponentialRampToValueAtTime(.0005, t + .25); o.connect(g); g.connect(master); o.start(t); o.stop(t + .3); } catch (e) {} }, 900);
  if (!on && alarmT) { clearInterval(alarmT); alarmT = null; }
}
function tone(on) { try { if (mTone) mTone.gain.setTargetAtTime(on && !muted ? .04 : 0, ac.currentTime, .005); } catch (e) {} }
function setMute(m) {
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
  t: () => [Z('钟停在三点四十分。主电，就是那一刻断的。')].concat(S.f.cat ? [Z('登记簿上说，这座钟坏了很多年。'), { who: '螺丝', t: '可它刚才不是走了吗。' }, Z('……也许它没有坏。它只是一直在等人来。')] : [Z('登记簿上说，这座钟坏了很多年。'), Z('可它刚才走了。也许它没有坏，只是一直在等人来。')]).concat([Z('下一枚「声」锁在机房的保险柜里。可没有电，柜子打不开。先把电找回来吧。')]),
  s: () => [Z('我想起来了。那三段广播是我每晚的点名：清洁臂、导航副机、温控器。'), Z('断电那晚的点名，清洁臂没有应。它以前一次也没缺过。'), Z('后来我播了很久，一直没有人应。你是第一个把它听完的人。'), Z('最后一枚在观星台。……星图，我也很久没看了。')],
  l: () => [Z('这个星座，星图上没有名字。'), Z('是你连出来的，就归你取名。不着急，下次来的时候再告诉我。'), Z('……星图上没有名字的，也是星。我最近总在想这句话。')]
};
function seal(k, how) {
  S.f['seal_' + k] = 1; give('seal_' + k); sfx('stamp');
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
  hot(120, 94, 44, 18, 'notice', '', '告示');

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
  if (!S.stars.includes(2)) { if (S.f.ttl) starGem(236, 24); else { px(236, 24, '#8a93b8'); px(235, 24, '#3a4060'); px(237, 24, '#3a4060'); } hot(232, 20, 9, 9, 'star', 2, '？'); }
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
  const n = 1 + (S.f.lit || S.f.end ? S.stars.length : 0);   // 星屑放上去之前，蛋糕上只有一根蜡烛
  for (let i = 0; i < n; i++) { const x = 160 - (n - 1) * 4 + i * 8; r(x - 1, 74, 2, 10, [CY[3], PU[3], GR[3], YL[2]][i]); r(x - 1, 74, 1, 10, '#ffffff'); if (E) { r(x - 1, 70 - (tick % 2), 2, 3, YL[3]); px(x - 1 + (tick % 2), 69 - (tick % 2), '#ffffff'); soft(x, 70, 8, '255,210,120', .5); } }
  hot(124, 66, 72, 58, 'cake', '', '蛋糕');
  { const op = S.hd && S.hd.done === 1; r(250, 140, 34, 3, '#2a1018'); bevel(252, op ? 128 : 122, 30, op ? 4 : 18, WD, 2); bevel(252, 132, 30, 10, WD, 2); if (!op) for (let i = 0; i < 4; i++) { r(256 + i * 6, 127, 4, 6, '#1a0c10'); r(256 + i * 6, 127, 4, 1, YL[1]); } else { r(256, 129, 22, 4, PP[0]); } hot(248, 118, 40, 28, 'hdopen', '', op ? '小木盒（开着）' : '小木盒'); }
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
      : !S.f.fuseIn ? ['假币里藏着那根备用保险丝。去机房，把它插进配电板的插槽。', 'core', '在下方物品栏选中保险丝，再点配电板左上角的插槽。']
      : ['配电板上的电表记录里，有一路的用电比铭牌多。找出它，别让它合着，再合总闸。', 'core', '对不上的两条记录都含「温室摄像」。拉下它，其余四路合上。'];
    case 3: return !S.f.water ? ['灯亮了。去温室打开喷淋，让花开起来。', 'green', '喷淋开关在温室右边的墙上。']
      : !seen('radio') ? ['码头小艇上的收音机有三个频道，各播一个数字的电码。去听一听，对照当铺的电码表译出来。', 'dock', '码头右边的小艇，点它。']
      : ['把三个数字按温室花槽从左到右的颜色排好，去机房打开保险柜。', 'core', '花槽从左到右是红、紫、黄；对应红灯、紫灯、黄灯三个频道。'];
    case 4: if (!S.f.nt1) return S.f.nt1Ask ? ['码头告示栏最底下那一行只有三格：零要读到「早安」，螺丝要读到「晚安」。', 'dock', '零看不见红字，螺丝看不见蓝字。两句都有的「安」用黑笔写一次。'] : ['回到地图上。零有件小事想请你帮忙。', '', ''];
      return !S.f.locker ? ['去观星台数一数星图上三个星座各有几颗星，再到码头，按储物柜门上图案的顺序拨密码。', !seen('chart') ? 'obs' : 'dock', '亮的点才是星。柜门上的图案从左到右，就是三个数字的顺序。']
      : !S.f.lens ? ['把储物柜里的镜片装回观星台的望远镜。', 'obs', '在物品栏选中镜片，再点望远镜。']
      : ['望远镜里的星座是倒着的。去观星台的控制台，把它正过来连好。', 'obs', '折射式望远镜看到的上下左右都是反的。'];
    case 5: return !S.route ? (!S.f.nt2 ? (S.f.nt2Ask ? ['码头告示栏那一行有十格：螺丝要读到零的通知，零要读到螺丝的回话。', 'dock', '两句按顺序都有的「别、了、出、来」用黑笔；只给零看的用蓝笔，只给螺丝看的用红笔。'] : ['回到地图上。零有话要说。', '', ''])
        : !S.f.night ? ['零想把断电那一晚拼起来。回到地图上，点下方的「帮零排一排那一晚」。', '', ''] : ['回到地图上。零有话要问你。', '', ''])
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

reg('dark', { name: '……', parent: null, desc: () => '黑。很冷。耳边有嗡嗡声。',
  draw() {   // 鼠标是一小圈光：移到哪里，哪里亮一点；开关在正中间
    r(0, 0, W, H, '#000000');
    const lx = mx, ly = my, R = 26;
    if (lx >= 0) {
      ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, R, 0, 6.283); ctx.clip();
      r(0, 0, W, H, '#151b28'); for (let y = 8; y < H; y += 30) r(0, y, W, 1, '#202736'); for (let x = 12; x < W; x += 48) r(x, 0, 1, H, '#141821');
      for (let k = 0; k < 18; k++) { const x = (k * 53) % W, y = (k * 37 + 11) % H; r(x, y, 2, 2, '#1c2130'); }
      bevel(150, 80, 20, 24, MT, 2); r(157, 85, 6, 14, '#07090f'); r(158, 87, 4, 6, MT[4]); r(158, 87, 4, 1, '#ffffff');
      ctx.restore();
      const g = ctx.createRadialGradient(lx, ly, R * .35, lx, ly, R); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.92)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, R + .5, 0, 6.283); ctx.fill();
      if (Math.hypot(lx - 160, ly - 92) < R) { hot(150, 80, 20, 24, 'dk', '', null); hots[hots.length - 1].hide = 1; }
    }
    if (tick - (S.dkT || 0) > 120) { ctx.globalAlpha = .35; txt('……开关好像在正中间。', 160, 160, 7, 4, 'center', false); ctx.globalAlpha = 1; }
  } });
reg('map', { name: '全站地图', desc: () => '零号站的结构图。五个舱段围着中枢，点一个亮着的舱段就能过去。' + (S.f.gate ? '所有舱段都亮了。' : '还有 ' + (1 + !(S.f.seal_t || S.f.power) + !S.f.power) + ' 个舱段黑着灯。'),
  draw() {
    const coreLit = !!(S.f.seal_t || S.f.power), obsLit = !!S.f.power;
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
    if (obsLit) { circ(270, 88, 22, 4); circ(270, 88, 19, 1); starfield(3, 14, 256, 74, 28, 28); hot(248, 66, 44, 44, 'go', 'obs', '观星台'); r(250, 98, 40, 12, 3); for (let i = 0; i < 4; i++) r(254 + i * 9, 102, 4, 4, 7); }
    else { circ(270, 88, 22, 2); circ(270, 88, 19, 1); r(250, 98, 40, 12, 2); r(266, 84, 6, 8, 2); hot(248, 66, 44, 44, 'look', '一个圆顶的舱段，黑着灯。穹顶的玻璃后面什么也看不见。', '？？？'); }
    mod(166, 126, 54, 38, 2, 5, coreLit ? 'core' : null, '机房', coreLit); if (coreLit) { circ(193, 141, 6, S.f.power ? 5 : 3); px(193, 141, 6); } else { hot(166, 126, 54, 38, 'look', '机房一片漆黑，只有门缝里透出一点待机灯。零：「先去温室和当铺吧。」', '？？？'); r(189, 138, 6, 8, 2); }
    mod(100, 130, 50, 34, 8, 7, S.f.gate ? 'back' : null, '后舱', !!S.f.gate); if (!S.f.gate) { hot(100, 130, 50, 34, 'look', '这个舱段没有亮灯，门从机房那一侧锁着。', '？？？'); r(122, 142, 6, 8, 2); }
  },
  btns: () => chap() === 5 && !S.route && S.f.nt2 && !S.f.night ? [['帮零排一排那一晚', 'nightgo']] : [],
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
  hint: () => S.f.seal_l && !S.stars.includes(2) ? ['这一题要动的是网页本身：看一眼浏览器标签页上的标题。', '标签页上写着：穹顶玻璃右上角，有一颗星不在星图上。现在它亮出来了。'] : [!S.f.locker ? '星图上有三个星座。码头储物柜的门上也有这三个图案。' : !S.f.lens ? '储物柜里的镜片该装回望远镜了。' : '控制台要你把看到的星座连出来。注意镜筒上的铭牌。', !S.f.seal_l ? '望远镜里的画面上下左右都是反的。把看到的图形转半圈再连。' : '观星台的事办完了。'] });

reg('core', { name: '机房', parent: 'map', desc: () => S.f.power ? '主机的光稳定下来了。零在看着你。' : '机房里很暗。中间的主机只剩一点微光，左边墙上是配电板。',
  draw() { drawCore(); },
  hint: () => [!S.f.power ? '配电板缺一根保险丝。当铺的天平上，有一枚硬币不太对劲。' : !S.f.seal_s ? '保险柜要三位数字。零把它存进了三段广播里，小艇的收音机收得到。' : '集齐三枚印章就去点舱门。', !S.f.power ? '当铺天平找出假币（保险丝藏在里面）→ 回来装上，对照电表记录找出多吃电的那一路。' : '温室通电浇花，记下三槽花的颜色顺序 → 小艇收音机按这个顺序听三个频道 → 对照当铺的电码表 → 保险柜。'] });

reg('back', { name: '后舱', parent: 'map', desc: () => '很小的一间舱室。桌上放着一只蛋糕，不为哪一天，只为你来了。' + (S.hd && S.hd.done === 1 ? '' : '墙角还有一只上了字锁的小木盒。'),
  draw() { drawBack(); },
  hint: () => S.stars.length && !S.f.lit && S.f.cakeTry ? ['按住屏幕右上角的 ✦，拖到蛋糕上再松手。', '拖不动的话，再点一次蛋糕，零会替你放上去。'] : ['点一下蛋糕。', '点一下蛋糕。'] });

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
reg('tiles', { name: '配电板', parent: 'core', desc: () => S.f.power ? '五路闸里，四路合着，「温室摄像」那一路拉着。' : S.f.fuseIn ? '五路分闸，每路的铭牌上写着它该用几格电。保险丝最多扛 10 格。右边夹着一卷断电前的电表记录。合好分闸，再合总闸。' : '五路分闸，每路的铭牌上写着它该用几格电。总闸下面的保险丝插槽空着：烧断的旧保险丝被人拔走了，备件柜里那根备用的也不见了。',
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

const RULE = '未登记的机械体回收不得留下';
reg('rule', { name: '旧规程', parent: 'inner', desc: () => S.f.pass ? '规程已经归档。' : '一张发黄的手抄规程，一个标点也没有。字不能改，但可以在字与字之间点上逗号。点两字之间的空隙，就放上或拿掉一个逗号。',
  draw() {
    r(0, 0, W, H, 0); r(34, 46, 256, 70, PP[1]); r(32, 44, 256, 70, PP[0]); r(32, 44, 256, 2, '#c8b890'); txt('站规 · 第七条', 160, 52, 8, '#6a5a50', 'center');
    const n = RULE.length, cw = 17, x0 = 160 - (n * cw) / 2, done = S.f.ruleOK ? Math.min(1, (tick - S.f.ruleOK) / 8) : 0;
    [...RULE].forEach((ch, i) => { txt(ch, x0 + i * cw + cw / 2, 74, 12, '#2a1e16', 'center'); });
    for (let i = 0; i < n - 1; i++) { const gx = x0 + (i + 1) * cw; if (S.rk2.includes(i)) { ctx.globalAlpha = S.f.ruleOK ? 1 : .95; txt('，', gx + 2, 76, 11, '#2a1e16', 'center'); ctx.globalAlpha = 1; } if (!S.f.pass) hot(gx - 5, 66, 10, 24, 'rcomma', i, '逗号'); }
    txt('。', x0 + n * cw + 3, 76, 11, '#2a1e16', 'center');
    if (done > 0) { ctx.globalAlpha = done; txt('原文一字未改', 280, 100, 7, '#6a5a50', 'right', false); ctx.globalAlpha = 1; }
  },
  btns: () => S.f.pass || S.f.ruleOK ? [] : [['照这样读', 'rread'], ['擦掉标点', 'rclr']],
  hint: () => ['「回收不得」四个字连在一起读，是什么意思？', '在「不得」后面点一个逗号：未登记的机械体回收不得，留下。「回收不得」就是不能回收。'],
  skip() { S.rk2 = [6, 10]; A.rread(); } });
const TILES9 = ['好', '林', '休', '思', '息', '明', '体', '想', '安'], WORD_OK = '好好休息';
const RIDDLE = ['箱子上的粉笔字：「失物，待领。」', '箱子上的粉笔字：「失物，待领。」底下有一个小小的爪印。', '箱子上的粉笔字歪歪扭扭的：「别开。」'];
reg('cargo', { name: '货舱', parent: 'green', desc: () => S.f.pass ? '螺丝的窝敞着，里面堆满了别人落下的小东西。' : '通风管的尽头是一间货舱。墙边堆着几只小箱子，最大的那只盖着一条旧毛毯。',
  draw() {
    room(1, 0, 13, 0); r(130, 6, 60, 10, 0); for (let i = 0; i < 6; i++) r(134 + i * 9, 6, 2, 10, 3);
    [[30, 78], [118, 84], [206, 78]].forEach(([x, y], i) => { r(x, y, 50, 40, 14); r(x, y, 50, 2, 8); r(x + 4, y + 6, 42, 2, 13); r(x + 4, y + 30, 42, 2, 13); r(x + 10, y + 13, 30, 12, 6); for (let j = 0; j < 3; j++) r(x + 13, y + 16 + j * 3, 20 - j * 4, 1, 0); hot(x, y, 50, 40, 'look', RIDDLE[i], '小箱子'); });
    r(262, 60, 52, 60, 13); r(262, 60, 52, 3, 14); r(262, 88, 52, 3, 14); r(280, 80, 16, 14, S.f.pass ? 0 : 7); if (S.f.pass) { r(266, 64, 44, 22, 0); r(270, 78, 10, 6, 9); r(284, 76, 8, 8, 5); r(296, 79, 9, 5, 12); }
    hot(262, 60, 52, 60, S.f.pass ? 'look' : 'ventgo', S.f.pass ? '毛毯边上有一行方方正正的粉笔字：好好休息。' : '', '大箱子');
    if (S.f.pass || !S.f.ventIn) { catAt(150, 110); hot(146, 106, 22, 16, 'pet', '', '螺丝'); }
  },
  hint: () => ['点一下最大的那只箱子。', '螺丝要你先找到它，才肯打开。'] });
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

/* ================= Q 通风管里找螺丝：六个口连成一圈，三声定出两条路，一片纸板分清是哪条 ================= */
const VNAME = ['码头', '当铺', '温室', '观星台', '机房', '后舱'], VSND = 'DKDKHH', VSNDN = { D: '滴水声', K: '咔哒声', H: '嗡嗡声' }, VSEQ = ['DKD', 'KDK'];
const ventCands = seq => { const out = []; for (let q = 0; q < 6; q++) for (const d of [1, -1]) { const path = [0, 1, 2].map(i => (q + d * i + 12) % 6); if (path.map(x => VSND[x]).join('') === seq) out.push({ path, next: (path[2] + d + 6) % 6 }); } return out; };
function ventNew() { S.vt = { seq: VSEQ[Math.floor(Math.random() * 2)], real: Math.floor(Math.random() * 2), card: -1, waited: 0, step: 0 }; }
const VPOS = i => { const a = [180, 240, 300, 0, 60, 120][i] * Math.PI / 180; return [96 + 70 * Math.cos(a), 92 + 56 * Math.sin(a)]; };
reg('vent', { name: '通风管', parent: 'cargo',
  desc: () => '六个通风口连成一圈。螺丝每分钟跑到相邻的下一个口，一直朝同一个方向，不停，也不掉头。它每到一个口就拍一下栅栏，你能听见那间舱段的声音：码头的贩卖机和温室的喷淋在滴水，当铺的座钟和观星台的马达在咔哒响，机房和后舱的机器在嗡嗡响。',
  draw() {
    if (!S.vt) ventNew(); const v = S.vt, sc = { D: CY[3], K: YL[3], H: PU[3] };
    r(0, 0, W, H, '#0e1220'); for (let y = 0; y < H; y += 10) r(0, y, 196, 1, '#121728');
    ctx.strokeStyle = '#2b3358'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(96, 92, 70, 56, 0, 0, 6.283); ctx.stroke(); ctx.strokeStyle = '#151a2c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(96, 92, 70, 56, 0, 0, 6.283); ctx.stroke();
    for (let i = 0; i < 6; i++) { const [x, y] = VPOS(i), c = sc[VSND[i]], top = y < 92;
      bevel(x - 14, y - 9, 28, 18, MT, 2); for (let k = 0; k < 4; k++) r(x - 10, y - 6 + k * 4, 20, 1, '#07090f');
      if (v.card === i) { r(x - 10, y - 7, 20, 14, '#d8c49a'); r(x - 10, y - 7, 20, 1, '#efe0bc'); r(x - 10, y + 6, 20, 1, '#a8946a'); if (v.waited && v.step) { r(x - 2, y - 1, 4, 4, '#3a2a1a'); [[-4, -4], [-1, -6], [2, -6], [5, -4]].forEach(([a, b]) => r(x + a - 1, y + b, 2, 2, '#3a2a1a')); } }
      txt(VNAME[i], x, top ? y - 29 : y + 11, 7, 5, 'center'); txt(VSNDN[VSND[i]], x, top ? y - 20 : y + 19, 7, c, 'center', false);
      hot(x - 15, y - 10, 30, 20, v.waited ? 'vopen' : 'vcard', i, v.waited ? '掀开' + VNAME[i] + '的通风口' : '把纸板放在' + VNAME[i]); }
    r(200, 6, 114, 168, 1); r(200, 6, 114, 11, 2); txt('你听到的', 204, 8, 7, 5);
    [...v.seq].forEach((c, k) => { txt('第 ' + (k + 1) + ' 分钟', 206, 22 + k * 12, 7, 4, 'left', false); txt(VSNDN[c], 250, 22 + k * 12, 7, sc[c], 'left', false); });
    txt('第 3 声就是它现在的位置。', 206, 58, 7, 4, 'left', false); txt('之后它不再拍栅栏了。', 206, 68, 7, 4, 'left', false);
    r(204, 82, 106, 1, 2);
    const say2 = v.card < 0 ? ['你只有一片涂了记号笔的', '纸板。点一个通风口，', '把它放上去。'] : !v.waited ? ['纸板放在' + VNAME[v.card] + '。', '螺丝跑到那里，就会', '留下爪印。按「等一分钟」。'] : ['一分钟过去了。', '纸板上' + (v.step ? '有一个小爪印。' : '干干净净。'), '现在掀开一个通风口。', '只能掀一次。'];
    say2.forEach((t, k) => txt(t, 206, 88 + k * 11, 7, v.waited && k === 1 ? 7 : 6, 'left', false));
  },
  btns: () => S.vt && S.vt.card >= 0 && !S.vt.waited ? [['等一分钟', 'vwait']] : [],
  hint: () => { const cs = ventCands(S.vt ? S.vt.seq : 'DKD'), snd = [...(S.vt ? S.vt.seq : 'DKD')].map(c => VSNDN[c]).join('、');
    return ['先别急着放纸板。在圈上找：哪几段连着的三个口，会依次响出「' + snd + '」？它可能顺着跑，也可能逆着跑。', '只有两条路：' + cs.map(c => c.path.map(k => VNAME[k]).join('→') + '（下一分钟到' + VNAME[c.next] + '）').join('；或者 ') + '。纸板放在' + VNAME[cs[0].next] + '或' + VNAME[cs[1].next] + '，踩没踩到都分得清。']; },
  sol: () => { const cs = ventCands(S.vt ? S.vt.seq : 'DKD'); return '<p>能依次响出这三声的路只有两条：' + cs.map(c => '<b>' + c.path.map(k => VNAME[k]).join('→') + '</b>，下一分钟到' + VNAME[c.next]).join('；') + '。</p><p>把纸板放在<b>' + VNAME[cs[0].next] + '</b>（或' + VNAME[cs[1].next] + '）。有爪印，它就在那儿；没有，它就在另一处。放在别的地方，纸板永远是干净的，什么也分不出来。</p>'; },
  skip() { const v = S.vt, cs = ventCands(v.seq); v.card = cs[0].next; v.waited = 0; A.vwait(); A.vopen(cs[v.real].next); } });

/* ================= 双面告示（P′）：零的摄像头是红镜片，看不见红字；螺丝的眼睛是蓝镜片，看不见蓝字 ================= */
const NB = { 1: { n: 3, z: '早安', c: '晚安', pal: '晚安早', sol: [['早', 'b'], ['晚', 'r'], ['安', 'k']] },
  2: { n: 10, z: '别找了我不出来', c: '别躲了出来登记', pal: '出别登我了来找记不躲', sol: [['别', 'k'], ['躲', 'r'], ['找', 'b'], ['了', 'k'], ['我', 'b'], ['不', 'b'], ['出', 'k'], ['来', 'k'], ['登', 'r'], ['记', 'r']] } };
const INK = { r: '#c8504a', b: '#3a64c8', k: '#1d1d24' }, INKN = { r: '红笔', b: '蓝笔', k: '黑笔' };
const nbSt = () => S.f.nt1 ? 2 : 1;
const nbRead = see => S.nb.filter(c => see.includes(c[1])).map(c => c[0]).join('');
const nbZ = () => nbRead('bk'), nbC = () => nbRead('rk');   // 零看得见蓝和黑；螺丝看得见红和黑
reg('board', { name: '告示栏', parent: 'dock',
  desc: () => nbSt() === 1 ? '告示栏最底下那一行只有 3 格。零要读到「早安」，螺丝要读到「晚安」。零的摄像头是红镜片，看不见红字；螺丝的眼睛是蓝镜片，看不见蓝字。先点一支笔，再点字；点印好的字可以撤掉。'
    : '还是那一行，这次有 10 格。螺丝要读到零的通知「别躲了出来登记」，零要读到螺丝的回话「别找了我不出来」。',
  draw() {
    const g = NB[nbSt()], n = g.n, cw = n > 5 ? 24 : 32, x0 = 160 - n * cw / 2;
    r(0, 0, W, H, '#10131f'); for (let y = 0; y < H; y += 12) r(0, y, W, 1, '#141828');
    bevel(14, 4, 292, 68, WD, 3); r(20, 10, 280, 56, '#9a7a52'); for (let k = 0; k < 40; k++) { const x = 22 + (k * 71) % 276, y = 12 + (k * 23) % 52; px(x, y, '#8a6a44'); }
    r(28, 13, 264, 22, '#e9e4d2'); r(28, 13, 264, 1, '#ffffff'); txt('本站五舱一枢。当户取物，请集齐时、声、光三枚印章，至机房验印。', 160, 16, 7, '#6a6458', 'center', false); txt('印章依次领取：先时，再声，后光。', 160, 25, 7, '#6a6458', 'center', false);
    r(x0 - 4, 39, n * cw + 8, 25, '#e9e4d2');
    for (let i = 0; i < n; i++) { const x = x0 + i * cw, c = S.nb[i];
      r(x + 1, 41, cw - 2, 21, '#f6f2e4'); if (c) { txt(c[0], x + cw / 2, 44, 14, INK[c[1]], 'center'); hot(x, 39, cw, 25, 'nbdel', i, '撤掉这个字'); } else if (i === S.nb.length) { r(x + 4, 59, cw - 8, 1, INK[S.nbInk]); } }
    const view = (x, nm, bg, fg, see, want) => { const got = nbRead(see), ok = got === want, vw = Math.min(13, 132 / n);
      r(x, 76, 146, 50, 1); r(x, 76, 146, 10, 2); txt(nm, x + 4, 77, 7, 5);
      r(x + 6, 89, n * vw + 2, 14, bg); S.nb.forEach((c, i) => { if (see.includes(c[1])) txt(c[0], x + 7 + i * vw + vw / 2, 91, Math.max(7, vw - 3), fg, 'center'); });
      txt('读出：' + (got || '（一片空白）'), x + 4, 106, 7, ok ? 12 : 6); txt('想读到：' + want, x + 4, 116, 7, 4);
      if (ok) txt('✓', x + 138, 106, 8, 12, 'right'); };
    view(8, '零的摄像头 · 红镜片', '#d88478', '#2a0c0c', 'bk', g.z); view(166, '螺丝的眼睛 · 蓝镜片', '#86a2dc', '#0c1430', 'rk', g.c);
    ['r', 'b', 'k'].forEach((k, j) => { const x = 10 + j * 26, on = S.nbInk === k; r(x - 2, 132, 24, 34, on ? 7 : 1); r(x, 134, 20, 30, 2); r(x + 8, 136, 4, 16, INK[k]); r(x + 8, 152, 4, 5, '#c8c0a8'); px(x + 9, 157, '#555'); txt(INKN[k], x + 10, 157, 7, on ? 7 : 4, 'center', false); hot(x - 2, 132, 24, 34, 'nbink', k, INKN[k]); });
    const pw = Math.min(22, 226 / g.pal.length); [...g.pal].forEach((ch, i) => { const x = 90 + i * pw; r(x, 134, pw - 2, 24, '#e9e4d2'); r(x, 134, pw - 2, 1, '#ffffff'); txt(ch, x + (pw - 2) / 2, 139, 12, INK[S.nbInk], 'center'); hot(x, 134, pw - 2, 24, 'nbput', ch, '用' + INKN[S.nbInk] + '写「' + ch + '」'); });
    txt('先点笔，再点字。还剩 ' + (n - S.nb.length) + ' 格', 90, 164, 7, 4);
  },
  btns: () => S.nb.length ? [['全部撤掉', 'nbclr']] : [],
  hint: () => nbSt() === 1 ? ['两句都有「安」，用黑笔写一次，两边都看得见。只给零看的字用蓝笔，只给螺丝看的字用红笔。', '蓝「早」、红「晚」、黑「安」。前两个换一下顺序也行。']
    : ['两句话按顺序都有的字是「别、了、出、来」，用黑笔写；其余的字插进它们之间：只给零看的用蓝笔，只给螺丝看的用红笔。', '一种写法：黑「别」、红「躲」、蓝「找」、黑「了」、蓝「我」、蓝「不」、黑「出」、黑「来」、红「登」、红「记」。'],
  sol: () => nbSt() === 1 ? '<p>蓝「早」、红「晚」、黑「安」（前两个可以对调）。</p><p>零的红镜片看不见红字，读到「早安」；螺丝的蓝镜片看不见蓝字，读到「晚安」。</p>'
    : '<p>一种写法：<b>黑别 红躲 蓝找 黑了 蓝我 蓝不 黑出 黑来 红登 红记</b>。</p><p>两句按顺序都有「别、了、出、来」，这四个用黑笔，两边都看得见；只给零看的「找、我、不」用蓝笔；只给螺丝看的「躲、登、记」用红笔。7 + 7 − 4 = 10，刚好十格。摆法不止一种，只要两边读出来对就算。</p>',
  skip() { S.nb = NB[nbSt()].sol.map(c => c.slice()); A.nbchk(); } });

/* ================= 零的那一晚（B′）：四段记忆排先后 ================= */
const NIGHT = [
  { k: 'cab', n: '轮子声', t: ['黑了以后，我只剩耳朵。', '有轮子声经过机房，在备件柜前停了一下。'] },
  { k: 'coin', n: '硬币', t: ['备用电池快撑不住了。', '我听到的最后一个声音，是当铺那边，硬币哗啦响了一声。'] },
  { k: 'roll', n: '点名', t: ['点名的时候，灯都还亮着。', '清洁臂没有应，我又叫了一遍。'] },
  { k: 'fuse', n: '保险丝', t: ['温室摄像那一路的读数一格一格往上爬。', '我正要去查，保险丝烧断了。'] }];
const NIGHT_OK = ['roll', 'fuse', 'cab', 'coin'];
reg('night', { name: '零的记忆', parent: 'map', desc: () => S.f.night ? '四段记忆排好了。' : '零的四段记忆，顺序乱了。按发生的先后，依次点一遍；点有编号的那段可以撤掉编号。',
  draw() {
    r(0, 0, W, H, '#0a0c16'); for (let k = 0; k < 30; k++) px((k * 97) % W, (k * 41) % H, '#1c2236');
    txt('断电那一晚 · 按先后点一遍', 160, 5, 8, 5, 'center');
    const order = S.f.night ? NIGHT_OK.map(k => NIGHT.findIndex(x => x.k === k)) : [0, 1, 2, 3];
    order.forEach((i, row) => { const y = 20 + row * 39, num = S.no.indexOf(i), on = num >= 0 || S.f.night;
      r(8, y, 304, 35, on ? 3 : 2); r(9, y + 1, 302, 33, on ? '#1e2744' : 1);
      r(14, y + 8, 18, 18, on ? 7 : 2); txt(S.f.night ? String(row + 1) : on ? String(num + 1) : '？', 23, y + 12, 9, on ? 0 : 4, 'center');
      txt(NIGHT[i].t[0], 40, y + 6, 8, on ? 6 : 5, 'left', false); txt(NIGHT[i].t[1], 40, y + 19, 8, on ? 6 : 5, 'left', false);
      if (!S.f.night) hot(8, y, 304, 35, 'nopick', i, num >= 0 ? '撤掉这个编号' : '排在第 ' + (S.no.length + 1)); });
  },
  btns: () => S.f.night ? [] : (S.no.length === 4 ? [['就是这个顺序', 'nochk'], ['重排', 'noclr']] : S.no.length ? [['重排', 'noclr']] : []),
  hint: () => ['先定最好定的两段：哪一段时灯还亮着？哪一段是「最后一个声音」？', '点名（灯还亮着）→ 保险丝烧断（就是黑了的那一刻）→ 轮子声（「黑了以后」）→ 硬币（「最后一个声音」）。'],
  sol: () => '<p>顺序：<b>点名 → 保险丝烧断 → 轮子声 → 硬币</b>。</p><p>点名时灯还亮着，所以在烧断之前；轮子声那段开头就是「黑了以后」，所以在烧断之后；硬币是「最后一个声音」，排在最后。</p>',
  skip() { S.no = NIGHT_OK.map(k => NIGHT.findIndex(x => x.k === k)); A.nochk(); } });

function getPass(lines) { talk(lines.concat([Z(praise()), { fn: () => { S.f.pass = 1; give('pass'); sfx('stamp'); save(); } }])); }
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
  if (S.f.cat && S.f.seal_s && !S.f.nt1 && !S.f.nt1Ask && S.v === 'map') {
    S.f.nt1Ask = 1; save();
    return talk([Z('{name}，帮我一个小忙。码头告示栏最底下，还空着一行。'), Z('我每天早上都会看一眼告示栏。那一行要是写着「早安」，我会很高兴。'), Z('笔挂在告示栏边上，红、蓝、黑三支。断电那晚，我的白天镜头烧坏了，现在只剩夜视那一路，装的是红色镜片。隔着它，红字跟白纸一个颜色。别用红笔写给我。')]);
  }
  if (S.f.cat && sealsN() >= 3 && !S.f.nt2 && !S.f.nt2Ask && !S.route && S.v === 'map') {
    S.f.nt2Ask = 1; save();
    return talk([Z('{name}，三枚印章都齐了。走之前，再帮我一件事。'), Z('告示栏那一行，我想换成一张通知，写给那个一直躲着我摄像头的热源：「别躲了，出来登记」。'), Z('还是那三支笔，还是那一行。')]);
  }
  if (S.f.cat && sealsN() >= 3 && S.f.nt2 && !S.f.night && !S.f.nightIn && !S.route && S.v === 'map') {
    S.f.nightIn = 1; save();
    return talk([Z('通知贴好了。可我读到的，是另一句话：「别找了，我不出来」。'), Z('……{name}，在你走之前，我想把断电那一晚拼起来。'), Z('我的记忆断成了四段，顺序乱了。你帮我排一排。'), { fn: () => A.nightgo() }]);
  }
  if (S.f.cat && sealsN() >= 3 && S.f.night && !S.route && S.v === 'map') {
    return talk([Z('现在我知道那一晚是怎么发生的了。可还是不知道，是谁。'), Z('还有一件事。站里有一个没有登记的热源，一直躲着我的摄像头。告示栏上那句「别找了」，大概就是它的回答。'),
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
function winScale() { S.f.scale = 1; S.sc.acc = false; give('fuse'); sfx('win'); say(praise() + '就是它，分量不对。掰开一看，这根本不是硬币：两片薄壳中间卷着一根备用保险丝。外壳被擦得锃亮，一点指纹也没有。有人把它藏进了硬币堆里，还收拾得干干净净。'); return; say('翻过来一看，这根本不是硬币，是一枚自动贩卖机的代币。'); }
function powerOn() { S.f.power = 1; S.brk = BRK_OK.slice(); sfx('win'); talk(['你把「温室摄像」那一路拉了下来，合上总闸。', '啪。整座空间站的灯依次亮了起来。', Z(praise())].concat([Z('温室摄像那一路，比铭牌多吃了四格电。像是有人故意让它把保险丝烧断。'), Z('……先不接它了。温室那边，我又成了瞎子。'),Z('……主电恢复了。谢谢你，{name}。我刚才说话是不是断断续续的？'), Z('现在温室的喷淋可以转了。另外，我左手边的保险柜里锁着一枚印章，密码我自己也忘了，只记得把它存进了三段广播里。码头小艇上的收音机收得到。')])); }
const A = {
  box() { if (!ME) return say('柜台下面是一排保管箱，每只上面都有名牌。没有一只写着「访客」。'); S.f.box = 1; S.v = 'box'; sfx('pick'); say(V.box.desc() + ' 零说，它一直替你收着，走的时候记得带上。'); },
  pet() {
    S.f.petN = (S.f.petN || 0) + 1; if (S.f.petN === 10) return talk(['你又摸了一下。螺丝终于忍不住，咕咚一声翻了个身，四脚朝天地躺在地上。', '它的肚皮上刻着一行很小的字：出厂日期——来日方长。', C('……看什么看。没见过猫翻身吗。')]);
    const it = ME && ME.item && !S.f.catItem;
    if (it) { S.f.catItem = 1; S.aff.c += 1; return talk([C('你身上有' + ITEMNAME[ME.item] + '的味道。'), C('是好东西。收好。')]); }
    if (S.f.cat && S.f.bunkIntro && !S.facts.includes('cat')) return talk([C('草莓？我又尝不出甜。我只是觉得它红红的，放在蛋糕上好看。')].concat(fact('cat')));
    talk([C(['喵。', '尾巴，别踩。', '大眼睛其实不坏。它只是太听规程的话。', '我修过这座站里所有的灯。'][Math.floor(Math.random() * 4)])]);
  },
  culprit(i) {
    if (S.f.pass) return;
    if (+i === 0) return talk(['零沉默了很久。', Z('是清洁臂。它是故意的。'), Z('主电一断，我的摄像头就全黑了。旧规程写着，未登记的机械体一律回收。它是在替那只猫关灯。'), Z('规程是我在执行，可规程不是我写的。我想改，可站规不许我改规程里的任何一个字。'), Z('……不过这一条是当年手抄的，没有标点。'), { fn: () => { S.v = 'rule'; S.rk2 = []; refresh(); } }]);
    sfx('bad'); say(+i === 1 ? '零：「如果是导航副机，那清洁臂和温控器说的就都是真话了。不对，只能有一条。」' : '零：「如果是温控器，那清洁臂和导航副机说的就都是真话了。不对，只能有一条。」');
  },
  rcomma(i) { if (S.f.ruleOK) return; i = +i; S.rk2 = S.rk2.includes(i) ? S.rk2.filter(x => x !== i) : S.rk2.concat(i).sort((a, b) => a - b); sfx('click'); },
  rclr() { S.rk2 = []; },
  rread() {
    if (S.f.ruleOK) return; const read = [...RULE].map((ch, i) => ch + (S.rk2.includes(i) ? '，' : '')).join('') + '。';
    const ok = S.rk2.includes(10) && S.rk2.every(i => i === 6 || i === 10);
    if (!S.rk2.length) return say('零：「一个标点都没有，还是原来那句。读起来，就是要回收。」');
    if (!ok) { sfx('bad'); return say('零念了一遍：「' + read + '」' + (S.rk2.includes(8) || (!S.rk2.includes(10) && S.rk2.length) ? '……还是要回收。' : '……这样读不通。')); }
    S.f.ruleOK = tick; sfx('win');
    getPass([Z('「' + read + '」'), Z('回收不得，留下。'), Z('一个字也没有改。'), Z('规程不是我写的，可这个标点是你点的。我会照它执行。'), '主机的出卡口吐出一枚新刻的章，上面两个字：通行。']);
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
    if (['t', 's', 'l'].every((k, i) => CH[S.dial[i]] === S.ch[k])) return getPass(['抽屉滑开了。里面只有一个档案袋，封面上是你的口令。', '最上面是一页事故记录：主电是清洁臂切断的，为的是让摄像头照不到一只没登记的机械猫。', '记录末尾，「处理意见」一栏空着。你看了一会儿，没有替它们填。', '再往下是你自己的当户档案。三张当票都在，' + ['t', 's', 'l'].map(k => '「' + PAWN[k].item.replace('一个', '').replace('一句', '') + '」' + { take: '已赎回', leave: '寄存', give: '已转赠' }[S.ch[k]]).join('，') + '。每一个去向，都是你自己选的。', '后面是厚厚一沓空白页。档案袋上夹着一支笔，笔杆上刻着站规的最后一条：每个人的档案，只能由本人来写。', '「通行」那一栏也空着，旁边放着一枚章。你给自己盖了章。']);
    sfx('bad'); say('这只抽屉里是别人的档案。有人把三样东西都留下了，有人全都送了出去。不是你的。');
  },
  go(p) { if ((p === 'core' && !(S.f.seal_t || S.f.power)) || (p === 'obs' && !S.f.power)) return say('那个舱段还黑着灯。'); if (locked(p)) { sfx('click'); return talk([Z('这个先放一放，还没到它。现在该去' + goalPlace() + '。'), Z('不知道做什么，就点「提示」。')]); } sim = null; S.v = p; sfx('step'); say(V[p].desc() + (SUB[p] && !S.f['seen_' + p] ? ' 地板上还有一个舱口，通往' + V[SUB[p]].name + '。' : '')); if (SUB[p]) S.f['seen_' + p] = 1; },
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
    if (S.sel === 'fuse') { drop('fuse'); S.f.fuseIn = 1; sfx('pick'); return say('备用保险丝装上了。上一根就是被超载烧断的——合总闸之前，先想想哪几路该合上。'); }
    say('插槽空着。烧断的旧保险丝被人拔走了，备件柜里那根备用的也不见了。');
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
    talk([Z('这座站替人保管三样东西：时间、声音和光。每一样都有一枚印章。'), Z('你已经找到 ' + n + ' 枚。下一步，去' + goalPlace() + '。'), Z('至于主电是谁切断的……我还在想。')]);
  },
  gate() {
    if (S.f.gate) { S.v = 'back'; return say(V.back.desc()); }
    const need = ['seal_t', 'seal_s', 'seal_l'];
    if (need.every(has) && has('pass')) { need.concat('pass').forEach(drop); S.f.gate = 1; sfx('stamp'); return talk(['三枚印章依次按进了门上的凹槽。时、声、光。最后是那枚「通行」。', Z('验印无误。后舱的门开了。'), Z('里面的东西是给你的，{name}。我只是替人保管。')]); }
    if (need.every(has)) return talk([Z('三枚印章都对。可是这扇门还要一枚「通行」章。'), Z({ z: '帮我查完日志，我就能给你刻一枚。入口在主机底座上。', c: '……我没有权限直接给你。也许站里有谁捡到过一枚。', l: '通行章收在档案室。那里不对当户开放，除非你自己打得开门。' }[S.route] || '再等一等。')]);
    const n = need.filter(has).length;
    say('舱门上有三个方形凹槽，旁边还有一个圆的。' + (n ? '你手里有 ' + n + ' 枚印章，还不够。' : '你手里一枚印章也没有。'));
  },
  cake() {
    if (S.f.end) return showEnd(false);
    if (S.stars.length && !S.f.lit) {   // 第一次点：教你拖；再点一次：零替你放，绝不卡住
      S.f.cakeTry = (S.f.cakeTry || 0) + 1;
      if (S.f.cakeTry === 1) return talk(['蛋糕上只插着一根蜡烛，还没有点。', Z('站里没有火。……不过，你一路捡的星屑还在发光。'), (S.route === 'c' ? C : Z)('就是你头顶右上角那一串 ✦。按住它，拖到蛋糕上再松手。')]);
      S.f.lit = 1; say('零：「拖不动也没关系，我替你放上去。」');
    }
    const n = S.stars.length;
    talk([n ? '你把捡到的星屑放在蛋糕上。它们立了起来，变成了蜡烛。' : '蛋糕上只有一根蜡烛。', '桌上除了蛋糕，还有一只空盘子，一把叉子。', Z('我没有手，点不了火。'), '话音刚落，烛芯自己亮了。'].concat(FINAL[S.route] || []).concat([{ fn: () => { S.f.end = 1; if (!S.end) S.end = 'l1'; sfx('stamp'); save(); setTimeout(() => runSlides(() => runCG(() => showEnd(false))), 500); } }]));
  }
};

Object.assign(A, {

  ventgo() { S.f.ventIn = 1; ventNew(); talk([C('这是我的窝。想看？'), C('先找到我。'), '螺丝一扭身，钻进了墙上的通风口。', '管子里传来一声很轻的「咚」。', { fn: () => { S.v = 'vent'; say(V.vent.desc()); refresh(); save(); } }]); },
  vcard(i) { S.vt.card = +i; sfx('click'); },
  vwait() { const v = S.vt; if (v.card < 0 || v.waited) return; v.waited = 1; v.step = ventCands(v.seq)[v.real].next === v.card ? 1 : 0; sfx('step'); say('一分钟过去了。' + (v.step ? '纸板上多了一个小小的爪印。' : '纸板干干净净。') + '现在掀开一个通风口。只能掀一次。'); },
  vopen(i) {
    i = +i; const v = S.vt; if (!v.waited) return; const cs = ventCands(v.seq), real = cs[v.real], fit = [...new Set(cs.filter(c => (c.next === v.card) === !!v.step).map(c => c.next))];
    if (fit.length > 1) { badN++; sfx('bad'); ventNew(); return talk(['你掀开' + VNAME[i] + '的通风口。' + (i === real.next ? '螺丝真的在里面。' : '里面是空的。'), C(i === real.next ? '……蒙的吧。' : '不在这儿。'), C('你看到的，' + fit.map(k => VNAME[k]).join('和') + '都说得通。蒙对了不算。'), C('再来一局。我换个地方跑。')]); }
    if (i !== real.next) { badN++; sfx('bad'); ventNew(); return talk(['你掀开' + VNAME[i] + '的通风口。里面是空的。', '管子另一头，传来一声得意的「喵」。', C('再来一局。我换个地方跑。')]); }
    S.v = 'cargo'; sfx('win');
    getPass(['你掀开' + VNAME[i] + '的通风口。螺丝蹲在里面，尾巴尖的灯一闪一闪。', C('……被你找到了。'), C('大眼睛的摄像头找了我好久。你只用了一张纸板。'), C('行。跟我来。'), '它带你回到货舱，用脑袋拱开了最大那只箱子上的毛毯。', '箱子里是一个用旧毛毯垫成的窝，堆满了别人落在站里的小东西：一只手套，半块橡皮，一枚纽扣。毛毯边上有一行粉笔字，写得方方正正：好好休息。', C('那是清洁臂写的。它每晚来擦地，顺手替我把灯关上。'), C('零的规程说，没登记的要回收。我没登记。'), C('这些都没人来领。我替它们找了个地方。'), C('这个给你，门上要用。我捡的。'), '螺丝用鼻子把一枚刻着「通行」的章推到你脚边。']);
  },
  nbink(k) { S.nbInk = k; sfx('click'); },
  nbput(ch) { const g = NB[nbSt()]; if (S.nb.length >= g.n) return say('这一行只有 ' + g.n + ' 格，已经写满了。点印好的字可以撤掉。'); S.nb.push([ch, S.nbInk]); sfx('click'); A.nbchk(); },
  nbdel(i) { S.nb.splice(i, 1); sfx('click'); say(V.board.desc()); },
  nbclr() { S.nb = []; say(V.board.desc()); },
  nbchk() {
    const st = nbSt(), g = NB[st], z = nbZ(), c = nbC();
    if (z !== g.z || c !== g.c) { if (S.nb.length >= g.n) { badN++; say('格子满了。零读到的是「' + (z || '……') + '」，螺丝读到的是「' + (c || '……') + '」。'); } return; }
    sfx('win');
    if (st === 1) { S.f.nt1 = 1; S.nb = []; S.nbInk = 'k'; save(); return talk(['三个字挤在一行里。', '隔着红镜片，零读到的是：「早安」。隔着蓝镜片，螺丝读到的是：「晚安」。', Z('……早安。{name}，我好久没在告示栏上看到问候了。'), C('晚安。'), C('它看不见我那句吧？'), '看不见。在红镜片底下，红字就是一张白纸。', C('嗯。……那我去睡了。'), { fn: () => { S.v = 'dock'; say(V.dock.desc()); refresh(); save(); } }]); }
    S.f.nt2 = 1; S.nbInk = 'k'; save();
    talk(['十个字挤在一行里。', '隔着蓝镜片，螺丝读到的是：「别躲了，出来登记」。', C('……登记。登记了，就会被回收。我才不。'), '它跳下告示栏，钻回了通风管。', '隔着红镜片，零读到的是：「别找了，我不出来」。', Z('……它是不是误会了什么。'), { fn: () => { S.v = 'map'; say(V.map.desc()); refresh(); save(); } }]);
  },
  nightgo() { S.v = 'night'; S.no = []; sfx('click'); say(V.night.desc()); refresh(); save(); },
  nopick(i) { const j = S.no.indexOf(i); if (j >= 0) S.no.splice(j, 1); else if (S.no.length < 4) S.no.push(i); sfx('click'); },
  noclr() { S.no = []; },
  nochk() {
    const o = S.no.map(i => NIGHT[i].k), pos = k => o.indexOf(k), nm = k => '「' + NIGHT.find(x => x.k === k).n + '」';
    if (o.join() === NIGHT_OK.join()) {
      S.f.night = 1; sfx('win'); save();
      return talk([Z('……对。是这个顺序。'), Z('点名，清洁臂没有应。读数往上爬，保险丝烧断，站里黑了。黑了以后，有轮子经过备件柜。最后，当铺里一枚硬币响了一声。'), Z('那根备用保险丝，后来就是在一枚假币里找到的。'), Z('……我不想往下猜了。'), { fn: () => { S.v = 'map'; say(V.map.desc()); refresh(); save(); } }]);
    }
    badN++;
    const m = pos('coin') !== 3 ? '「最后一个声音」是硬币那一声。可你把' + nm(o[3]) + '排在了它后面。这两段对不上。'
      : pos('fuse') < pos('roll') ? '点名的时候灯还亮着，可保险丝一烧断就黑了。' + nm('roll') + '和' + nm('fuse') + '，顺序反了。'
      : nm('cab') + '那段开头就是「黑了以后」，得在保险丝烧断之后。它和' + nm('fuse') + '，顺序反了。';
    sfx('bad'); talk([Z(m)]);
  },
  hdopen() { hdShow(); },
});

/* ================= 把 ✦ 拖到蛋糕上：自己实现拖动，不依赖浏览器的拖放 ================= */
let dragStar = null;
const canDrag = () => S.v === 'back' && S.stars.length > 0 && !S.f.lit && !S.f.end && !dOn && $('title').hidden;
function moveStar(e) { if (dragStar) { dragStar.style.left = e.clientX + 'px'; dragStar.style.top = e.clientY + 'px'; } }
function dropStar(e) {
  if (!dragStar) return; dragStar.remove(); dragStar = null; document.body.classList.remove('dragging'); if (!e || !canDrag()) return;
  const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) * W / b.width, y = (e.clientY - b.top) * H / b.height;
  if (x < 118 || x > 202 || y < 60 || y > 126) { say('星屑在半空停了一下，又飘回了你头顶。再往蛋糕上放一点。'); return; }
  puff(x, y); S.f.lit = 1; sfx('pick'); act('cake');
}
$('stars').addEventListener('pointerdown', e => { if (!canDrag()) return; e.preventDefault(); dragStar = document.createElement('div'); dragStar.id = 'dragStar'; dragStar.textContent = '✦'.repeat(S.stars.length); document.body.appendChild(dragStar); document.body.classList.add('dragging'); moveStar(e); });
window.addEventListener('pointermove', moveStar);
window.addEventListener('pointerup', dropStar);
window.addEventListener('pointercancel', () => dropStar(null));
window.addEventListener('blur', () => dropStar(null));

/* ================= 汉兜字锁（H，后舱的小彩蛋）：任意四个字，看字、声母、韵母、声调 ================= */
let PYM = null;
function pyMap() { if (PYM) return PYM; PYM = {}; String(window.PINYIN || '').split(';').forEach(g => { const [p, cs] = g.split(':'); if (cs) for (const c of cs) (PYM[c] = PYM[c] || []).push(p); }); return PYM; }
const TONEMK = { '̄': 1, '́': 2, '̌': 3, '̀': 4 }, TONESYM = ['', 'ˉ', 'ˊ', 'ˇ', 'ˋ', '·'];
const INITS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];
function pyParse(p) {
  let tone = 5, base = ''; for (const ch of p.normalize('NFD')) { if (TONEMK[ch]) tone = TONEMK[ch]; else base += ch; } base = base.normalize('NFC');
  let ini = INITS.find(i => base.startsWith(i) && base.length > i.length) || ''; if (!/[aeiouü]/.test(base.slice(ini.length))) ini = '';
  return { ini, fin: base.slice(ini.length), tone };
}
const HD_ANS = [['来', 'lái'], ['日', 'rì'], ['方', 'fāng'], ['长', 'cháng']].map(([c, p]) => Object.assign({ c }, pyParse(p))), HD_MAX = 10;
function hdMark(vals, ans) { const res = vals.map(() => 'n'), left = {}; ans.forEach((a, i) => { if (vals[i] === a) res[i] = 'g'; else left[a] = (left[a] || 0) + 1; }); vals.forEach((v, i) => { if (res[i] !== 'g' && left[v]) { res[i] = 'y'; left[v]--; } }); return res; }
function hdJudge(chars) {   // 多音字取对玩家最有利的读音
  const M = pyMap(), opts = chars.map(c => M[c].map(pyParse)); let best = null;
  const keys = ['ini', 'fin', 'tone'], walk = (i, pick) => { if (i === 4) { const mk = { c: hdMark(chars, HD_ANS.map(a => a.c)) }; keys.forEach(k => { mk[k] = hdMark(pick.map(p => p[k]), HD_ANS.map(a => a[k])); }); const sc = keys.concat('c').reduce((t, k) => t + mk[k].reduce((u, v) => u + (v === 'g' ? 2 : v === 'y' ? 1 : 0), 0), 0); if (!best || sc > best.sc) best = { sc, pick: pick.slice(), mk }; return; } opts[i].forEach(o => { pick.push(o); walk(i + 1, pick); pick.pop(); }); };
  walk(0, []); return best;
}
function hdRender() {
  const H0 = S.hd, rows = H0.g.map(g => { const chars = [...g], j = hdJudge(chars);
    return '<div class="hdrow">' + chars.map((c, i) => { const p = j.pick[i]; return `<div class="hdc"><div class="hdpy"><span class="${j.mk.ini[i]}">${p.ini}</span><span class="${j.mk.fin[i]}">${p.fin}</span><span class="t ${j.mk.tone[i]}">${TONESYM[p.tone]}</span></div><div class="hdch ${j.mk.c[i]}">${c}</div></div>`; }).join('') + '</div>'; });
  if (!H0.done) rows.push('<div class="hdrow empty">' + '<div class="hdc"><div class="hdpy">&nbsp;</div><div class="hdch">？</div></div>'.repeat(4) + '</div>');
  $('hdGrid').innerHTML = rows.join('');
  $('hdLeft').textContent = H0.done ? '' : '还能猜 ' + (HD_MAX - H0.g.length) + ' 次';
  $('hdin').disabled = $('hdGo').disabled = !!H0.done; $('hdHint').hidden = !!H0.done;
}
function hdShow() { if (!S.hd) S.hd = { g: [], h: 0, done: 0 }; $('hdmsg').textContent = S.hd.done === 1 ? '你猜出来了：来日方长。' : S.hd.done === 2 ? '答案是：来日方长。' : ''; hdRender(); $('hd').hidden = false; if (!S.hd.done) $('hdin').focus(); sfx('click'); save(); }
function hdGuess() {
  const H0 = S.hd; if (!H0 || H0.done) return;
  const chars = [...$('hdin').value].filter(c => /\p{Script=Han}/u.test(c));
  if (chars.length !== 4) { $('hdmsg').textContent = '要正好四个汉字。'; return; }
  const bad = chars.find(c => !pyMap()[c]); if (bad) { $('hdmsg').textContent = '「' + bad + '」这个字盒子不认得，换一个常用字吧。'; return; }
  H0.g.push(chars.join('')); $('hdin').value = '';
  if (chars.join('') === HD_ANS.map(a => a.c).join('')) { H0.done = 1; sfx('win'); $('hdmsg').textContent = '咔哒。盒盖弹开了。'; }
  else if (H0.g.length >= HD_MAX) { H0.done = 2; $('hdmsg').textContent = '十次用完了。盒子自己弹开了：答案是「来日方长」。'; }
  else { sfx('click'); $('hdmsg').textContent = ''; }
  hdRender(); save(); refresh();
}
const HD_HINT = ['第一个字读 lái。', '这是零常说的一句话，意思是：以后的日子还长着呢。', '答案是「来日方长」。'];
$('hdGo').onclick = hdGuess; $('hdin').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) hdGuess(); });
$('hdHint').onclick = () => { const H0 = S.hd; if (!H0) return; $('hdmsg').textContent = '提示：' + HD_HINT.slice(0, H0.h + 1).join(' '); H0.h = Math.min(H0.h + 1, HD_HINT.length - 1); save(); };
$('hdClose').onclick = () => { $('hd').hidden = true; if (S.hd && S.hd.done && !S.f.hdTalk) { S.f.hdTalk = 1; save(); talk(S.hd.done === 1 ? ['盒子里只有一张小纸条，是零的字：', Z('「来日方长」。这四个字，我在当票上写过，也刻在过别的地方。'), Z('这一次，是你自己拼出来的。')] : ['盒子里只有一张小纸条，是零的字：「来日方长」。', Z('猜不出来也没关系。这四个字的意思就是：不着急。')]); } refresh(); };

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

/* ① 邮件室 · 导航副机：用 Python 给信使写一段循环程序（右手扶墙） */
const DMAPS = [['..#....', '..#....', 'S......', '..#....', '.#...G.'], ['......G', '.......', 'S..#.##', '....#..', '.....#.'], ['....#..', '.......', 'S.###..', '..#....', '....G..']];
const DCMD = { F: '前进()', L: '左转()', R: '右转()', A: 'if 前面有陨石(): 左转()', B: 'if 前面有陨石(): 右转()', C: 'if 右边是空的(): 右转()' }, DMAX = 4, DSTEPS = 64;
const DZH = { F: '前进', L: '左转', R: '右转', A: '如果前面有陨石，就左转', B: '如果前面有陨石，就右转', C: '如果右边是空的，就右转' };
const dLabel = c => S.f.py ? DCMD[c] : DZH[c];
const dFind = (m, ch) => { for (let j = 0; j < 5; j++) { const i = m[j].indexOf(ch); if (i >= 0) return [i, j]; } };
const dBlocked = (m, x, y) => x < 0 || x >= 7 || y < 0 || y >= 5 || m[y][x] === '#';
function dStep(m, st, c) {
  const nx = st.x + DX4[st.d], ny = st.y + DY4[st.d], b = dBlocked(m, nx, ny), rd = (st.d + 1) % 4, rb = dBlocked(m, st.x + DX4[rd], st.y + DY4[rd]);
  if (c === 'L') st.d = (st.d + 3) % 4; else if (c === 'R') st.d = rd; else if (c === 'A') { if (b) st.d = (st.d + 3) % 4; } else if (c === 'B') { if (b) st.d = rd; } else if (c === 'C') { if (!rb) st.d = rd; } else if (!b) { st.x = nx; st.y = ny; }
  const g = dFind(m, 'G'); if (st.x === g[0] && st.y === g[1]) st.done = true;
}
const dStart = () => DMAPS.map(m => { const s = dFind(m, 'S'); return { x: s[0], y: s[1], d: 0, done: false }; });
const PYCARD = [{ who: '导航副机', t: '同样的程序，用 Python 写是这样的。一共只要懂三样：' }, { who: '导航副机', t: '「前进()」是调用一个动作，后面的括号表示「去做」。' }, { who: '导航副机', t: '「while not 送到():」下面缩进的几行，会一遍一遍重复，直到信送到为止。' }, { who: '导航副机', t: '「if 条件: 动作」只在条件成立的时候才做那个动作，不成立就跳过这一行。' }, { who: '导航副机', t: '循环里最多写四行。三张航图，用同一段程序。' }];
reg('mail', { name: '邮件室', parent: 'dock', desc: () => '导航副机的委托：「三封信，三张航图，可信使无人机只装得下一段程序。」用下面的按钮写程序，循环里最多 4 行，同一段程序要在三张航图上都送到。无人机出发时都朝右。' + (S.f.py ? '现在是 Python 写法。' : '无人机也认 Python，想试的话可以切换写法。') + bestTxt('mail'),
  draw() {
    r(0, 0, W, H, 1); r(0, 0, W, 12, 2); txt('信使无人机 · 航线程序' + (S.f.py ? '（Python）' : ''), 312, 2, 8, 5, 'right');
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
    r(10, 97, 300, 76, '#0b0f1a'); r(10, 97, 300, 1, '#2a3550');
    if (S.f.py) { txt('while', 16, 101, 8, '#c792ea'); txt('not', 46, 101, 8, '#c792ea'); txt('送到():', 68, 101, 8, '#82aaff'); } else txt('一遍又一遍，直到送到：', 16, 101, 8, '#82aaff');
    for (let i = 0; i < DMAX; i++) {
      const y = 116 + i * 14, c = S.pg[i], on = sim && sim.kind === 'drone' && S.pg.length && (sim.i % S.pg.length) === i;
      if (on) r(12, y - 2, 296, 13, '#1e2a44');
      txt(String(i + 1), 18, y, 7, '#3a4870');
      if (!c) { txt('……', 40, y, 8, '#3a4870', 'left', false); continue; }
      const t = dLabel(c), m = S.f.py && t.match(/^if (.+?): (.+)$/);
      if (m) { txt('if', 40, y, 8, '#c792ea'); txt(m[1] + ':', 54, y, 8, '#ffcb6b'); txt(m[2], 54 + ctx.measureText(m[1] + ':').width + 6, y, 8, '#82aaff'); }
      else txt(t, 40, y, 8, '#82aaff');
    }
    txt(S.pg.length + ' / ' + DMAX + ' 行', 304, 101, 7, 7, 'right');
    if (sim && sim.kind === 'drone') txt('第 ' + sim.i + ' 步', 304, 160, 7, 7, 'right');
  },
  btns: () => sim ? [] : ['F', 'L', 'R', 'A', 'B', 'C'].map(c => [dLabel(c), 'dc', c]).concat([['删一行', 'dc', '-'], ['清空', 'dc', '0'], [S.f.py ? '换回中文写法' : '换成 Python 写法', 'pyswap']], S.f.py ? [['语法', 'pyhelp']] : [], [['试飞', 'dfly']]),
  hint: () => ['「撞了就转」最容易想到，可总有一张图会把无人机困在原地兜圈。想想人在黑屋子里怎么走出迷宫。', '右手一直扶着墙走：右边空着就先右转，前面有陨石就左转，然后前进。'],
  sol: () => '<p>最少 3 行，一共 7 种写法。其中一种（中文写法）：</p><pre>一遍又一遍，直到送到：\n    如果右边是空的，就右转\n    如果前面有陨石，就左转\n    前进</pre><p>同一段程序的 Python 写法：</p><pre>while not 送到():\n    if 右边是空的(): 右转()\n    if 前面有陨石(): 左转()\n    前进()</pre><p>思路是走迷宫的「右手法则」：右手一直扶着墙走，总能走到出口。「撞了就右转」在航图三上会被一排陨石困住。</p>',
  skip() { S.pg = ['C', 'A', 'F']; sideWin('mail', 0, '零把一段程序传给了无人机。三封信都送到了。', NAVLINE); } });
const NAVLINE = { who: '导航副机', t: '收到。三封信都投进去了。右手扶墙……我算了很多年航线，头一回有人替我写程序。' };

/* ② 库房 · 零：互相打架的上架规程（4 件、2 层、5 条） */
const IT4 = [{ n: '玻璃罐', f: 1, h: 0, o: '甲' }, { n: '铁砧', f: 0, h: 1, o: '甲' }, { n: '八音盒', f: 1, h: 0, o: '乙' }, { n: '信封', f: 0, h: 0, o: '乙' }];
const RTXT = ['易碎的放上层', '重的放下层', '同一当户的放同一层', '两件易碎的不放同一层', '上层只放轻的'];
const RFN = [a => IT4.every((t, i) => !t.f || a[i] === 0), a => IT4.every((t, i) => !t.h || a[i] === 1), a => IT4.every((t, i) => IT4.every((u, j) => t.o !== u.o || a[i] === a[j])), a => a[0] !== a[2], a => IT4.every((t, i) => a[i] !== 0 || !t.h)];
const ARR4 = [[0, 0, 1, 1], [0, 1, 0, 1], [0, 1, 1, 0], [1, 0, 0, 1], [1, 0, 1, 0], [1, 1, 0, 0]];
const rkOK = () => { if (!S.rk || S.rk.length !== RTXT.length) S.rk = RTXT.map(() => true); return S.rk; };
const sat = ids => ARR4.find(a => ids.every(i => RFN[i](a)));
function bestShelf() {   // 能摆：[摆法, []]；摆不下：[null, 卷进冲突的规程]（只标出谁和谁打架，不点明该删哪条）
  const kept = rkOK().map((k, i) => k ? i : -1).filter(i => i >= 0), a = sat(kept); if (a) return [a, []];
  const fight = new Set(), subs = [];
  for (let m = 1; m < 1 << kept.length; m++) { const ids = kept.filter((_, q) => m >> q & 1); if (!sat(ids) && ids.every(i => sat(ids.filter(j => j !== i)))) subs.push(ids); }
  subs.forEach(ids => ids.forEach(i => fight.add(i))); return [null, [...fight].sort(), subs];
}
reg('rules', { name: '规程簿', parent: 'store', desc: () => '零的委托：「四件当物，两层架子，每层放两件。我的五条规程互相打架。」点规程可以划掉或恢复。卷进冲突的规程会标红。' + bestTxt('store'),
  draw() {
    rkOK(); const [a, bad, subs] = bestShelf();
    r(0, 0, W, H, 13); r(6, 6, 146, 168, 6); r(6, 6, 146, 11, 14); txt('架子（零按留下的规程试摆）', 148, 7, 7, 0, 'right');
    ['上层', '下层'].forEach((n, k) => { const y = 26 + k * 56; r(10, y + 44, 138, 4, WD[3]); r(10, y + 48, 138, 2, WD[1]); txt(n, 12, y, 7, 14);
      if (a) IT4.forEach((t, i) => { if (a[i] !== k) return; const x = a.slice(0, i).filter(v => v === k).length ? 82 : 18; r(x, y + 10, 58, 34, 1); r(x + 1, y + 11, 56, 32, 2); txt(t.n, x + 29, y + 14, 8, 6, 'center');
        const tags = [t.f ? ['易碎', 9] : null, t.h ? ['重', 14] : ['轻', 4], [t.o, { 甲: 7, 乙: 12 }[t.o]]].filter(Boolean); tags.forEach(([w, c], q) => { const tx = x + 4 + q * 18; r(tx, y + 30, 16, 10, c); txt(w, tx + 8, y + 31, 7, 0, 'center', false); }); }); });
    if (!a) { txt('怎么摆都违规', 79, 60, 9, 9, 'center'); }
    txt(a ? '全部满足，可以请零上架' : '标红的规程在互相打架', 79, 148, 8, a ? 12 : 9, 'center');
    r(158, 6, 156, 168, 1); r(158, 6, 156, 11, 2); txt('上架规程', 162, 7, 8, 5);
    RTXT.forEach((t, i) => { const y = 24 + i * 24, on = S.rk[i], no = on && bad.includes(i); r(162, y, 148, 20, no ? 9 : on ? 3 : 0); r(163, y + 1, 146, 18, on ? 2 : 0); txt(CNUM[i], 168, y + 5, 8, on ? 7 : 2); txt(t, 182, y + 5, 8, on ? 6 : 3, 'left', on); if (!on) r(180, y + 10, 124, 1, 9); if (no) txt('打架', 306, y + 6, 7, 9, 'right'); hot(162, y, 148, 21, 'rk', i, on ? '划掉' : '恢复'); });
    txt('留下 ' + S.rk.filter(Boolean).length + ' 条（至少 3 条）', 310, 160, 7, 7, 'right');
  },
  btns: () => [['请零上架', 'rkgo'], ['全部恢复', 'rkall']],
  hint: () => ['易碎的有两件。第一条要它们都去上层，第四条又不许它们在同一层。', '只删一条就够。删掉第一条「易碎的放上层」：铁砧和玻璃罐去下层，八音盒和信封去上层，其余四条全满足。'],
  sol: () => '<p>只删一条，而且只能删<b>第一条「易碎的放上层」</b>。</p><p>摆法：上层八音盒、信封；下层玻璃罐、铁砧。</p><p>为什么：第一条和第四条直接打架（两件易碎的都去上层，又不能同层）；第一、二、三条也凑不齐（玻璃罐要上去，铁砧要下去，可它俩是同一位当户的）。两组冲突里都有第一条。</p>',
  skip() { S.rk = [false, true, true, true, true]; A.rkgo(); } });
const ZEROLINE = Z('被你划掉的那几条，我会从规程里删去。……原来规程是可以改的。'), ZEROLINE1 = Z('「易碎的放上层」听着最像在保护东西，原来最该删。……规程是可以改的。');

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
    r(0, 0, W, H, '#173226'); const x0 = 80, y0 = 8, c = 20; r(x0 - 3, y0 - 3, NW * c + 6, NH * c + 6, 13); r(x0, y0, NW * c, NH * c, 11);
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

/* ⑤ 冷却井 · 温控器：先开面板锁（前任的五条记录），再找出管灯的开关（摸灯泡的温度） */
const KLOG = [['053', 1, 0], ['645', 1, 0], ['938', 0, 0], ['735', 0, 0], ['410', 0, 2]], KANS = '042';
const kfb = (g, s) => { let a = 0, c = 0; for (let i = 0; i < 3; i++) if (g[i] === s[i]) a++; for (const ch of new Set(g)) if (s.includes(ch)) c++; return [a, c - a]; };
const kcode = () => S.kd.join('');
function swObs(k) { return S.sw[k] ? '亮' : S.swh[k] ? '灭·热' : '灭·凉'; }
reg('shaft', { name: '冷却井', parent: 'core',
  desc: () => (!S.f.kOpen ? '温控器的委托：「控制面板锁上了。前任技工试过五次，结果记在旁边的纸上。」密码是三位数，三个数字互不相同。A 表示数字和位置都对的个数，B 表示数字对、位置不对的个数。'
    : S.f.tIn ? '门开着。温控器：「看清楚了就告诉我，是哪一个开关。」'
    : '面板开了。温控器：「里屋有一盏灯，门外三个开关，只有一个管它。门关着看不见灯，门也只能开一次。」你可以随意拨开关、等一会儿，再进门。') + bestTxt('shaft'),
  draw() {
    r(0, 0, W, H, 0); for (let i = 0; i < 5; i++) { r(6 + i * 7, 0, 2, H, 2); r(W - 8 - i * 7, 0, 2, H, 2); }
    if (!S.f.kOpen) {
      // 前任的记录纸
      r(48, 14, 112, 152, PP[1]); r(46, 12, 112, 152, PP[0]); r(46, 12, 112, 3, RD[2]); txt('前任技工的记录', 102, 18, 8, '#3a2a20', 'center');
      KLOG.forEach(([g, a, b], i) => { const y = 38 + i * 22; txt(g.split('').join(' '), 60, y, 10, '#3a2a20', 'left'); txt(a + 'A' + b + 'B', 150, y + 1, 9, '#3a2a20', 'right'); r(56, y + 16, 96, 1, PP[2]); });
      txt('三个数字互不相同', 102, 150, 7, '#6a5a50', 'center', false);
      // 面板锁
      bevel(176, 24, 128, 120, MT, 2); r(182, 30, 116, 108, MT[1]); txt('控制面板', 240, 34, 8, MT[5], 'center');
      S.kd.forEach((d, i) => { const x = 192 + i * 34; r(x, 58, 26, 34, '#07090f'); r(x, 58, 26, 1, MT[3]); txt(String(d), x + 13, 66, 14, YL[3], 'center'); hot(x, 44, 26, 13, 'kd', i + ',1', '加一'); hot(x, 93, 26, 13, 'kd', i + ',-1', '减一'); txt('▲', x + 13, 46, 8, MT[4], 'center', false); txt('▼', x + 13, 95, 8, MT[4], 'center', false); });
      r(196, 116, 88, 4, S.kTry ? RD[2] : MT[2]);
    } else {
      // 门外：三个开关和一扇门
      r(40, 20, 240, 140, MT[1]); r(40, 20, 240, 2, MT[3]);
      [0, 1, 2].forEach(k => { const x = 70 + k * 40; bevel(x, 60, 26, 44, MT, 2); r(x + 9, 66, 8, 32, '#07090f'); const on = S.sw[k]; r(x + 10, on ? 68 : 82, 6, 14, on ? GR[3] : MT[4]); txt(String(k + 1), x + 13, 108, 9, MT[5], 'center'); if (!S.f.tIn) hot(x, 56, 26, 52, 'tsw', k, k + 1 + ' 号开关'); });
      r(212, 44, 52, 96, WD[2]); r(216, 48, 44, 88, S.f.tIn ? '#1a1206' : WD[3]); r(252, 92, 4, 4, BR[3]);
      if (S.f.tIn) { const lit = S.sw[S.tsw]; if (lit) soft(238, 74, 26, [255, 220, 120], .5); circ(238, 74, 7, lit ? YL[4] : '#3a3428'); r(235, 81, 6, 5, MT[3]); if (!lit && S.swh[S.tsw]) { for (let q = 0; q < 3; q++) r(233 + q * 5, 62 - (tick + q * 2) % 6, 1, 3, '#c89060'); } }
      else hot(212, 44, 52, 96, 'tdoor', '', '里屋的门');
      txt(S.f.tIn ? '灯' + (S.sw[S.tsw] ? '亮着' : S.swh[S.tsw] ? '灭着，灯泡还热' : '灭着，灯泡是凉的') : '已经等过 ' + (S.twait || 0) + ' 次', 160, 146, 8, 7, 'center');
    }
  },
  btns: () => !S.f.kOpen ? [['试开', 'kgo']] : S.f.tDone && S.f.tIn ? [['重新接线，再来一次', 'treset']] : S.f.tIn ? [['是 1 号', 'tans', 0], ['是 2 号', 'tans', 1], ['是 3 号', 'tans', 2]] : [['等一会儿', 'twait'], ['进门', 'tdoor']],
  hint: () => !S.f.kOpen ? ['先看两条「0A0B」，它们一下排掉五个数字。剩下的每条记录里，还有几个数字没被排掉？', '053 只剩 0，它在第一位；645 只剩 6 和 4，第一位已经是 0，所以 4 在第二位；410 的两个 B 就是 4 和 0，所以 1 不在。第三位只剩 2：042。']
    : ['灯不只会亮。', '开 1 号，等一会儿，关掉 1 号，再开 2 号，然后进门。亮是 2 号；灭但灯泡热，是 1 号；灭而且凉，是 3 号。'],
  sol: () => '<p><b>面板锁：042。</b>938、735 都是 0A0B，排掉 3、5、7、8、9。053 里只剩 0，又是 1A，所以第一位是 0。645 里只剩 6 和 4，第一位已经是 0，6 不可能在第一位，所以 4 在第二位。410 是 0A2B，两个对的就是 4 和 0，1 不在。第三位只剩 2。</p><p><b>三个开关：</b>开 1 号，等一会儿，关掉 1 号，再开 2 号，然后进门。灯亮是 2 号；灯灭但灯泡热，是 1 号；灯灭而且凉，是 3 号。灯泡不只会亮，还会发热。</p>',
  skip() { S.f.kOpen = 1; S.kd = [0, 4, 2]; sideWin('shaft', 0, '零替你开了面板，也找出了那个开关。', TEMPLINE); } });
const TEMPLINE = { who: '温控器', t: '面板密码是零四二，我最喜欢的温度。至于灯泡……我量了一辈子温度，头一回知道温度还能拿来认开关。' };

function simStep() {
  if (!sim) return;
  if (sim.kind === 'drone') {
    const c = S.pg[sim.i % S.pg.length]; DMAPS.forEach((m, k) => { if (!sim.st[k].done) dStep(m, sim.st[k], c); }); sim.i++;
    if (sim.st.every(s => s.done)) { const n = S.pg.length; sim = null; sideWin('mail', n <= 3 ? 2 : 1, '三架无人机都把信投进了信箱。你的循环里有 ' + n + ' 行。', S.f.py ? { who: '导航副机', t: NAVLINE.t + '……而且是用 Python 写的。' } : NAVLINE); refresh(); save(); }
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
  dk() {
    S.f.dark = 1; say('指尖碰到一个冰凉的开关。你按了下去。'); S.v = 'map'; sfx('click'); save(); say(V.map.desc()); refresh(); introTalk();
  },
  notice() {
    const st = chap() === 4 && S.f.nt1Ask && !S.f.nt1 ? 1 : chap() === 5 && !S.route && S.f.nt2Ask && !S.f.nt2 ? 2 : 0;
    if (st) { S.v = 'board'; sfx('click'); say(V.board.desc()); if (!S.f['nbIn' + st]) { S.f['nbIn' + st] = 1; talk(st === 1 ? ['告示栏顶上蹲着一团小小的影子，正好在摄像头照不到的那个角。是螺丝。', C('大眼睛要早安？那也给我写一句：晚安。我晚上出门前会看一眼。'), C('我的眼睛是蓝镜片，蓝字我看不见。'), '最底下那一行，只有三格。'] : ['告示栏顶上，螺丝又蹲在那个角落里。它已经知道零要贴什么了。', C('「出来登记」？登记了就要被回收。规程我读过。'), C('你替我回它一句：「别找了，我不出来」。'), '还是那一行。这次有十格，两句话，各七个字。']); } return; }
    S.f.ntc = (S.f.ntc || 0) + 1;
    if (S.f.ntc % 3) return say('告示：「本站五舱一枢。当户取物，请集齐时、声、光三枚印章，至机房验印。印章依次领取：先时，再声，后光。」');
    sfx('click'); say('告示的胶带松了，你顺手把它翻了过来。背面有一行很淡的铅笔字：' + (S.f.gate ? '「今天有人来了。」' : '「今天也没有人来。」') + ' 字迹很工整，像是一台机器写的。');
  },
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
  dc(c) { if (sim) return; if (S.pg.some(x => !DCMD[x])) S.pg = []; if (c === '0') S.pg = []; else if (c === '-') S.pg.pop(); else if (S.pg.length < DMAX) S.pg.push(c); else return say('循环里最多写 ' + DMAX + ' 行。'); sfx('click'); },
  pyhelp() { talk(PYCARD); },
  pyswap() { S.f.py = S.f.py ? 0 : 1; sfx('click'); if (S.f.py && !S.f.pyCard) { S.f.pyCard = 1; return talk(PYCARD); } say(S.f.py ? '换成了 Python 写法。程序没变，只是换了一种写法。' : '换回了中文写法。'); },
  dfly() { if (sim) return; if (!S.pg.length) return say('程序还是空的。'); if (!S.pg.includes('F')) return say('程序里一行「前进()」都没有，无人机只会原地打转。'); sim = { kind: 'drone', st: dStart(), i: 0 }; sfx('step'); say('三架无人机同时起飞，照着同一段程序飞。'); },
  rk(i) { rkOK(); S.rk[+i] = !S.rk[+i]; S.arr = null; sfx('click'); },
  rkall() { S.rk = RTXT.map(() => true); S.arr = null; say('五条规程都恢复了。'); },
  rkgo() {
    rkOK(); const n = S.rk.filter(Boolean).length; if (n < 3) { sfx('bad'); return say('零：「规程删得太多，就不叫规程了。至少留三条。」'); }
    const [a] = bestShelf(); if (!a) { S.arr = null; sfx('bad'); return say('零试了六种摆法，每一种都有规程被违反。标红的几条还在互相打架。' + encourage()); }
    S.arr = a; sideWin('store', n >= 4 ? 2 : 1, '零照着你留下的 ' + n + ' 条规程，把四件当物都放上了架子，一条也没有违反。', S.rk[0] ? ZEROLINE : ZEROLINE1);
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
  kd(p) { const [i, d] = p.split(',').map(Number); S.kd[i] = (S.kd[i] + d + 10) % 10; sfx('click'); },
  kgo() {
    const c = kcode(); if (new Set(c).size < 3) return say('面板上贴着一行小字：三个数字互不相同。');
    if (c === KANS) { S.f.kOpen = 1; sfx('win'); S.tsw = Math.floor(Math.random() * 3); S.sw = [0, 0, 0]; S.swh = [0, 0, 0]; S.twait = 0; return talk(['咔哒，面板弹开了。', { who: '温控器', t: '零四二。我最喜欢的温度。' }, { who: '温控器', t: '还有一件事。里屋的灯，我一直不知道是哪个开关管的。门外三个开关，门一开就再也关不上，你只有一次机会。' }]); }
    S.kTry = (S.kTry || 0) + 1; sfx('bad');
    const bad = KLOG.find(([g, a, b]) => { const [x, y] = kfb(g, c); return x !== a || y !== b; }), [x, y] = kfb(bad[0], c);
    say('面板没有反应。如果密码是 ' + c + '，那 ' + bad[0] + ' 应该是 ' + x + 'A' + y + 'B，可记录上写的是 ' + bad[1] + 'A' + bad[2] + 'B。');
  },
  treset() { S.f.tIn = 0; S.f.tDone = 0; S.ttry = 0; S.kTry = 0; S.tsw = Math.floor(Math.random() * 3); S.sw = [0, 0, 0]; S.swh = [0, 0, 0]; S.twait = 0; say('温控器把线路重新接了一遍，开关都拨回去了。'); },
  tsw(k) { if (S.f.tIn) return; S.sw[+k] = S.sw[+k] ? 0 : 1; sfx('click'); },
  twait() { if (S.f.tIn) return; S.twait = (S.twait || 0) + 1; S.swh = S.sw.map(on => on ? 1 : 0); say(S.sw.some(Boolean) ? '你等了一会儿。门缝里什么也看不出来。' : '你等了一会儿。三个开关都关着，灯泡要是热过，这会儿也凉了。'); },
  tdoor() { if (S.f.tIn) return; S.f.tIn = 1; sfx('click'); say('你推开门。' + ({ 亮: '灯亮着。', '灭·热': '灯灭着。你让温控器摸了摸灯泡：还热。', '灭·凉': '灯灭着。你让温控器摸了摸灯泡：凉的。' })[swObs(S.tsw)]); },
  tans(k) {
    k = +k; const seen = swObs(S.tsw), fits = [0, 1, 2].filter(j => swObs(j) === seen);
    if (fits.length > 1) { sfx('bad'); S.ttry = (S.ttry || 0) + 1; S.f.tIn = 0; S.tsw = Math.floor(Math.random() * 3); S.sw = [0, 0, 0]; S.swh = [0, 0, 0]; S.twait = 0;
      return talk([{ who: '温控器', t: '你看到的，' + fits.map(j => j + 1 + ' 号').join('和') + '都说得通。蒙对了也不算数。' }, { who: '温控器', t: '我把线路重新接了一遍，开关都拨回去了。再来一次，进门之前想清楚。' }]); }
    if (k !== S.tsw) { sfx('bad'); return say('温控器：「再想想你看到的：' + seen.replace('·', '，') + '。」'); }
    S.f.tDone = 1; sideWin('shaft', (S.ttry || 0) + (S.kTry || 0) === 0 ? 2 : 1, '是 ' + (k + 1) + ' 号。温控器把它记在了面板背面。', TEMPLINE);
  },
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
  vent: '通风管：码头→当铺→温室→观星台→机房→后舱→码头，连成一圈。螺丝每分钟跑一格，方向不变。滴水声：码头、温室；咔哒声：当铺、观星台；嗡嗡声：机房、后舱。',
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
const NDONE = { vent: () => S.f.pass, dock: () => S.f.gate, scale: () => S.f.scale, clock: () => S.f.seal_t, glass: () => S.f.seal_t, locker: () => S.f.locker, chart: () => S.f.locker, tele: () => S.f.seal_l, console: () => S.f.seal_l,
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
  $('bNote').hidden = !S.notes.length; $('inv').hidden = !S.inv.length && !S.f.hadItem;
  if (S.v === 'radio' && S.chan != null) startMorse(); else stopMorse(); alarm();
  draw();
  $('goal').textContent = '下一步：' + goalPlace(); $('goal').hidden = !$('title').hidden || S.v === 'dark';
  $('where').textContent = v.name; $('back').hidden = !v.parent;
  $('labs').innerHTML = S.v === 'map' ? [['码头', 61, 111], ['当铺', 128, 57], ['温室', 205, 59], [S.f.power ? '观星台' : '？？？', 270, 113], [S.f.seal_t || S.f.power ? '机房' : '？？？', 193, 167], [S.f.gate ? '后舱' : '？？？', 125, 167]].map(([t, x, y]) => `<span class="lab" style="left:${x / 3.2}%;top:${y / 1.8}%">${t}</span>`).join('') : '';
  $('stars').classList.toggle('grab', canDrag()); $('stars').textContent = (S.stars.length ? '✦'.repeat(S.stars.length) : '') + (S.shard.length ? '　◆' + S.shard.length : ''); if ($('title').hidden) autoNotes();
  $('inv').innerHTML = S.inv.map(id => `<button type="button" class="slot${S.sel === id ? ' sel' : ''}" data-id="${id}" aria-pressed="${S.sel === id}"><img src="${iconURL[id]}" alt="">${ITEMS[id][0]}</button>`).join('');
  $('pb').innerHTML = (v.btns ? v.btns() : []).map(([t, a, p]) => `<button type="button" data-a="${a}" data-p="${p === undefined ? '' : p}">${t}</button>`).join('');
  const solved = { scale: S.f.scale, clock: S.f.seal_t, locker: S.f.locker, console: S.f.seal_l, tiles: S.f.power, vault: S.f.seal_s, radio: S.f.seal_s, inner: S.f.pass, rule: S.f.pass, crate: S.f.pass, vent: S.f.pass, archive: S.f.pass, mail: S.shard.includes('mail'), rules: S.shard.includes('store'), nursery: S.shard.includes('nursery'), bunk: S.shard.includes('bunk'), shaft: S.shard.includes('shaft') }[S.v];
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
cv.addEventListener('mousemove', e => { const b = cv.getBoundingClientRect(); mx = (e.clientX - b.left) * W / b.width; my = (e.clientY - b.top) * H / b.height; const h = dOn ? null : at(e); cv.style.cursor = S.v === 'dark' ? 'none' : h && !h.hide ? HAND : 'default'; if (S.v === 'dark') draw(); $('tip').hidden = !(h && h.tip); if (h && h.tip) $('tip').textContent = h.tip; });
cv.addEventListener('mouseleave', () => { mx = my = -1; $('tip').hidden = true; if (S.v === 'dark') draw(); });
$('inv').addEventListener('click', e => { const el = e.target.closest('[data-id]'); if (el && !dOn) invClick(el.dataset.id); });
$('pb').addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (el) act(el.dataset.a, el.dataset.p); });
$('back').onclick = () => { if (dOn) return; const p = V[S.v].parent; if (p) act('go', p); };
const SECT = ['map', 'dock', 'shop', 'green', 'obs', 'core', 'back'];
const special = () => S.v === 'obs' && S.f.seal_l && !S.stars.includes(2);
$('bHint').onclick = () => { if (dOn) return; const v = V[S.v], useG = SECT.includes(S.v) && !special(), hk = useG ? 'g:' + goal()[0] : S.v, g = goal(), t = useG ? [g[0], g[2] || g[0]] : v.hint ? v.hint() : ['四处点点看。'], n = S.hints[hk] || 0; say('提示：' + t[Math.min(n, t.length - 1)] + (v.skip && !S.assist && n === 0 ? '（在这个画面再点一次提示，就会出现「跳过这一步」' + (v.sol ? '和「看解答」' : '') + '。）' : '')); S.hints[hk] = n + 1; if (S.v === 'obs' && !useG && n >= 1) S.f.ttl = 1; refresh(); save(); };
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
  l1: ['执笔', '你把档案夹在腋下走出后舱。身后，螺丝和零还在为登记卡上的字好不好看争个不停，没有人叫你回去评理。最好的尊重，大概就是把笔还给每一个人，再好好写自己的那一页。新的一岁，由你执笔。'],
  l2: ['留白', '你在档案最后夹了一页白纸，写上明年的今天。零问那一页要记什么。你说，还不知道，所以才要留着。零想了想：「那就留着。我们也是。」不替别人写，也不急着写完自己。来日方长。']
};
const FINAL = {
  z: [Z('登记卡我做好了。可是「职务」这一栏，我不知道该给螺丝填什么。你来定吧。'), { who: '零', t: '填什么？', ch: [{ t: '「站长助理。」', f: () => { S.end = 'z1'; } }, { t: '「不填职务。备注里写：家人。」', f: () => { S.end = 'z2'; } }] }],
  c: [Z('{name}，有件事我该告诉你。温室的摄像头是黑的，可热感应器一直看得见：一个巴掌大的热源，每晚都在灯底下打盹。'), Z('规程要我立刻上报。我没有删那一条，只是把它的执行时间改成了四个字：来日方长。'), C('……大眼睛，你早说啊。'), C('你要走了。'), { who: '螺丝', t: '那我呢？', ch: [{ t: '「跟我走。」', f: () => { S.end = 'c1'; } }, { t: '「留下来，替我陪着零。它一个人太久了。」', f: () => { S.end = 'c2'; } }] }],
  l: [Z('{name}，猫的事，你没有交给我，也没有瞒我。'), '你回头看了一眼。螺丝蹲在主机的顶上，零的摄像头正对着它。谁也没有躲谁。', Z('你没替我们决定。所以我只好自己去见它。'), C('大眼睛问我要不要登记。我说，我自己来填。'), Z('它在「职务」那一栏写了三个字：修灯的。……字很丑。我没改。'), Z('事故记录的处理意见，我们俩也商量着填好了：清洁臂记一次表扬。'), Z('你把笔留给了我们，我们自己把那一页写完了。现在，轮到你的了。'), '你手里的档案袋沉甸甸的。前面几页是站里替你记的，后面全是空白。', { t: '新的一岁，怎么写？', ch: [{ t: '带走它，回去一页一页自己写。', f: () => { S.end = 'l1'; } }, { t: '先留一页空白在这里，明年再来写。', f: () => { S.end = 'l2'; } }] }]
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
  slides.push({ art: () => { st(); fw(9, 29); fw(6, 71); r(0, 84, 160, 6, 1); cake(56); }, t: (ME ? callName() + '，' : '') + '祝你一切都好！', sub: '“王”携　零 · 螺丝 · 清洁臂 · 导航副机 · 温控器' + (ME && ME.from ? ' · ' + ME.from : '') + '　敬上', big: true });
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
  h += `<div class="memo"><h3>写在最后</h3><p>借 AI 创作之力一用，想了一点小点子，合成了这个小游戏，愿它能带给你们一些小乐趣，也希望以后的生活里，不乏这样的小确幸。</p><p>感谢你的参与。游戏内容也许有些无聊冗杂，但我的心意不变。这也是我在 20 岁之前的一次尝试。</p><p class="sig">我们来日方长${ME ? '，' + esc(callName()) : ''}。<br>—— 王</p></div>`;
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
  const nm = s => s.replace('{name}', ME ? callName() : '你');
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
  $('title').hidden = true; audio(); if (!S.f.intro && !S.f.dark) { S.v = 'dark'; S.dkT = tick; } say(V[S.v].desc()); refresh();
  if (!S.f.intro && S.f.dark) introTalk();
}
function introTalk() {
  { S.f.intro = 1; save(); talk(['对接舱的灯亮了，只亮了一半。窗外，你的小艇刚靠上码头。', Z('……有人……来了？'), Z('欢迎来到零号站，{name}。我是这里的管理员，他们叫我「零」。'), Z('站里的主电断了，我说话可能断断续续。'), Z('……不是坏了。是有人切断的。是谁、为什么，我想不起来了。'), Z('不过站规第一条：当户的东西，一样不能少。你要取的东西还在。'), Z('集齐时、声、光三枚印章，后舱的门就会为你打开。'), Z('下一步该去哪，画面下方会写着；具体怎么做，点「提示」问我。'), Z('先从温室开始吧。那里的玻璃上，映着一座钟。'), Z('对了，当铺柜台下面有一只写着你名字的保管箱。有空可以去看看。'),].concat(S.assist ? [Z('还有，你这次是「陪同模式」。意思是：每道谜题的右上角都有一个「请零代劳」，点一下，我就替你解开。'), Z('故事和选择还是你自己的。想自己解也完全可以，不点那个按钮就行；想关掉，去右上角的菜单。')] : []).concat([ Z('还有，每个舱段的地板上都有一个舱口，下面各有一间小屋。不去也能离站，去了会有别的收获。'), '（看到线索的时候，右上角会多出一本「笔记」，替你记下来。）',]).concat([ '（点地图上的舱段进入。右上角有提示，卡住了不丢人。）']), () => { if (!S.f.svTip) { S.f.svTip = 1; save(); svOpen('first'); } }); }
}
async function enter(direct, reset) {
  const code = $('code').value, nm = $('pname').value, any = norm(code) || normName(nm);
  if (any && !(norm(code) && normName(nm))) { $('tmsg').textContent = '全名和口令要一起填。都不填的话，就以访客身份进站。'; return; }
  $('tmsg').textContent = any ? '正在核对……' : '';
  const m = await unlock(nm, code);
  if (any && !m) { $('tmsg').textContent = '站里没有这个名字和口令对应的当票。检查一下有没有打错字，或者都清空后以访客身份进站。'; return; }
  if (direct && !m) { $('tmsg').textContent = '要先填上你的全名和口令，才能找到给你的话。'; return; }
  const sl = slotOf(nm, code); if (sl !== curSlot) { curSlot = sl; S = load(sl); }
  if (reset) S = fresh();
  ME = m; S.code = norm(code); S.name = nm.trim(); S.assist = $('assist').checked || (S.assist === undefined && !!(m && m.easy)); save(); $('tmsg').textContent = '';
  if (direct) { $('title').hidden = true; audio(); runSlides(() => runCG(() => showEnd(true))); } else startGame();
}
$('bGo').onclick = () => enter(false);
$('bBless').onclick = () => enter(true);
$('bNew').onclick = () => { const b = $('bNew'); if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = '确定清空这个名字的进度？再点一次'; return; } delete b.dataset.sure; b.textContent = '从头开始'; enter(false, true); };
function peekTitle() { const o = readSlot(slotOf($('pname').value, $('code').value)), has = !!(o && (o.inv.length || Object.keys(o.f).length || o.stars.length)); $('bGo').textContent = has ? '继续' : '进站'; $('bNew').hidden = !has; delete $('bNew').dataset.sure; $('bNew').textContent = '从头开始'; }
$('pname').addEventListener('input', peekTitle); $('code').addEventListener('input', peekTitle);
/* ================= 存档码 ================= */
const SVTAG = 'ZS1';
const ck4 = t => { let h = 0x811c9dc5; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } h ^= 0x5a17; return (h >>> 0).toString(36).slice(-4).padStart(4, '0'); };
async function zip(str, inv) {
  const fmt = 'deflate-raw', bytes = inv ? Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)) : new TextEncoder().encode(str);
  const out = await new Response(new Blob([bytes]).stream().pipeThrough(inv ? new DecompressionStream(fmt) : new CompressionStream(fmt))).arrayBuffer();
  if (inv) return new TextDecoder().decode(out);
  let bin = ''; new Uint8Array(out).forEach(b => { bin += String.fromCharCode(b); }); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function exportCode() { const o = Object.assign({}, JSON.parse(JSON.stringify(S)), { slot: curSlot }); delete o.code; const body = await zip(JSON.stringify(o)); return SVTAG + '.' + body + '.' + ck4(body); }
async function importCode(txt) {
  const m = String(txt || '').replace(/\s+/g, '').match(/^ZS1\.([A-Za-z0-9_-]+)\.([0-9a-z]{4})$/);
  if (!m || ck4(m[1]) !== m[2]) return null;
  try { const o = JSON.parse(await zip(m[1], true)); return okSave(o) ? o : null; } catch (e) { return null; }
}
function svOpen(mode) {   // first：开场后的单独提示；all：右下角常驻按钮（导出 + 读取）
  const has = !!started(), first = mode === 'first';
  $('svFirst').hidden = !first; $('svOut').hidden = !has; $('svIn').hidden = first; $('svmsg').textContent = '';
  $('svTitle').textContent = first ? '先说一件重要的事：存档' : '存档码';
  $('svOutT').textContent = first ? '' : '这是' + (S.name ? '「' + S.name + '」' : '访客') + '现在的存档码。换电脑、换浏览器之前，复制下来存好：';
  $('svInT').textContent = has ? '换了浏览器？把之前复制的存档码粘贴到下面（会替换上面这份进度）：' : '这个浏览器里还没有进度。换了浏览器的话，把之前复制的存档码粘贴到下面，就能接着玩：';
  $('svClose').textContent = first ? '知道了，开始吧' : '关闭'; $('save').hidden = false;
  if (has) { $('svcode').value = '生成中……'; exportCode().then(c => { $('svcode').value = c; }).catch(() => { $('svcode').value = ''; $('svmsg').textContent = '这个浏览器生成不了存档码，换个新一点的浏览器试试。'; }); }
  if (!first) $('svin').value = '';
}
$('bSave').onclick = () => { if (!dOn || !$('title').hidden) svOpen('all'); };
$('svClose').onclick = () => { $('save').hidden = true; };
$('svCopy').onclick = async () => { const t = $('svcode').value; try { await navigator.clipboard.writeText(t); $('svmsg').textContent = '已复制。找个地方存好，比如发给自己。'; } catch (e) { $('svcode').select(); $('svmsg').textContent = '没能自动复制，存档码已经选中了，按 Ctrl+C 复制。'; } };
$('svLoad').onclick = async () => {
  const o = await importCode($('svin').value);
  if (!o) { $('svmsg').textContent = '这串存档码不完整，或者被改动过。重新完整复制一遍再试试。'; return; }
  const sl = o.slot || slotOf(o.name, ''); delete o.slot; curSlot = sl; S = Object.assign(fresh(), o); save();
  $('save').hidden = true; showTitle(); $('pname').value = S.name || ''; $('code').value = '';
  $('bGo').textContent = '继续'; $('bNew').hidden = true;
  $('tmsg').textContent = S.name ? '存档已导入。为了安全，存档码里不带口令：填上你的口令，再点「继续」。' : '存档已导入。点「继续」接着玩。';
  (S.name ? $('code') : $('bGo')).focus();
};
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
window.__G = { get sim() { return sim; }, get tick() { return tick; }, renderCGAudio, runCG, endCG, get cgOn() { return cgOn; }, set cgT(v) { cgT0 = performance.now() - v * 1000; fwSeen = {}; }, photoImg, get ME() { return ME; }, get S() { return S; }, get shuf() { return shuf; }, get hots() { return hots; }, get dOn() { return dOn; }, flow, TS, LOCK_CODE, PEG_OK, unlock, route, V, refresh, ventCands };
})();
