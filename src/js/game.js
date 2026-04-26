// Game host and scene manager.

import { ARENA } from './systems/Arena.js';
import { hideModal } from './ui/Modal.js';
import { hideHud, showHud } from './ui/Hud.js';
import { showTerminal, clearTerminal, termBoot } from './systems/Terminal.js';
import { hideAll as hideTouchAll } from './systems/TouchControls.js';
import { COPY } from './data/copy.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { RunnerScene } from './scenes/RunnerScene.js';
import { ControllerScene } from './scenes/ControllerScene.js';

export class Game {
  constructor(canvas, { incoming } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.scene = null;
    this.incoming = incoming;
    this.renderScale = 1;
    this.time = 0;
  }

  setRenderScale(s) { this.renderScale = s; }

  setScene(scene) {
    this.scene?.destroy?.();
    hideModal();
    hideHud();
    this.scene = scene;
    this.scene.enter?.();
  }

  showMainMenu() {
    showTerminal(false);
    hideTouchAll();
    this.setScene(new MainMenuScene(this));
  }

  startRunner(opts = {}) {
    showTerminal(true);
    clearTerminal();
    termBoot(COPY.terminal.boot);
    showHud();
    this.setScene(new RunnerScene(this, opts));
  }

  startController(opts = {}) {
    showTerminal(true);
    clearTerminal();
    termBoot(COPY.terminal.boot);
    showHud();
    this.setScene(new ControllerScene(this, opts));
  }

  update(dt) {
    this.time += dt;
    this.scene?.update?.(dt);
  }

  draw() {
    const { ctx, canvas } = this;
    // Set transform for logical 1280x720 -> canvas size
    const sx = canvas.width / ARENA.w;
    const sy = canvas.height / ARENA.h;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.clearRect(0, 0, ARENA.w, ARENA.h);
    this.scene?.draw?.(ctx);
  }
}
