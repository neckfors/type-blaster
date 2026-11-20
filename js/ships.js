// Enemy spacecraft, drawn as vector art (original artwork, no image files). Each ship flies nose-first straight down the screen.
// Coordinates: x -1..1 (left..right), y -1 (tail, up the screen) .. +1 (nose, down the screen). Only the right half of the hull is
// listed; it is mirrored for the left half.
const HULLS = [
  { // needle fighter
    hull: [[0, 1], [0.16, 0.45], [0.2, 0.05], [0.95, -0.55], [0.98, -0.9], [0.42, -0.62], [0.26, -0.95], [0, -0.82]],
    trim: [[0.2, 0.05], [0.95, -0.55]], cockpit: [0, 0.3, 0.13, 0.3], engines: [0.26], stripe: true,
  },
  { // wide-wing striker
    hull: [[0, 0.92], [0.22, 0.4], [0.3, 0.12], [1, 0.3], [1, -0.4], [0.5, -0.5], [0.3, -0.92], [0, -0.78]],
    trim: [[0.3, 0.12], [1, 0.3], [1, -0.4]], cockpit: [0, 0.35, 0.16, 0.28], engines: [0.3, 0.7], stripe: false,
  },
  { // delta
    hull: [[0, 1], [0.34, 0.2], [1, -0.85], [0.5, -0.7], [0.22, -0.95], [0, -0.85]],
    trim: [[0.34, 0.2], [1, -0.85]], cockpit: [0, 0.15, 0.12, 0.35], engines: [0.22], stripe: true,
  },
  { // twin-prong
    hull: [[0, 0.62], [0.16, 0.5], [0.3, 1], [0.5, 0.55], [0.95, -0.15], [0.85, -0.9], [0.42, -0.72], [0.22, -0.95], [0, -0.8]],
    trim: [[0.5, 0.55], [0.95, -0.15], [0.85, -0.9]], cockpit: [0, 0.3, 0.14, 0.3], engines: [0.25, 0.7], stripe: false,
  },
  { // arrowhead
    hull: [[0, 1], [0.25, 0.55], [0.85, 0.35], [0.7, -0.1], [0.95, -0.8], [0.4, -0.55], [0.22, -0.95], [0, -0.85]],
    trim: [[0.25, 0.55], [0.85, 0.35], [0.7, -0.1]], cockpit: [0, 0.4, 0.13, 0.3], engines: [0.24], stripe: true,
  },
  { // heavy gunship
    hull: [[0, 0.85], [0.3, 0.75], [0.62, 0.35], [0.72, -0.2], [1, -0.45], [0.92, -0.9], [0.45, -0.88], [0, -0.92]],
    trim: [[0.3, 0.75], [0.62, 0.35], [0.72, -0.2]], cockpit: [0, 0.4, 0.2, 0.28], engines: [0.3, 0.72], stripe: false,
  },
  { // swept interceptor
    hull: [[0, 1], [0.14, 0.5], [0.28, 0.2], [0.75, 0.55], [0.9, -0.3], [0.55, -0.35], [0.28, -0.9], [0, -0.75]],
    trim: [[0.28, 0.2], [0.75, 0.55], [0.9, -0.3]], cockpit: [0, 0.35, 0.11, 0.3], engines: [0.26], stripe: true,
  },
  { // flying saucer (round hull instead of a mirrored outline)
    saucer: true, engines: [],
  },
];
export const SHIP_KINDS = HULLS.length;

const mirrorPath = (ctx, pts) => {
  ctx.beginPath(); ctx.moveTo(0, pts[0][1]);
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
  for (const [x, y] of pts.slice(1, -1).reverse()) ctx.lineTo(-x, y);
  ctx.closePath();
};
const inset = (pts, k, cy) => pts.map(([x, y]) => [x * k, cy + (y - cy) * k]);
const glow = (ctx, x, y, r, inner, outer) => { // soft additive light
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
};

