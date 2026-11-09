import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { court } from './layout';
import { targetRings } from './targetScore';

const radius = 0.52;
const sideWall = court.width / 2 - 0.125;
const targets = [
  { name: 'Left wall target', position: [-sideWall + 0.045, 1.35, 0.6], turn: Math.PI / 2 },
  { name: 'Right wall target', position: [sideWall - 0.045, 1.35, 0.6], turn: -Math.PI / 2 },
  { name: 'Rear wall target', position: [0, 1.35, 6.785], turn: Math.PI },
] as const;

export function PracticeTargets() {
  const face = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    for (const ring of targetRings) {
      ctx.beginPath();
      ctx.arc(128, 128, ring.radius * 128, 0, Math.PI * 2);
      ctx.fillStyle = ring.color;
      ctx.fill();
      ctx.strokeStyle = '#e5c697';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    targetRings.forEach((ring, index) => {
      ctx.fillStyle = index === 0 || index === 4 ? '#2d2019' : '#fff1d1';
      ctx.fillText(String(ring.points), 128, index === 4 ? 128 : 128 - (ring.radius - 0.1) * 128);
    });
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => face.dispose(), [face]);

  return targets.map(({ name, position, turn }) => (
    <group key={name} position={position} rotation-y={turn} name={name}>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[radius + 0.028, radius + 0.028, 0.065, 48]} />
        <meshStandardMaterial color="#583827" roughness={0.85} />
      </mesh>
      <mesh position-z={0.034} userData={{ practiceTarget: true }}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial map={face} emissiveMap={face} emissive="#ffffff" emissiveIntensity={0.26} roughness={0.93} />
      </mesh>
    </group>
  ));
}
