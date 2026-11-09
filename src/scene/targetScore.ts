export const targetRings = [
  { radius: 1, points: 2, color: '#b6956e' },
  { radius: 0.8, points: 4, color: '#614438' },
  { radius: 0.6, points: 6, color: '#a35946' },
  { radius: 0.4, points: 8, color: '#63382e' },
  { radius: 0.2, points: 10, color: '#e1ac55' },
] as const;

export function scoreTarget(u: number, v: number) {
  const radius = Math.hypot(u - 0.5, v - 0.5) * 2;
  for (let i = targetRings.length - 1; i >= 0; i--) {
    if (radius <= targetRings[i].radius) return targetRings[i].points;
  }
  return 0;
}
