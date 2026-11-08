import { useLayoutEffect, useRef } from 'react';
import { Color, Matrix4 } from 'three';
import type { InstancedMesh, MeshStandardMaterial } from 'three';

const posts = [-5.2, -2.6, 2.6, 5.2];
const postParts = [
  { y: 0.39, size: [0.37, 0.3, 0.37], color: '#786455' },
  { y: 1.59, size: [0.23, 2.45, 0.25], color: '#594030' },
  { y: 2.72, size: [0.49, 0.19, 0.32], color: '#594030' },
] as const;
const windows = [-3.85, 3.85];
const roofTileCount = 74;
const flowerCount = 15;

export function Veranda({ plaster }: { plaster: MeshStandardMaterial }) {
  const tiles = useRef<InstancedMesh>(null);
  const garland = useRef<InstancedMesh>(null);
  const columns = useRef<(InstancedMesh | null)[]>([]);

  useLayoutEffect(() => {
    const mesh = tiles.current;
    if (!mesh) return;
    const transform = new Matrix4();
    columns.current.forEach((column, i) => {
      if (!column) return;
      posts.forEach((x, j) => column.setMatrixAt(j, transform.makeTranslation(x, postParts[i].y, -5.22)));
      column.instanceMatrix.needsUpdate = true;
      column.computeBoundingSphere();
    });
    for (let i = 0; i < roofTileCount; i++) {
      mesh.setMatrixAt(i, transform.makeTranslation((i - (roofTileCount - 1) / 2) * 0.157, 0.09, 0));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (garland.current) {
      const marigold = new Color('#ce862d');
      const rust = new Color('#a95127');
      for (let i = 0; i < flowerCount; i++) {
        const x = (i - (flowerCount - 1) / 2) * 0.133;
        garland.current.setMatrixAt(i, transform.makeTranslation(x, 2.48 + 0.2 * x * x, -6.54));
        garland.current.setColorAt(i, i % 3 ? marigold : rust);
      }
      garland.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  return (
    <group name="Temporary veranda façade">
      <mesh position={[0, 1.68, -6.87]} scale={[11.6, 3.36, 0.24]} material={plaster} castShadow receiveShadow>
        <boxGeometry />
      </mesh>
      <mesh position={[0, 0.12, -5.91]} receiveShadow>
        <boxGeometry args={[11.45, 0.24, 1.94]} />
        <meshStandardMaterial color="#725f4e" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.06, -4.79]} receiveShadow>
        <boxGeometry args={[4.4, 0.12, 0.32]} />
        <meshStandardMaterial color="#827264" roughness={0.94} />
      </mesh>

      {postParts.map(({ y, size, color }, index) => (
        <instancedMesh key={y} ref={instance => { columns.current[index] = instance; }}
          args={[undefined, undefined, posts.length]} castShadow receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color={color} roughness={index === 0 ? 0.94 : 0.8} />
        </instancedMesh>
      ))}

      <group position={[0, 3.18, -6.04]} rotation-x={0.24}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[11.7, 0.15, 2.52]} />
          <meshStandardMaterial color="#704332" roughness={0.95} />
        </mesh>
        <instancedMesh ref={tiles} args={[undefined, undefined, roofTileCount]} receiveShadow>
          <boxGeometry args={[0.137, 0.062, 2.52]} />
          <meshStandardMaterial color="#a15d43" roughness={0.96} />
        </instancedMesh>
        <mesh position={[0, -0.07, 1.22]} castShadow>
          <boxGeometry args={[11.78, 0.14, 0.16]} />
          <meshStandardMaterial color="#56372b" roughness={0.88} />
        </mesh>
      </group>

      <group position={[0, 1.33, -6.7]}>
        <mesh castShadow>
          <boxGeometry args={[1.72, 2.28, 0.12]} />
          <meshStandardMaterial color="#684838" roughness={0.78} />
        </mesh>
        <mesh position-z={0.085}>
          <boxGeometry args={[1.43, 2.08, 0.08]} />
          <meshStandardMaterial color="#3a2920" roughness={0.82} />
        </mesh>
        {[-0.37, 0.37].map(x => (
          <group key={x} position-x={x}>
            {[-0.52, 0.52].map(y => (
              <mesh key={y} position={[0, y, 0.138]}>
                <boxGeometry args={[0.51, 0.78, 0.055]} />
                <meshStandardMaterial color="#593b29" roughness={0.8} />
              </mesh>
            ))}
            <mesh position={[-Math.sign(x) * 0.24, -0.12, 0.17]}>
              <sphereGeometry args={[0.035, 12, 8]} />
              <meshStandardMaterial color="#ad834b" metalness={0.65} roughness={0.42} />
            </mesh>
          </group>
        ))}
      </group>

      {windows.map(x => (
        <group key={x} position={[x, 1.54, -6.69]}>
          <mesh castShadow>
            <boxGeometry args={[1.08, 1.26, 0.14]} />
            <meshStandardMaterial color="#533c2d" roughness={0.84} />
          </mesh>
          <mesh position-z={0.079}>
            <planeGeometry args={[0.9, 1.07]} />
            <meshStandardMaterial color="#583b27" emissive="#e8a25a" emissiveIntensity={0.26} roughness={0.86} />
          </mesh>
          {[-0.29, 0, 0.29].map(bar => (
            <mesh key={bar} position={[bar, 0, 0.096]}>
              <boxGeometry args={[0.047, 1.08, 0.052]} />
              <meshStandardMaterial color="#4a3328" roughness={0.84} />
            </mesh>
          ))}
          <mesh position={[0, -0.63, 0.13]} castShadow>
            <boxGeometry args={[1.22, 0.12, 0.24]} />
            <meshStandardMaterial color="#876e58" roughness={0.92} />
          </mesh>
        </group>
      ))}

      {[-1.32, 1.32].map(x => (
        <group key={x} position={[x, 2.02, -6.49]}>
          <mesh>
            <cylinderGeometry args={[0.065, 0.074, 0.16, 8]} />
            <meshStandardMaterial color="#ba864b" emissive="#ff9b44" emissiveIntensity={1.3} />
          </mesh>
          <pointLight position-z={0.24} color="#ffc18a" intensity={6.2} distance={4.4} />
        </group>
      ))}
      <instancedMesh ref={garland} args={[undefined, undefined, flowerCount]}>
        <icosahedronGeometry args={[0.065, 1]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </group>
  );
}
