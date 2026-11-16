// Which questions to ask (times tables and/or additions), and the settings card that picks them.
// This file is shared by Math Clicker and Type Blaster (same copy in both): keep them identical.
// Colours: x is orange, + is cyan (green is already used for "correct").

export const MUL_NUMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const ADD_KINDS = [
  { id: '11', label: '1 digit + 1 digit', ex: '7 + 5' },
  { id: '22', label: '2 digits + 2 digits', ex: '47 + 38' },
  { id: '12', label: '1 digit + 2 digits', ex: '6 + 47' },
];
export const SYM = { x: '×', '+': '+' };

export const defaultCfg = () => ({ mode: 'mul', tables: [2, 3, 4, 5, 6, 7, 8, 9], adds: ['11'] });

// Make a saved or broken config safe to use.
export function fixCfg(c) {
  const d = defaultCfg();
  c = c && typeof c === 'object' ? c : {};
  const tables = MUL_NUMS.filter(n => (c.tables || d.tables).includes(n));
  const adds = ADD_KINDS.map(k => k.id).filter(id => (c.adds || d.adds).includes(id));
  return {
    mode: ['mul', 'add', 'both'].includes(c.mode) ? c.mode : d.mode,
    tables: tables.length ? tables : d.tables,
    adds: adds.length ? adds : d.adds,
  };
}

const ri = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

// Second numbers for a times table: 2-9, plus 0 and 1 when those tables are switched on.
const mulPairs = cfg => {
  const out = [];
  for (const a of cfg.tables) for (const b of MUL_NUMS) if (b >= 2 || cfg.tables.includes(b)) out.push([a, b]);
  return out;
};

// weight(a, b) lets the game ask weak facts more often. avoid = the last question (not repeated).
export function pickQuestion(cfg, weight = () => 1, avoid = null) {
  const wantMul = cfg.mode === 'mul' || (cfg.mode === 'both' && Math.random() < 0.5);
  if (wantMul) {
    const list = mulPairs(cfg).filter(([a, b]) => !(avoid && avoid.op === 'x' && avoid.a === a && avoid.b === b));
    const ws = list.map(([a, b]) => weight(a, b));
    let pick = Math.random() * ws.reduce((t, w) => t + w, 0), i = 0;
    while (i < list.length - 1 && (pick -= ws[i]) > 0) i++;
    const [a, b] = list[i] || mulPairs(cfg)[0];
    return { op: 'x', a, b };
  }
  for (let tries = 0; ; tries++) {
    const kind = cfg.adds[ri(0, cfg.adds.length - 1)];
    let a, b;
    if (kind === '11') { a = ri(1, 9); b = ri(1, 9); }
    else if (kind === '22') { a = ri(10, 99); b = ri(10, 99); }
    else { a = ri(1, 9); b = ri(10, 99); if (Math.random() < 0.5) [a, b] = [b, a]; }
    if (tries > 20 || !(avoid && avoid.op === '+' && avoid.a === a && avoid.b === b)) return { op: '+', a, b, kind };
  }
}

export const answerOf = q => (q.op === '+' ? q.a + q.b : q.a * q.b);
export const textOf = q => `${q.a} ${SYM[q.op]} ${q.b}`;

// ---- Settings card ----
// Draws into el. onChange(cfg) is called after every tap; cfg is changed in place.
export function renderSettings(el, cfg, onChange) {
  const btn = (cls, attrs, html) => `<button class="${cls}" ${attrs}>${html}</button>`;
  const modes = [['mul', '× only'], ['add', '+ only'], ['both', '× +']];
  let h = `<div class="ms-seg">${modes.map(([m, t]) => btn(cfg.mode === m ? 'on' : '', `data-mode="${m}" aria-pressed="${cfg.mode === m}"`, t)).join('')}</div>`;
  if (cfg.mode !== 'add') {
    h += `<div class="ms-sec ms-m"><h4><i class="ms-badge">×</i>Tables</h4><div class="ms-chips">` +
      MUL_NUMS.map(n => btn('ms-chip' + (cfg.tables.includes(n) ? ' on' : ''), `data-t="${n}" aria-pressed="${cfg.tables.includes(n)}"`, `${n}×`)).join('') +
      `</div><div class="ms-quick">${btn('', 'data-all="1"', 'All')}</div></div>`;
  }
  if (cfg.mode !== 'mul') {
    h += `<div class="ms-sec ms-a"><h4><i class="ms-badge">+</i>Digits</h4>` +
      ADD_KINDS.map(k => btn('ms-opt' + (cfg.adds.includes(k.id) ? ' on' : ''), `data-a="${k.id}" aria-pressed="${cfg.adds.includes(k.id)}"`, `<span>${k.label}</span><b>${k.ex}</b>`)).join('') + `</div>`;
  }
  el.innerHTML = `<div class="ms">${h}</div>`;
  el.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.mode) cfg.mode = d.mode;
    else if (d.all) cfg.tables = [...MUL_NUMS];
    else if (d.t !== undefined) {
      const n = +d.t;
      cfg.tables = cfg.tables.includes(n) ? (cfg.tables.length > 1 ? cfg.tables.filter(x => x !== n) : cfg.tables) : [...cfg.tables, n].sort((x, y) => x - y);
    } else if (d.a) {
      cfg.adds = cfg.adds.includes(d.a) ? (cfg.adds.length > 1 ? cfg.adds.filter(x => x !== d.a) : cfg.adds) : [...cfg.adds, d.a];
    } else return;
    renderSettings(el, cfg, onChange);
    onChange(cfg);
  };
}
