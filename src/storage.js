import { DEFAULT_LETTER_GAP_MS } from './keyer.js';

// Saved settings and lesson progress. Storage can be unavailable (private
// windows, blocked site data), so the app must work without it.

const STORAGE_KEY = 'morse-trainer';

export const DEFAULTS = Object.freeze({
  wpm: 12,
  sound: true,
  letterGapMs: DEFAULT_LETTER_GAP_MS,
  completedLessons: [],
  // Mastery score (0–1) per item, keyed by itemKey().
  scores: {},
});

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return { ...DEFAULTS, ...saved };
  } catch (error) {
    console.warn('Could not load saved state', error);
    return { ...DEFAULTS };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Could not save state', error);
  }
}
