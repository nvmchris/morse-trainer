// Mastery: a 0–1 score per item that rises slowly on right answers and
// drops sharply on wrong ones, and drives how often an item is practised.

// At or above this score an item counts as known.
export const MASTERY_THRESHOLD = 0.9;
// Each answer moves the score this fraction of the way to 1 (right) or 0
// (wrong). A miss costs far more than a hit earns, so after a mistake it
// takes many right answers in a row to climb back above the threshold.
export const RIGHT_STEP = 0.15;
export const WRONG_STEP = 0.35;
// Relative chance of being picked. Known items keep a small weight so they
// are still reviewed; the weaker an item, the closer it gets to the max.
export const WEIGHT_KNOWN = 1;
export const WEIGHT_LEARNING_MIN = 3;
export const WEIGHT_LEARNING_MAX = 10;

export const UNSEEN_SCORE = 0;

export function itemKey(item) {
  return `${item.kind}:${item.text}`;
}

export function updateScore(score, correct) {
  const current = score ?? UNSEEN_SCORE;
  return correct ? current + (1 - current) * RIGHT_STEP : current * (1 - WRONG_STEP);
}

export function isKnown(score) {
  return (score ?? UNSEEN_SCORE) >= MASTERY_THRESHOLD;
}

export function selectionWeight(score) {
  const current = score ?? UNSEEN_SCORE;
  if (isKnown(current)) return WEIGHT_KNOWN;
  const weakness = 1 - current / MASTERY_THRESHOLD; // 1 at 0%, near 0 just below 90%
  return WEIGHT_LEARNING_MIN + (WEIGHT_LEARNING_MAX - WEIGHT_LEARNING_MIN) * weakness;
}

export function toPercent(score) {
  return Math.round((score ?? UNSEEN_SCORE) * 100);
}
