// Remembers how each multiplication fact (0-9) went in the last 10 tries. 7x8 and 8x7 count as the same fact.
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

export function record(a, b, ok) {
  const h = hist[key(a, b)] || (hist[key(a, b)] = []);
  h.push(ok ? 1 : 0); if (h.length > 10) h.shift();
  save();
}

// null = not played yet, otherwise 0 (all good) .. 1 (all wrong). A single early miss is not full red.
export function badness(a, b) {
  const h = hist[key(a, b)];
  if (!h || !h.length) return null;
  return h.filter(x => !x).length / Math.max(h.length, 3);
}

export const mastered = () => FACTS.filter(([a, b]) => { const h = hist[key(a, b)]; return h && h.length >= 5 && h.every(x => x); }).length;

// Facts you struggle with come up more often; mastered ones less often. The square root lifts facts you only miss
// sometimes (1 miss in 10 -> 2.2x, 2 in 10 -> 2.8x, always wrong -> 5.6x, versus 0.6x when perfect and 2x when unseen).
export function weight(a, b) { const r = badness(a, b); return r == null ? 2 : 0.6 + 5 * Math.sqrt(r); }

export function color(a, b) {
  const r = badness(a, b);
  return r == null ? 'rgba(255,255,255,.08)' : `hsl(${Math.round(130 * (1 - Math.min(1, r * 2)))} 65% 36%)`;
}
