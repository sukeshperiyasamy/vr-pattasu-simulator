import { useImperativeHandle, useMemo, useRef } from 'react';
import type { Ref } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, Object3D, Vector3 } from 'three';
import type { InstancedMesh } from 'three';

export type PaperPool = {
  scatter: (x: number, y: number, z: number, count: number, force: number) => void;
  clear: () => void;
};

const capacity = 320;
const colors = ['#a92e28', '#bd5140', '#87302a', '#d7b484', '#775744'].map(color => new Color(color));
const noRaycast = () => {};

export function PaperDebris({ pool }: { pool: Ref<PaperPool> }) {
  const mesh = useRef<InstancedMesh>(null);
  const next = useRef(0);
  const scraps = useMemo(() => Array.from({ length: capacity }, () => ({
    pose: new Object3D(), velocity: new Vector3(), spin: new Vector3(), floor: 0.008,
  })), []);

  useImperativeHandle(pool, () => ({
    scatter(x, y, z, count, force) {
      const target = mesh.current;
      if (!target) return;
      for (let i = 0; i < count; i++) {
        const slot = next.current++ % capacity;
        const { pose, velocity, spin } = scraps[slot];
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.4 + Math.random() * 1.3) * force;
        pose.position.set(x, y + 0.04, z);
        scraps[slot].floor = y + 0.008;
        pose.rotation.set(angle, 0, angle / 2);
        pose.scale.set(0.021 + Math.random() * 0.043, 0.012 + Math.random() * 0.033, 1);
        velocity.set(Math.cos(angle) * speed, (0.95 + Math.random() * 2) * force, Math.sin(angle) * speed);
        spin.set(3 + Math.random() * 8, angle, 7 - angle);
        target.setColorAt(slot, colors[Math.floor(Math.random() * colors.length)]);
      }
      if (target.instanceColor) target.instanceColor.needsUpdate = true;
    },
    clear() {
      next.current = 0;
      if (mesh.current) mesh.current.count = 0;
    },
  }), [scraps]);

  useFrame((_, frameDelta) => {
    const target = mesh.current;
    if (!target) return;
    const count = Math.min(next.current, capacity);
    const delta = Math.min(frameDelta, 0.05);
    let dirty = false;
    for (let i = 0; i < count; i++) {
      const { pose, velocity, spin, floor } = scraps[i];
      if (pose.position.y <= floor) continue;
      velocity.multiplyScalar(Math.exp(-1.35 * delta));
      velocity.y -= 4.8 * delta;
      pose.position.addScaledVector(velocity, delta);
      pose.rotation.x += spin.x * delta;
      pose.rotation.y += spin.y * delta;
      pose.rotation.z += spin.z * delta;
      if (pose.position.y <= floor) {
        pose.position.y = floor;
        pose.rotation.set(-Math.PI / 2, 0, pose.rotation.z);
      }
      pose.updateMatrix();
      target.setMatrixAt(i, pose.matrix);
      dirty = true;
    }
    target.count = count;
    if (dirty) target.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh name="Firecracker paper scraps" ref={mesh} args={[undefined, undefined, capacity]} count={0}
    frustumCulled={false} raycast={noRaycast}>
    <planeGeometry />
    <meshStandardMaterial roughness={0.96} side={DoubleSide} />
  </instancedMesh>;
}
