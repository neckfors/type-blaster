// Game logic and canvas rendering. UI text comes in through ev.t() so it stays translatable.
import { sfx } from './audio.js';
import { FX } from './fx.js';
import * as ms from './mathstats.js';

const params = new URLSearchParams(location.search);
export const MINUTE = Number(params.get('minute')) || 60; // seconds per round (?minute=10 for testing)
export const MAX_LIVES = 5;
const MONSTERS = ['👾', '🛸', '👹', '👻', '🤖', '🐙', '👽', '🦑'];
const COLORS = ['#ff5ea8', '#5ef0ff', '#ffd35e', '#9d7bff', '#6bff9e', '#ff8a5e'];
const FONT = '"Trebuchet MS","Segoe UI",system-ui,sans-serif';
const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

const fx = new FX();
let canvas, ctx, words, ev = {};
let W = 0, H = 0, S = 1, dpr = 1, clock = 0, lastTs = 0;
let opts = { speed: 1, accents: false, mode: 'words' };
const stat = () => ({ keys: 0, ok: 0, words: 0, best: 0, cw: 0 });
const fresh = () => ({
  mode: opts.mode, running: false, paused: false, lives: MAX_LIVES, score: 0, combo: 0, bestCombo: 0,
  time: 0, minute: 1, minTime: 0, enemies: [], target: null, spawnT: 0.4, spawned: 0, grace: 0, cps: 1.6, lastKill: 0, clockOn: false, typeTime: 0,
  aim: 0, recoil: 0, recent: [], m: stat(), t: stat(),
});
let G = fresh();

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = a => a[Math.floor(Math.random() * a.length)];
const k = ch => (opts.accents ? ch.normalize('NFD').replace(/[̀-ͯ]/g, '') : ch);
const cannonY = () => H - 28 * S;
const lineY = () => cannonY() - 82 * S;
const labelFont = () => `700 ${Math.round(26 * S)}px ${FONT}`;

export function init(canvasEl, wordData, events) {
  canvas = canvasEl; ctx = canvas.getContext('2d'); words = wordData; ev = events;
  resize();
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
  requestAnimationFrame(frame);
}
export const configure = o => { opts = { ...opts, ...o }; };
export const getState = () => G;

function resize() {
  const vv = window.visualViewport;
  W = vv ? vv.width : innerWidth; H = vv ? vv.height : innerHeight;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  S = clamp(Math.min(W, H) / 700, 0.75, 1.4);
  fx.initStars(W, H);
}

export function start() {
  G = fresh(); G.running = true; G.grace = 1.2; sfx.go(); ev.hud?.(G);
}
export function pause() { if (G.running && !G.paused) { G.paused = true; return true; } return false; }
export function resume() {
  for (const e of G.enemies) if (e.typed) { e.typed = 0; e.bad = false; e.badCh = ''; } // start the locked word fresh after a pause or level end
  G.paused = false; G.grace = 1.2; G.clockOn = false; sfx.go(); }
export function quit() { G.running = false; G.paused = false; G.enemies = []; G.target = null; }
export function unlock() {
  // Backspace removes a wrong (red) character, otherwise the last correct one
  const e = G.target; if (!e) return;
  if (e.bad) { e.bad = false; e.badCh = ''; } else if (e.typed > 0) e.typed--;
}

// ---------- words & spawning ----------
function pool() {
  const { easy, medium, hard } = words, m = G.minute;
  if (m <= 1) return easy;
  if (m === 2) return [...easy, ...medium, ...medium];
  if (m === 3) return [...easy, ...medium, ...medium, ...hard];
  return [...medium, ...hard, ...hard];
}

function pickWord() {
  const onScreen = new Set(G.enemies.map(e => e.word));
  const c = pool().filter(w => !onScreen.has(w) && !G.recent.includes(w));
  if (!c.length) return null;
  const w = rand(c);
  G.recent.push(w); if (G.recent.length > 20) G.recent.shift();
  return w;
}

function pickMath() {
  const onScreen = new Set(G.enemies.map(e => e.word));
  let c = ms.FACTS.filter(([a, b]) => !G.recent.includes(a + 'x' + b) && !onScreen.has(a + '×' + b) && !onScreen.has(b + '×' + a));
  if (!c.length) c = ms.FACTS;
  let n = Math.random() * c.reduce((t, [a, b]) => t + ms.weight(a, b), 0), f = c[c.length - 1];
  for (const x of c) { n -= ms.weight(x[0], x[1]); if (n <= 0) { f = x; break; } }
  G.recent.push(f[0] + 'x' + f[1]); if (G.recent.length > 6) G.recent.shift();
  return Math.random() < 0.5 ? f : [f[1], f[0]];
}

