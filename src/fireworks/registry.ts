export const crackers = {
  busvanam: { label: 'Busvanam', type: 'Ground fountain', placement: 'ground', x: 2.48, duration: 8.2 },
  sparkler: { label: 'Kambi Mathappu', type: 'Handheld sparkler', placement: 'handheld', x: 2.7, duration: 6.6 },
  spinner: { label: 'Sangu Chakram', type: 'Ground spinner', placement: 'ground', x: 2.96, duration: 6.2 },
  skyshot: { label: 'Sky Shot', type: 'Aerial firework', placement: 'ground', x: 3.16, duration: 6.7 },
  chain: { label: 'Red Cracker Chain', type: 'Sequential ground bursts', placement: 'ground', x: 2.41, z: -0.17, duration: 5.4 },
  rocket: { label: 'Comet Rocket', type: 'Gold aerial comet', placement: 'ground', x: 2.95, z: -0.17, duration: 6.7 },
  wala: { label: '1000 Wala', type: 'Rapid ground cracker chain', placement: 'ground', x: 2.68, z: -0.18, duration: 16 },
  bijili: { label: 'Bijili Crackers', type: 'Quick string of sharp pops', placement: 'ground', x: 3.23, duration: 3.1 },
  atom: { label: 'Atom Bomb', type: 'Single heavy ground burst', placement: 'ground', x: 3.4, duration: 3.3 },
} as const;

export type CrackerId = keyof typeof crackers;
export const crackerIds = Object.keys(crackers) as CrackerId[];

export const fusePoints = {
  busvanam: [0, 0.202, 0],
  sparkler: [0, 0.386, 0],
  spinner: [0.045, 0.042, 0],
  skyshot: [0.017, 0.278, 0],
  chain: [-0.15, 0.035, 0],
  rocket: [0.029, 0.16, 0.03],
  wala: [0.108, 0.035, 0],
  bijili: [-0.1, 0.025, 0],
  atom: [0, 0.087, 0],
} as const satisfies Record<CrackerId, readonly [number, number, number]>;

export const groundPopTimes: Partial<Record<CrackerId, readonly number[]>> = {
  chain: Array.from({ length: 8 }, (_, i) => i * 0.4),
  wala: Array.from({ length: 120 }, (_, i) => Math.floor(i / 6) * 0.69
    + [0, 0.13, 0.25, 0.323, 0.402, 0.565][i % 6]),
  bijili: [0, 0.11, 0.23, 0.31, 0.4, 0.57],
  atom: [0],
};

export function groundPopPosition(id: CrackerId, index: number) {
  if (id === 'wala') return walaCoil(index / ((groundPopTimes.wala?.length ?? 1) - 1));
  if (id === 'atom') return [0, 0] as const;
  return id === 'bijili' ? [(index - 2.5) * 0.04, 0] as const
    : [(index - 3.5) * 0.035, (index % 2 - 0.5) * 0.032] as const;
}

export function walaCoil(progress: number) {
  const angle = progress * Math.PI * 6;
  const radius = 0.108 + 0.14 * progress;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius] as const;
}

export const pistols = {
  cap: { label: 'Single-Cap Pistol', rounds: 1, x: 1.99 },
  roll: { label: 'Roll-Cap Pistol', rounds: 8, x: 3.46 },
} as const;
export type PistolId = keyof typeof pistols;
