// Controller Mode: route entities to correct portals before stability hits zero.

import { ARENA, drawGrid, drawControlRoomFrame } from '../systems/Arena.js';
import { Input } from '../systems/Input.js';
import { Portal } from '../systems/Portal.js';
import { PORTAL_DESTINATIONS, getPortal } from '../data/portalDestinations.js';
import { ARCHETYPE_IDS, getArchetype, collisionEffect } from '../data/archetypes.js';
import { Entity } from '../systems/Entity.js';
import { Particles } from '../systems/Particles.js';
import { Audio } from '../systems/AudioSystem.js';
import { showModal, hideModal } from '../ui/Modal.js';
import { setHud, showExitButton, hideExitButton } from '../ui/Hud.js';
import { termLog } from '../systems/Terminal.js';
import { showControllerControls, hideAll as hideTouchAll, setControllerToolState } from '../systems/TouchControls.js';
import { COPY, pickRandom } from '../data/copy.js';

export class ControllerScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.elapsed = 0;
    this.score = 0;
    this.combo = 0;
    this.streakBest = 0;
    this.routedCorrect = 0;
    this.routedWrong = 0;
    this.totalRouted = 0;
    this.stability = 100;
    this.over = false;
    this.intro = 1.4;
    this.wave = 1;

    this.particles = new Particles();
    this.portals = PORTAL_DESTINATIONS.map((d) => new Portal(d, ARENA));
    this.entities = [];
    this.queue = []; // pending arrival queue
    this.spawnTimer = 1.0;
    this.queueTimer = 2.0;

    this.selected = null;
    this.freezeCooldown = 0;
    this.quarantineUses = 3;
    this.quarantine = []; // entities in holding pen

    this.collisionFlash = null;

    termLog('controller online // routing inbound traffic', 'ok');
    termLog(COPY.terminal.surge, 'warn');
  }

  destroy() { hideTouchAll(); hideExitButton(); }
  enter() {
    this.updateHud();
    showControllerControls({
      onFreeze: () => this.useFreeze(),
      onQuarantine: () => this.useQuarantine(),
    });
    showExitButton(() => this.confirmExit());
  }

  useFreeze() {
    if (this.over || !this.selected || this.freezeCooldown > 0) return;
    this.selected.frozenUntil = this.t + 1.5;
    this.freezeCooldown = 4.0;
    Audio.beep(1200);
    termLog(`freeze beam // ${this.selected.archetype.label}`);
  }

  useQuarantine() {
    if (this.over || !this.selected || this.quarantineUses <= 0) return;
    this.quarantineUses--;
    const idx = this.entities.indexOf(this.selected);
    if (idx >= 0) this.entities.splice(idx, 1);
    this.selected.x = 90;
    this.selected.y = 90;
    this.selected.vx = 0;
    this.selected.vy = 0;
    this.selected.assignedPortalId = null;
    this.quarantine.push(this.selected);
    termLog(`quarantined // ${this.selected.archetype.label}`, 'warn');
    this.selected = null;
    Audio.beep(440);
  }

  difficulty() {
    return {
      spawnInterval: Math.max(0.55, 2.4 - this.elapsed * 0.025),
      speedMult: 1 + this.elapsed / 180,
      patienceDecay: 0.04 + this.elapsed / 1200,
    };
  }

  spawnEntity() {
    const id = pickRandom(ARCHETYPE_IDS);
    const fromEdge = Math.floor(Math.random() * 4);
    let x, y;
    if (fromEdge === 0) { x = 30; y = 80 + Math.random() * (ARENA.h - 160); }
    else if (fromEdge === 1) { x = ARENA.w - 30; y = 80 + Math.random() * (ARENA.h - 160); }
    else if (fromEdge === 2) { x = 100 + Math.random() * (ARENA.w - 200); y = 30; }
    else { x = 100 + Math.random() * (ARENA.w - 200); y = ARENA.h - 30; }

    const e = new Entity({ archetypeId: id, x, y });
    e.speed = e.archetype.speed * 0.55 * this.difficulty().speedMult;
    e.assignedPortalId = null;
    e.patience = 1.0;
    // Initially wander toward center while waiting for routing
    e.wanderAngle = Math.random() * Math.PI * 2;
    this.entities.push(e);
    this.totalRouted++;
  }

  update(dt) {
    if (this.over) return;
    this.t += dt;

    if (this.intro > 0) {
      this.intro -= dt;
      for (const p of this.portals) p.update(dt);
      this.updateHud();
      return;
    }
    this.elapsed += dt;

    if (Input.wasPressed('Escape')) { this.confirmExit(); return; }

    // Tools
    if (Input.wasPressed('1') && this.selected) {
      // Quick: assign to correct portal as a hint? No — leave for click-to-route.
    }
    if (Input.wasPressed('f')) this.useFreeze();
    if (Input.wasPressed('q')) this.useQuarantine();
    if (this.freezeCooldown > 0) this.freezeCooldown -= dt;

    // Spawn
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.entities.length < 14) {
      this.spawnTimer = this.difficulty().spawnInterval;
      this.spawnEntity();
    }

    // Pointer input
    if (Input.consumePointerDown()) this.handleClick();

    for (const p of this.portals) p.update(dt);

    // Move entities
    const diff = this.difficulty();
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      const frozen = e.frozenUntil && this.t < e.frozenUntil;

      // Patience decay
      if (!e.assignedPortalId) {
        e.patience -= diff.patienceDecay * dt;
        if (e.patience <= 0) {
          // Self-route to a random (likely wrong) portal
          e.assignedPortalId = pickRandom(PORTAL_DESTINATIONS).id;
          termLog(`${e.archetype.label} self-routed`, 'warn');
        }
      }

      if (!frozen) {
        if (e.assignedPortalId) {
          const p = getPortal(e.assignedPortalId);
          e.setVelocityToward(p.x * ARENA.w, p.y * ARENA.h, e.speed);
        } else {
          // Wander softly around center
          e.wanderAngle += (Math.random() - 0.5) * dt * 2;
          e.vx = Math.cos(e.wanderAngle) * 30;
          e.vy = Math.sin(e.wanderAngle) * 30;
          // Drift toward middle
          const dx = ARENA.w / 2 - e.x;
          const dy = ARENA.h / 2 - e.y;
          const d = Math.hypot(dx, dy) || 1;
          e.vx += (dx / d) * 12;
          e.vy += (dy / d) * 12;
        }
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      }

      // Bound
      const r = e.radius;
      if (e.x < r) { e.x = r; e.vx = Math.abs(e.vx); }
      if (e.x > ARENA.w - r) { e.x = ARENA.w - r; e.vx = -Math.abs(e.vx); }
      if (e.y < r) { e.y = r; e.vy = Math.abs(e.vy); }
      if (e.y > ARENA.h - r) { e.y = ARENA.h - r; e.vy = -Math.abs(e.vy); }

      // Portal entry
      for (const p of this.portals) {
        if (p.contains(e.x, e.y)) {
          this.handleEntityEnterPortal(e, p);
          this.entities.splice(i, 1);
          break;
        }
      }
    }

    // Entity-entity collisions
    this.handleCollisions();

    this.particles.update(dt);
    this.updateHud();

    if (this.stability <= 0) this.gameOver();
  }

  handleClick() {
    const ptr = Input.pointer();

    // Portal click first if entity selected -> assign route
    if (this.selected) {
      for (const p of this.portals) {
        if (p.inAttractRange(ptr.x, ptr.y)) {
          this.selected.assignedPortalId = p.id;
          this.selected.patience = 1.0;
          p.pulseFlash();
          Audio.beep(880);
          termLog(`assigned ${this.selected.archetype.label} -> ${p.label}`);
          this.selected = null;
          return;
        }
      }
    }

    // Otherwise pick an entity
    let nearest = null;
    let bestD = 36 * 36;
    for (const e of this.entities) {
      const dx = ptr.x - e.x;
      const dy = ptr.y - e.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; nearest = e; }
    }
    if (nearest) {
      this.selected = nearest;
      Audio.beep(660);
    } else {
      this.selected = null;
    }
  }

  handleEntityEnterPortal(e, p) {
    Audio.portalEnter();
    this.particles.burst({ x: p.x, y: p.y, count: 20, speed: 200, color: p.color, life: 0.5, size: 2 });
    if (p.archetype === e.type) {
      this.routedCorrect++;
      this.combo++;
      this.streakBest = Math.max(this.streakBest, this.combo);
      const bonus = 100 + this.combo * 25;
      this.score += bonus;
      this.stability = Math.min(100, this.stability + 2);
      termLog(`${COPY.terminal.correctRoute} // ${e.archetype.label}`, 'ok');
      Audio.correct();
      p.pulseFlash();
    } else {
      this.routedWrong++;
      this.combo = 0;
      this.score = Math.max(0, this.score - 50);
      this.stability -= 12;
      termLog(`${COPY.terminal.wrongRoute} // ${e.archetype.label} -> ${p.label}`, 'err');
      Audio.wrong();
      this.particles.shake(4, 0.2);
      // Trigger chaos by archetype
      this.triggerChaos(e, p);
    }
  }

  triggerChaos(e, p) {
    switch (e.chaosType) {
      case 'explosion':
        termLog(COPY.terminal.explosion, 'err');
        Audio.explode();
        this.particles.burst({ x: p.x, y: p.y, count: 32, speed: 320, color: '#ff7a30', life: 0.7, size: 3 });
        this.particles.shake(8, 0.3);
        this.stability -= 8;
        break;
      case 'duplicate':
        termLog(COPY.terminal.duplicate, 'warn');
        for (let i = 0; i < 2; i++) this.spawnEntity();
        break;
      case 'panic':
        termLog(COPY.terminal.panic, 'warn');
        for (const ent of this.entities) ent.assignedPortalId = null;
        break;
      case 'jam':
        termLog(COPY.terminal.jam, 'warn');
        for (const ent of this.entities) ent.frozenUntil = this.t + 0.6;
        break;
      default:
        break;
    }
  }

  handleCollisions() {
    for (let i = 0; i < this.entities.length; i++) {
      const a = this.entities[i];
      for (let j = i + 1; j < this.entities.length; j++) {
        const b = this.entities[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const r = a.radius + b.radius;
        const d2 = dx * dx + dy * dy;
        if (d2 < r * r) {
          const d = Math.sqrt(d2) || 0.001;
          const push = (r - d) / 2 + 0.5;
          a.x += (dx / d) * push;
          a.y += (dy / d) * push;
          b.x -= (dx / d) * push;
          b.y -= (dy / d) * push;
          const now = this.t;
          if (now - a.lastCollideTime > 0.6 && now - b.lastCollideTime > 0.6) {
            a.lastCollideTime = now;
            b.lastCollideTime = now;
            const eff = collisionEffect(a.type, b.type);
            if (eff) {
              this.collisionFlash = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, life: 0.4 };
              this.stability -= eff === 'explosion' ? 10 : 5;
              this.particles.burst({
                x: (a.x + b.x) / 2,
                y: (a.y + b.y) / 2,
                count: 12,
                color: eff === 'explosion' ? '#ff7a30' : '#ffe66d',
                life: 0.4,
              });
              this.particles.shake(4, 0.18);
              if (eff === 'explosion') Audio.explode();
              else Audio.collide();
              termLog(`collision // ${a.archetype.label} + ${b.archetype.label} (${eff})`, 'warn');
            } else {
              Audio.beep(330);
              this.stability -= 0.5;
            }
          }
        }
      }
    }
  }

  updateHud() {
    setHud({
      topLeft: [
        { label: 'STABILITY', bar: { pct: this.stability, danger: this.stability < 35 } },
      ],
      topRight: [
        { label: 'SCORE', value: this.score },
        { label: 'COMBO', value: `x${this.combo}` },
      ],
      bottomLeft: [
        { label: 'CORRECT', value: this.routedCorrect },
        { label: 'WRONG',   value: this.routedWrong, warn: this.routedWrong > 0 },
      ],
      bottomRight: [],
    });
    setControllerToolState({
      freezeReady: this.freezeCooldown <= 0,
      quarantineUses: this.quarantineUses,
      hasSelected: !!this.selected,
    });
  }

  confirmExit() {
    if (this.over) return;
    this.over = true;
    showModal({
      title: 'PAUSED',
      body: 'leave shift?',
      actions: [
        { label: 'Resume', kind: 'primary', onClick: () => { hideModal(); this.over = false; } },
        { label: COPY.controller.mainMenu, onClick: () => { hideModal(); this.game.showMainMenu(); } },
      ],
    });
  }

  gameOver() {
    if (this.over) return;
    this.over = true;
    Audio.collapse();
    this.particles.shake(10, 0.6);
    termLog(COPY.controller.failureTitle, 'err');
    showModal({
      title: COPY.controller.failureTitle,
      danger: true,
      body: COPY.controller.failureBody,
      stats: {
        'Score': this.score,
        'Routed correctly': this.routedCorrect,
        'Wrong routes': this.routedWrong,
        'Best combo': this.streakBest,
        'Survived': `${this.elapsed.toFixed(1)}s`,
      },
      actions: [
        { label: COPY.controller.restart, kind: 'primary', onClick: () => { hideModal(); this.game.startController(); } },
        { label: COPY.controller.becomeRunner, onClick: () => { hideModal(); this.game.startRunner(); } },
        { label: COPY.controller.mainMenu, onClick: () => { hideModal(); this.game.showMainMenu(); } },
      ],
    });
  }

  draw(ctx) {
    const shake = this.particles.getShake();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    drawGrid(ctx, { t: this.t, controllerMode: true });

    // Routing line preview
    if (this.selected) {
      const ptr = Input.pointer();
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -this.t * 50;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.selected.x, this.selected.y);
      ctx.lineTo(ptr.x, ptr.y);
      ctx.stroke();
      ctx.restore();
    }

    // Entity assignment lines
    for (const e of this.entities) {
      if (!e.assignedPortalId) continue;
      const p = getPortal(e.assignedPortalId);
      ctx.save();
      ctx.strokeStyle = p.archetype === e.type ? 'rgba(0,255,136,0.30)' : 'rgba(255,77,77,0.30)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(p.x * ARENA.w, p.y * ARENA.h);
      ctx.stroke();
      ctx.restore();
    }

    // Portals
    for (const p of this.portals) p.draw(ctx);

    // Quarantine pen
    ctx.save();
    ctx.strokeStyle = '#ffb454';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(40, 40, 110, 110);
    ctx.setLineDash([]);
    ctx.font = '12px "VT323", monospace';
    ctx.fillStyle = '#ffb454';
    ctx.fillText('QUARANTINE', 44, 36);
    ctx.restore();

    for (let i = 0; i < this.quarantine.length; i++) {
      const e = this.quarantine[i];
      e.x = 60 + (i % 3) * 28;
      e.y = 60 + Math.floor(i / 3) * 28;
      e.draw(ctx);
    }

    // Entities
    for (const e of this.entities) {
      const isSel = e === this.selected;
      e.draw(ctx, { selected: isSel });

      // Patience ring
      if (!e.assignedPortalId) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = e.patience > 0.4 ? '#00ff88' : e.patience > 0.2 ? '#ffb454' : '#ff4d4d';
        ctx.beginPath();
        ctx.arc(e.x, e.y - e.radius - 8, 4, -Math.PI / 2, -Math.PI / 2 + Math.max(0, e.patience) * Math.PI * 2);
        ctx.stroke();
      }

      // Frozen indicator
      if (e.frozenUntil && this.t < e.frozenUntil) {
        ctx.strokeStyle = '#66e3ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Particles
    this.particles.draw(ctx);

    ctx.restore();

    // Control room frame on top
    drawControlRoomFrame(ctx, this.t);

    // Tutorial-ish hint
    ctx.font = 'bold 20px "VT323", monospace';
    ctx.fillStyle = 'rgba(0,255,136,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('TAP ENTITY -> TAP PORTAL TO ROUTE', ARENA.w / 2, ARENA.h - 32);

    // Intro overlay
    if (this.intro > 0) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.55, this.intro / 1.4)})`;
      ctx.fillRect(0, 0, ARENA.w, ARENA.h);
      ctx.font = 'bold 60px "VT323", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00ff88';
      ctx.fillText('CONTROLLER ONLINE', ARENA.w / 2, ARENA.h / 2 - 24);
      ctx.font = '30px "VT323", monospace';
      ctx.fillStyle = '#d8ffe9';
      ctx.fillText('route every entrant to the correct portal', ARENA.w / 2, ARENA.h / 2 + 24);
    }
  }
}
