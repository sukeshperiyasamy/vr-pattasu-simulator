import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import {
  BackSide, Color, DataTexture, EquirectangularReflectionMapping, LinearFilter, Matrix4, Mesh, MeshStandardMaterial, RepeatWrapping,
  SRGBColorSpace, TextureLoader, Vector2, Vector3,
} from 'three';
import type { DirectionalLight, InstancedMesh } from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { court, table } from './layout';
import { Veranda } from './Veranda';
import { PracticeTargets } from './PracticeTargets';

const assets = import.meta.env.BASE_URL + 'assets/';
const materialPaths = ['floor', 'wall'].flatMap(surface =>
  ['Diffuse', 'nor_gl', 'Rough'].map(map => assets + surface + '-' + map + '.webp'),
);
export const diyaLocations = [
  [-4.72, 0.242, -5.01], [-3.85, 0.242, -5.01], [-3.02, 0.242, -5.01],
  [-1.82, 0.242, -5.01], [-1.44, 0.242, -5.01], [1.44, 0.242, -5.01],
  [1.82, 0.242, -5.01], [3.02, 0.242, -5.01], [3.85, 0.242, -5.01],
  [4.72, 0.242, -5.01], [2.15, table.height, table.z + 0.28], [3.35, table.height, table.z + 0.28],
] as const;
export const initialLitDiyas = new Set([0, 2, 4, 5, 7, 9, 10]);

function NightSky() {
  const texture = useMemo(() => {
    const data = new Uint8Array(128 * 4);
    const low = new Color('#343342');
    const high = new Color('#081629');
    const color = new Color();
    for (let i = 0; i < 128; i++) {
      const sky = Math.min(1, Math.max(0, (i / 127 - 0.44) * 2.15));
      color.copy(low).lerp(high, sky ** 0.65).convertLinearToSRGB();
      data.set([color.r * 255, color.g * 255, color.b * 255, 255], i * 4);
    }
    const map = new DataTexture(data, 1, 128);
    map.colorSpace = SRGBColorSpace;
    map.magFilter = LinearFilter;
    map.minFilter = LinearFilter;
    map.needsUpdate = true;
    return map;
  }, []);
  useLayoutEffect(() => () => texture.dispose(), [texture]);
  return <mesh raycast={() => {}} renderOrder={-20}>
    <sphereGeometry args={[38, 20, 12]} />
    <meshBasicMaterial map={texture} side={BackSide} toneMapped={false} depthWrite={false} />
  </mesh>;
}

function Rangoli() {
  const petals = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = petals.current;
    if (!mesh) return;
    const transform = new Matrix4();
    const color = new Color();
    const petalScale = new Vector3(0.062, 0.18, 1);
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      mesh.setMatrixAt(i, transform.makeRotationZ(angle).scale(petalScale).setPosition(
        0.34 * Math.sin(angle), -0.34 * Math.cos(angle), 0,
      ));
      mesh.setColorAt(i, color.set(i % 2 ? '#bc6551' : '#c89450'));
      const dot = angle + Math.PI / 12;
      mesh.setMatrixAt(i + 12, transform.makeScale(0.019, 0.019, 1).setPosition(
        0.58 * Math.sin(dot), -0.58 * Math.cos(dot), 0,
      ));
      mesh.setColorAt(i + 12, color.set('#d4b680'));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group position={[0, 0.004, -3.88]} rotation-x={-Math.PI / 2}>
      <instancedMesh ref={petals} args={[undefined, undefined, 24]} receiveShadow>
        <circleGeometry args={[1, 16]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <mesh position-z={0.001} receiveShadow>
        <ringGeometry args={[0.531, 0.549, 64]} />
        <meshStandardMaterial color="#c8ad83" roughness={1} />
      </mesh>
      <mesh position-z={0.001} receiveShadow>
        <circleGeometry args={[0.11, 24]} />
        <meshStandardMaterial color="#c8ad83" roughness={1} />
      </mesh>
    </group>
  );
}

export function DiyaInstances({ lit, locations = diyaLocations }: {
  lit: ReadonlySet<number>; locations?: readonly (readonly [number, number, number])[];
}) {
  const { scene } = useLoader(GLTFLoader, assets + 'diya.glb');
  const meshes = useMemo(() => {
    const parts: Mesh[] = [];
    scene.traverse(object => { if (object instanceof Mesh) parts.push(object); });
    return parts;
  }, [scene]);
  const instances = useRef<(InstancedMesh | null)[]>([]);

  useLayoutEffect(() => {
    const transform = new Matrix4();
    instances.current.forEach((instance, index) => {
      if (!instance) return;
      const flame = meshes[index].name.toLowerCase().includes('flame');
      locations.forEach(([x, y, z], i) => {
        transform.makeRotationY(-Math.PI / 2);
        if (flame && !lit.has(i)) transform.makeScale(0.000001, 0.000001, 0.000001);
        instance.setMatrixAt(i, transform.setPosition(x, y, z));
      });
      instance.instanceMatrix.needsUpdate = true;
      instance.computeBoundingSphere();
    });
  }, [lit, locations, meshes]);

  return meshes.map((mesh, index) => (
    <instancedMesh
      key={mesh.uuid}
      ref={instance => { instances.current[index] = instance; }}
      args={[mesh.geometry, mesh.material, locations.length]}
      userData={{ diya: true }}
    />
  ));
}

