// Turns key-down/key-up timestamps into dots, dashes and letters.
// Pure timing logic: the caller passes timestamps in milliseconds.

// A press shorter than this many dot units is a dot, otherwise a dash.
export const DASH_THRESHOLD_UNITS = 2;
// Silence this long ends the current letter. It is set in milliseconds,
// not dot units, so beginners can pause between symbols at any speed.
export const DEFAULT_LETTER_GAP_MS = 800;
export const LETTER_GAP_RANGE_MS = Object.freeze({ min: 300, max: 2000, step: 50 });

const MS_PER_MINUTE_AT_ONE_WPM = 1200;

export function unitMsForWpm(wpm) {
  if (!(wpm > 0)) throw new Error(`WPM must be positive, got ${wpm}`);
  return MS_PER_MINUTE_AT_ONE_WPM / wpm;
}

export function classifyPress(durationMs, unitMs) {
  return durationMs < unitMs * DASH_THRESHOLD_UNITS ? '.' : '-';
}

export class Keyer {
  constructor(unitMs, letterGapMs = DEFAULT_LETTER_GAP_MS) {
    this.unitMs = unitMs;
    this.letterGapMs = letterGapMs;
    this.reset();
  }

  reset() {
    this.current = '';
    this.downAt = null;
    this.lastUpAt = null;
  }

  get isDown() {
    return this.downAt !== null;
  }

  press(time) {
    if (this.isDown) return;
    this.downAt = time;
  }

  // Returns the symbol that was keyed, or null if the key was not down.
  release(time) {
    if (!this.isDown) return null;
    const symbol = classifyPress(time - this.downAt, this.unitMs);
    this.current += symbol;
    this.downAt = null;
    this.lastUpAt = time;
    return symbol;
  }

  // How far the current pause is towards ending the letter, from 0 to 1.
  pauseProgress(time) {
    if (this.isDown || !this.current) return 0;
    return Math.min(1, (time - this.lastUpAt) / this.letterGapMs);
  }

  // Returns the finished letter code once the gap is long enough, else null.
  poll(time) {
    if (this.isDown || !this.current) return null;
    if (this.pauseProgress(time) < 1) return null;
    const letter = this.current;
    this.current = '';
    return letter;
  }
}
