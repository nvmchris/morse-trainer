import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode, encodeChar, normalizeCode, UNKNOWN_CHAR } from '../src/morse.js';

test('encodes single characters case-insensitively', () => {
  assert.equal(encodeChar('a'), '.-');
  assert.equal(encodeChar('0'), '-----');
  assert.equal(encodeChar('?'), '..--..');
});

test('encodes words with letter and word gaps', () => {
  assert.equal(encode('sos'), '... --- ...');
  assert.equal(encode('hi there'), '.... .. / - .... . .-. .');
});

test('throws on characters without a code', () => {
  assert.throws(() => encodeChar('#'), /No Morse code/);
});

test('decodes codes back to text', () => {
  assert.equal(decode('.... .. / - .... . .-. .'), 'HI THERE');
  assert.equal(decode(''), '');
});

test('marks unknown codes', () => {
  assert.equal(decode('........-'), UNKNOWN_CHAR);
});

test('round-trips every character', () => {
  const text = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?\'!/()&:;=+-_"$@';
  for (const ch of text) assert.equal(decode(encode(ch)), ch);
});

test('normalizes look-alike symbols and spacing', () => {
  assert.equal(normalizeCode('  ·–  _•  '), '.- -.');
  assert.equal(normalizeCode('.-/-...'), '.- / -...');
});
