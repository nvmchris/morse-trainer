// International Morse code tables and encode/decode helpers.
// Codes use "." and "-"; letters are separated by " " and words by " / ".

export const LETTERS = Object.freeze({
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
});

export const NUMBERS = Object.freeze({
  1: '.----',
  2: '..---',
  3: '...--',
  4: '....-',
  5: '.....',
  6: '-....',
  7: '--...',
  8: '---..',
  9: '----.',
  0: '-----',
});

export const SIGNS = Object.freeze({
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
});

// Prosigns are sent as one run with no letter gap. Several share a code
// with a sign, so they are kept out of the decode table.
export const PROSIGNS = Object.freeze([
  { text: 'AR', code: '.-.-.', note: 'end of message (same as +)' },
  { text: 'AS', code: '.-...', note: 'wait (same as &)' },
  { text: 'BT', code: '-...-', note: 'break / new paragraph (same as =)' },
  { text: 'CT', code: '-.-.-', note: 'start of transmission' },
  { text: 'KN', code: '-.--.', note: 'go ahead, named station only (same as ()' },
  { text: 'SK', code: '...-.-', note: 'end of contact' },
  { text: 'SOS', code: '...---...', note: 'distress signal' },
  { text: 'HH', code: '........', note: 'error, ignore last word' },
]);

const CHAR_TO_CODE = Object.freeze({ ...LETTERS, ...NUMBERS, ...SIGNS });

const CODE_TO_CHAR = Object.freeze(
  Object.fromEntries(Object.entries(CHAR_TO_CODE).map(([ch, code]) => [code, ch])),
);

export const UNKNOWN_CHAR = '�';

export function encodeChar(ch) {
  const code = CHAR_TO_CODE[ch.toUpperCase()];
  if (!code) throw new Error(`No Morse code for character "${ch}"`);
  return code;
}

export function encode(text) {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => [...word].map(encodeChar).join(' '))
    .join(' / ');
}

export function decodeSymbol(code) {
  return CODE_TO_CHAR[code] ?? UNKNOWN_CHAR;
}

export function decode(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return '';
  return normalized
    .split(' / ')
    .map((word) => word.split(' ').map(decodeSymbol).join(''))
    .join(' ');
}

// Accepts the look-alike characters people type for dots and dashes and
// tidies whitespace so answers compare reliably.
export function normalizeCode(input) {
  return input
    .replace(/[·•∙*]/g, '.')
    .replace(/[_–—−]/g, '-')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();
}
