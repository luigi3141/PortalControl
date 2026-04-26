// Generic moving entity used in both modes.
// Holds archetype, position, velocity, hp, desired/assigned portals.

import { ARCHETYPES, getArchetype } from '../data/archetypes.js';

let nextId = 1;

export class Entity {
  constructor({ archetypeId, x, y, color, speed, hp, isPlayer = false, sourceRef = null, isRealPortalEntrant = false, displayName = null }) {
    const a = getArchetype(archetypeId);
    this.id = `e${nextId++}`;
    this.type = archetypeId;
    this.archetype = a;
    this.displayName = displayName || a.label;
    this.icon = a.icon;
    this.color = color || a.color;
    this.baseSpeed = speed != null ? speed : a.speed;
    this.speed = this.baseSpeed;
    this.maxHp = a.hp;
    this.hp = hp != null ? hp : a.hp;
    this.radius = a.radius;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isPlayer = isPlayer;
    this.desiredPortalId = a.desiredPortalId;
    this.assignedPortalId = null;
    this.patience = 1.0; // Controller mode: decays over time
    this.chaosType = a.chaosType;
    this.sourceRef = sourceRef;
    this.isRealPortalEntrant = isRealPortalEntrant;

    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.alive = true;
    this.scoreState = 'pending'; // pending|correct|wrong
    this.lastCollideTime = -1e9;
    this.facing = 0;

    // Trail
    this.trailT = 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) this.alive = false;
  }

  setVelocityToward(tx, ty, speed = this.speed) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.001) { this.vx = 0; this.vy = 0; return; }
    this.vx = (dx / d) * speed;
    this.vy = (dy / d) * speed;
  }

  draw(ctx, { selected = false } = {}) {
    const r = this.radius;

    if (selected) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, r + 6 + Math.sin(performance.now() / 200) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + r - 2, r * 0.9, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Glow ring
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Icon
    ctx.font = `${Math.floor(r * 1.2)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, this.x, this.y + 1);
    ctx.textBaseline = 'alphabetic';

    // Name (player only)
    if (this.isPlayer && this.displayName) {
      ctx.font = '12px "VT323", monospace';
      ctx.fillStyle = '#d8ffe9';
      ctx.fillText(this.displayName, this.x, this.y - r - 6);
    }
  }
}

export const ARCHETYPE_LIST = Object.values(ARCHETYPES);
