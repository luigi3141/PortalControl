// Main menu: title, role buttons, how-to overlay.

import { ARENA, drawGrid } from '../systems/Arena.js';
import { Input } from '../systems/Input.js';
import { Portal } from '../systems/Portal.js';
import { PORTAL_DESTINATIONS } from '../data/portalDestinations.js';
import { Audio } from '../systems/AudioSystem.js';
import { COPY } from '../data/copy.js';

const BUTTONS = [
  { id: 'runner',     label: COPY.menu.runner,     kind: 'primary' },
  { id: 'controller', label: COPY.menu.controller },
  { id: 'howto',      label: COPY.menu.howTo },
];

export class MainMenuScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.portals = PORTAL_DESTINATIONS.map((d) => new Portal(d, ARENA));
    this.hover = null;
    this.showHowTo = false;
    this.demoEntities = [];
    this.spawnTimer = 0;
  }

  enter() {}
  destroy() {}

  layoutButtons() {
    const w = 320;
    const h = 56;
    const gap = 14;
    const total = BUTTONS.length * h + (BUTTONS.length - 1) * gap;
    const startY = ARENA.h * 0.55;
    return BUTTONS.map((b, i) => ({
      ...b,
      x: ARENA.w / 2 - w / 2,
      y: startY + i * (h + gap),
      w, h,
    }));
  }

  pointInRect(p, r) {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }

  update(dt) {
    this.t += dt;
    for (const p of this.portals) p.update(dt);

    const layout = this.layoutButtons();
    const ptr = Input.pointer();
    let hover = null;
    for (const r of layout) {
      if (this.pointInRect(ptr, r)) { hover = r.id; break; }
    }
    if (hover !== this.hover) {
      if (hover) Audio.hover();
      this.hover = hover;
    }

    if (Input.consumePointerDown()) {
      if (this.showHowTo) { this.showHowTo = false; Audio.click(); }
      else if (hover) {
        Audio.click();
        if (hover === 'runner') this.game.startRunner();
        else if (hover === 'controller') this.game.startController();
        else if (hover === 'howto') this.showHowTo = true;
      }
    }
    if (Input.wasPressed('Escape')) this.showHowTo = false;
    if (Input.wasPressed('1')) { Audio.click(); this.game.startRunner(); }
    if (Input.wasPressed('2')) { Audio.click(); this.game.startController(); }

    // Spawn idle drifting demo entities for vibe
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.demoEntities.length < 8) {
      this.spawnTimer = 0.7;
      const a = Math.random() * Math.PI * 2;
      this.demoEntities.push({
        x: ARENA.w / 2,
        y: ARENA.h / 2,
        vx: Math.cos(a) * 60,
        vy: Math.sin(a) * 60,
        c: ['#ffe66d', '#ff7ab6', '#66e3ff', '#22c55e', '#f97316', '#c084fc'][Math.floor(Math.random() * 6)],
        life: 6,
      });
    }
    for (let i = this.demoEntities.length - 1; i >= 0; i--) {
      const d = this.demoEntities[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
      if (d.life <= 0 || d.x < -20 || d.x > ARENA.w + 20 || d.y < -20 || d.y > ARENA.h + 20) {
        this.demoEntities.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    drawGrid(ctx, { t: this.t });

    // Portals as ambient backdrop (dimmed)
    ctx.save();
    ctx.globalAlpha = 0.4;
    for (const p of this.portals) p.draw(ctx);
    ctx.restore();

    // Demo entities
    for (const d of this.demoEntities) {
      ctx.fillStyle = d.c;
      ctx.globalAlpha = Math.min(1, d.life / 2);
      ctx.beginPath();
      ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Title
    const tx = ARENA.w / 2;
    const ty = ARENA.h * 0.22;
    ctx.font = 'bold 84px "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 18;
    ctx.fillText(COPY.title, tx, ty);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '22px "VT323", monospace';
    ctx.fillStyle = '#9fffd1';
    ctx.fillText(COPY.subtitle, tx, ty + 36);

    // Tagline
    ctx.fillStyle = '#6f8a7a';
    ctx.font = '16px "VT323", monospace';
    ctx.fillText('A pixelated vibe-jam routing simulation', tx, ty + 60);

    // Buttons
    const layout = this.layoutButtons();
    for (const r of layout) {
      const isHover = this.hover === r.id;
      const isPrimary = r.kind === 'primary';
      ctx.fillStyle = isPrimary
        ? (isHover ? '#b9ffd6' : '#00ff88')
        : (isHover ? 'rgba(0,255,136,0.20)' : 'rgba(0,255,136,0.06)');
      ctx.fillRect(r.x, r.y, r.w, r.h);

      ctx.lineWidth = 2;
      ctx.strokeStyle = isHover ? '#ffffff' : '#00ff88';
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

      ctx.font = '24px "VT323", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isPrimary ? '#04140c' : (isHover ? '#ffffff' : '#00ff88');
      ctx.fillText(r.label.toUpperCase(), r.x + r.w / 2, r.y + r.h / 2);
      ctx.textBaseline = 'alphabetic';

      // Hotkey hint
      if (r.id === 'runner' || r.id === 'controller') {
        ctx.font = '14px "VT323", monospace';
        ctx.fillStyle = isPrimary ? 'rgba(4,20,12,0.6)' : '#6f8a7a';
        ctx.textAlign = 'right';
        ctx.fillText(`[${r.id === 'runner' ? '1' : '2'}]`, r.x + r.w - 10, r.y + r.h - 8);
      }
    }

    // Footer
    ctx.font = '14px "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3a5a4d';
    ctx.fillText('VIBE JAM 2026 // portal=true to skip menu', ARENA.w / 2, ARENA.h - 14);

    if (this.showHowTo) this.drawHowTo(ctx);
  }

  drawHowTo(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, ARENA.w, ARENA.h);

    const boxW = 720;
    const boxH = 360;
    const x = (ARENA.w - boxW) / 2;
    const y = (ARENA.h - boxH) / 2;

    ctx.fillStyle = '#0a1812';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#00ff88';
    ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, boxH - 1);

    ctx.font = '32px "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('HOW TO PLAY', ARENA.w / 2, y + 50);

    ctx.font = '20px "VT323", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9fffd1';
    ctx.fillText('RUNNER', x + 40, y + 100);
    ctx.fillStyle = '#d8ffe9';
    wrapText(ctx, COPY.howTo.runner, x + 40, y + 124, boxW - 80, 22);

    ctx.fillStyle = '#9fffd1';
    ctx.font = '20px "VT323", monospace';
    ctx.fillText('CONTROLLER', x + 40, y + 218);
    ctx.fillStyle = '#d8ffe9';
    wrapText(ctx, COPY.howTo.controller, x + 40, y + 242, boxW - 80, 22);

    ctx.font = '16px "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6f8a7a';
    ctx.fillText('click anywhere or press ESC to close', ARENA.w / 2, y + boxH - 18);
  }
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      yy += lineH;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
