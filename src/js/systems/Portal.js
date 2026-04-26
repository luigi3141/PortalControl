// Portal entity used by both modes. Renders pulsing green ring.

export class Portal {
  constructor(def, arena) {
    this.def = def;
    this.id = def.id;
    this.label = def.label;
    this.icon = def.icon;
    this.color = def.color;
    this.archetype = def.archetype;
    this.x = def.x * arena.w;
    this.y = def.y * arena.h;
    this.r = 44;
    this.t = Math.random() * Math.PI * 2;
    this.flash = 0;
  }

  update(dt) {
    this.t += dt * 2;
    if (this.flash > 0) this.flash -= dt;
  }

  pulseFlash() { this.flash = 0.4; }

  contains(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= this.r * this.r;
  }

  inAttractRange(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    const d = Math.hypot(dx, dy);
    return d < this.r + 18;
  }

  draw(ctx, { highlight = false, danger = false } = {}) {
    const x = this.x;
    const y = this.y;
    const pulse = 0.6 + Math.sin(this.t) * 0.18;
    const flashBoost = this.flash > 0 ? 0.4 : 0;
    const baseColor = danger ? '#ff4d4d' : this.color;

    // Outer halo
    const grad = ctx.createRadialGradient(x, y, this.r * 0.4, x, y, this.r * 2.2);
    grad.addColorStop(0, hexA(baseColor, 0.30 + flashBoost * 0.5));
    grad.addColorStop(1, hexA(baseColor, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, this.r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring
    ctx.lineWidth = 4;
    ctx.strokeStyle = hexA(baseColor, 0.8 + flashBoost);
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner pulsing ring
    ctx.lineWidth = 2;
    ctx.strokeStyle = hexA(baseColor, pulse);
    ctx.beginPath();
    ctx.arc(x, y, this.r - 8 + Math.sin(this.t * 2) * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Core swirl - dashed offset ring
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.t * 0.6);
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = hexA(baseColor, 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Highlight overlay
    if (highlight) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, this.r + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Label above
    const labelY = y - this.r - 16;
    ctx.font = 'bold 22px "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = baseColor;
    ctx.fillText(this.label.toUpperCase(), x, labelY);

    // Icon in center
    ctx.font = '44px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, x, y + 2);
    ctx.textBaseline = 'alphabetic';
  }
}

function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const v = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h.slice(0, 6);
  const r = parseInt(v.substr(0, 2), 16);
  const g = parseInt(v.substr(2, 2), 16);
  const b = parseInt(v.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
