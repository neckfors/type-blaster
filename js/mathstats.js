// Remembers how each multiplication fact (0-9) went in the last 20 tries. 7x8 and 8x7 count as the same fact.
let KEY = null; // null = guest: history lives in memory only
let hist = {};
export function load(storageKey) {
  KEY = storageKey; hist = {};
  if (KEY) try { hist = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { hist = {}; }
}
const save = () => { if (KEY) try { localStorage.setItem(KEY, JSON.stringify(hist)); } catch { /* storage unavailable */ } };
const key = (a, b) => (a < b ? `${a}x${b}` : `${b}x${a}`);

export const FACTS = [];
for (let a = 0; a <= 9; a++) for (let b = a; b <= 9; b++) FACTS.push([a, b]);

export const WINDOW = 20; // how many of the latest tries of a fact are remembered

export function record(a, b, ok) {
  const h = hist[key(a, b)] || (hist[key(a, b)] = []);
  h.push(ok ? 1 : 0); if (h.length > WINDOW) h.shift();
  save();
}

const info = (a, b) => { const h = hist[key(a, b)] || []; const miss = h.filter(x => !x).length; return { n: h.length, miss, r: miss / Math.max(h.length, 3) }; };

// Only the last WINDOW tries count, so an old miss fades out after enough right answers.
// Facts you never miss: 20 clean tries in a row = mastered (fully green, asked least often).
// Facts you miss: the more misses in the window, the more often they come back.
export function weight(a, b) {
  const { n, miss, r } = info(a, b);
  if (miss) return 0.6 + 5 * Math.sqrt(r);        // 1 miss in 20 ~1.7x, 1 in 10 ~2.2x, always wrong ~5.6x
  return 2 - 1.4 * Math.min(1, n / WINDOW);       // unseen 2x, falls to 0.6x after 20 clean tries
}

export const mastered = () => FACTS.filter(([a, b]) => { const { n, miss } = info(a, b); return n >= WINDOW && !miss; }).length;
export const tries = (a, b) => info(a, b).n;

// null = not played yet. Green grows with clean tries (fully green at 20), misses pull towards red.
export function color(a, b) {
  const { n, miss, r } = info(a, b);
  if (!n) return 'rgba(255,255,255,.08)';
  const hue = miss ? 130 * (1 - Math.min(1, 1.6 * Math.sqrt(r))) : 95 + 35 * Math.min(1, n / WINDOW);
  return `hsl(${Math.round(hue)} 65% 36%)`;
}
