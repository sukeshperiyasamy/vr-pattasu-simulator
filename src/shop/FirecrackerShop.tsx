import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from 'zustand';
import {
  BoxGeometry, CanvasTexture, Color, Matrix4, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace,
} from 'three';
import type { Group, InstancedMesh } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PropShape } from '../fireworks/CrackerProps';
import { crackerIds, crackers } from '../fireworks/registry';
import type { CrackerId } from '../fireworks/registry';
import { packages, shop } from '../store/shop';
import { table } from '../scene/layout';

const width = 0.268;
const depth = 0.235;
const height = 0.064;
const hingeAngle = -1.97;
const artOrder = [...crackerIds, 'sign'] as const;
const atlasRows = Math.ceil(artOrder.length / 4);

function paintAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = atlasRows * 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create shop packaging textures');
  artOrder.forEach((id, index) => {
    const x = index % 4 * 256;
    const y = Math.floor(index / 4) * 256;
    const sign = id === 'sign';
    ctx.fillStyle = '#bc9163';
    ctx.fillRect(x, y, 256, 256);
    ctx.fillStyle = sign ? '#47302a' : packages[id].color;
    ctx.fillRect(x + 13, y + 14, 230, 228);
    ctx.strokeStyle = '#e6bb7b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 21, y + 22, 214, 212);
    ctx.strokeRect(x + 26, y + 27, 204, 202);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#eac790';
    ctx.font = 'bold 14px Georgia';
    ctx.fillText(sign ? 'COURTYARD FIREWORKS' : 'PATTASU · DIWALI SERIES', x + 128, y + 59, 190);
    ctx.fillStyle = '#fff0d3';
    ctx.font = 'bold 29px Georgia';
    const words = sign ? ['PATTASU', 'SHOP'] : crackers[id].label.length > 12 ? crackers[id].label.split(/ (?=[^ ]+$)/) : [crackers[id].label];
    words.forEach((word, i) => ctx.fillText(word, x + 128, y + (words.length > 1 ? 112 + i * 33 : 127), 189));
    ctx.fillStyle = '#f4cc86';
    ctx.font = 'bold 13px system-ui';
    ctx.fillText(sign ? 'SELECT · OPEN · TAKE ONE' : packages[id].mark, x + 128, y + 199, 192);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + 128 + side * 76, y + 170, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function labelGeometry(index: number, lid: boolean) {
  const geometry = lid ? new BoxGeometry(width, 0.012, depth) : new PlaneGeometry(0.79, 0.23);
  const uv = geometry.attributes.uv;
  const top = lid ? geometry.groups[2].start / 6 * 4 : 0;
  for (let i = 0; i < uv.count; i++) {
    const artwork = !lid || (i >= top && i < top + 4);
    const u = artwork ? uv.getX(i) * 0.97 + 0.015 : 0.025;
    const v = artwork ? uv.getY(i) * 0.97 + 0.015 : 0.025;
    uv.setXY(i, (index % 4 + u) / 4, (atlasRows - 1 - Math.floor(index / 4) + v) / atlasRows);
  }
  uv.needsUpdate = true;
  return geometry;
}

function trayGeometry() {
  const pieces = [
    new BoxGeometry(width, 0.014, depth).translate(0, 0.007, 0),
    ...[-1, 1].flatMap(side => [
      new BoxGeometry(width, height, 0.014).translate(0, height / 2, side * (depth / 2 - 0.007)),
      new BoxGeometry(0.014, height, depth - 0.028).translate(side * (width / 2 - 0.007), height / 2, 0),
    ]),
  ];
  const merged = mergeGeometries(pieces);
  pieces.forEach(piece => piece.dispose());
  return merged;
}

const FirecrackerBox = memo(function FirecrackerBox({ id, material, geometry, aimed, itemAimed }: {
  id: CrackerId; material: MeshStandardMaterial; geometry: BoxGeometry | PlaneGeometry;
  aimed: boolean; itemAimed: boolean;
}) {
  const box = useStore(shop, state => state.boxes[id]);
  const lid = useRef<Group>(null);
  const [x, y, z] = packages[id].position;
  const open = box.phase === 'open' || box.phase === 'empty' || box.phase === 'opening';
  const animating = box.phase === 'opening' || box.phase === 'closing';
  useFrame((_, delta) => {
    if (!lid.current) return;
    const target = open ? hingeAngle : 0;
    if (!animating) {
      lid.current.rotation.x = target;
      return;
    }
    const angle = lid.current.rotation.x;
    lid.current.rotation.x = angle + (target - angle) * (1 - Math.exp(-Math.min(delta, 0.05) * 14));
    if (Math.abs(lid.current.rotation.x - target) < 0.013) shop.getState().settle(id, box.revision);
  });
  const long = id === 'sparkler' || id === 'rocket' || id === 'skyshot';
  return (
    <group position={[x, y, z]} name={crackers[id].label + ' box'} userData={{ shopBox: id }}>
      <group ref={lid} position={[0, height + 0.004, -depth / 2]}>
        <mesh position-z={depth / 2} geometry={geometry} material={material} />
      </group>
      {aimed && <mesh position={[0, 0.034, depth / 2 + 0.001]} raycast={() => {}}>
        <planeGeometry args={[width * 0.8, 0.005]} />
        <meshBasicMaterial color="#f3ca8d" />
      </mesh>}
      {box.phase === 'open' && box.stock > 0 && (
        <group name={crackers[id].label + ' stock'} userData={{ shopItem: id }}>
          <group position={long ? [-0.088, 0.047, 0] : [0, 0.018, 0]}
            scale={id === 'wala' ? 0.42 : id === 'chain' ? 0.65 : 0.57} rotation-z={long ? -Math.PI / 2 : 0}>
            <PropShape id={id} highlighted={itemAimed} spent={false} />
          </group>
          <mesh position-y={0.071}>
            <boxGeometry args={[0.207, 0.11, 0.195]} />
            <meshBasicMaterial colorWrite={false} depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
  );
});

export const FirecrackerShop = memo(function FirecrackerShop({ aimed, counter = table }: {
  aimed: string | null; counter?: typeof table;
}) {
  const trays = useRef<InstancedMesh>(null);
  const resources = useMemo(() => {
    const texture = paintAtlas();
    return {
      texture, labels: new MeshStandardMaterial({ map: texture, roughness: 0.82, metalness: 0 }),
      tray: trayGeometry(), lids: crackerIds.map((_, index) => labelGeometry(index, true)),
      sign: labelGeometry(crackerIds.length, false),
    };
  }, []);
  useLayoutEffect(() => {
    if (!trays.current) return;
    const transform = new Matrix4();
    const color = new Color();
    crackerIds.forEach((id, index) => {
      const [x, y, z] = packages[id].position;
      trays.current?.setMatrixAt(index, transform.makeTranslation(x, y, z));
      trays.current?.setColorAt(index, color.set(aimed === 'box:' + id ? '#dcad74' : '#b28b62'));
    });
    trays.current.instanceMatrix.needsUpdate = true;
    if (trays.current.instanceColor) trays.current.instanceColor.needsUpdate = true;
    trays.current.computeBoundingSphere();
  }, [aimed]);
  useLayoutEffect(() => () => {
    resources.lids.forEach(geometry => geometry.dispose());
    resources.sign.dispose();
    resources.tray.dispose();
    resources.labels.dispose();
    resources.texture.dispose();
  }, [resources]);

  return (
    <group position={[counter.x, counter.height + 0.004, counter.z]} name="Pattasu shop">
      <mesh position={[0, 0.291, -0.16]} receiveShadow>
        <boxGeometry args={[1.49, 0.036, 0.25]} />
        <meshStandardMaterial color="#513526" roughness={0.88} />
      </mesh>
      {[-0.37, 0.37].map(x => <mesh key={x} position={[x, 0.32, -0.294]} receiveShadow>
        <boxGeometry args={[0.035, 0.64, 0.048]} />
        <meshStandardMaterial color="#624332" roughness={0.88} />
      </mesh>)}
      <mesh position={[0, 0.64, -0.285]} geometry={resources.sign} material={resources.labels} raycast={() => {}} />
      <instancedMesh ref={trays} args={[resources.tray, undefined, crackerIds.length]} userData={{ shopTrays: true }}>
        <meshStandardMaterial roughness={0.93} />
      </instancedMesh>
      {crackerIds.map((id, index) => <FirecrackerBox key={id} id={id} material={resources.labels}
        geometry={resources.lids[index]} aimed={aimed === 'box:' + id} itemAimed={aimed === 'stock:' + id} />)}
    </group>
  );
});
