// Local players (name only, no passwords) and a per-player key/value store. Guest keeps everything in memory.
const P = 'wordshooter.';
const LEGACY = ['speed', 'sound', 'accents', 'mode', 'bestScore', 'bestWpm', 'bestScoreMath', 'mathHist'];
const raw = {
  get(k) { try { return localStorage.getItem(P + k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(P + k, v); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(P + k); } catch { /* storage unavailable */ } },
};
const json = (k, d) => { try { const v = raw.get(k); return v == null ? d : JSON.parse(v); } catch { return d; } };

let names = json('players', []);
if (!Array.isArray(names)) names = [];
let current = json('player', '');
if (!names.includes(current)) current = '';
const mem = {}; // guest data, gone on reload

export const list = () => [...names];
export const getCurrent = () => current; // '' = guest
export const isGuest = () => !current;
const pre = () => `u.${current}.`;

export function setCurrent(name) {
  current = names.includes(name) ? name : '';
  raw.set('player', JSON.stringify(current));
  for (const k of Object.keys(mem)) delete mem[k]; // a new guest session starts fresh
}

export const store = {
  get(key, d) {
    if (!current) return key in mem ? mem[key] : d;
    return json(pre() + key, d);
  },
  set(key, v) {
    if (!current) { mem[key] = v; return; }
    raw.set(pre() + key, JSON.stringify(v));
  },
};

// Storage key for the multiplication history, or null for a guest.
export const mathKey = () => (current ? P + pre() + 'mathHist' : null);

export function clean(name) { return String(name || '').replace(/\s+/g, ' ').trim().slice(0, 16); }

// Returns the stored name, or '' if empty or already taken. The first player adopts progress saved before players existed.
export function add(name) {
  name = clean(name);
  if (!name || names.some(n => n.toLowerCase() === name.toLowerCase())) return '';
  const first = names.length === 0;
  names.push(name); raw.set('players', JSON.stringify(names));
  if (first) {
    for (const k of LEGACY) { const v = raw.get(k); if (v != null) { raw.set(`u.${name}.${k}`, v); raw.del(k); } }
  }
  setCurrent(name);
  return name;
}

export function remove(name) {
  names = names.filter(n => n !== name); raw.set('players', JSON.stringify(names));
  try { Object.keys(localStorage).filter(k => k.startsWith(`${P}u.${name}.`)).forEach(k => localStorage.removeItem(k)); } catch { /* storage unavailable */ }
  if (current === name) setCurrent('');
}