function spawn() {
  let word, extra = {}, label;
  if (G.mode === 'math') {
    const [a, b] = pickMath();
    word = a + '×' + b; label = `${a} × ${b} = 00`;
    extra = { a, b, ans: String(a * b), failed: false, badCh: '' };
  } else {
    word = pickWord();
    if (!word) { G.spawnT = 0.3; return; }
  }
  ctx.font = labelFont();
  const tw = ctx.measureText(label || word).width, w = tw + 28 * S;
  const amp = 10 * S, band = Math.min(W, 420 * S + 40), mid = W / 2; // keep monsters near the middle
  const lo = Math.max(w / 2 + amp + 10, mid - band / 2 + w / 2), hi = Math.min(W - w / 2 - amp - 10, mid + band / 2 - w / 2);
  let bx = W / 2, bd = -1;
  for (let i = 0; i < 8; i++) { // pick the spot furthest from the monsters near the top
    const x = lo + Math.random() * Math.max(1, hi - lo);
    let d = 1e9;
    for (const o of G.enemies) if (o.y < H * 0.35) d = Math.min(d, Math.abs(o.baseX - x));
    if (d > bd) { bd = d; bx = x; }
  }
  G.enemies.push({ word, typed: 0, tw, w, x: bx, baseX: bx, y: H * 0.09, age: 0, phase: Math.random() * 6.28, amp, emoji: rand(MONSTERS), color: rand(COLORS), shake: 0, bad: false, ...extra });
  G.spawned++; G.spawnT = spawnGap() * (0.85 + Math.random() * 0.3) * (G.spawned <= 4 ? 0.45 : 1.15); // quick start, then a calmer stream
}

// Pace follows the player: ~5 wpm and ~100 wpm both get a steady stream of targets.
// G.cps is a moving average of characters killed per second.
const MIN_ON = 4;
const maxOnScreen = () => clamp(Math.round(4 + G.cps * 0.5), 4, 7);
const topClear = () => G.enemies.every(o => o.y > H * 0.09 + 95 * S); // room for a new word at the top
function spawnGap() {
  const load = 0.8 * Math.pow(1.1, G.minute - 1) * opts.speed; // each minute asks a bit more
  return clamp(5 / (G.cps * load), 0.5, 4);
}

// ---------- input ----------
export function handleChar(raw) {
  if (!G.running || G.paused || G.grace > 0) return;
  const ch = raw.toLowerCase();
  if (ch.length > 2) return;
  if (G.mode === 'math') return ch.trim() ? handleMath(ch) : undefined;
  if (!ch.trim()) { // SPACE fires the shot once the whole word is typed, like the space in a typing test
    const t = G.target;
    if (t && !t.bad && t.typed >= t.word.length) { G.clockOn = true; G.m.keys++; G.t.keys++; kill(t); }
    return;
  }
  if (G.target?.bad) return; // one wrong letter blocks everything until Backspace
  G.clockOn = true; // the minute clock starts with the first typed letter
  G.m.keys++; G.t.keys++;
  const e = G.target; // always the closest word (autolock)
  if (!e || e.typed >= e.word.length) return; // word complete: only SPACE does anything
  if (k(e.word[e.typed]) !== k(ch)) { // wrong key: the next letter turns red until Backspace
    sfx.wrong(); e.shake = 0.3; e.bad = true; G.combo = 0; ev.hud?.(G); return;
  }
  e.typed++; G.m.ok++; G.t.ok++;
  sfx.key(Math.min(e.typed, 10));
  fx.burst(e.x, e.y + 40 * S, '#6bff9e', 5, 140);
  if (e.typed >= e.word.length) { sfx.combo(); fx.ring(e.x, e.y, '#6bff9e', 70 * S); } // ready: press SPACE
}

function handleMath(ch) {
  const e = G.target;
  if (!/^[0-9]$/.test(ch) || !e || e.bad) return; // one wrong digit blocks input until Backspace
  G.clockOn = true; G.m.keys++; G.t.keys++;
  if (e.ans[e.typed] !== ch) {
    sfx.wrong(); e.shake = 0.3; e.bad = true; e.badCh = ch; G.combo = 0;
    if (!e.failed) { e.failed = true; ms.record(e.a, e.b, false); }
    ev.hud?.(G); return;
  }
  e.typed++; G.m.ok++; G.t.ok++;
  sfx.key(Math.min(e.typed, 10));
  fx.burst(e.x, e.y + 40 * S, '#6bff9e', 5, 140);
  if (e.typed >= e.ans.length) kill(e);
}

