import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialFirework, transition } from '../src/fireworks/lifecycle.ts';
import { crackers, fusePoints, groundPopPosition, groundPopTimes } from '../src/fireworks/registry.ts';

const ground = [0, 0, 1];
const place = { type: 'place', ground };
const ignite = { type: 'ignite' };
const reset = { type: 'reset' };
const pick = { type: 'pick', id: 'busvanam' };

test('Wala has irregular, frame-safe pop spacing and time for its final burst', () => {
  const times = groundPopTimes.wala;
  assert.equal(times.length, 120);
  assert.equal(times[0], 0);
  const gaps = times.slice(1).map((time, index) => time - times[index]);
  assert(gaps.every(gap => gap > 0.05));
  assert(Math.max(...gaps) - Math.min(...gaps) > 0.08);
  assert(crackers.wala.duration - times.at(-1) > 2);
  const [x, z] = groundPopPosition('wala', 0);
  assert.deepEqual([x, z], [fusePoints.wala[0], fusePoints.wala[2]]);
});

test('Busvanam must be picked up and placed before one activation', () => {
  assert.equal(transition(initialFirework, place), initialFirework);
  assert.equal(transition(initialFirework, ignite), initialFirework);

  const held = transition(initialFirework, pick);
  assert.equal(held.stage, 'held');
  assert.equal(transition(held, ignite), held);
  const placed = transition(held, place);
  assert.deepEqual(placed, { stage: 'placed', id: 'busvanam', ground });
  const burning = transition(placed, ignite);
  assert.deepEqual(burning, { stage: 'burning', id: 'busvanam', ground });
  assert.equal(transition(burning, ignite), burning);
  assert.deepEqual(transition(burning, { type: 'finish' }), { stage: 'finished', id: 'busvanam', ground });
});

test('only the sparkler can ignite in hand', () => {
  for (const id of ['sparkler', 'spinner', 'skyshot']) {
    const held = transition(initialFirework, { type: 'pick', id });
    if (id === 'sparkler') {
      assert.equal(transition(held, place), held);
      assert.deepEqual(transition(held, ignite), { stage: 'burning', id, ground: null });
    } else {
      assert.equal(transition(held, ignite), held);
      assert.deepEqual(transition(transition(held, place), ignite), { stage: 'burning', id, ground });
    }
  }
});

test('reset returns the prop to the table from every state', () => {
  let state = initialFirework;
  for (const action of [pick, place, ignite, { type: 'finish' }]) {
    state = transition(state, action);
    assert.equal(transition(state, reset), initialFirework);
  }
  assert.equal(transition(initialFirework, reset), initialFirework);
});