function Lighting() {
  const environment = useLoader(EXRLoader, assets + 'night.exr');
  const scene = useThree(state => state.scene);
  const moon = useRef<DirectionalLight>(null);

  useLayoutEffect(() => {
    environment.mapping = EquirectangularReflectionMapping;
    scene.environment = environment;
    scene.environmentIntensity = 0.22;
    if (moon.current) moon.current.shadow.needsUpdate = true;
    return () => { scene.environment = null; };
  }, [environment, scene]);

  return (
    <>
      <hemisphereLight args={['#a1b9e9', '#715c51', 0.82]} />
      <directionalLight
        ref={moon} position={[-4, 8, 4]} color="#bbcffa" intensity={0.94} castShadow
        shadow-mapSize={[1024, 1024]} shadow-normalBias={0.028} shadow-bias={-0.00015}
        shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={8} shadow-camera-bottom={-8}
        shadow-camera-near={0.3} shadow-camera-far={24} shadow-autoUpdate={false}
      />
      <pointLight position={[-3.75, 0.64, -4.96]} color="#ffa861" intensity={5} distance={3.5} />
      <pointLight position={[3.75, 0.64, -4.96]} color="#ffa861" intensity={5} distance={3.5} />
      <pointLight position={[table.x - 0.35, 1.58, table.z + 0.54]} color="#ffd1a1" intensity={3.9} distance={4.6} />
    </>
  );
}

export const Courtyard = memo(function Courtyard({ litDiyas }: { litDiyas: ReadonlySet<number> }) {
  const maps = useLoader(TextureLoader, materialPaths);
  const tableAsset = useLoader(GLTFLoader, assets + 'table/WoodenTable_01_1k.gltf');

  const [floor, plaster] = useMemo(() => {
    return [[court.width / 2.3, court.depth / 2.3], [2.6, 1.6]].map(([u, v], i) => {
      const [color, normal, roughness] = maps.slice(i * 3, i * 3 + 3);
      color.colorSpace = SRGBColorSpace;
      for (const texture of [color, normal, roughness]) {
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.repeat.set(u, v);
        texture.anisotropy = 4;
      }
      return new MeshStandardMaterial({
        map: color, normalMap: normal, roughnessMap: roughness,
        roughness: 1, normalScale: new Vector2(i === 0 ? 0.66 : 0.39, i === 0 ? 0.66 : 0.39),
        color: new Color(i === 0 ? '#b3aa9e' : '#e0c6ac'),
      });
    });
  }, [maps]);

  useLayoutEffect(() => {
    tableAsset.scene.traverse(object => {
      if (object instanceof Mesh) object.castShadow = object.receiveShadow = true;
    });
  }, [tableAsset]);

  useLayoutEffect(() => () => {
    floor.dispose();
    plaster.dispose();
  }, [floor, plaster]);

  return (
    <>
      <color attach="background" args={['#101927']} />
      <NightSky />
      <Lighting />
      <mesh rotation-x={-Math.PI / 2} material={floor} receiveShadow userData={{ stagingSurface: true }}>
        <planeGeometry args={[court.width, court.depth]} />
      </mesh>
      {[-1, 1].map(side => (
        <group key={side} position-x={side * court.width / 2}>
          <mesh position-y={1.05} scale={[0.25, 2.1, court.depth]} material={plaster} receiveShadow>
            <boxGeometry />
          </mesh>
          <mesh position-y={2.115}>
            <boxGeometry args={[0.39, 0.11, court.depth]} />
            <meshStandardMaterial color="#865947" roughness={0.91} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.05, 6.95]} scale={[court.width, 2.1, 0.24]} material={plaster} receiveShadow>
        <boxGeometry />
      </mesh>
      <mesh position={[0, 1.05, -6.99]} scale={[court.width, 2.1, 0.16]} material={plaster} receiveShadow>
        <boxGeometry />
      </mesh>
      <Veranda plaster={plaster} />
      <PracticeTargets />
      <Rangoli />
      <DiyaInstances lit={litDiyas} />
      {litDiyas.has(11) && <pointLight position={[3.35, table.height + 0.15, table.z + 0.28]} intensity={1.35} distance={1.8} color="#ff9c55" />}
      <primitive object={tableAsset.scene} position={[table.x, 0, table.z]} scale={[1, table.height / 0.54885, 1]} />
    </>
  );
});
