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

// Cartoon eyes that stare straight ahead (at the cannon): angry brows normally, worried brows once the player is typing at it.
function eyes(ctx, cx, cy, gap, er, t, worried, px) {
  const blink = Math.sin(t * 1.3) > 0.985 ? 0.15 : 1;
  for (const sgn of [-1, 1]) {
    const x = cx + sgn * gap;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, cy, er, er * blink, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(8,12,36,.9)'; ctx.lineWidth = 1.6 * px; ctx.stroke();
    if (blink > 0.5) {
      ctx.fillStyle = '#0b1026'; ctx.beginPath(); ctx.arc(x, cy + er * (worried ? 0.1 : 0.38), er * (worried ? 0.42 : 0.5), 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - er * 0.12, cy + er * (worried ? 0 : 0.26), er * 0.15, 0, 6.283); ctx.fill();
    }
    // brows slope down towards the middle when angry, up when worried
    const inY = cy - er * (worried ? 1.55 : 1.0), outY = cy - er * (worried ? 1.05 : 1.55);
    ctx.strokeStyle = '#0b1026'; ctx.lineWidth = 3 * px; ctx.beginPath();
    ctx.moveTo(x + sgn * er * 1.15, outY); ctx.lineTo(x - sgn * er * 0.9, inY); ctx.stroke();
  }
}

// Draw one ship centred on the current origin; r is half its size in pixels, accent its glow colour, t seconds for animation.
export function drawShip(ctx, kind, r, accent, t, worried = 0) {
  const h = HULLS[kind % HULLS.length];
  ctx.save(); ctx.scale(r, r); // canvas y points down, so the nose (+y) points down the screen
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const px = 1 / r; // one screen pixel in ship units
  const flick = 0.85 + 0.15 * Math.sin(t * 40 + kind) + 0.08 * Math.sin(t * 23);

  // engine flames trail behind (up the screen)
  for (const ex of h.engines) for (const sgn of ex === 0 ? [1] : [-1, 1]) {
    const fx = ex * sgn, fy = -0.82, len = (0.5 + 0.12 * Math.sin(t * 31 + ex * 9)) * flick, w = 0.1;
    const g = ctx.createLinearGradient(0, fy, 0, fy - len);
    g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.25, accent); g.addColorStop(1, 'rgba(255,120,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - w, fy); ctx.lineTo(fx + w, fy); ctx.lineTo(fx, fy - len); ctx.closePath(); ctx.fill();
  }

  if (h.saucer) {
    // lower disc
    const disc = ctx.createLinearGradient(0, -0.5, 0, 0.5);
    disc.addColorStop(0, '#9fb3d9'); disc.addColorStop(0.5, '#4c5e8f'); disc.addColorStop(1, '#232c52');
    ctx.fillStyle = disc; ctx.beginPath(); ctx.ellipse(0, 0, 1, 0.62, 0, 0, 6.283); ctx.fill();
    ctx.lineWidth = 3 * px; ctx.strokeStyle = accent; ctx.beginPath(); ctx.ellipse(0, 0, 1, 0.62, 0, 0, 6.283); ctx.stroke();
    // lights around the rim
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.283 + t * 1.5, on = Math.sin(a * 2 - t * 6) > 0;
      ctx.fillStyle = on ? '#ffffff' : accent; ctx.globalAlpha = on ? 1 : 0.55;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 0.78, Math.sin(a) * 0.48, 0.055, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // dome
    const dome = ctx.createRadialGradient(-0.1, -0.1, 0.02, 0, 0, 0.42);
    dome.addColorStop(0, '#e6ffff'); dome.addColorStop(0.45, '#5ef0ff'); dome.addColorStop(1, '#1d6a86');
    ctx.fillStyle = dome; ctx.beginPath(); ctx.ellipse(0, 0, 0.42, 0.32, 0, 0, 6.283); ctx.fill();
    eyes(ctx, 0, 0.02, 0.17, 0.12, t, worried, px);
    ctx.restore(); return;
  }

  // hull
  const hull = ctx.createLinearGradient(-1, 0, 1, 0);
  hull.addColorStop(0, '#26305c'); hull.addColorStop(0.32, '#7d8fbf'); hull.addColorStop(0.5, '#c9d6f5'); hull.addColorStop(0.68, '#7d8fbf'); hull.addColorStop(1, '#26305c');
  mirrorPath(ctx, h.hull); ctx.fillStyle = hull; ctx.fill();
  ctx.lineWidth = 2.5 * px; ctx.strokeStyle = 'rgba(8,12,36,.9)'; ctx.stroke();

  // coloured wing trim
  ctx.strokeStyle = accent; ctx.lineWidth = 5 * px;
  for (const sgn of [1, -1]) {
    ctx.beginPath(); h.trim.forEach(([x, y], i) => (i ? ctx.lineTo(sgn * x, y) : ctx.moveTo(sgn * x, y))); ctx.stroke();
  }
  // centre stripe
  if (h.stripe) { ctx.fillStyle = accent; ctx.globalAlpha = 0.85; ctx.fillRect(-0.035, -0.7, 0.07, 1.1); ctx.globalAlpha = 1; }
  // engine nozzles
  ctx.fillStyle = '#10163a';
  for (const ex of h.engines) for (const sgn of ex === 0 ? [1] : [-1, 1]) {
    ctx.beginPath(); ctx.roundRect(ex * sgn - 0.07, -0.95, 0.14, 0.16, 0.04); ctx.fill();
  }
  // cockpit
  const [cx, cy, cw, ch] = h.cockpit;
  const glass = ctx.createLinearGradient(0, cy - ch, 0, cy + ch);
  glass.addColorStop(0, '#e6ffff'); glass.addColorStop(0.5, '#5ef0ff'); glass.addColorStop(1, '#1b5f86');
  ctx.fillStyle = glass; ctx.beginPath(); ctx.ellipse(cx, cy, cw * 2.1, ch * 0.9, 0, 0, 6.283); ctx.fill();
  ctx.strokeStyle = 'rgba(8,12,36,.8)'; ctx.lineWidth = 2 * px; ctx.stroke();
  eyes(ctx, cx, cy, Math.max(0.15, cw * 1.1), Math.max(0.13, cw * 0.9), t + kind, worried, px);
  ctx.restore();
}
