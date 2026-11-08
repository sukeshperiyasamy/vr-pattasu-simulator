export const crackers = {
  busvanam: { label: 'Busvanam', type: 'Ground fountain', placement: 'ground', x: 2.48, duration: 8.2 },
  sparkler: { label: 'Kambi Mathappu', type: 'Handheld sparkler', placement: 'handheld', x: 2.7, duration: 6.6 },
  spinner: { label: 'Sangu Chakram', type: 'Ground spinner', placement: 'ground', x: 2.96, duration: 6.2 },
  skyshot: { label: 'Sky Shot', type: 'Aerial firework', placement: 'ground', x: 3.16, duration: 6.7 },
  chain: { label: 'Red Cracker Chain', type: 'Sequential ground bursts', placement: 'ground', x: 2.41, z: -0.17, duration: 5.4 },
  rocket: { label: 'Comet Rocket', type: 'Gold aerial comet', placement: 'ground', x: 2.95, z: -0.17, duration: 6.7 },
  wala: { label: '1000 Wala', type: 'Rapid ground cracker chain', placement: 'ground', x: 2.68, z: -0.18, duration: 15.4 },
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
} as const satisfies Record<CrackerId, readonly [number, number, number]>;

export const walaBursts = 88;
export const walaInterval = 0.15;

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
