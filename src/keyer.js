// Turns key-down/key-up timestamps into dots, dashes and letters.
// Pure timing logic: the caller passes timestamps in milliseconds.

// A press shorter than this many dot units is a dot, otherwise a dash.
export const DASH_THRESHOLD_UNITS = 2;
// Silence longer than this many units ends the current letter. Standard
// spacing is 3 units; a little less keeps beginners' letters apart.
export const LETTER_GAP_UNITS = 2.5;

const MS_PER_MINUTE_AT_ONE_WPM = 1200;

export function unitMsForWpm(wpm) {
  if (!(wpm > 0)) throw new Error(`WPM must be positive, got ${wpm}`);
  return MS_PER_MINUTE_AT_ONE_WPM / wpm;
}

export function classifyPress(durationMs, unitMs) {
  return durationMs < unitMs * DASH_THRESHOLD_UNITS ? '.' : '-';
}

export class Keyer {
  constructor(unitMs) {
    this.unitMs = unitMs;
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

  // Returns the finished letter code once the gap is long enough, else null.
  poll(time) {
    if (this.isDown || !this.current) return null;
    if (time - this.lastUpAt < this.unitMs * LETTER_GAP_UNITS) return null;
    const letter = this.current;
    this.current = '';
    return letter;
  }
}
