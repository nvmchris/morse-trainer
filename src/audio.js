// Sidetone and playback through one always-running oscillator whose gain is
// switched on and off, which avoids clicks and start-up lag.

const TONE_HZ = 600;
const VOLUME = 0.25;
const RAMP_S = 0.005;
const START_DELAY_S = 0.05;
// Gaps in dot units, on top of the 1-unit gap already added after a symbol.
const EXTRA_GAP_UNITS = { ' ': 2, '/': 2 };

export class Tone {
  #ctx = null;
  #gain = null;

  #ensureStarted() {
    if (!this.#ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.#ctx = new AudioCtx();
      this.#gain = this.#ctx.createGain();
      this.#gain.gain.value = 0;
      this.#gain.connect(this.#ctx.destination);
      const osc = this.#ctx.createOscillator();
      osc.frequency.value = TONE_HZ;
      osc.connect(this.#gain);
      osc.start();
    }
    if (this.#ctx.state === 'suspended') this.#ctx.resume();
    return this.#ctx.currentTime;
  }

  #setLevel(level) {
    const now = this.#ensureStarted();
    const gain = this.#gain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(level, now + RAMP_S);
  }

  on() {
    this.#setLevel(VOLUME);
  }

  off() {
    this.#setLevel(0);
  }

  // Plays a code ("." "-" " " "/") and returns its length in milliseconds.
  play(code, unitMs) {
    const now = this.#ensureStarted();
    const unit = unitMs / 1000;
    const gain = this.#gain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(0, now);
    let t = now + START_DELAY_S;
    for (const symbol of code) {
      if (symbol === '.' || symbol === '-') {
        const length = symbol === '.' ? unit : 3 * unit;
        gain.setValueAtTime(0, t);
        gain.linearRampToValueAtTime(VOLUME, t + RAMP_S);
        gain.setValueAtTime(VOLUME, t + length - RAMP_S);
        gain.linearRampToValueAtTime(0, t + length);
        t += length + unit;
      } else {
        t += (EXTRA_GAP_UNITS[symbol] ?? 0) * unit;
      }
    }
    return (t - now) * 1000;
  }

  stop() {
    if (this.#ctx) this.off();
  }
}
