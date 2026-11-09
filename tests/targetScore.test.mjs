import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scoreTarget } from '../src/scene/targetScore.ts';

test('practice targets award points by distance from the bullseye', () => {
  assert.equal(scoreTarget(0.5, 0.5), 10);
  assert.equal(scoreTarget(0.65, 0.5), 8);
  assert.equal(scoreTarget(0.5, 0.75), 6);
  assert.equal(scoreTarget(0.15, 0.5), 4);
  assert.equal(scoreTarget(0.5, 0.95), 2);
  assert.equal(scoreTarget(0, 0), 0);
});
