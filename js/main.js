// UI wiring: menus, HUD, keyboard input, settings, service worker updates.
import { loadI18n, t, loadWords } from './i18n.js';
import * as game from './game.js';
import * as ms from './mathstats.js';
import { initAudio, setSound, resumeAudio, sfx } from './audio.js';

const $ = id => document.getElementById(id);
import * as pl from './players.js';
const store = pl.store;
const SPEEDS = { slow: 0.7, normal: 1, fast: 1.3 };
const settings = {};
function loadPlayer() {
  ms.load(pl.mathKey());
  Object.assign(settings, { speed: store.get('speed', 'normal'), sound: store.get('sound', true), accents: store.get('accents', false), mode: store.get('mode', 'words') });
}
loadPlayer();

function renderPlayers() {
  const sel = $('playerSel'), cur = pl.getCurrent();
  sel.innerHTML = `<option value="">${t('guest')}</option>` + pl.list().map(n => `<option value="${n.replace(/"/g, '&quot;')}">${n.replace(/</g, '&lt;')}</option>`).join('') + `<option value="+">${t('newPlayer')}</option>`;
  sel.value = cur; $('delPlayer').hidden = !cur;
  $('guestNote').hidden = !!cur;
}
function switchPlayer(name) { pl.setCurrent(name); loadPlayer(); renderPlayers(); applySettings(); renderBest(); }
function createPlayer() {
  const n = pl.add(prompt(t('askName')) || '');
  if (n) { loadPlayer(); renderPlayers(); applySettings(); renderBest(); } else renderPlayers();
}
const kb = $('kb');
let panel = 'start';
let panelAt = 0; // when the current panel opened

function show(name) {
  panel = name; panelAt = performance.now();
  document.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== 'p-' + name; });
  $('overlay').hidden = !name;
  if (name) { const b = document.querySelector(`#p-${name} .big`); if (b) b.focus(); }
  else kb.focus();
}

