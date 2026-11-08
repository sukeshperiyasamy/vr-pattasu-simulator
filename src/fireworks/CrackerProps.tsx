import { useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D as Transform, Quaternion, Vector3 } from 'three';
import type { Group, InstancedMesh, Object3D } from 'three';
import { table } from '../scene/layout';
import type { Firework } from './lifecycle';
import { fusePoints, walaCoil } from './registry';
import type { CrackerId } from './registry';

export const heldOffset = [0.32, -0.31, -0.74] as const;
export const controllerOffset = [0.08, -0.055, -0.3] as const;

function CrackerChain({ coiled, highlighted, spent }: { coiled: boolean; highlighted: boolean; spent: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const count = coiled ? 84 : 8;
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new Transform();
    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const [x, z] = coiled ? walaCoil(progress) : [(i - 3.5) * 0.035, (i % 2 - 0.5) * 0.032];
      transform.position.set(x, coiled ? 0.017 : 0.024, z);
      transform.rotation.set(0, coiled ? -progress * Math.PI * 6 : 0, Math.PI / 2);
      transform.updateMatrix();
      mesh.current.setMatrixAt(i, transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [coiled, count]);
  const radius = coiled ? 0.013 : 0.02;
  return <>
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[radius, radius, 0.062, 8]} />
      <meshStandardMaterial color={spent ? '#3d3029' : '#9b2923'} roughness={0.86}
        emissive="#d17839" emissiveIntensity={highlighted ? 0.32 : 0} />
    </instancedMesh>
    {coiled ? <mesh position-y={0.016} rotation-x={-Math.PI / 2}>
      <circleGeometry args={[0.25, 24]} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh> : <mesh position-y={0.024} rotation-z={Math.PI / 2}>
      <cylinderGeometry args={[0.005, 0.005, 0.31, 8]} />
      <meshStandardMaterial color="#c0a076" roughness={0.97} />
    </mesh>}
  </>;
}

export function PropShape({ id, highlighted, spent }: { id: CrackerId; highlighted: boolean; spent: boolean }) {
  if (id === 'wala' || id === 'chain') return <CrackerChain coiled={id === 'wala'} {...{ highlighted, spent }} />;
  if (id === 'rocket') {
    return <>
      <mesh position-y={0.16}><cylinderGeometry args={[0.009, 0.01, 0.32, 8]} /><meshStandardMaterial color="#9b7548" /></mesh>
      <mesh position-y={0.24}>
        <cylinderGeometry args={[0.04, 0.04, 0.18, 16]} />
        <meshStandardMaterial color={spent ? '#33241f' : '#234966'} emissive="#b9c8ef" emissiveIntensity={highlighted ? 0.3 : 0} />
      </mesh>
      <mesh position-y={0.355}><coneGeometry args={[0.042, 0.06, 16]} /><meshStandardMaterial color="#c68d38" /></mesh>
    </>;
  }
  const finish = spent ? '#2b241f' : id === 'spinner' ? '#876746' : id === 'skyshot' ? '#45566b' : '#a74532';
  if (id === 'sparkler') {
    return (
      <>
        <mesh position-y={0.16}>
          <cylinderGeometry args={[0.012, 0.012, 0.32, 10]} />
          <meshStandardMaterial color="#998c79" roughness={0.48} />
        </mesh>
        <mesh position-y={0.29}>
          <cylinderGeometry args={[0.021, 0.021, 0.19, 10]} />
          <meshStandardMaterial color={spent ? '#332a21' : '#8c745c'} emissive="#dd9e53"
            emissiveIntensity={highlighted ? 0.27 : 0} roughness={0.83} />
        </mesh>
      </>
    );
  }
  const [top, base, height] = id === 'busvanam' ? [0.026, 0.078, 0.19]
    : id === 'spinner' ? [0.068, 0.077, 0.032] : [0.046, 0.053, 0.25];
  return (
    <>
      <mesh position-y={height / 2} receiveShadow>
        <cylinderGeometry args={[top, base, height, 24]} />
        <meshStandardMaterial color={finish} roughness={0.85} emissive="#dd9e53"
          emissiveIntensity={highlighted ? 0.27 : 0} />
      </mesh>
      <mesh position-y={0.013}>
        <cylinderGeometry args={[base, base * 1.04, 0.026, 24]} />
        <meshStandardMaterial color="#b99950" roughness={0.75} />
      </mesh>
      <mesh position={[id === 'spinner' ? 0.045 : 0, height + 0.004, 0]}>
        <cylinderGeometry args={[id === 'spinner' ? 0.013 : top * 0.91, id === 'spinner' ? 0.013 : top, 0.01, 16]} />
        <meshStandardMaterial color="#d4ae61" roughness={0.75} />
      </mesh>
      {id === 'skyshot' && (
        <>
          <mesh position-y={0.057}>
            <cylinderGeometry args={[0.052, 0.053, 0.022, 24]} />
            <meshStandardMaterial color="#a46637" roughness={0.88} />
          </mesh>
          <mesh position-y={0.208}>
            <cylinderGeometry args={[0.048, 0.049, 0.015, 24]} />
            <meshStandardMaterial color="#d2aa66" roughness={0.84} />
          </mesh>
          <mesh position={[0.013, height + 0.02, 0]} rotation-z={-0.37}>
            <cylinderGeometry args={[0.0025, 0.003, 0.029, 8]} />
            <meshStandardMaterial color={spent ? '#32251b' : '#4c5940'} roughness={0.95} />
          </mesh>
        </>
      )}
    </>
  );
}

