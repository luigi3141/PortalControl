// Runner Mode: player evades AI controller hazards to reach assigned portal.

import { ARENA, drawGrid } from '../systems/Arena.js';
import { Input } from '../systems/Input.js';
import { Portal } from '../systems/Portal.js';
import { PORTAL_DESTINATIONS, getPortal, portalForArchetype } from '../data/portalDestinations.js';
import { ARCHETYPES, ARCHETYPE_IDS, getArchetype, classifyByRef } from '../data/archetypes.js';
import { Entity } from '../systems/Entity.js';
import { Particles } from '../systems/Particles.js';
import { Audio } from '../systems/AudioSystem.js';
import { showModal, hideModal } from '../ui/Modal.js';
import { setHud, showExitButton, hideExitButton } from '../ui/Hud.js';
import { termLog } from '../systems/Terminal.js';
import { goToVibePortal } from '../systems/VibeJamIntegration.js';
import { showRunnerControls, hideAll as hideTouchAll, isTouchDevice } from '../systems/TouchControls.js';
import { COPY, pickRandom } from '../data/copy.js';

const RUN_SECONDS = 60;

export class RunnerScene {
  constructor(game, opts = {}) {
    this.game = game;
    this.t = 0;
    this.elapsed = 0;
    this.timeLeft = RUN_SECONDS;
    this.score = 0;
    this.combo = 0;
    this.collisions = 0;
    this.dashCount = 0;
    this.hazardLevel = 0;
    this.over = false;
    this.intro = 1.6;

    this.particles = new Particles();
    this.portals = PORTAL_DESTINATIONS.map((d) => new Portal(d, ARENA));

    // Determine player archetype + preferred portal
    const incoming = game.incoming || {};
    let archetypeId = 'vibeCoder';
    let username = 'portal_runner';
    let color = null;
    let speedMult = 1;
    let hp = 100;

    if (opts.portalArrival && incoming.isPortalArrival) {
      archetypeId = classifyByRef(incoming.ref) || 'vibeCoder';
      if (incoming.username) username = incoming.username;
      if (incoming.color) color = incoming.color;
      if (incoming.speed) speedMult = Math.max(0.6, Math.min(1.6, incoming.speed / 5));
      if (incoming.hp) hp = incoming.hp;
    } else {
      archetypeId = pickRandom(ARCHETYPE_IDS.filter((id) => id !== 'vibeCoder')) || 'duck';
      username = 'you';
    }

    const archetype = getArchetype(archetypeId);
    this.preferredPortal = portalForArchetype(archetypeId);

    // Spawn player at center
    this.player = new Entity({
      archetypeId,
      x: ARENA.w / 2,
      y: ARENA.h / 2,
      color: color || archetype.color,
      speed: archetype.speed * speedMult,
      hp,
      isPlayer: true,
      sourceRef: incoming.ref || null,
      isRealPortalEntrant: !!opts.portalArrival,
      displayName: username,
    });

    this.dashCooldown = 0;
    this.dashUntil = 0;
    this.dashSpeedBoost = 1;

    // Traffic, hazards
    this.traffic = [];
    this.gates = this.buildGates();
    this.beams = []; // redirect beams
    this.scannerPulses = [];
    this.spawnTrafficTimer = 1.2;
    this.beamTimer = 4;
    this.scannerTimer = 6;

    termLog(`[runner] you are a ${archetype.label}. reach the ${this.preferredPortal.label}.`);
    if (opts.portalArrival) termLog(`[runner] portal arrival // ref=${incoming.ref || 'unknown'}`, 'ok');
  }

  destroy() { hideTouchAll(); hideExitButton(); }
  enter() {
    this.updateHud();
    showRunnerControls();
    showExitButton(() => this.confirmExit());
  }

  buildGates() {
    // A few horizontal/vertical gates that cycle open/closed.
    return [
      { x: 360, y: 220, w: 100, h: 14, vertical: false, period: 4.0, phase: 0, openFrac: 0.5 },
      { x: 820, y: 220, w: 100, h: 14, vertical: false, period: 4.0, phase: 1.5, openFrac: 0.5 },
      { x: 360, y: 480, w: 100, h: 14, vertical: false, period: 5.0, phase: 0.7, openFrac: 0.5 },
      { x: 820, y: 480, w: 100, h: 14, vertical: false, period: 5.0, phase: 2.2, openFrac: 0.5 },
      { x: 620, y: 300, w: 14, h: 120, vertical: true,  period: 3.4, phase: 0, openFrac: 0.5 },
    ];
  }