function applySettings() {
  document.querySelectorAll('#speedSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.speed === settings.speed));
  $('soundBtn').textContent = t(settings.sound ? 'soundOn' : 'soundOff');
  $('accBtn').textContent = t(settings.accents ? 'accOn' : 'accOff');
  const math = settings.mode === 'math';
  document.querySelectorAll('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === settings.mode));
  $('accBtn').hidden = math; $('gridBtn').hidden = !math;
  $('tag').textContent = t(math ? 'taglineMath' : 'tagline'); $('how').textContent = t(math ? 'howToMath' : 'howTo');
  $('hudLbl').textContent = t(math ? 'solved' : 'wpm');
  setSound(settings.sound);
  game.configure({ speed: SPEEDS[settings.speed], accents: settings.accents, mode: settings.mode });
}

function renderBest() {
  const math = settings.mode === 'math';
  const s = store.get(math ? 'bestScoreMath' : 'bestScore', 0), w = store.get('bestWpm', 0);
  $('best').textContent = s ? (math ? t('bestMath', { score: s }) : t('best', { score: s, wpm: w })) : '';
}

// ---------- game flow ----------
function play() {
  initAudio(); resumeAudio(); applySettings();
  game.start(); $('hud').hidden = false; show(null);
}
function pauseGame() { if (game.pause()) show('paused'); }
function resumeGame() { show(null); game.resume(); }
function toMenu() { game.quit(); $('hud').hidden = true; renderBest(); show('start'); }

const events = {
  t,
  minuteDone(s) {
    const math = s.mode === 'math';
    $('mTitle').textContent = t('minuteDone', { n: s.minute });
    $('mWpm').textContent = math ? s.words : s.wpm; $('mWpm').nextElementSibling.textContent = t(math ? 'solved' : 'wpm');
    const praise = t(math ? 'praiseMath' : 'praise');
    $('mPraise').textContent = praise[math ? (s.words >= 12 ? 2 : s.words >= 6 ? 1 : 0) : (s.wpm >= 30 ? 2 : s.wpm >= 15 ? 1 : 0)];
    $('mAcc').textContent = s.accuracy + '%'; $('mCombo').textContent = s.bestCombo;
    $('mWords').textContent = math ? `${ms.mastered()}/${ms.FACTS.length}` : s.words;
    $('mWords').nextElementSibling.textContent = t(math ? 'mastered' : 'words');
    sfx.minute(); show('minute');
    if (!math && s.wpm > store.get('bestWpm', 0)) store.set('bestWpm', s.wpm);
  },
  over(s) {
    const math = s.mode === 'math', bk = math ? 'bestScoreMath' : 'bestScore';
    const isBest = s.score > store.get(bk, 0);
    if (isBest) store.set(bk, s.score);
    if (!math && s.wpm > store.get('bestWpm', 0)) store.set('bestWpm', s.wpm);
    $('oScore').textContent = s.score; $('oCombo').textContent = s.bestCombo;
    $('oWpm').textContent = math ? `${ms.mastered()}/${ms.FACTS.length}` : s.wpm; $('oWpm').nextElementSibling.textContent = t(math ? 'mastered' : 'wpm');
    $('oWords').textContent = s.words; $('oWords').nextElementSibling.textContent = t(math ? 'solved' : 'words');
    $('gridBtn2').hidden = !math;
    $('oNew').hidden = !isBest; $('hud').hidden = true;
    show('over');
  },
  hud: () => {},
  frame(G) {
    if (G.lives !== hudCache.lives) {
      hudCache.lives = G.lives;
      $('lives').innerHTML = Array.from({ length: game.MAX_LIVES }, (_, i) => `<span class="${i < G.lives ? '' : 'lost'}">&#9829;</span>`).join('');
    }
    if (G.score !== hudCache.score) { hudCache.score = G.score; $('score').textContent = G.score; }
    if (G.minute !== hudCache.minute) { hudCache.minute = G.minute; $('hudMinute').textContent = t('minute', { n: G.minute }); }
    $('timefill').style.transform = `scaleX(${Math.min(1, G.minTime / game.MINUTE)})`;
    const w = G.mode === 'math' ? G.t.words : G.minTime > game.MINUTE * 0.15 ? Math.round(G.m.cw / 5 / (G.minTime / 60)) : '-';
    if (w !== hudCache.wpm) { hudCache.wpm = w; $('liveWpm').textContent = w; }
    if (G.combo !== hudCache.combo) {
      hudCache.combo = G.combo;
      const c = $('combo'); c.hidden = G.combo < 2;
      if (G.combo >= 2) { c.textContent = t('combo', { n: G.combo }); c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse'); }
    }
  },
};
const hudCache = {};

// ---------- input ----------
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (panel) {
    const enterOnly = panel === 'minute' || panel === 'over' || panel === 'paused'; // space is mid-typing, so it must not close these
    if (enterOnly && performance.now() - panelAt < 1000) { e.preventDefault(); return; } // 1s lock so fast typing can't skip it
    if ((e.key === 'Enter' || (e.key === ' ' && !enterOnly)) && document.activeElement?.tagName !== 'BUTTON') {
      e.preventDefault();
      ({ grid: closeGrid, start: play, minute: () => { show(null); game.resume(); }, paused: resumeGame, over: play })[panel]?.();
    }
    return;
  }
  if (e.key === 'Escape') { e.preventDefault(); pauseGame(); return; }
  if (e.key === 'Backspace') { e.preventDefault(); game.unlock(); return; }
  if (e.key.length === 1) { e.preventDefault(); game.handleChar(e.key); }
});
// Soft keyboards on phones/tablets don't send usable keydown keys, so read the hidden input instead.
kb.addEventListener('input', () => { for (const ch of kb.value) game.handleChar(ch); kb.value = ''; });
$('c').addEventListener('pointerdown', () => { if (!panel) { kb.focus(); game.handleChar(' '); } }); // tapping the screen also shoots a finished word (phones)
document.addEventListener('visibilitychange', () => { if (document.hidden && !panel) pauseGame(); });

let gridFrom = 'start';
function showGrid() {
  gridFrom = panel;
  let h = '<tr><th></th>' + [2, 3, 4, 5, 6, 7, 8, 9].map(n => `<th>${n}</th>`).join('') + '</tr>';
  for (let a = 2; a <= 9; a++) {
    h += `<tr><th>${a}</th>`;
    for (let b = 2; b <= 9; b++) h += `<td style="background:${ms.color(a, b)}">${a * b}</td>`;
    h += '</tr>';
  }
  $('gridTable').innerHTML = h; show('grid');
}
function closeGrid() { show(gridFrom); }
$('gridBtn').onclick = showGrid; $('gridBtn2').onclick = showGrid; $('gridBack').onclick = closeGrid;
document.querySelectorAll('#modeSeg button').forEach(b => {
  b.onclick = () => { settings.mode = b.dataset.mode; store.set('mode', settings.mode); applySettings(); renderBest(); };
});
$('playerSel').onchange = e => { if (e.target.value === '+') createPlayer(); else switchPlayer(e.target.value); };
$('delPlayer').onclick = () => { const n = pl.getCurrent(); if (n && confirm(t('confirmDel', { n }))) { pl.remove(n); switchPlayer(''); } };
$('play').onclick = play;
$('again').onclick = play;
$('continue').onclick = () => { show(null); game.resume(); };
$('resume').onclick = resumeGame;
$('quit').onclick = toMenu;
$('pauseBtn').onclick = pauseGame;
$('soundBtn').onclick = () => { settings.sound = !settings.sound; store.set('sound', settings.sound); applySettings(); };
$('accBtn').onclick = () => { settings.accents = !settings.accents; store.set('accents', settings.accents); applySettings(); };
document.querySelectorAll('#speedSeg button').forEach(b => {
  b.onclick = () => { settings.speed = b.dataset.speed; store.set('speed', settings.speed); applySettings(); };
});

// ---------- service worker / updates ----------
function swVersion(worker) {
  return new Promise(res => {
    const ch = new MessageChannel();
    ch.port1.onmessage = e => res(e.data);
    worker.postMessage({ type: 'GET_VERSION' }, [ch.port2]);
    setTimeout(() => res(null), 2000);
  });
}

async function setupSW() {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.register('sw.js');
  let userAsked = false, reloading = false;
  const showUpdate = w => {
    $('update').hidden = false; document.body.classList.add('has-update');
    $('updateBtn').onclick = () => { userAsked = true; w.postMessage({ type: 'SKIP_WAITING' }); };
  };
  if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(w); });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (userAsked && !reloading) { reloading = true; location.reload(); } // only after the user tapped Update
  });
  const check = () => reg.update().catch(() => {});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  setInterval(check, 30 * 60 * 1000);
  const ready = await navigator.serviceWorker.ready;
  const v = ready.active && await swVersion(ready.active);
  if (v) $('ver').textContent = t('about', { v });
}

// ---------- boot ----------
(async function boot() {
  await loadI18n();
  const words = await loadWords();
  game.init($('c'), words, events);
  renderPlayers(); applySettings(); renderBest(); show('start');
  setupSW().catch(() => {});
})();