function kill(e) {
  if (e.ans && !e.failed) ms.record(e.a, e.b, true);
  const tip = cannonTip();
  fx.laser(tip.x, tip.y, e.x, e.y); G.recoil = 1;
  sfx.shoot(); sfx.boom();
  const len = e.ans ? 4 : e.word.length; // a solved problem counts like a 4-letter word
  G.cps = clamp(0.6 * G.cps + 0.4 * (len + 1) / clamp(G.time - G.lastKill, 0.25, 12), 0.4, 12); G.lastKill = G.time;
  fx.burst(e.x, e.y, e.color, 36, 330); fx.burst(e.x, e.y, '#ffffff', 14, 210);
  fx.ring(e.x, e.y, e.color, 110 * S + len * 6);
  fx.shake = Math.max(fx.shake, 5 + len);
  G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.m.best = Math.max(G.m.best, G.combo);
  G.m.words++; G.t.words++; if (!e.ans) { G.m.cw += len + 1; G.t.cw += len + 1; } // 10fastfingers: only finished words count, letters plus their space
  const pts = Math.round(len * 10 * (1 + Math.min(G.combo, 20) * 0.1));
  G.score += pts;
  fx.text(e.x, e.y - 30 * S, '+' + pts, '#ffe066', 28 * S);
  G.enemies = G.enemies.filter(o => o !== e); G.target = null;
  if (G.combo % 5 === 0) {
    fx.text(W / 2, H * 0.32, ev.t('combo', { n: G.combo }), '#5ef0ff', 46 * S);
    sfx.combo();
    if (G.combo % 10 === 0 && G.lives < MAX_LIVES) {
      G.lives++; sfx.life();
      fx.text(W / 2, H * 0.32 + 52 * S, ev.t('extraLife'), '#ff5ea8', 32 * S);
    }
  }
  ev.hud?.(G);
}

function hit(e) {
  if (e.ans && !e.failed) ms.record(e.a, e.b, false);
  G.lives--; G.combo = 0;
  fx.burst(e.x, lineY(), '#ff4d6d', 40, 300); fx.ring(e.x, lineY(), '#ff4d6d', 150);
  fx.shake = 14; fx.flash = 1; sfx.hit();
  G.enemies = G.enemies.filter(o => o !== e);
  if (G.target === e) G.target = null;
  ev.hud?.(G);
  if (G.lives <= 0) gameOver();
}

function endMinute() {
  const m = G.m, mins = MINUTE / 60;
  const s = { mode: G.mode, minute: G.minute, wpm: Math.round(m.cw / 5 / mins), accuracy: m.keys ? Math.round(m.ok / m.keys * 100) : 100, words: m.words, bestCombo: m.best };
  G.paused = true; G.minute++; G.minTime = 0; G.m = stat(); G.m.best = G.combo;
  ev.minuteDone(s); ev.hud?.(G);
}

function gameOver() {
  G.running = false; sfx.over();
  const mins = G.typeTime / 60;
  ev.over({ mode: G.mode, score: G.score, wpm: mins > 0.08 ? Math.round(G.t.cw / 5 / mins) : 0, words: G.t.words, bestCombo: G.bestCombo, minutes: G.minute - 1 });
}

// ---------- update ----------
function update(dt) {
  clock += dt; fx.update(dt);
  G.recoil = Math.max(0, G.recoil - dt * 6);
  const cx = W / 2, cy = cannonY();
  const want = G.target ? clamp(Math.atan2(G.target.x - cx, cy - G.target.y), -1.2, 1.2) : 0;
  G.aim += (want - G.aim) * Math.min(1, dt * 14);
  for (const e of G.enemies) e.shake = Math.max(0, e.shake - dt);
  if (!G.running || G.paused) return;
  if (!G.target && G.enemies.length) G.target = G.enemies.reduce((a, b) => (b.y > a.y ? b : a)); // autolock the closest (lowest) monster; the others can't be typed until it is gone
  if (G.grace > 0) { G.grace -= dt; return; }
  G.time += dt;
  if (G.clockOn) { G.minTime += dt; G.typeTime += dt; }
  const v = (lineY() + 40 * S) * 0.048 * Math.pow(1.1, G.minute - 1) * opts.speed; // ~21s top to bottom at start
  for (const e of G.enemies) { e.age += dt; e.y += v * dt; e.x = e.baseX + Math.sin(e.age * 1.6 + e.phase) * e.amp; }
  for (const e of [...G.enemies]) if (G.running && e.y >= lineY()) hit(e);
  if (!G.running) return;
  G.spawnT -= dt;
  if (G.enemies.length < MIN_ON && G.spawnT > 0.12) G.spawnT = 0.12; // always something to shoot at
  if (G.spawnT <= 0 && G.enemies.length < maxOnScreen() && topClear()) spawn();
  if (G.minTime >= MINUTE) endMinute();
}

