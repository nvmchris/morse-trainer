import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MASTERY_THRESHOLD,
  WEIGHT_KNOWN,
  WEIGHT_LEARNING_MAX,
  WEIGHT_LEARNING_MIN,
  isKnown,
  itemKey,
  selectionWeight,
  toPercent,
  updateScore,
} from '../src/mastery.js';
import { pickNext } from '../src/practice.js';

const answerRepeatedly = (score, correct, times) => {
  for (let i = 0; i < times; i += 1) score = updateScore(score, correct);
  return score;
};

test('new items start at zero and rise with right answers', () => {
  assert.equal(updateScore(undefined, false), 0);
  assert.ok(updateScore(undefined, true) > 0);
  assert.ok(!isKnown(answerRepeatedly(undefined, true, 13)));
  assert.ok(isKnown(answerRepeatedly(undefined, true, 15)));
});

test('one mistake on a known item needs many right answers to recover', () => {
  const afterMistake = updateScore(0.95, false);
  assert.ok(afterMistake < 0.65);
  assert.ok(!isKnown(answerRepeatedly(afterMistake, true, 5)));
  assert.ok(isKnown(answerRepeatedly(afterMistake, true, 9)));
});

test('weaker items get more weight; known items the least', () => {
  assert.equal(selectionWeight(undefined), WEIGHT_LEARNING_MAX);
  assert.equal(selectionWeight(MASTERY_THRESHOLD), WEIGHT_KNOWN);
  assert.ok(selectionWeight(0.89) >= WEIGHT_LEARNING_MIN);
  assert.ok(selectionWeight(0.2) > selectionWeight(0.6));
  assert.ok(selectionWeight(0.89) > selectionWeight(0.95));
});

test('weighted picking follows the weights', () => {
  const pool = [{ id: 'weak' }, { id: 'known' }];
  const weightOf = (item) => (item.id === 'weak' ? 9 : 1);
  assert.equal(pickNext(pool, null, () => 0.89, weightOf).id, 'weak');
  assert.equal(pickNext(pool, null, () => 0.91, weightOf).id, 'known');
  assert.equal(pickNext(pool, pool[0], () => 0, weightOf).id, 'known');
});

test('keys and percentages', () => {
  assert.equal(itemKey({ kind: 'letter', text: 'A' }), 'letter:A');
  assert.equal(toPercent(0.904), 90);
  assert.equal(toPercent(undefined), 0);
});
