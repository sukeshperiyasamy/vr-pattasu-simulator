import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Quaternion, Vector3 } from 'three';
import type { BufferAttribute, Group, Mesh, Object3D, PointLight, PointsMaterial } from 'three';
import { createFountainAudio } from '../audio/fountain';
import { table } from '../scene/layout';
import { useSettings } from '../store/settings';
import { pistols } from './registry';
import type { PistolId } from './registry';
import type { Ground } from './lifecycle';

export const pistolMuzzle = [0, 0.088, -0.183] as const;
export const pistolOffset = [0.25, -0.27, -0.53] as const;
export const vrPistolOffset = [0.035, -0.06, -0.12] as const;

export interface CapShot {
  muzzle: Ground;
  end: Ground;
  hit: boolean;
  id: PistolId;
  at: number;
}

function ToyPistol({ id, highlighted }: { id: PistolId; highlighted: boolean }) {
  const body = id === 'roll' ? '#268286' : '#c67a36';
  return (
    <>
      <mesh position={[0, 0.078, -0.053]}>
        <boxGeometry args={[0.047, 0.042, 0.18]} />
        <meshStandardMaterial color={body} roughness={0.54} emissive="#aa7139" emissiveIntensity={highlighted ? 0.32 : 0} />
      </mesh>
      <mesh position={[0, 0.029, 0.023]} rotation-x={-0.24}>
        <boxGeometry args={[0.041, 0.073, 0.043]} />
        <meshStandardMaterial color="#4b352d" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.083, -0.156]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.017, 0.019, 0.054, 16]} />
        <meshStandardMaterial color="#f39a40" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.042, -0.032]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.019, 0.0035, 6, 14]} />
        <meshStandardMaterial color="#d0a16f" roughness={0.62} />
      </mesh>
      {id === 'roll' && <mesh position={[0, 0.081, -0.01]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.031, 0.031, 0.053, 16]} />
        <meshStandardMaterial color="#d14f36" roughness={0.63} />
      </mesh>}
    </>
  );
}

export function CapPistols({ equipped, aimed, shot, xrActive, pointer }: {
  equipped: PistolId | null; aimed: PistolId | null; shot: CapShot | null;
  xrActive: boolean; pointer: RefObject<Object3D | null>;
}) {
  const held = useRef<Group>(null);
  const pose = useMemo(() => ({ position: new Vector3(), rotation: new Quaternion() }), []);
  useFrame(({ camera }) => {
    if (!held.current) return;
    const source = xrActive ? pointer.current : camera;
    held.current.visible = Boolean(source);
    if (!source) return;
    source.getWorldPosition(pose.position);
    source.getWorldQuaternion(pose.rotation);
    const kick = shot ? Math.max(0, 1 - (performance.now() - shot.at) / 130) : 0;
    const [x, y, z] = xrActive ? vrPistolOffset : pistolOffset;
    held.current.position.set(x, y + kick * 0.012, z + kick * 0.038)
      .applyQuaternion(pose.rotation).add(pose.position);
    held.current.quaternion.copy(pose.rotation);
    held.current.rotateX(kick * 0.15);
  });

  return (Object.keys(pistols) as PistolId[]).map(id => (
    equipped === id
      ? <group key={id + '-held'} ref={held} name={pistols[id].label}><ToyPistol id={id} highlighted={false} /></group>
      : <group key={id} position={[pistols[id].x, table.height + 0.014, table.z + 0.07]} rotation-y={-0.36}
          userData={{ pistol: id }}><ToyPistol id={id} highlighted={aimed === id} /></group>
  ));
}

export function CapFlash({ shot, onComplete, light }: {
  shot: CapShot; onComplete: () => void; light: RefObject<PointLight | null>;
}) {
  const flash = useRef<Mesh>(null);
  const impact = useRef<BufferAttribute>(null);
  const impactMaterial = useRef<PointsMaterial>(null);
  const streak = useRef<Mesh>(null);
  const audio = useRef<ReturnType<typeof createFountainAudio> | null>(null);
  const positions = useMemo(() => new Float32Array(27), []);
  const velocities = useMemo(() => Array.from({ length: 9 }, () =>
    [Math.random() - 0.5, Math.random() * 0.65, Math.random() - 0.5]), []);
  const travel = useMemo(() => new Vector3(...shot.end).sub(new Vector3(...shot.muzzle)), [shot]);
  const streakRotation = useMemo(() => new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0), travel.clone().normalize(),
  ), [travel]);

  useEffect(() => {
    const player = createFountainAudio(shot.id);
    const lamp = light.current;
    lamp?.position.set(...shot.muzzle);
    audio.current = player;
    const timer = window.setTimeout(onComplete, 270);
    return () => {
      window.clearTimeout(timer);
      player.dispose();
      if (lamp) lamp.intensity = 0;
      audio.current = null;
    };
  }, [light, onComplete, shot]);

  useFrame(({ camera }) => {
    const time = (performance.now() - shot.at) / 1000;
    const { muted, volume, reducedFlash } = useSettings.getState();
    audio.current?.update(camera, !document.hidden, muted, volume, ...shot.muzzle);
    const strength = Math.max(0, 1 - time * 11);
    if (flash.current) flash.current.scale.setScalar(strength * (reducedFlash ? 0.04 : 0.065));
    if (light.current) light.current.intensity = strength * (reducedFlash ? 0.7 : 2.2);
    if (streak.current) {
      const travelTime = 0.047;
      streak.current.visible = time < travelTime;
      streak.current.position.set(...shot.muzzle).addScaledVector(travel, Math.min(1, time / travelTime));
    }
    if (impact.current && impactMaterial.current) {
      const spread = Math.max(0, time - 0.03);
      velocities.forEach(([x, y, z], i) => {
        positions.set([x * spread, y * spread - spread ** 2, z * spread], i * 3);
      });
      impact.current.needsUpdate = true;
      impactMaterial.current.opacity = Math.max(0, 0.8 - spread * 3.5);
    }
  });

  return <>
    <group position={shot.muzzle} name="Cap flash">
      <mesh ref={flash} scale={0} raycast={() => {}}>
        <sphereGeometry args={[1, 10, 7]} /><meshBasicMaterial color="#ffc578" toneMapped={false} />
      </mesh>
    </group>
    <mesh ref={streak} quaternion={streakRotation} visible={false} raycast={() => {}}>
      <cylinderGeometry args={[0.002, 0.004, 0.19, 5]} />
      <meshBasicMaterial color="#ffd89f" transparent opacity={0.63} depthWrite={false} />
    </mesh>
    {shot.hit && <points position={shot.end} frustumCulled={false} raycast={() => {}}>
      <bufferGeometry><bufferAttribute ref={impact} attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial ref={impactMaterial} size={0.016} color="#ffb04d" transparent depthWrite={false} blending={AdditiveBlending} />
    </points>}
  </>;
}