// ---------- drawing ----------
function cannonTip() {
  const L = (56 - G.recoil * 8) * S;
  return { x: W / 2 + Math.sin(G.aim) * L, y: cannonY() - Math.cos(G.aim) * L };
}

const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
const easeOutBack = x => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);

function drawGround() {
  const ly = lineY();
  const g = ctx.createLinearGradient(0, ly, 0, H);
  g.addColorStop(0, 'rgba(94,240,255,0)'); g.addColorStop(1, 'rgba(94,240,255,.2)');
  ctx.fillStyle = g; ctx.fillRect(0, ly, W, H - ly);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,94,168,.6)'; ctx.lineWidth = 2; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -clock * 30;
  ctx.shadowColor = '#ff5ea8'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
  ctx.restore();
}

function drawCannon() {
  const cx = W / 2, cy = cannonY();
  ctx.save(); ctx.translate(cx, cy);
  ctx.save(); ctx.rotate(G.aim);
  const bg = ctx.createLinearGradient(-10 * S, 0, 10 * S, 0);
  bg.addColorStop(0, '#2b8aa0'); bg.addColorStop(0.5, '#8ff6ff'); bg.addColorStop(1, '#2b8aa0');
  ctx.fillStyle = bg; ctx.shadowColor = '#5ef0ff'; ctx.shadowBlur = 14;
  rr(-9 * S, (-52 + G.recoil * 8) * S, 18 * S, 52 * S, 5 * S); ctx.fill();
  ctx.fillStyle = '#ff5ea8'; ctx.shadowBlur = 0;
  rr(-11 * S, (-56 + G.recoil * 8) * S, 22 * S, 8 * S, 3 * S); ctx.fill();
  ctx.restore();
  const dg = ctx.createRadialGradient(0, -8 * S, 4, 0, 0, 38 * S);
  dg.addColorStop(0, '#9ffaff'); dg.addColorStop(1, '#1d6a86');
  ctx.fillStyle = dg; ctx.shadowColor = '#5ef0ff'; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(0, 0, 34 * S, Math.PI, 0); ctx.fill();
  ctx.restore();
  if (G.recoil > 0.5) { // muzzle flash
    const t = cannonTip(), r = 34 * S * G.recoil;
    const rg = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, r);
    rg.addColorStop(0, 'rgba(255,255,255,.95)'); rg.addColorStop(1, 'rgba(94,240,255,0)');
    ctx.fillStyle = rg; ctx.fillRect(t.x - r, t.y - r, r * 2, r * 2);
  }
}

function drawEnemy(e) {
  ctx.save(); ctx.globalAlpha = G.target && G.target !== e ? 0.5 : 1; // dim everything except the locked monster
  drawEnemy0(e);
  ctx.restore();
}

function drawAimLine() {
  const e = G.target; if (!e || G.paused) return;
  const t = cannonTip();
  ctx.save(); ctx.strokeStyle = 'rgba(94,240,255,.55)'; ctx.lineWidth = 2; ctx.setLineDash([4, 10]); ctx.lineDashOffset = -clock * 60;
  ctx.shadowColor = '#5ef0ff'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(e.x, e.y); ctx.stroke(); ctx.restore();
}

