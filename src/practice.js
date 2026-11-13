// Practice rules: building the pool, picking items and checking answers.
import { CATEGORIES } from './items.js';
import { normalizeCode } from './morse.js';

export const DIRECTION = Object.freeze({
  ENCODE: 'encode', // see text, send Morse
  DECODE: 'decode', // see or hear Morse, type text
});

// Prosigns share codes with signs, so typed text cannot name them.
const DECODE_EXCLUDED_KINDS = new Set(['prosign']);

export function buildPool(categoryKeys, direction) {
  const items = categoryKeys.flatMap((key) => {
    const category = CATEGORIES[key];
    if (!category) throw new Error(`Unknown category "${key}"`);
    return category.items;
  });
  return filterForDirection(items, direction);
}

export function filterForDirection(items, direction) {
  if (direction !== DIRECTION.DECODE) return items;
  return items.filter((item) => !DECODE_EXCLUDED_KINDS.has(item.kind));
}

// Picks a random item, avoiding an immediate repeat when possible.
export function pickNext(pool, previous, random = Math.random) {
  if (pool.length === 0) return null;
  const candidates = pool.length > 1 ? pool.filter((item) => item !== previous) : pool;
  return candidates[Math.floor(random() * candidates.length)];
}

export function checkAnswer(item, answer, direction) {
  if (direction === DIRECTION.ENCODE) return normalizeCode(answer) === item.code;
  return answer.trim().replace(/\s+/g, ' ').toUpperCase() === item.text;
}
