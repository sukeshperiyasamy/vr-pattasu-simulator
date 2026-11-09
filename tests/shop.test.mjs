import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createShopStore, packages } from '../src/store/shop.ts';
import { crackerIds } from '../src/fireworks/registry.ts';

function settle(store, id) {
  const { boxes, settle } = store.getState();
  settle(id, boxes[id].revision);
}

function finish(store, id) {
  if (id !== 'sparkler') store.getState().act({ type: 'place', ground: [0, 0, 1] });
  store.getState().act({ type: 'ignite' });
  assert.equal(store.getState().firework.stage, 'burning');
  store.getState().act({ type: 'finish' });
}

test('all nine boxes start closed with configured stock', () => {
  const store = createShopStore();
  assert.equal(Object.keys(store.getState().boxes).length, 9);
  for (const id of crackerIds) {
    assert.equal(store.getState().boxes[id].phase, 'closed');
    assert.equal(store.getState().boxes[id].stock, packages[id].stock);
  }
});

test('opening and closing settle once and ignore input while in flight', () => {
  const store = createShopStore();
  const id = 'busvanam';
  const { toggle, take } = store.getState();
  assert.equal(toggle(id), 'opening');
  assert.equal(toggle(id), null);
  assert.equal(take(id), 'closed');
  settle(store, id);
  assert.equal(store.getState().boxes[id].phase, 'open');
  assert.equal(toggle(id), 'closing');
  assert.equal(toggle(id), null);
  settle(store, id);
  assert.equal(store.getState().boxes[id].phase, 'closed');
});

test('withdrawal enters the existing lifecycle once for each cracker', () => {
  const store = createShopStore();
  for (const id of crackerIds) {
    const { toggle, take } = store.getState();
    toggle(id);
    settle(store, id);
    assert.equal(take(id), 'taken');
    assert.deepEqual(store.getState().firework, { stage: 'held', id });
    assert.equal(take(id), 'busy');
    assert.equal(store.getState().boxes[id].stock, packages[id].stock - 1);
    finish(store, id);
  }
});

test('spent ground crackers remain replayable after another pickup without consuming stock', () => {
  const store = createShopStore();
  const { take, toggle, act } = store.getState();
  for (const id of ['busvanam', 'chain']) {
    toggle(id);
    settle(store, id);
    assert.equal(take(id), 'taken');
    finish(store, id);
  }
  const { boxes } = store.getState();
  assert.deepEqual(store.getState().spent.map(item => item.id), ['busvanam']);
  act({ type: 'replay', index: 0 });
  assert.deepEqual(store.getState().firework, { stage: 'burning', id: 'busvanam', ground: [0, 0, 1] });
  assert.deepEqual(store.getState().spent.map(item => item.id), ['chain']);
  assert.equal(store.getState().boxes, boxes);
  act({ type: 'replay', index: 0 });
  assert.equal(store.getState().firework.id, 'busvanam');
  act({ type: 'reset' });
  assert.deepEqual(store.getState().spent, []);
});

test('empty boxes refuse further withdrawals and reset restocks and invalidates animation', () => {
  const store = createShopStore();
  const { take, toggle, act, settle: complete } = store.getState();
  const id = 'wala';
  toggle(id);
  settle(store, id);
  for (let i = 0; i < packages[id].stock; i++) {
    assert.equal(take(id), 'taken');
    finish(store, id);
  }
  assert.equal(take(id), 'empty');
  assert.equal(store.getState().boxes[id].stock, 0);
  assert.equal(store.getState().boxes[id].phase, 'empty');
  toggle(id);
  const stale = store.getState().boxes[id].revision;
  act({ type: 'reset' });
  toggle(id);
  complete(id, stale);
  assert.equal(store.getState().boxes[id].phase, 'opening');
  assert.equal(store.getState().boxes[id].stock, packages[id].stock);
  assert.equal(store.getState().firework.stage, 'available');
});

test('failed or throwing pickup leaves inventory unchanged', () => {
  for (const advance of [state => state, () => { throw new Error('creation failed'); }]) {
    const store = createShopStore(advance);
    store.getState().toggle('busvanam');
    settle(store, 'busvanam');
    const before = store.getState();
    assert.equal(before.take('busvanam'), 'failed');
    assert.equal(store.getState(), before);
  }
});
