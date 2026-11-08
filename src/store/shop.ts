import { createStore } from 'zustand/vanilla';
import { initialFirework, transition } from '../fireworks/lifecycle.ts';
import type { Action, Firework } from '../fireworks/lifecycle.ts';
import { crackerIds } from '../fireworks/registry.ts';
import type { CrackerId } from '../fireworks/registry.ts';

export const packages = {
  busvanam: { color: '#813a30', stock: 5, position: [-0.47, 0, 0.11], mark: 'GOLD FOUNTAIN' },
  sparkler: { color: '#82562a', stock: 8, position: [-0.16, 0, 0.11], mark: 'HANDHELD' },
  spinner: { color: '#325b54', stock: 5, position: [0.16, 0, 0.11], mark: 'GROUND SPINNER' },
  skyshot: { color: '#394f76', stock: 4, position: [0.47, 0, 0.11], mark: 'AERIAL BURST' },
  chain: { color: '#763d53', stock: 4, position: [-0.34, 0.31, -0.16], mark: 'RED CHAIN' },
  rocket: { color: '#395965', stock: 4, position: [0, 0.31, -0.16], mark: 'GOLD COMET' },
  wala: { color: '#8d3928', stock: 3, position: [0.34, 0.31, -0.16], mark: 'LONG CHAIN' },
} as const satisfies Record<CrackerId, {
  color: string; stock: number; position: readonly [number, number, number]; mark: string;
}>;

type BoxPhase = 'closed' | 'opening' | 'open' | 'empty' | 'closing';
type Box = { phase: BoxPhase; stock: number; revision: number };
export type ShopAim = `${'box' | 'stock'}:${CrackerId}`;
type Boxes = Record<CrackerId, Box>;
export type TakeResult = 'taken' | 'busy' | 'empty' | 'closed' | 'failed';

function restock(previous?: Boxes): Boxes {
  return Object.fromEntries(crackerIds.map(id => [
    id, { phase: 'closed', stock: packages[id].stock, revision: (previous?.[id].revision ?? 0) + 1 },
  ])) as Boxes;
}

interface ShopState {
  boxes: Boxes;
  firework: Firework;
  toggle: (id: CrackerId) => 'opening' | 'closing' | null;
  settle: (id: CrackerId, revision: number) => void;
  take: (id: CrackerId) => TakeResult;
  act: (action: Exclude<Action, { type: 'pick' }>) => void;
}

export function createShopStore(advance = transition) {
  return createStore<ShopState>()((set, get) => ({
    boxes: restock(),
    firework: initialFirework,
    toggle(id) {
      const { boxes } = get();
      const box = boxes[id];
      if (box.phase === 'opening' || box.phase === 'closing') return null;
      const phase = box.phase === 'closed' ? 'opening' : 'closing';
      set({ boxes: { ...boxes, [id]: { ...box, phase, revision: box.revision + 1 } } });
      return phase;
    },
    settle(id, revision) {
      const { boxes } = get();
      const box = boxes[id];
      if (box.revision !== revision || (box.phase !== 'opening' && box.phase !== 'closing')) return;
      const phase = box.phase === 'closing' ? 'closed' : box.stock ? 'open' : 'empty';
      set({ boxes: { ...boxes, [id]: { ...box, phase } } });
    },
    take(id) {
      const { boxes, firework } = get();
      const box = boxes[id];
      if (box.phase !== 'open' && box.phase !== 'empty') return 'closed';
      if (!box.stock) return 'empty';
      if (firework.stage !== 'available' && firework.stage !== 'finished') return 'busy';
      let held: Firework;
      try {
        held = advance(firework.stage === 'finished' ? initialFirework : firework, { type: 'pick', id });
      } catch {
        return 'failed';
      }
      if (held.stage !== 'held' || held.id !== id) return 'failed';
      const stock = box.stock - 1;
      set({ firework: held, boxes: { ...boxes, [id]: { ...box, stock, phase: stock ? 'open' : 'empty' } } });
      return 'taken';
    },
    act(action) {
      const { firework, boxes } = get();
      if (action.type === 'reset') set({ firework: initialFirework, boxes: restock(boxes) });
      else {
        const next = advance(firework, action);
        if (next !== firework) set({ firework: next });
      }
    },
  }));
}

export const shop = createShopStore();

export function parseShopAim(aim: string | null) {
  if (!aim) return null;
  const separator = aim.indexOf(':');
  if (separator < 0) return null;
  const part = aim.slice(0, separator);
  const id = aim.slice(separator + 1);
  if ((part !== 'box' && part !== 'stock') || !Object.hasOwn(packages, id)) return null;
  return { part, id: id as CrackerId };
}