function drawEnemy0(e) {
  const sz = 54 * S * (G.target === e ? 1.15 : 1), sc = easeOutBack(Math.min(1, e.age / 0.35));
  const isT = G.target === e, danger = e.y > lineY() - 150 * S;
  ctx.save(); ctx.translate(e.x, e.y); ctx.scale(sc, sc); ctx.rotate(Math.sin(e.age * 2 + e.phase) * 0.12);
  ctx.shadowColor = e.color; ctx.shadowBlur = 24;
  ctx.font = `${sz}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(e.emoji, 0, 0);
  ctx.restore();
  if (isT) {
    ctx.save(); ctx.strokeStyle = '#5ef0ff'; ctx.lineWidth = 4; ctx.setLineDash([9, 9]); ctx.lineDashOffset = -clock * 50;
    ctx.shadowColor = '#5ef0ff'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(e.x, e.y, sz * 0.78 + Math.sin(clock * 8) * 2 * S, 0, 6.283); ctx.stroke(); ctx.restore();
  }
  const fs = Math.round(26 * S), lh = fs + 16 * S;
  const lx = e.x + Math.sin(clock * 70) * 5 * (e.shake / 0.3), ly = e.y + sz * 0.58;
  ctx.font = labelFont();
  ctx.fillStyle = 'rgba(8,12,36,.82)';
  rr(lx - e.w / 2, ly, e.w, lh, lh / 2); ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = isT ? '#5ef0ff' : danger ? `rgba(255,77,109,${0.6 + 0.4 * Math.sin(clock * 10)})` : 'rgba(255,255,255,.35)';
  ctx.stroke();
  if (isT) { // arrows beside the locked label
    const ah = 7 * S, pulse = Math.sin(clock * 8) * 3 * S, my = ly + lh / 2, L = lx - e.w / 2, R = lx + e.w / 2;
    ctx.fillStyle = '#5ef0ff';
    ctx.beginPath(); ctx.moveTo(L - 8 * S + pulse, my - ah); ctx.lineTo(L - 8 * S + pulse, my + ah); ctx.lineTo(L + 2 * S + pulse, my); ctx.fill();
    ctx.beginPath(); ctx.moveTo(R + 8 * S - pulse, my - ah); ctx.lineTo(R + 8 * S - pulse, my + ah); ctx.lineTo(R - 2 * S - pulse, my); ctx.fill();
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const x0 = lx - e.tw / 2, ty = ly + lh / 2 + 1, done = e.word.slice(0, e.typed);
  if (e.ans) { // multiplication: question in white, typed digits green, a wrong digit red
    const q = `${e.a} × ${e.b} = `;
    ctx.fillStyle = '#ffffff'; ctx.fillText(q, x0, ty);
    let x = x0 + ctx.measureText(q).width; const d = e.ans.slice(0, e.typed);
    ctx.fillStyle = '#6bff9e'; ctx.fillText(d, x, ty); x += ctx.measureText(d).width;
    if (e.bad) { ctx.fillStyle = '#ff4d6d'; ctx.fillText(e.badCh, x, ty); }
    else if (e.typed < e.ans.length) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillText('?', x, ty); }
    return;
  }
  const dw = ctx.measureText(done).width;
  ctx.fillStyle = '#6bff9e'; ctx.fillText(done, x0, ty);
  const rest = e.word.slice(e.typed);
  if (e.bad) {
    ctx.fillStyle = '#ff4d6d'; ctx.fillText(rest[0], x0 + dw, ty);
    ctx.fillStyle = '#ffffff'; ctx.fillText(rest.slice(1), x0 + dw + ctx.measureText(rest[0]).width, ty);
  } else { ctx.fillStyle = '#ffffff'; ctx.fillText(rest, x0 + dw, ty); }
  if (isT && !rest && !e.bad) { // word complete: show that SPACE shoots
    ctx.save(); const p = 0.75 + Math.sin(clock * 10) * 0.25;
    ctx.font = `bold ${Math.round(22 * S)}px system-ui, sans-serif`; ctx.textAlign = 'center';
    const msg = ev.t('pressSpace'), mw = ctx.measureText(msg).width + 28 * S, my = ly + lh + 20 * S;
    ctx.globalAlpha = p; ctx.fillStyle = '#6bff9e'; rr(lx - mw / 2, my - 15 * S, mw, 30 * S, 15 * S); ctx.fill();
    ctx.fillStyle = '#06210f'; ctx.fillText(msg, lx, my + 1); ctx.restore();
  }
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fx.drawBg(ctx, W, H, clock);
  ctx.save();
  if (fx.shake > 0) ctx.translate((Math.random() - 0.5) * fx.shake * 2, (Math.random() - 0.5) * fx.shake * 2);
  drawGround();
  drawAimLine();
  [...G.enemies].sort((a, b) => a.y - b.y).forEach(drawEnemy);
  drawCannon();
  fx.drawFg(ctx);
  if (G.running && !G.paused && G.grace > 0) {
    ctx.globalAlpha = Math.min(1, G.grace * 1.5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(48 * S)}px ${FONT}`; ctx.fillStyle = '#fff'; ctx.shadowColor = '#5ef0ff'; ctx.shadowBlur = 20;
    ctx.fillText(ev.t('getReady'), W / 2, H * 0.4); ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (fx.flash > 0) { ctx.fillStyle = `rgba(255,40,80,${fx.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
}

// Advance the game by dt seconds (also used by automated tests).
export function step(dt) { update(dt); draw(); ev.frame?.(G); }

function frame(ts) {
  const dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000); lastTs = ts;
  step(dt);
  requestAnimationFrame(frame);
}
