import { DiyaInstances } from './Courtyard';
import { roomDiyaLocations, roomTable } from './layout';

export function Room({ litDiyas }: { litDiyas: ReadonlySet<number> }) {
  const { x, z, height, width, depth } = roomTable;
  return <>
    <hemisphereLight color="#fff4e6" groundColor="#a59281" intensity={2} />
    <directionalLight position={[2, 4, 2]} intensity={1.8} />
    <mesh name="Passthrough floor target" rotation-x={-Math.PI / 2} userData={{ stagingSurface: true }}>
      <planeGeometry args={[6, 6]} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>
    <group position={[x, 0, z]} name="Mixed reality counter">
      <mesh position-y={height - 0.035}>
        <boxGeometry args={[width, 0.07, depth]} />
        <meshStandardMaterial color="#64442f" roughness={0.83} />
      </mesh>
      {[-0.78, 0.78].map(side => (
        <mesh key={side} position={[side, (height - 0.07) / 2, 0]}>
          <boxGeometry args={[0.075, height - 0.07, depth - 0.1]} />
          <meshStandardMaterial color="#523726" roughness={0.88} />
        </mesh>
      ))}
    </group>
    <DiyaInstances lit={litDiyas} locations={roomDiyaLocations} />
  </>;
}
