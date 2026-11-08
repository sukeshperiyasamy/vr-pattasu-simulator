import { useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3 } from 'three';
import type { Group, Object3D } from 'three';
import { diyaLocations } from '../scene/Courtyard';

export function Taper({ lit, xrActive, pointer, fuse, canIgnite, litDiyas, onLight, onDiya, onIgnite, locations = diyaLocations }: {
  lit: boolean; xrActive: boolean; pointer: RefObject<Object3D | null>;
  fuse: RefObject<Object3D | null>; canIgnite: boolean; litDiyas: ReadonlySet<number>;
  onLight: () => void; onDiya: (index: number) => void; onIgnite: () => void;
  locations?: readonly (readonly [number, number, number])[];
}) {
  const mesh = useRef<Group>(null);
  const tip = useRef<Object3D>(null);
  const contact = useRef({ target: -1, seconds: 0 });
  const transform = useMemo(() => ({
    position: new Vector3(), rotation: new Quaternion(), ember: new Vector3(), target: new Vector3(),
  }), []);
  useFrame(({ camera, gl }, delta) => {
    if (!mesh.current) return;
    const pose = xrActive ? pointer.current : camera;
    mesh.current.visible = Boolean(pose?.visible);
    if (!pose?.visible) { contact.current = { target: -1, seconds: 0 }; return; }
    pose.getWorldQuaternion(transform.rotation);
    pose.getWorldPosition(transform.position);
    mesh.current.position.set(xrActive ? 0.018 : -0.29, xrActive ? -0.022 : -0.27, xrActive ? -0.025 : -0.62)
      .applyQuaternion(transform.rotation).add(transform.position);
    mesh.current.quaternion.copy(transform.rotation);
    if (!xrActive || !tip.current || gl.xr.getSession()?.visibilityState !== 'visible') return;
    const ember = tip.current.getWorldPosition(transform.ember);
    let target = -1;
    if (lit && canIgnite && fuse.current && fuse.current.parent?.visible
      && ember.distanceToSquared(fuse.current.getWorldPosition(transform.target)) < 0.085 ** 2) {
      target = locations.length;
    } else {
      target = locations.findIndex(([x, y, z], index) => (
        litDiyas.has(index) !== lit
        && ember.distanceToSquared(transform.target.set(x - 0.018, y + 0.06, z + 0.06)) < 0.095 ** 2
      ));
    }
    const previous = contact.current;
    if (target !== previous.target || target < 0) {
      previous.target = target;
      previous.seconds = 0;
      return;
    }
    previous.seconds += Math.min(delta, 0.05);
    if (previous.seconds < 0.16) return;
    previous.seconds = -Infinity;
    const right = Array.from(gl.xr.getSession()?.inputSources ?? []).find(source => source.handedness === 'right');
    void right?.gamepad?.hapticActuators?.[0]?.pulse?.(0.25, 45).catch(() => {});
    if (target === locations.length) onIgnite();
    else if (lit) onDiya(target);
    else onLight();
  });
  if (!lit && !xrActive) return null;
  return (
    <group ref={mesh}>
      <group rotation-x={xrActive ? -Math.PI / 2 : 0} scale={xrActive ? 1.27 : 1}>
      <mesh position-y={0.083} raycast={() => {}}>
        <cylinderGeometry args={[0.003, 0.005, 0.165, 8]} />
        <meshStandardMaterial color="#9b6435" roughness={0.85} />
      </mesh>
      <group ref={tip} position-y={0.169} />
      <mesh position-y={0.165} scale={[0.0045, 0.01, 0.0045]} raycast={() => {}}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color={lit ? '#f79830' : '#3b302a'} emissive="#e95c17" emissiveIntensity={lit ? 1.6 : 0} />
      </mesh>
      {lit && !xrActive && <><mesh position-y={0.176} scale={[0.008, 0.023, 0.008]} raycast={() => {}}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial color="#ff9a2d" toneMapped={false} />
      </mesh>
      <mesh position-y={0.17} scale={[0.004, 0.01, 0.004]} raycast={() => {}}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#fff0a1" toneMapped={false} />
      </mesh>
      </>}
      {lit && <pointLight position-y={0.19} intensity={0.42} distance={0.9} color="#ff9e54" />}
      </group>
    </group>
  );
}
