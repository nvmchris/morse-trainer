import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTION, buildPool, pickNext, checkAnswer } from '../src/practice.js';
import { CATEGORIES, letterCount, displayText } from '../src/items.js';
import { LESSONS, lessonPracticeItems } from '../src/lessons.js';

test('builds pools from categories', () => {
  const pool = buildPool(['letters', 'numbers'], DIRECTION.ENCODE);
  assert.equal(pool.length, 36);
  assert.throws(() => buildPool(['nope'], DIRECTION.ENCODE), /Unknown category/);
});

test('leaves prosigns out when decoding', () => {
  assert.equal(buildPool(['prosigns'], DIRECTION.DECODE).length, 0);
  assert.ok(buildPool(['prosigns'], DIRECTION.ENCODE).length > 0);
});

test('every word in the list can be encoded', () => {
  for (const item of CATEGORIES.words.items) assert.ok(item.code.length > 0, item.text);
});

test('picks without repeating the previous item', () => {
  const pool = CATEGORIES.letters.items.slice(0, 2);
  assert.equal(
    pickNext(pool, pool[0], () => 0),
    pool[1],
  );
  assert.equal(pickNext([], null), null);
  assert.equal(pickNext([pool[0]], pool[0]), pool[0]);
});

test('checks sent Morse', () => {
  const hello = CATEGORIES.words.items.find((i) => i.text === 'HELLO');
  assert.ok(checkAnswer(hello, '.... . .-.. .-.. ---', DIRECTION.ENCODE));
  assert.ok(checkAnswer(hello, '  ....  .  .-..  .-..  ---  ', DIRECTION.ENCODE));
  assert.ok(!checkAnswer(hello, '.... . .-.. .-..', DIRECTION.ENCODE));
});

test('checks read text', () => {
  const item = CATEGORIES.letters.items[0];
  assert.ok(checkAnswer(item, ' a ', DIRECTION.DECODE));
  assert.ok(!checkAnswer(item, 'b', DIRECTION.DECODE));
});

test('counts letters and shows prosigns in brackets', () => {
  const hello = CATEGORIES.words.items.find((i) => i.text === 'HELLO');
  assert.equal(letterCount(hello), 5);
  const sos = CATEGORIES.prosigns.items.find((i) => i.text === 'SOS');
  assert.equal(letterCount(sos), 1);
  assert.equal(displayText(sos), '<SOS>');
});

test('lessons cover every letter, number and sign once', () => {
  const chars = LESSONS.slice(0, -1).flatMap((l) => l.items.map((i) => i.text));
  const expected = ['letters', 'numbers', 'signs'].flatMap((k) =>
    CATEGORIES[k].items.map((i) => i.text),
  );
  assert.equal(new Set(chars).size, chars.length);
  assert.deepEqual([...chars].sort(), [...expected].sort());
});

test('lesson practice can include earlier lessons', () => {
  assert.equal(lessonPracticeItems(1, false).length, 4);
  assert.equal(lessonPracticeItems(1, true).length, 6);
  assert.throws(() => lessonPracticeItems(99, true), /No lesson/);
});