function CrackerProp({ id, highlighted, firework, touchActive, xrActive, pointer, leftPointer, fuse }: {
  id: CrackerId; highlighted: boolean; firework: Firework; touchActive: boolean;
  xrActive: boolean; pointer: RefObject<Object3D | null>; leftPointer: RefObject<Object3D | null>;
  fuse: RefObject<Object3D | null>;
}) {
  const prop = useRef<Group>(null);
  const world = useMemo(() => ({ position: new Vector3(), rotation: new Quaternion() }), []);
  const active = firework.stage !== 'available' && firework.id === id;
  const held = active && (firework.stage === 'held' || ('ground' in firework && !firework.ground));
  const spinning = id === 'spinner' && active && firework.stage === 'burning';
  useFrame(({ camera, gl }, delta) => {
    if (!prop.current) return;
    if (held) {
      const pose = xrActive ? (id === 'sparkler' ? leftPointer.current : pointer.current) : camera;
      if (!pose) { prop.current.visible = false; return; }
      prop.current.visible = true;
      pose.getWorldPosition(world.position);
      pose.getWorldQuaternion(world.rotation);
      const [x, y, z] = xrActive ? controllerOffset : heldOffset;
      prop.current.position.set(x, y, z).applyQuaternion(world.rotation).add(world.position);
      prop.current.quaternion.copy(world.rotation);
    } else if (spinning && (xrActive ? gl.xr.getSession()?.visibilityState === 'visible'
      : (touchActive || document.pointerLockElement === gl.domElement) && !document.hidden)) {
      prop.current.rotation.y += Math.min(delta, 0.05) * 15;
    }
  }, -1);
  const position = 'ground' in firework && firework.ground ? firework.ground : [table.x, table.height, table.z] as const;
  return (
    <group key={held ? 'held' : 'world'} ref={prop} position={position}
      scale={id === 'wala' && (!active || held) ? 0.55 : 1} userData={{ firecracker: id }}>
      <PropShape id={id} highlighted={highlighted} spent={active && firework.stage === 'finished'} />
      <mesh ref={active ? fuse : undefined} position={fusePoints[id]} raycast={() => {}}>
        <sphereGeometry args={[0.009, 8, 6]} />
        <meshStandardMaterial color={active && firework.stage === 'finished' ? '#352f27' : '#bea073'} roughness={0.94} />
      </mesh>
    </group>
  );
}

export function CrackerProps({ aim, firework, touchActive, xrActive, pointer, leftPointer, fuse }: {
  aim: CrackerId | null; firework: Firework; touchActive: boolean; xrActive: boolean; pointer: RefObject<Object3D | null>;
  leftPointer: RefObject<Object3D | null>; fuse: RefObject<Object3D | null>;
}) {
  if (firework.stage === 'available') return null;
  return <CrackerProp key={firework.id} id={firework.id} highlighted={aim === firework.id}
    {...{ firework, touchActive, xrActive, pointer, leftPointer, fuse }} />;
}