  isGateClosed(g, t) {
    const phase = ((t + g.phase) % g.period) / g.period;
    return phase > g.openFrac;
  }

  updateHud() {
    const dashPct = Math.min(100, ((1 - Math.max(0, this.dashCooldown) / 1.4)) * 100);
    setHud({
      topLeft: [
        { label: 'TIME',    value: `${Math.max(0, this.timeLeft).toFixed(1)}s`, warn: this.timeLeft < 10 },
        { label: 'SCORE',   value: this.score },
      ],
      topRight: [
        { label: 'TARGET',  value: this.preferredPortal.label },
      ],
      bottomLeft: [
        { label: 'HP',      bar: { pct: (this.player.hp / this.player.maxHp) * 100, danger: this.player.hp < 30 } },
        { label: 'DASH',    bar: { pct: dashPct } },
      ],
      bottomRight: [
        { label: 'RUNNER',  value: this.player.displayName },
        { label: 'TYPE',    value: this.player.archetype.label },
      ],
    });
  }

  spawnTraffic(dt) {
    this.spawnTrafficTimer -= dt;
    const target = 4 + Math.min(8, Math.floor(this.elapsed / 8));
    if (this.spawnTrafficTimer <= 0 && this.traffic.length < target) {
      this.spawnTrafficTimer = Math.max(0.4, 1.6 - this.elapsed / 60);
      const id = pickRandom(ARCHETYPE_IDS);
      const fromEdge = Math.floor(Math.random() * 4);
      let x, y;
      if (fromEdge === 0) { x = -20; y = Math.random() * ARENA.h; }
      else if (fromEdge === 1) { x = ARENA.w + 20; y = Math.random() * ARENA.h; }
      else if (fromEdge === 2) { x = Math.random() * ARENA.w; y = -20; }
      else { x = Math.random() * ARENA.w; y = ARENA.h + 20; }

      const e = new Entity({ archetypeId: id, x, y });
      // Pick a random portal target so they crisscross
      const dest = PORTAL_DESTINATIONS[Math.floor(Math.random() * PORTAL_DESTINATIONS.length)];
      e.targetX = dest.x * ARENA.w;
      e.targetY = dest.y * ARENA.h;
      e.speed = e.archetype.speed * (0.7 + Math.random() * 0.5);
      this.traffic.push(e);
    }
  }

