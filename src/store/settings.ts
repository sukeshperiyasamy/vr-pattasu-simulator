import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Quality = 'low' | 'medium' | 'high';
type Values = { muted: boolean; reducedFlash: boolean; quality: Quality; volume: number };

export const useSettings = create<Values & { update: (patch: Partial<Values>) => void }>()(
  persist(set => ({
    muted: false,
    reducedFlash: true,
    quality: 'medium',
    volume: 0.7,
    update: patch => set(patch),
  }), { name: 'pattasu-settings' }),
);

export const qualityOptions = {
  low: { dpr: 1, density: 0.42 },
  medium: { dpr: 1.5, density: 0.72 },
  high: { dpr: 2, density: 1 },
} as const;
