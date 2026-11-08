import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending, Color, DataTexture, DynamicDrawUsage, Object3D, Quaternion, RGBAFormat, Vector3,
} from 'three';
import type { BufferAttribute, InstancedMesh, Mesh, PointLight, Points, PointsMaterial } from 'three';
import { createFountainAudio } from '../audio/fountain';
import { qualityOptions, useSettings } from '../store/settings';
import type { Ground } from './lifecycle';
import { controllerOffset, heldOffset } from './CrackerProps';
import { crackers, groundPopPosition, groundPopTimes } from './registry';
import type { CrackerId } from './registry';
import type { PaperPool } from './PaperDebris';

const ignition = 0.72;
const burstAt = 2;
const shellHeight = 8.4;
const emissionEnd = 6;
const sparkCount = 420;
const smokeCount = 26;
const up = new Vector3(0, 1, 0);

function makeParticle() {
  return { position: new Vector3(), velocity: new Vector3(), life: 0, age: 0, size: 0, palette: -1, glow: 1 };
}

function shellRise(t: number) {
  const progress = Math.min(1, Math.max(0, (t - ignition) / (burstAt - ignition)));
  return shellHeight * progress * (2 - progress);
}

function smokeTexture() {
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const radius = Math.hypot((i % size + 0.5) / size - 0.5, (Math.floor(i / size) + 0.5) / size - 0.5) * 2;
    data.set([255, 255, 255, Math.round(255 * Math.max(0, 1 - radius * radius) ** 3)], i * 4);
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

const worldOrigin: Ground = [0, 0, 0];

export function FireworkEffect({ id, ground, onFinish, touchActive, xrActive, pointer, light, paper }: {
  id: CrackerId; ground: Ground | null; onFinish: () => void; touchActive: boolean;
  xrActive: boolean; pointer: RefObject<Object3D | null>;
  light: RefObject<PointLight | null>;
  paper: RefObject<PaperPool | null>;
}) {
  const { camera, gl } = useThree();
  const sparks = useRef<InstancedMesh>(null);
  const haze = useRef<Points>(null);
  const hazeMaterial = useRef<PointsMaterial>(null);
  const hazePositions = useRef<BufferAttribute>(null);
  const shell = useRef<Mesh>(null);
  const audio = useRef<ReturnType<typeof createFountainAudio> | null>(null);
  const elapsed = useRef(0);
  const budget = useRef(0);
  const smokeBudget = useRef(0);
  const burst = useRef(false);
  const chainPop = useRef(-1);
  const pool = useMemo(() => Array.from({ length: sparkCount }, makeParticle), []);
  const smoke = useMemo(() => Array.from({ length: smokeCount }, makeParticle), []);
  const positions = useMemo(() => new Float32Array(smokeCount * 3), []);
  const texture = useMemo(smokeTexture, []);
  const popTimes = groundPopTimes[id];
  const tools = useMemo(() => ({
    transform: new Object3D(), direction: new Vector3(), hot: new Color(3.6, 1.9, 0.55),
    cool: new Color(0.9, 0.16, 0.025), color: new Color(), origin: new Vector3(),
    posePosition: new Vector3(), poseRotation: new Quaternion(),
    burstColors: [new Color(2.1, 0.18, 0.12), new Color(2.5, 1.1, 0.18), new Color(0.36, 0.8, 2.5)],
  }), []);

  useEffect(() => {
    const player = createFountainAudio(id);
    const lamp = light.current;
    if (lamp) {
      lamp.color.set(id === 'skyshot' ? '#ffcbad' : popTimes ? '#ff874b' : '#ffb364');
      lamp.distance = id === 'skyshot' || id === 'rocket' ? 21 : id === 'sparkler' ? 2.8 : 6;
    }
    audio.current = player;
    return () => { player.dispose(); if (lamp) lamp.intensity = 0; audio.current = null; };
  }, [id, light, popTimes]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((_, frameDelta) => {
    const { reducedFlash, muted, quality, volume } = useSettings.getState();
    const running = xrActive ? gl.xr.getSession()?.visibilityState === 'visible'
      : (touchActive || document.pointerLockElement === gl.domElement) && !document.hidden;
    const { origin } = tools;
    const aerial = id === 'skyshot' || id === 'rocket';
    const longChain = id === 'wala';
    const heavy = id === 'atom';
    const chain = !!popTimes;
    origin.set(0, id === 'spinner' ? 0.058 : chain ? 0.045 : aerial ? 0.25 : 0.2, 0);
    if (!ground) {
      const pose = (xrActive ? pointer.current : camera) ?? camera;
      const [x, y, z] = xrActive ? controllerOffset : heldOffset;
      origin.set(x, y + 0.386, z)
        .applyQuaternion(pose.getWorldQuaternion(tools.poseRotation)).add(pose.getWorldPosition(tools.posePosition));
    }
    audio.current?.update(camera, running, muted, volume,
      ground ? origin.x + ground[0] : origin.x,
      ground ? origin.y + ground[1] + (aerial ? shellRise(elapsed.current) : 0) : origin.y,
      ground ? origin.z + ground[2] : origin.z, elapsed.current);
    if (!running || !sparks.current || !haze.current || !hazePositions.current || !light.current) {
      if (light.current) light.current.intensity = 0;
      return;
    }

    const delta = Math.min(frameDelta, 0.05);
    const t = elapsed.current += delta;
    const effectEnd = crackers[id].duration;
    if (t >= effectEnd) { onFinish(); return; }

    const igniting = t < ignition;
    const handheld = id === 'sparkler';
    const spinning = id === 'spinner';
    const lift = aerial && !igniting && t < burstAt;
    const burstNow = aerial && t >= burstAt && !burst.current;
    if (burstNow) burst.current = true;
    const fade = Math.max(0, Math.min(1, ((id === 'busvanam' ? emissionEnd : effectEnd - 1.5) - t) / 1.45));
    const pulse = reducedFlash ? 1 : 0.89 + 0.07 * Math.sin(t * 19) + 0.04 * Math.sin(t * 37);
    const envelope = igniting ? t * 0.16 : Math.min(1, (t - ignition) * 3) * fade;
    const density = Math.min(qualityOptions[quality].density, xrActive ? 0.66 : 1);
    const height = shellRise(t);
    const nextPop = popTimes?.[chainPop.current + 1];
    const newPop = nextPop !== undefined && t >= ignition + nextPop;
    const popIndex = chainPop.current + Number(newPop);
    if (newPop) chainPop.current = popIndex;
    const accent = !longChain || popIndex % 6 === 0 || popIndex % 6 === 4;
    if (popIndex >= 0) {
      const [x, z] = groundPopPosition(id, popIndex);
      origin.x = x;
      origin.z = z;
      if (newPop && ground) {
        audio.current?.pop(ground[0] + x, ground[1] + origin.y, ground[2] + z, accent);
        paper.current?.scatter(ground[0] + x, ground[1], ground[2] + z,
          heavy ? 24 : longChain ? (accent ? 4 : 2) : 5, heavy ? 1.65 : 1);
      }
    }
    const burstGlow = Math.max(0, 1 - Math.abs(t - burstAt) * (reducedFlash ? 1.5 : 3));
    if (shell.current) {
      shell.current.visible = lift;
      shell.current.position.copy(origin);
      shell.current.position.y += height;
    }
    light.current.position.copy(origin);
    if (ground) light.current.position.add(tools.posePosition.set(...ground));
    light.current.position.y += aerial ? Math.min(height, 3.8) : spinning ? 0.18 : 0.35;
    if (spinning) {
      light.current.position.x += Math.cos(t * 15) * 0.23;
      light.current.position.z += Math.sin(t * 15) * 0.23;
    }
    const lastPop = popTimes?.[popIndex];
    const popGlow = lastPop === undefined ? 0 : Math.max(0, 1 - (t - ignition - lastPop) * (longChain ? 13 : 8));
    const glowEnd = ignition + (popTimes?.at(-1) ?? 0) + 0.6;
    const longGlow = Math.max(0, Math.min(1, (t - ignition) * 3, (glowEnd - t) * 3));
    light.current.intensity = aerial ? (reducedFlash ? 22 : 72) * burstGlow ** 2
      : chain ? (reducedFlash ? 2.5 * longGlow : (heavy ? 25 : accent ? 15 : 9) * popGlow ** 2)
        : (reducedFlash ? 8 : 21) * envelope * pulse;
    const rate = igniting ? 18 : aerial ? (lift ? 195 : 0) : chain ? 0 : (handheld ? 160 : 280) * envelope * pulse;
    const popSparks = heavy ? 75 : longChain && !accent ? 21 : 35;
    budget.current += rate * density * delta + Math.round((burstNow ? 340 : newPop ? popSparks : 0) * density);
    smokeBudget.current += (igniting || aerial || handheld ? 0 : chain ? 6 * popGlow : 10 * envelope) * density * delta
      + (newPop ? (heavy ? 7 : accent ? 2 : 0.7) * density : 0);

    for (const particle of pool) {
      if (budget.current < 1) break;
      if (particle.age < particle.life) continue;
      budget.current--;
      const angle = spinning && !igniting ? t * 15 + Math.random() * 0.58 : Math.random() * Math.PI * 2;
      const spread = Math.random() * (igniting ? 0.38 : 1.65);
      particle.position.copy(origin);
      particle.velocity.set(Math.cos(angle) * spread, (igniting ? 0.9 : 2.1) + Math.random() * (igniting ? 0.55 : 3.5), Math.sin(angle) * spread);
      particle.life = (igniting ? 0.25 : 0.44) + Math.random() * (igniting ? 0.22 : 0.83);
      particle.size = 0.0035 + Math.random() * 0.0045;
      particle.glow = 0.62 + Math.random() * 0.65;
      particle.palette = -1;
      if (chain && !igniting) {
        particle.velocity.set(Math.cos(angle) * (0.8 + spread), 0.75 + Math.random() * 1.6, Math.sin(angle) * (0.8 + spread));
        if (heavy) particle.velocity.multiplyScalar(1.55);
        particle.life = 0.2 + Math.random() * 0.42;
        particle.size *= reducedFlash ? 0.9 : accent ? 1.55 : 1.2;
        particle.glow *= reducedFlash ? 0.7 : 1.15;
      } else if (spinning && !igniting) {
        particle.position.x += Math.cos(angle) * 0.064;
        particle.position.z += Math.sin(angle) * 0.064;
        particle.velocity.set(Math.cos(angle) * (1.2 + spread), 0.7 + Math.random() * 1.3, Math.sin(angle) * (1.2 + spread));
      } else if (handheld) {
        particle.velocity.multiplyScalar(0.46);
        particle.life *= 0.54;
        particle.size *= 0.7;
      } else if (lift) {
        particle.position.y += shellRise(t - Math.random() * delta);
        particle.velocity.set(Math.cos(angle) * 0.32, -0.4 - Math.random() * 0.8, Math.sin(angle) * 0.32);
        particle.life = 0.22 + Math.random() * 0.28;
        particle.size *= 0.95;
      } else if (burstNow) {
        const y = Math.random() * 2 - 1;
        const horizontal = Math.sqrt(1 - y * y);
        particle.position.y += shellHeight;
        const inner = Math.random() < 0.22;
        particle.velocity.set(Math.cos(angle) * horizontal, y, Math.sin(angle) * horizontal)
          .multiplyScalar(inner ? 1.1 + Math.random() : 3.6 + Math.random() * 1.9);
        particle.life = inner ? 0.55 + Math.random() * 0.85 : 1.45 + Math.random() * 1.55;
        particle.size *= inner ? 1.9 : 1.7;
        particle.palette = id === 'rocket' || inner ? 1 : Math.random() < 0.52 ? 0 : 2;
      }
      particle.age = 0;
    }
    budget.current %= 1;

    const { transform, direction, hot, cool, color, burstColors } = tools;
    let count = 0;
    for (const particle of pool) {
      if (particle.age >= particle.life) continue;
      particle.age += delta;
      particle.velocity.multiplyScalar(Math.exp(-(particle.palette >= 0 ? 0.56 : 0.27) * delta));
      particle.velocity.y -= (aerial ? 2.3 : 5.4) * delta;
      particle.position.addScaledVector(particle.velocity, delta);
      if (particle.position.y <= 0 || particle.age >= particle.life) {
        particle.age = particle.life;
        continue;
      }

      const life = 1 - particle.age / particle.life;
      transform.position.copy(particle.position);
      transform.quaternion.setFromUnitVectors(up, direction.copy(particle.velocity).normalize());
      const length = (0.012 + particle.velocity.length() * (particle.palette >= 0 ? 0.032 : 0.016)) * life;
      transform.scale.set(particle.size, length, particle.size);
      transform.updateMatrix();
      sparks.current.setMatrixAt(count, transform.matrix);
      const peak = particle.palette >= 0 ? burstColors[particle.palette] : hot;
      sparks.current.setColorAt(count++, color.copy(cool).lerp(peak, life ** 0.55)
        .multiplyScalar(particle.glow * Math.min(1, life * 3.1)));
    }
    sparks.current.count = count;
    sparks.current.instanceMatrix.needsUpdate = true;
    if (sparks.current.instanceColor) sparks.current.instanceColor.needsUpdate = true;

    for (const particle of smoke) {
      if (smokeBudget.current < 1) break;
      if (particle.age < particle.life) continue;
      smokeBudget.current--;
      particle.position.copy(origin).addScaledVector(up, 0.03);
      particle.velocity.set(Math.random() * 0.26 - 0.04, 0.26 + Math.random() * 0.3, Math.random() * 0.3 - 0.15);
      particle.life = 1.5 + Math.random() * 0.85;
      particle.age = 0;
    }
    smokeBudget.current %= 1;
    let puffs = 0;
    for (const particle of smoke) {
      if (particle.age >= particle.life) continue;
      particle.age += delta;
      particle.velocity.x += delta * 0.055;
      particle.position.addScaledVector(particle.velocity, delta);
      particle.position.toArray(positions, puffs++ * 3);
    }
    haze.current.geometry.setDrawRange(0, puffs);
    hazePositions.current.needsUpdate = true;
    if (hazeMaterial.current) hazeMaterial.current.opacity = (quality === 'low' ? 0.085 : 0.15) * Math.min(1, (effectEnd - t) / 2.2);
  });

  return (
    <group name="Active firework" position={ground ?? worldOrigin}>
      {(id === 'skyshot' || id === 'rocket') && <mesh ref={shell} visible={false} raycast={() => {}}>
        <sphereGeometry args={[0.034, 10, 8]} />
        <meshBasicMaterial color="#ffdaa1" toneMapped={false} />
      </mesh>}
      <instancedMesh ref={sparks} args={[undefined, undefined, sparkCount]} count={0} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="white" blending={AdditiveBlending} transparent depthWrite={false} />
      </instancedMesh>
      <points ref={haze} frustumCulled={false}>
        <bufferGeometry drawRange={{ start: 0, count: 0 }}>
          <bufferAttribute ref={hazePositions} attach="attributes-position" args={[positions, 3]} usage={DynamicDrawUsage} />
        </bufferGeometry>
        <pointsMaterial ref={hazeMaterial} color="#9c8c7f" map={texture} size={0.48} transparent opacity={0} depthWrite={false} />
      </points>
    </group>
  );
}
