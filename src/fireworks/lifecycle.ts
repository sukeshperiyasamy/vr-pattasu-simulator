import { crackers } from './registry.ts';
import type { CrackerId } from './registry.ts';

export type Ground = readonly [number, number, number];
export type Firework =
  | { stage: 'available' }
  | { stage: 'held'; id: CrackerId }
  | { stage: 'placed'; id: CrackerId; ground: Ground }
  | { stage: 'burning' | 'finished'; id: CrackerId; ground: Ground | null };
export type Action =
  | { type: 'pick'; id: CrackerId }
  | { type: 'ignite' | 'finish' | 'reset' }
  | { type: 'place'; ground: Ground };

export const initialFirework: Firework = { stage: 'available' };
export function transition(state: Firework, action: Action): Firework {
  switch (action.type) {
    case 'reset': return initialFirework;
    case 'pick': return state.stage === 'available' ? { stage: 'held', id: action.id } : state;
    case 'place': return state.stage === 'held' && crackers[state.id].placement === 'ground'
      ? { ...state, stage: 'placed', ground: action.ground } : state;
    case 'ignite':
      if (state.stage === 'placed') return { ...state, stage: 'burning' };
      if (state.stage === 'held' && crackers[state.id].placement === 'handheld') {
        return { ...state, stage: 'burning', ground: null };
      }
      return state;
    case 'finish': return state.stage === 'burning' ? { ...state, stage: 'finished' } : state;
  }
}
