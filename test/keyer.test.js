import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Keyer, classifyPress, unitMsForWpm, LETTER_GAP_UNITS } from '../src/keyer.js';

const UNIT = unitMsForWpm(12); // 100 ms

test('converts WPM to dot length', () => {
  assert.equal(UNIT, 100);
  assert.throws(() => unitMsForWpm(0), /positive/);
});

test('short presses are dots, long presses dashes', () => {
  assert.equal(classifyPress(90, UNIT), '.');
  assert.equal(classifyPress(199, UNIT), '.');
  assert.equal(classifyPress(200, UNIT), '-');
  assert.equal(classifyPress(350, UNIT), '-');
});

test('builds a letter and ends it after a gap', () => {
  const keyer = new Keyer(UNIT);
  keyer.press(0);
  assert.equal(keyer.release(100), '.');
  keyer.press(200);
  assert.equal(keyer.release(500), '-');
  assert.equal(keyer.poll(550), null);
  assert.equal(keyer.poll(500 + UNIT * LETTER_GAP_UNITS), '.-');
  assert.equal(keyer.poll(2000), null);
});

test('does not end a letter while the key is down', () => {
  const keyer = new Keyer(UNIT);
  keyer.press(0);
  keyer.release(100);
  keyer.press(150);
  assert.equal(keyer.poll(5000), null);
});

test('ignores repeated presses and stray releases', () => {
  const keyer = new Keyer(UNIT);
  assert.equal(keyer.release(10), null);
  keyer.press(0);
  keyer.press(50);
  assert.equal(keyer.release(300), '-');
});
