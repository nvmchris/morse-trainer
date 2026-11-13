// Practice items: { text, code, kind, note? }. Shared by every view.
import { LETTERS, NUMBERS, SIGNS, PROSIGNS, encode } from './morse.js';
import { WORDS } from './words.js';

function fromTable(table, kind) {
  return Object.entries(table).map(([text, code]) => ({ text, code, kind }));
}

export const CATEGORIES = Object.freeze({
  letters: { label: 'Letters', items: fromTable(LETTERS, 'letter') },
  numbers: { label: 'Numbers', items: fromTable(NUMBERS, 'number') },
  signs: { label: 'Signs', items: fromTable(SIGNS, 'sign') },
  prosigns: {
    label: 'Prosigns',
    items: PROSIGNS.map((p) => ({ ...p, kind: 'prosign' })),
  },
  words: {
    label: 'Words',
    items: WORDS.map((text) => ({ text, code: encode(text), kind: 'word' })),
  },
});

const SINGLE_CHAR_ITEMS = new Map(
  ['letters', 'numbers', 'signs'].flatMap((key) =>
    CATEGORIES[key].items.map((item) => [item.text, item]),
  ),
);

export function itemForChar(ch) {
  const item = SINGLE_CHAR_ITEMS.get(ch.toUpperCase());
  if (!item) throw new Error(`Unknown character "${ch}"`);
  return item;
}

// Prosigns are shown with angle brackets so they read as one signal.
export function displayText(item) {
  return item.kind === 'prosign' ? `<${item.text}>` : item.text;
}

export function letterCount(item) {
  return item.code.split(' ').filter((part) => part !== '/').length;
}
