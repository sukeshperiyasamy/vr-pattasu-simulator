export const eyeHeight = 1.64;
export const court = { width: 13, depth: 14, walkMinZ: -4.65, walkMaxZ: 6.55 };
export const table = { x: 2.75, z: -2.6, width: 1.8, depth: 0.66, height: 0.77 };

export function canWalk(x: number, z: number) {
  const clearance = 0.25;
  const insideCourt = Math.abs(x) <= court.width / 2 - clearance
    && z >= court.walkMinZ && z <= court.walkMaxZ;
  const touchesTable = Math.abs(x - table.x) < table.width / 2 + clearance
    && Math.abs(z - table.z) < table.depth / 2 + clearance;
  return insideCourt && !touchesTable;
}