  spawnBeams(dt) {
    this.beamTimer -= dt;
    if (this.beamTimer <= 0) {
      this.beamTimer = Math.max(2.5, 6 - this.elapsed / 20);
      // Beam pushes player toward a random WRONG portal
      const wrongs = PORTAL_DESTINATIONS.filter((p) => p.id !== this.preferredPortal.id);
      const target = pickRandom(wrongs);
      this.beams.push({
        targetX: target.x * ARENA.w,
        targetY: target.y * ARENA.h,
        life: 3.0,
        max: 3.0,
        color: '#ff4d4d',
      });
      termLog('redirect beam active', 'warn');
    }
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= dt;
      if (b.life <= 0) this.beams.splice(i, 1);
    }
  }

  spawnScanners(dt) {
    this.scannerTimer -= dt;
    if (this.scannerTimer <= 0) {
      this.scannerTimer = Math.max(4, 9 - this.elapsed / 14);
      this.scannerPulses.push({
        x: this.player.x + (Math.random() - 0.5) * 200,
        y: this.player.y + (Math.random() - 0.5) * 200,
        r: 0,
        maxR: 220,
        life: 0.9,
        max: 0.9,
      });
    }
    for (let i = this.scannerPulses.length - 1; i >= 0; i--) {
      const s = this.scannerPulses[i];
      s.life -= dt;
      s.r = (1 - s.life / s.max) * s.maxR;
      if (s.life <= 0) this.scannerPulses.splice(i, 1);
    }
  }

  applyBeams(dt) {
    for (const b of this.beams) {
      // Pull player toward beam target weakly
      const dx = b.targetX - this.player.x;
      const dy = b.targetY - this.player.y;
      const d = Math.hypot(dx, dy) || 1;
      const strength = 50 * (b.life / b.max);
      this.player.x += (dx / d) * strength * dt;
      this.player.y += (dy / d) * strength * dt;
    }
  }

  applyScanners() {
    for (const s of this.scannerPulses) {
      const dx = this.player.x - s.x;
      const dy = this.player.y - s.y;
      const d = Math.hypot(dx, dy);
      if (Math.abs(d - s.r) < 18) {
        this.dashSpeedBoost = Math.min(this.dashSpeedBoost, 0.55);
      }
    }
  }

  collideGates() {
    for (const g of this.gates) {
      const closed = this.isGateClosed(g, this.t);
      if (!closed) continue;
      // Circle-rect collision
      const cx = Math.max(g.x, Math.min(this.player.x, g.x + g.w));
      const cy = Math.max(g.y, Math.min(this.player.y, g.y + g.h));
      const dx = this.player.x - cx;
      const dy = this.player.y - cy;
      const d2 = dx * dx + dy * dy;
      const r = this.player.radius;
      if (d2 < r * r) {
        const d = Math.sqrt(d2) || 0.001;
        const push = (r - d) + 1;
        this.player.x += (dx / d) * push;
        this.player.y += (dy / d) * push;
        if (this.t - this.player.lastCollideTime > 0.3) {
          this.player.takeDamage(this.player.archetype.id === 'bugReport' ? 2 : 6);
          this.player.lastCollideTime = this.t;
          this.collisions++;
          this.particles.shake(4, 0.15);
          Audio.collide();
        }
      }
    }
  }

  collideTraffic() {
    for (const e of this.traffic) {
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const r = this.player.radius + e.radius;
      const d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        const d = Math.sqrt(d2) || 0.001;
        const push = (r - d) + 1;
        this.player.x += (dx / d) * push;
        this.player.y += (dy / d) * push;
        if (this.t - this.player.lastCollideTime > 0.3) {
          this.player.takeDamage(8);
          this.player.lastCollideTime = this.t;
          this.collisions++;
          this.particles.burst({ x: this.player.x, y: this.player.y, count: 8, speed: 120, color: e.color, life: 0.4, size: 2 });
          this.particles.shake(5, 0.18);
          Audio.collide();
          if (this.player.archetype.id === 'missile') {
            this.particles.burst({ x: e.x, y: e.y, count: 24, speed: 260, color: '#ff7a30', life: 0.6, size: 3 });
            this.particles.shake(8, 0.25);
            Audio.explode();
            e.alive = false;
          }
        }
      }
    }
  }

  checkPortals() {
    for (const p of this.portals) {
      if (p.contains(this.player.x, this.player.y)) {
        Audio.portalEnter();
        this.particles.burst({ x: p.x, y: p.y, count: 40, speed: 280, color: p.color, life: 0.7, size: 3 });
        this.particles.shake(7, 0.35);
        if (p.id === this.preferredPortal.id) {
          this.score += 1000 + Math.floor(this.timeLeft * 20) - this.collisions * 25;
          this.success();
        } else {
          this.fail('wrong-portal');
        }
        return;
      }
    }
  }

  movePlayer(dt) {
    const ax = Input.axes();
    const arch = this.player.archetype;

    // Dash
    let dashing = this.t < this.dashUntil;
    const dashRequested = Input.wasPressed(' ') || Input.consumeDash();
    if (dashRequested && this.dashCooldown <= 0 && (ax.x || ax.y)) {
      this.dashUntil = this.t + 0.18;
      this.dashCooldown = 1.4;
      this.dashCount++;
      Audio.dash();
      this.particles.burst({ x: this.player.x, y: this.player.y, count: 10, speed: 120, color: this.player.color, life: 0.35, size: 2 });
      dashing = true;
    }
    if (this.dashCooldown > 0) this.dashCooldown -= dt;

    let speed = this.player.speed;
    if (dashing) speed *= 2.2;
    if (Input.isDown('Shift')) speed *= 0.55;
    speed *= this.dashSpeedBoost;
    this.dashSpeedBoost = 1;

    // Missile turn limitation
    if (arch.id === 'missile' && (ax.x || ax.y)) {
      const desiredAngle = Math.atan2(ax.y, ax.x);
      const cur = Math.atan2(this.player.vy || 0, this.player.vx || 1);
      const turn = arch.turnRate || 2.4;
      let diff = desiredAngle - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const limit = turn * dt;
      const newA = cur + Math.max(-limit, Math.min(limit, diff));
      this.player.vx = Math.cos(newA) * speed;
      this.player.vy = Math.sin(newA) * speed;
    } else if (arch.id === 'racer') {
      const at = arch.accelTime || 0.9;
      const targetX = ax.x * speed;
      const targetY = ax.y * speed;
      const k = Math.min(1, dt / at);
      this.player.vx += (targetX - this.player.vx) * k;
      this.player.vy += (targetY - this.player.vy) * k;
    } else if (arch.id === 'paperPlane') {
      // Glides: low friction, momentum bias
      const targetX = ax.x * speed;
      const targetY = ax.y * speed;
      this.player.vx += (targetX - this.player.vx) * dt * 2.0;
      this.player.vy += (targetY - this.player.vy) * dt * 2.0;
    } else if (arch.id === 'aiAgent') {
      // Erratic: small random jitter
      this.player.vx = ax.x * speed + (Math.random() - 0.5) * speed * 0.18;
      this.player.vy = ax.y * speed + (Math.random() - 0.5) * speed * 0.18;
    } else {
      this.player.vx = ax.x * speed;
      this.player.vy = ax.y * speed;
    }

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Trail
    this.player.trailT += dt;
    if (this.player.trailT > 0.04) {
      this.player.trailT = 0;
      this.particles.trail({
        x: this.player.x, y: this.player.y,
        color: this.player.color, life: 0.35, size: 3,
      });
    }

    // Bound
    const r = this.player.radius;
    if (this.player.x < r) this.player.x = r;
    if (this.player.x > ARENA.w - r) this.player.x = ARENA.w - r;
    if (this.player.y < r) this.player.y = r;
    if (this.player.y > ARENA.h - r) this.player.y = ARENA.h - r;
  }

  moveTraffic(dt) {
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const e = this.traffic[i];
      if (!e.alive) { this.traffic.splice(i, 1); continue; }
      e.setVelocityToward(e.targetX, e.targetY, e.speed);
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      // Despawn if reached or off-screen
      const dx = e.x - e.targetX;
      const dy = e.y - e.targetY;
      if (dx * dx + dy * dy < 30 * 30) this.traffic.splice(i, 1);
      else if (e.x < -60 || e.x > ARENA.w + 60 || e.y < -60 || e.y > ARENA.h + 60) this.traffic.splice(i, 1);
    }
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
    this.timeLeft -= dt;

    // Pause
    if (Input.wasPressed('Escape')) {
      this.confirmExit();
      return;
    }

    for (const p of this.portals) p.update(dt);
    this.spawnTraffic(dt);
    this.spawnBeams(dt);
    this.spawnScanners(dt);
    this.applyBeams(dt);
    this.applyScanners();
    this.movePlayer(dt);
    this.moveTraffic(dt);
    this.collideGates();
    this.collideTraffic();
    this.checkPortals();
    this.particles.update(dt);

    if (this.player.hp <= 0) this.fail('hp');
    if (this.timeLeft <= 0) this.fail('timer');

    this.updateHud();
  }

  confirmExit() {
    if (this.over) return;
    this.over = true;
    showModal({
      title: 'PAUSED',
      body: 'leave the run?',
      actions: [
        { label: 'Resume', kind: 'primary', onClick: () => { hideModal(); this.over = false; } },
        { label: COPY.runner.mainMenu, onClick: () => { hideModal(); this.game.showMainMenu(); } },
      ],
    });
  }

  success() {
    if (this.over) return;
    this.over = true;
    Audio.correct();
    termLog('PORTAL LOCK ACQUIRED', 'ok');
    const stats = {
      'Score': this.score,
      'Time left': `${Math.max(0, this.timeLeft).toFixed(1)}s`,
      'Collisions': this.collisions,
      'Dashes used': this.dashCount,
      'Archetype': this.player.archetype.label,
    };
    showModal({
      title: COPY.runner.successTitle,
      body: COPY.runner.successBody,
      stats,
      actions: [
        {
          label: COPY.runner.enterPortal,
          kind: 'primary',
          onClick: () => {
            Audio.portalEnter();
            goToVibePortal({
              username: this.player.displayName,
              color: this.player.color,
              speed: Math.round(this.player.archetype.speed / 25),
              hp: this.player.hp,
            });
          },
        },
        { label: COPY.runner.runAgain, onClick: () => { hideModal(); this.game.startRunner(); } },
        { label: COPY.runner.becomeController, onClick: () => { hideModal(); this.game.startController(); } },
        { label: COPY.runner.mainMenu, onClick: () => { hideModal(); this.game.showMainMenu(); } },
      ],
    });
  }

  fail(reason) {
    if (this.over) return;
    this.over = true;
    Audio.wrong();
    this.particles.shake(8, 0.3);
    termLog(`MISROUTED // ${reason}`, 'err');
    const body = pickRandom(COPY.runner.failureBodies);
    showModal({
      title: COPY.runner.failureTitle,
      danger: true,
      body,
      stats: {
        'Reason': reason.toUpperCase(),
        'Score': this.score,
        'Collisions': this.collisions,
        'Archetype': this.player.archetype.label,
      },
      actions: [
        { label: COPY.runner.retry, kind: 'primary', onClick: () => { hideModal(); this.game.startRunner(); } },
        { label: COPY.runner.becomeController, onClick: () => { hideModal(); this.game.startController(); } },
        { label: COPY.runner.mainMenu, onClick: () => { hideModal(); this.game.showMainMenu(); } },
      ],
    });
  }

  draw(ctx) {
    const shake = this.particles.getShake();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    drawGrid(ctx, { t: this.t });

    // Beams
    for (const b of this.beams) {
      const a = b.life / b.max;
      ctx.save();
      ctx.globalAlpha = 0.2 + a * 0.4;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -this.t * 60;
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      ctx.lineTo(b.targetX, b.targetY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Gates
    for (const g of this.gates) {
      const closed = this.isGateClosed(g, this.t);
      ctx.fillStyle = closed ? 'rgba(255,77,77,0.8)' : 'rgba(0,255,136,0.25)';
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = closed ? '#ff4d4d' : '#00ff88';
      ctx.lineWidth = 1;
      ctx.strokeRect(g.x + 0.5, g.y + 0.5, g.w - 1, g.h - 1);
    }

    // Scanner pulses
    for (const s of this.scannerPulses) {
      const a = s.life / s.max;
      ctx.strokeStyle = `rgba(102, 227, 255, ${a * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Portals (preferred highlighted)
    for (const p of this.portals) {
      p.draw(ctx, {
        highlight: p.id === this.preferredPortal.id,
        danger: p.id !== this.preferredPortal.id && Math.sin(this.t * 4 + p.x) > 0.6,
      });
    }

    // Traffic
    for (const e of this.traffic) e.draw(ctx);

    // Player
    this.player.draw(ctx);

    // Particles
    this.particles.draw(ctx);

    ctx.restore();

    // Intro overlay
    if (this.intro > 0) {
      const a = this.intro > 1.0 ? (this.intro - 1.0) / 0.6 : (this.intro / 1.0);
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, ARENA.w, ARENA.h);
      ctx.globalAlpha = 1;

      ctx.font = '48px "VT323", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`YOU ARE A ${this.player.archetype.label.toUpperCase()}`, ARENA.w / 2, ARENA.h / 2 - 30);
      ctx.font = '28px "VT323", monospace';
      ctx.fillStyle = '#d8ffe9';
      ctx.fillText(`reach the ${this.preferredPortal.label}`, ARENA.w / 2, ARENA.h / 2 + 10);
      ctx.font = '18px "VT323", monospace';
      ctx.fillStyle = '#6f8a7a';
      const controlsHint = isTouchDevice()
        ? 'drag left side to move // tap DASH to dash'
        : 'WASD or arrows to move // SPACE to dash // ESC to pause';
      ctx.fillText(controlsHint, ARENA.w / 2, ARENA.h / 2 + 48);
    }
  }
}
