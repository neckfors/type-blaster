// Particles, lasers, rings, floating text, screen shake and the starfield.
export class FX {
  constructor() {
    this.p = []; this.rings = []; this.texts = []; this.lasers = []; this.stars = [];
    this.shake = 0; this.flash = 0; this.W = 0; this.H = 0;
  }

  initStars(W, H) {
    this.W = W; this.H = H;
    const n = Math.round(W * H / 5000);
    this.stars = Array.from({ length: n }, () => {
      const z = Math.random();
      return { x: Math.random() * W, y: Math.random() * H, z, r: 0.4 + z * 1.3, tw: Math.random() * 6 };
    });
  }

  burst(x, y, color, n = 28, speed = 260) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.9);
      this.p.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 0.5 + Math.random() * 0.6, size: 2 + Math.random() * 4, color });
    }
  }
  ring(x, y, color, max = 140) { this.rings.push({ x, y, color, max, life: 0, dur: 0.45 }); }
  text(x, y, str, color = '#fff', size = 26) { this.texts.push({ x, y, str, color, size, life: 0, dur: 1.1 }); }
  laser(x1, y1, x2, y2) { this.lasers.push({ x1, y1, x2, y2, life: 0, dur: 0.14 }); }

  update(dt) {
    for (const p of this.p) { p.life += dt; p.vy += 300 * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.p = this.p.filter(p => p.life < p.max);
    for (const r of this.rings) r.life += dt;
    this.rings = this.rings.filter(r => r.life < r.dur);
    for (const t of this.texts) { t.life += dt; t.y -= 40 * dt; }
    this.texts = this.texts.filter(t => t.life < t.dur);
    for (const l of this.lasers) l.life += dt;
    this.lasers = this.lasers.filter(l => l.life < l.dur);
    this.shake *= Math.pow(0.002, dt);
    if (this.shake < 0.2) this.shake = 0;
    this.flash = Math.max(0, this.flash - dt * 2.5);
    for (const s of this.stars) {
      s.y += (8 + s.z * 45) * dt;
      if (s.y > this.H) { s.y = 0; s.x = Math.random() * this.W; }
    }
  }

  drawBg(ctx, W, H, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070a1f'); g.addColorStop(0.6, '#141a47'); g.addColorStop(1, '#2a1650');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const blob = (x, y, r, c) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    blob(W * 0.2, H * 0.3, Math.max(W, H) * 0.35, 'rgba(94,240,255,.07)');
    blob(W * 0.8, H * 0.6, Math.max(W, H) * 0.4, 'rgba(255,94,168,.08)');
    for (const s of this.stars) {
      ctx.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + s.tw)) * (0.4 + s.z * 0.6);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawFg(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const r of this.rings) {
      const k = r.life / r.dur;
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.color; ctx.lineWidth = 6 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.max * (1 - Math.pow(1 - k, 3)), 0, 6.283); ctx.stroke();
    }
    for (const l of this.lasers) {
      const k = l.life / l.dur;
      ctx.globalAlpha = 1 - k; ctx.lineCap = 'round';
      ctx.strokeStyle = '#5ef0ff'; ctx.lineWidth = 12 * (1 - k) + 2;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4 * (1 - k) + 1;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    }
    for (const p of this.p) {
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - p.life / p.max * 0.6), 0, 6.283); ctx.fill();
    }
    ctx.restore();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const t of this.texts) {
      const k = t.life / t.dur;
      ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.font = `800 ${t.size * (1 + 0.3 * Math.max(0, 1 - k * 6))}px "Trebuchet MS",system-ui,sans-serif`;
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.color; ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
