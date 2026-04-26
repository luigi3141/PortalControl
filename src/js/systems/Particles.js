// Lightweight particle system + screen shake.

export class Particles {
  constructor() {
    this.parts = [];
    this.shakeT = 0;
    this.shakeAmp = 0;
  }

  burst({ x, y, count = 12, speed = 160, color = '#00ff88', life = 0.6, size = 2 }) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.parts.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life * (0.6 + Math.random() * 0.7),
        max: life,
        color,
        size: size * (0.7 + Math.random() * 0.8),
      });
    }
  }

  trail({ x, y, color = '#00ff88', life = 0.3, size = 2, vx = 0, vy = 0 }) {
    this.parts.push({ x, y, vx, vy, life, max: life, color, size });
  }

  shake(amp = 6, t = 0.25) {
    this.shakeAmp = Math.max(this.shakeAmp, amp);
    this.shakeT = Math.max(this.shakeT, t);
  }

  getShake() {
    if (this.shakeT <= 0) return { x: 0, y: 0 };
    const a = this.shakeAmp * (this.shakeT > 0.05 ? 1 : this.shakeT / 0.05);
    return {
      x: (Math.random() * 2 - 1) * a,
      y: (Math.random() * 2 - 1) * a,
    };
  }

  update(dt) {
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      if (this.shakeT <= 0) { this.shakeAmp = 0; this.shakeT = 0; }
    }
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
    }
  }

  draw(ctx) {
    for (const p of this.parts) {
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      const s = Math.max(1, p.size * a);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }
}
