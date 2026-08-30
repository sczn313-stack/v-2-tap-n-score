(function exposeSelfTeachingPlayer(global) {
  "use strict";

  class PausableTimer {
    constructor(clock = global) {
      this.clock = clock;
      this.handle = null;
      this.callback = null;
      this.remainingMs = 0;
      this.startedAt = 0;
    }

    start(durationMs, callback) {
      this.clear();
      this.callback = callback;
      this.remainingMs = Math.max(0, Number(durationMs) || 0);
      this.resume();
    }

    pause() {
      if (this.handle === null) return;
      this.clock.clearTimeout(this.handle);
      this.handle = null;
      this.remainingMs = Math.max(0, this.remainingMs - (Date.now() - this.startedAt));
    }

    resume() {
      if (!this.callback || this.handle !== null) return;
      this.startedAt = Date.now();
      this.handle = this.clock.setTimeout(() => {
        const callback = this.callback;
        this.handle = null;
        this.callback = null;
        this.remainingMs = 0;
        callback();
      }, this.remainingMs);
    }

    clear() {
      if (this.handle !== null) this.clock.clearTimeout(this.handle);
      this.handle = null;
      this.callback = null;
      this.remainingMs = 0;
      this.startedAt = 0;
    }
  }

  class SelfTeachingPlayer {
    constructor(options = {}) {
      this.root = options.root || null;
      this.steps = Array.isArray(options.steps) ? options.steps : [];
      this.renderStep = options.renderStep || (() => {});
      this.prepareStep = options.prepareStep || (() => Promise.resolve());
      this.renderReset = options.renderReset || (() => {});
      this.resolveAction = options.resolveAction || (() => null);
      this.demonstrateAction = options.demonstrateAction || (() => {});
      this.clearAction = options.clearAction || (() => {});
      this.onStatusChange = options.onStatusChange || (() => {});
      this.onNarrationStatus = options.onNarrationStatus || (() => {});
      this.audioFactory = options.audioFactory || (() => new global.Audio());
      this.timer = new PausableTimer(options.clock || global);
      this.audio = null;
      this.utterance = null;
      this.status = "idle";
      this.phase = "idle";
      this.stepIndex = -1;
      this.runToken = 0;
      this.pendingContinuation = null;
      this.narrationFinish = null;
      this.controls = null;
      this.activeActionElement = null;
      this.rewindMs = Math.max(1000, Number(options.rewindMs) || 10000);
      this.logicalElapsedMs = 0;
      this.logicalClockStartedAt = 0;
      this.stepHistory = [];
    }

    static controlsMarkup(label = "Self-teaching player") {
      return `<div class="self-teaching-player-controls" data-self-teaching-player-controls aria-label="${label}" hidden><button type="button" data-player-action="rewind">↶ <span>10 SEC</span></button><button type="button" data-player-action="toggle">▶ <span>PLAY</span></button><button type="button" data-player-action="restart">↻ <span>RESTART</span></button></div>`;
    }

    bindControls(element) {
      this.controls = element || null;
      if (!this.controls) return;
      this.controls.addEventListener("click", event => {
        const action = event.target.closest("[data-player-action]")?.dataset.playerAction;
        if (!action) return;
        event.preventDefault();
        event.stopPropagation();
        if (action === "rewind") this.rewind();
        if (action === "toggle") this.status === "playing" ? this.pause() : this.play();
        if (action === "restart") this.restart();
      });
      ["pointerdown", "pointerup", "pointercancel"].forEach(eventName => {
        this.controls.addEventListener(eventName, event => event.stopPropagation());
      });
      this._syncControls();
    }

    play() {
      if (this.status === "paused") return this.resume();
      if (this.status === "playing") return;
      this._beginRun();
    }

    pause() {
      if (this.status !== "playing") return;
      this._syncLogicalClock();
      this.logicalClockStartedAt = 0;
      this.status = "paused";
      this.timer.pause();
      if (this.activeActionElement) this.activeActionElement.classList.add("is-player-paused");
      if (this.phase === "narrating") {
        if (this.audio && !this.audio.paused) this.audio.pause();
        if (this.utterance && global.speechSynthesis && typeof global.speechSynthesis.pause === "function") global.speechSynthesis.pause();
      }
      this._publishStatus();
    }

    resume() {
      if (this.status !== "paused") return;
      this.status = "playing";
      this.logicalClockStartedAt = Date.now();
      if (this.activeActionElement) this.activeActionElement.classList.remove("is-player-paused");
      const continuation = this.pendingContinuation;
      this.pendingContinuation = null;
      if (this.phase === "narrating") {
        if (this.audio && this.audio.paused) this.audio.play().catch(() => {});
        if (this.utterance && global.speechSynthesis && typeof global.speechSynthesis.resume === "function") global.speechSynthesis.resume();
      }
      this.timer.resume();
      this._publishStatus();
      if (continuation) continuation();
    }

    restart() {
      this.stop({ reset: true });
      this._beginRun();
    }

    replay() { this.restart(); }

    rewind(milliseconds = this.rewindMs) {
      if (!this.steps.length || this.stepIndex < 0) return this.restart();
      const wasPaused = this.status === "paused";
      this._syncLogicalClock();
      const targetMs = Math.max(0, this.logicalElapsedMs - Math.max(0, Number(milliseconds) || this.rewindMs));
      const checkpoint = [...this.stepHistory].reverse().find(entry => entry.atMs <= targetMs)
        || this.stepHistory[0]
        || { index: 0, atMs: 0 };
      this.runToken += 1;
      this.timer.clear();
      this.pendingContinuation = null;
      this._stopNarration();
      this._clearActiveAction();
      this.logicalElapsedMs = checkpoint.atMs;
      this.logicalClockStartedAt = wasPaused ? 0 : Date.now();
      this.stepHistory = this.stepHistory.filter(entry => entry.atMs <= checkpoint.atMs);
      this.status = wasPaused ? "paused" : "playing";
      this.phase = "preparing";
      this.renderReset();
      this._publishStatus();
      this._enterStep(checkpoint.index, this.runToken, { recordHistory: false });
    }

    stop({ reset = false } = {}) {
      this.runToken += 1;
      this.timer.clear();
      this.pendingContinuation = null;
      this._stopNarration();
      this._clearActiveAction();
      this.phase = "idle";
      this.stepIndex = -1;
      this.status = "idle";
      if (reset) this.renderReset();
      this._publishStatus();
    }

    _beginRun() {
      this.runToken += 1;
      this.timer.clear();
      this._stopNarration();
      this.status = "playing";
      this.phase = "preparing";
      this.stepIndex = -1;
      this.logicalElapsedMs = 0;
      this.logicalClockStartedAt = Date.now();
      this.stepHistory = [];
      this.renderReset();
      this._publishStatus();
      this._enterStep(0, this.runToken);
    }

    _enterStep(index, token, { recordHistory = true } = {}) {
      if (token !== this.runToken) return;
      const step = this.steps[index];
      if (!step) return this._complete();
      this._syncLogicalClock();
      this.stepIndex = index;
      this.phase = "preparing";
      if (recordHistory) this.stepHistory.push({ index, atMs: this.logicalElapsedMs });
      this._syncControls();
      this.renderStep(step, index);
      if (step.terminal) return this._complete();
      Promise.resolve(this.prepareStep(step, index)).catch(() => {}).then(() => {
        if (token !== this.runToken) return;
        this._continueWhenPlaying(() => this._settleStep(step, index, token));
      });
    }

    _settleStep(step, index, token) {
      this.phase = "settling";
      this._delay(step.settleMs || 0, () => this._startNarration(step, index, token));
    }

    _startNarration(step, index, token) {
      if (!step.narration) return this._startAction(step, index, token);
      this.phase = "narrating";
      this._playNarration(step, () => this._startAction(step, index, token));
    }

    _startAction(step, index, token) {
      if (token !== this.runToken) return;
      if (!step.action) return this._holdStep(step, index, token);
      this.phase = "action-highlight";
      const action = typeof step.action === "string" ? { id: step.action } : step.action;
      const element = this.resolveAction(action, step, index);
      if (!element) return this._holdStep(step, index, token);
      this.activeActionElement = element;
      element.classList.add("self-teaching-player-action-highlight");
      this._delay(action.highlightMs ?? 900, () => {
        if (token !== this.runToken) return;
        this.phase = "action-tap";
        element.classList.add("is-demonstrated-tap");
        this.demonstrateAction(action, element, step, index);
        this._delay(action.tapMs ?? 420, () => {
          this._clearActiveAction(action, step, index);
          this._holdStep(step, index, token);
        });
      });
    }

    _holdStep(step, index, token) {
      if (token !== this.runToken) return;
      this.phase = "holding";
      this._delay(step.after ?? step.duration ?? 0, () => this._enterStep(index + 1, token));
    }

    _delay(durationMs, callback) {
      if ((Number(durationMs) || 0) <= 0) return callback();
      this.timer.start(durationMs, callback);
      if (this.status === "paused") this.timer.pause();
    }

    _continueWhenPlaying(callback) {
      if (this.status === "paused") this.pendingContinuation = callback;
      else callback();
    }

    _syncLogicalClock() {
      if (this.logicalClockStartedAt) {
        this.logicalElapsedMs += Math.max(0, Date.now() - this.logicalClockStartedAt);
        this.logicalClockStartedAt = this.status === "playing" ? Date.now() : 0;
      }
    }

    _clearActiveAction(action = null, step = null, index = this.stepIndex) {
      if (!this.activeActionElement) return;
      const element = this.activeActionElement;
      element.classList.remove("self-teaching-player-action-highlight", "is-demonstrated-tap");
      this.activeActionElement = null;
      this.clearAction(action, element, step, index);
    }

    _playNarration(step, onComplete) {
      const message = String(step.narration || "");
      const estimatedDuration = Math.max(1500, 520 + message.trim().split(/\s+/).length * 360);
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        this.timer.clear();
        this.narrationFinish = null;
        this.onNarrationStatus("complete", step);
        onComplete();
      };
      this.narrationFinish = finish;
      this.audio = this.audio || this.audioFactory();
      this.audio.onended = finish;
      this.audio.onerror = () => this._speechFallback(message, finish, estimatedDuration);
      this.audio.src = step.audio || "";
      this.audio.currentTime = 0;
      this.audio.play().then(() => this.onNarrationStatus("playing", step)).catch(() => {
        this.onNarrationStatus("fallback", step);
        this._speechFallback(message, finish, estimatedDuration);
      });
      this.timer.start(estimatedDuration + 4000, finish);
    }

    _speechFallback(message, finish, estimatedDuration) {
      if (!global.speechSynthesis || typeof global.SpeechSynthesisUtterance !== "function") {
        this.timer.start(estimatedDuration, finish);
        return;
      }
      global.speechSynthesis.cancel();
      this.utterance = new global.SpeechSynthesisUtterance(message);
      this.utterance.rate = 0.94;
      this.utterance.pitch = 1;
      this.utterance.onend = finish;
      this.utterance.onerror = () => this.timer.start(estimatedDuration, finish);
      global.speechSynthesis.speak(this.utterance);
    }

    _stopNarration() {
      if (this.audio) {
        this.audio.onended = null;
        this.audio.onerror = null;
        this.audio.pause();
        this.audio.currentTime = 0;
      }
      if (global.speechSynthesis) global.speechSynthesis.cancel();
      this.utterance = null;
      this.narrationFinish = null;
      this.onNarrationStatus("idle", null);
    }

    _complete() {
      this._syncLogicalClock();
      this.timer.clear();
      this._stopNarration();
      this._clearActiveAction();
      this.logicalClockStartedAt = 0;
      this.phase = "complete";
      this.status = "completed";
      this._publishStatus();
    }

    _publishStatus() {
      if (this.root) {
        this.root.dataset.playerStatus = this.status;
        this.root.classList.toggle("is-player-paused", this.status === "paused");
      }
      this._syncControls();
      this.onStatusChange(this.status, { phase: this.phase, stepIndex: this.stepIndex });
    }

    _syncControls() {
      if (!this.controls) return;
      const toggle = this.controls.querySelector('[data-player-action="toggle"]');
      const rewind = this.controls.querySelector('[data-player-action="rewind"]');
      const toggleLabel = toggle && toggle.querySelector("span");
      this.controls.hidden = this.status === "idle";
      if (toggleLabel) toggleLabel.textContent = this.status === "playing" ? "PAUSE" : (this.status === "paused" ? "RESUME" : "PLAY");
      if (toggle) toggle.setAttribute("aria-label", toggleLabel ? toggleLabel.textContent : "Play");
      if (rewind) rewind.disabled = this.stepIndex < 0;
    }
  }

  global.SCZN3SelfTeachingPlayer = Object.freeze({
    create: options => new SelfTeachingPlayer(options),
    controlsMarkup: SelfTeachingPlayer.controlsMarkup
  });
})(window);