// Draw one ship centred on the current origin; r is half its size in pixels, accent its colour, t seconds for animation.
// boost (0 or 1) makes the engines surge and the core flare, used while the player is typing at that ship.
export function drawShip(ctx, kind, r, accent, t, boost = 0) {
  const h = HULLS[kind % HULLS.length];
  ctx.save(); ctx.scale(r, r); // canvas y points down, so the nose (+y) points down the screen
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const px = 1 / r, pulse = 0.5 + 0.5 * Math.sin(t * 5 + kind * 1.7), flick = 0.85 + 0.15 * Math.sin(t * 40 + kind) + 0.08 * Math.sin(t * 23);
  const noses = (fn) => { for (const sgn of [-1, 1]) fn(sgn); };

  // ---- engine plasma (additive, trails up the screen) ----
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const ex of h.engines) for (const sgn of ex === 0 ? [1] : [-1, 1]) {
    const fx = ex * sgn, fy = -0.84, len = (0.62 + 0.14 * Math.sin(t * 31 + ex * 9)) * flick * (1 + 0.7 * boost), w = 0.13 * (1 + 0.3 * boost);
    glow(ctx, fx, fy, 0.3 * (1 + 0.4 * boost), 'rgba(255,255,255,.55)', 'rgba(0,0,0,0)');
    const g = ctx.createLinearGradient(0, fy, 0, fy - len);
    g.addColorStop(0, accent); g.addColorStop(0.55, accent); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.9; ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(fx - w, fy); ctx.quadraticCurveTo(fx - w * 0.5, fy - len * 0.5, fx, fy - len); ctx.quadraticCurveTo(fx + w * 0.5, fy - len * 0.5, fx + w, fy); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    const c = ctx.createLinearGradient(0, fy, 0, fy - len * 0.6);
    c.addColorStop(0, '#ffffff'); c.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(fx - w * 0.45, fy); ctx.lineTo(fx + w * 0.45, fy); ctx.lineTo(fx, fy - len * 0.6); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  if (h.saucer) { // alien warship
    const disc = ctx.createLinearGradient(0, -0.62, 0, 0.62);
    disc.addColorStop(0, '#8f9fcf'); disc.addColorStop(0.45, '#3a4577'); disc.addColorStop(1, '#10163a');
    ctx.fillStyle = disc; ctx.beginPath(); ctx.ellipse(0, 0, 1, 0.64, 0, 0, 6.283); ctx.fill();
    ctx.lineWidth = 2.5 * px; ctx.strokeStyle = 'rgba(8,12,36,.9)'; ctx.stroke();
    ctx.fillStyle = 'rgba(10,15,40,.55)'; ctx.beginPath(); ctx.ellipse(0, 0, 0.74, 0.45, 0, 0, 6.283); ctx.fill();
    ctx.lineWidth = 4 * px; ctx.strokeStyle = accent; ctx.beginPath(); ctx.ellipse(0, 0, 0.9, 0.57, 0, 0, 6.283); ctx.stroke();
    for (let i = 0; i < 10; i++) { // chasing lights around the rim
      const a = (i / 10) * 6.283, on = Math.sin(a * 2 - t * 9) > 0.2;
      ctx.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,.18)';
      ctx.beginPath(); ctx.arc(Math.cos(a) * 0.74, Math.sin(a) * 0.46, 0.05, 0, 6.283); ctx.fill();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, 0, 0.62 * (1 + 0.1 * pulse + 0.3 * boost), accent, 'rgba(0,0,0,0)'); ctx.restore();
    const dome = ctx.createRadialGradient(-0.1, -0.12, 0.02, 0, 0, 0.42);
    dome.addColorStop(0, 'rgba(255,255,255,.95)'); dome.addColorStop(0.35, 'rgba(150,240,255,.7)'); dome.addColorStop(1, 'rgba(20,50,90,.85)');
    ctx.fillStyle = dome; ctx.beginPath(); ctx.ellipse(0, 0, 0.4, 0.3, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2 * px; ctx.stroke();
    ctx.restore(); return;
  }

  // ---- hull: gunmetal with a lit centre, dark outline ----
  const hull = ctx.createLinearGradient(-1, 0, 1, 0);
  hull.addColorStop(0, '#141a3d'); hull.addColorStop(0.3, '#46538a'); hull.addColorStop(0.5, '#a9b8e6'); hull.addColorStop(0.7, '#46538a'); hull.addColorStop(1, '#141a3d');
  mirrorPath(ctx, h.hull); ctx.fillStyle = hull; ctx.fill();
  ctx.lineWidth = 2.5 * px; ctx.strokeStyle = 'rgba(6,9,28,.95)'; ctx.stroke();
  // armour plate sitting on top of the hull
  mirrorPath(ctx, inset(h.hull, 0.62, -0.05));
  ctx.fillStyle = 'rgba(8,12,38,.5)'; ctx.fill();
  ctx.lineWidth = 1.5 * px; ctx.strokeStyle = accent; ctx.globalAlpha = 0.55; ctx.stroke(); ctx.globalAlpha = 1;

  // neon edge lighting along the wings
  ctx.save(); ctx.strokeStyle = accent; ctx.lineWidth = 4 * px; ctx.shadowColor = accent; ctx.shadowBlur = 8;
  noses(sgn => { ctx.beginPath(); h.trim.forEach(([x, y], i) => (i ? ctx.lineTo(sgn * x, y) : ctx.moveTo(sgn * x, y))); ctx.stroke(); });
  ctx.restore();
  // spine
  if (h.stripe) { ctx.fillStyle = accent; ctx.globalAlpha = 0.9; ctx.fillRect(-0.03, -0.72, 0.06, 0.78); ctx.globalAlpha = 1; }
  // panel lines
  ctx.strokeStyle = 'rgba(6,9,28,.55)'; ctx.lineWidth = 1.5 * px;
  noses(sgn => { ctx.beginPath(); ctx.moveTo(sgn * 0.12, -0.25); ctx.lineTo(sgn * 0.5, -0.45); ctx.moveTo(sgn * 0.12, -0.5); ctx.lineTo(sgn * 0.42, -0.62); ctx.stroke(); });

  // weapon pods at the wing tips with glowing muzzles and blinking running lights
  const [wx, wy] = h.trim[h.trim.length - 1];
  noses(sgn => {
    ctx.fillStyle = '#10163a'; ctx.beginPath(); ctx.roundRect(sgn * wx - 0.05, wy - 0.15, 0.1, 0.3, 0.045); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 1.5 * px; ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, sgn * wx, wy + 0.17, 0.12 + 0.05 * pulse + 0.05 * boost, accent, 'rgba(0,0,0,0)'); ctx.restore();
    if (Math.sin(t * 8 + sgn * 2 + kind) > 0.3) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sgn * wx, wy - 0.17, 0.035, 0, 6.283); ctx.fill(); }
  });

  // engine nozzles
  ctx.fillStyle = '#0a0e28'; ctx.strokeStyle = 'rgba(160,175,225,.6)'; ctx.lineWidth = 1.5 * px;
  for (const ex of h.engines) for (const sgn of ex === 0 ? [1] : [-1, 1]) {
    ctx.beginPath(); ctx.roundRect(ex * sgn - 0.085, -0.97, 0.17, 0.16, 0.05); ctx.fill(); ctx.stroke();
  }

  // pulsing energy core
  const [cx, cy, cw, ch] = h.cockpit;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 0, cy - ch - 0.3, 0.26 * (1 + 0.18 * pulse + 0.35 * boost), 'rgba(255,255,255,.9)', 'rgba(0,0,0,0)');
  glow(ctx, 0, cy - ch - 0.3, 0.2 * (1 + 0.25 * pulse), accent, 'rgba(0,0,0,0)');
  ctx.restore();

  // canopy: dark tinted glass with a glint and a lit rim
  const glass = ctx.createLinearGradient(0, cy - ch, 0, cy + ch);
  glass.addColorStop(0, '#9fefff'); glass.addColorStop(0.35, '#2a7fb0'); glass.addColorStop(1, '#0a1740');
  ctx.fillStyle = glass; ctx.beginPath(); ctx.ellipse(cx, cy, cw * 1.5, ch * 0.78, 0, 0, 6.283); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 2 * px; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(cx - cw * 0.5, cy - ch * 0.28, cw * 0.32, ch * 0.2, -0.4, 0, 6.283); ctx.fill();
  ctx.restore();
}
