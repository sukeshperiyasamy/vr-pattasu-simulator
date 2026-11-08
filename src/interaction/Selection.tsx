import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Quaternion, Raycaster, Vector2, Vector3 } from 'three';
import type { Intersection, Mesh, Object3D } from 'three';
import type { Action, Firework, Ground } from '../fireworks/lifecycle';
import { crackerIds, crackers } from '../fireworks/registry';
import type { CrackerId, PistolId } from '../fireworks/registry';
import { pistolMuzzle, pistolOffset, vrPistolOffset } from '../fireworks/CapPistols';
import type { CapShot } from '../fireworks/CapPistols';
import type { ShopAim } from '../store/shop';
import { shop } from '../store/shop';
import { playShopCue } from '../audio/fountain';

export type Aim = CrackerId | PistolId | ShopAim | 'ground' | 'diya' | null;
export type InputAction = 'pick' | 'place' | 'ignite' | 'reset' | 'use' | 'shoot';

interface Props {
  firework: Firework;
  onAim: (aimed: Aim) => void;
  onAction: (action: Exclude<Action, { type: 'pick' }>) => void;
  onFeedback: (message: string) => void;
  touchActive: boolean;
  touchAction: RefObject<((action: InputAction) => void) | null>;
  xrActive: boolean;
  xrPointer: RefObject<Object3D | null>;
  litDiyas: ReadonlySet<number>;
  taperLit: boolean;
  onLightTaper: () => void;
  onLightDiya: (index: number) => void;
  pistol: PistolId | null;
  onEquip: (id: PistolId) => void;
  onShoot: (shot: CapShot, target: CrackerId | null) => void;
  onReset: () => void;
}

const center = new Vector2();

export function Selection({
  firework, onAim, onAction, onFeedback, touchActive, touchAction, xrActive, xrPointer,
  litDiyas, taperLit, onLightTaper, onLightDiya,
  pistol, onEquip, onShoot, onReset,
}: Props) {
  const { camera, scene, gl } = useThree();
  const marker = useRef<Mesh>(null);
  const previous = useRef<Aim>(null);
  const elapsed = useRef(0);
  const lastShopSound = useRef(-Infinity);
  const hit = useMemo(() => {
    const ray = new Raycaster(undefined, undefined, 0, 4.5);
    const hits: Intersection[] = [];
    const origin = new Vector3();
    const direction = new Vector3();
    const endpoint = new Vector3();
    return (range = 4.5, screen = center) => {
      hits.length = 0;
      ray.far = range;
      if (xrActive) {
        const pointer = xrPointer.current;
        if (!pointer?.visible) return;
        ray.set(pointer.getWorldPosition(origin), pointer.getWorldDirection(direction).negate());
      } else {
        camera.updateMatrixWorld();
        ray.setFromCamera(screen, camera);
      }
      ray.intersectObject(scene, true, hits);
      return { intersection: hits[0], end: ray.ray.at(range, endpoint) };
    };
  }, [camera, scene, xrActive, xrPointer]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < 1 / 30) return;
    elapsed.current = 0;
    const interactive = firework.stage !== 'burning';
    const intersection = interactive && (xrActive || touchActive || document.pointerLockElement === gl.domElement)
      ? hit()?.intersection : undefined;
    const ground = firework.stage === 'held' && crackers[firework.id].placement === 'ground'
      ? placement(intersection) : null;
    if (marker.current) {
      marker.current.visible = ground !== null;
      if (ground) {
        marker.current.position.set(ground[0], 0.012, ground[2]);
        marker.current.scale.setScalar(firework.stage === 'held' && firework.id === 'wala' ? 1.8 : 1);
      }
    }
    const target = aimedAtProp(intersection);
    const toy = firework.stage === 'available' || firework.stage === 'placed' || firework.stage === 'finished'
      ? aimedAtPistol(intersection) : null;
    const shopTarget = !pistol && !ground ? aimedAtShop(intersection) : null;
    const aimed = shopTarget ?? toy ?? (diyaIndex(intersection) !== undefined ? 'diya' : ground ? 'ground'
      : firework.stage === 'available' || (firework.stage === 'placed' && target === firework.id) ? target : null);
    if (aimed !== previous.current) {
      previous.current = aimed;
      onAim(aimed);
      if (shopTarget?.startsWith('stock:') && intersection && performance.now() - lastShopSound.current > 500) {
        lastShopSound.current = performance.now();
        playShopCue('shop-select', intersection.point, camera);
      }
    }
  });

  useEffect(() => {
    const canvas = gl.domElement;
    const locked = () => document.pointerLockElement === canvas;
    const pick = (currentHit?: Intersection) => {
      const target = !pistol ? aimedAtShop(currentHit) : null;
      if (target && currentHit) {
        const id = target.slice(target.indexOf(':') + 1) as CrackerId;
        const inventory = shop.getState();
        if (target.startsWith('box:')) {
          const empty = inventory.boxes[id].phase === 'empty';
          const phase = inventory.toggle(id);
          if (phase) playShopCue(empty ? 'shop-empty' : phase === 'opening' ? 'shop-open' : 'shop-close', currentHit.point, camera);
          if (empty) onFeedback('Box empty. Reset to restock.');
        } else {
          const result = inventory.take(id);
          if (result === 'taken') {
            playShopCue('shop-pick', currentHit.point, camera);
            onFeedback(crackers[id].label + ' taken.');
          } else if (result === 'empty') {
            playShopCue('shop-empty', currentHit.point, camera);
            onFeedback('Box empty. Reset to restock.');
          } else if (result === 'busy') onFeedback('Finish or reset the current cracker first.');
          else if (result === 'failed') onFeedback('Could not take the cracker. Stock was kept.');
        }
        return;
      }
      const toy = aimedAtPistol(currentHit);
      if (toy && (firework.stage === 'available' || firework.stage === 'placed' || firework.stage === 'finished')) {
        onEquip(toy);
      }
    };
    function click(event: MouseEvent) {
      if (event.button === 0 && locked()) perform(pistol ? 'shoot' : 'pick');
    }
    let tap: { id: number; x: number; y: number } | null = null;
    function startTap(event: PointerEvent) {
      if (touchActive && event.pointerType === 'touch') tap = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }
    function endTap(event: PointerEvent) {
      if (!tap || tap.id !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - tap.x, event.clientY - tap.y);
      tap = null;
      if (event.type !== 'pointerup' || distance > 8 || pistol) return;
      const rect = canvas.getBoundingClientRect();
      const screen = new Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
      const contact = hit(4.5, screen)?.intersection;
      if (aimedAtShop(contact)) pick(contact);
    }
    function shoot() {
      const pose = xrActive ? xrPointer.current : camera;
      if (!pose || !pistol) return;
      const result = hit(12);
      if (!result) return;
      const contact = result.intersection;
      const offset = xrActive ? vrPistolOffset : pistolOffset;
      const muzzle = new Vector3(...pistolMuzzle).add(new Vector3(...offset))
        .applyQuaternion(pose.getWorldQuaternion(new Quaternion())).add(pose.getWorldPosition(new Vector3()));
      onShoot({
        id: pistol, muzzle: muzzle.toArray(), end: (contact?.point ?? result.end).toArray(),
        hit: Boolean(contact), at: performance.now(),
      }, aimedAtProp(contact, 6));
    }
    function perform(action: InputAction) {
      if (action === 'reset') { onReset(); return; }
      if (pistol && (action === 'shoot' || action === 'ignite' || action === 'use')) { shoot(); return; }
      const currentHit = hit()?.intersection;
      const lamp = diyaIndex(currentHit);
      if ((action === 'ignite' || action === 'use') && lamp !== undefined) {
        if (xrActive) { onFeedback('Touch the stick tip to this diya.'); return; }
        if (litDiyas.has(lamp)) {
          onLightTaper();
          onFeedback('Taper lit. Use it to light a diya or ignite a firecracker.');
        } else if (taperLit) {
          onLightDiya(lamp);
          onFeedback('Diya lit.');
        } else onFeedback('Use a burning diya to light your taper first.');
        return;
      }
      if (action === 'use') {
        if (aimedAtShop(currentHit) || aimedAtPistol(currentHit)) {
          pick(currentHit);
          return;
        }
        action = firework.stage === 'available' ? 'pick'
          : firework.stage === 'held' && crackers[firework.id].placement === 'ground' ? 'place' : 'ignite';
      }
      switch (action) {
        case 'pick': pick(currentHit); break;
        case 'place': {
          if (firework.stage !== 'held' || crackers[firework.id].placement !== 'ground') return;
          const ground = placement(currentHit);
          if (ground) onAction({ type: 'place', ground });
          else onFeedback('Aim at open paving in the middle of the courtyard.');
          break;
        }
        case 'ignite':
          if (xrActive) { onFeedback('Touch the glowing stick tip to the fuse.'); break; }
          if ((firework.stage === 'placed' && aimedAtProp(currentHit) === firework.id)
            || (firework.stage === 'held' && crackers[firework.id].placement === 'handheld')) {
            if (taperLit) onAction({ type: 'ignite' });
            else onFeedback('Aim at a burning diya and use it to light your taper first.');
          }
          else if (firework.stage === 'held') onFeedback('Place the firecracker on the ground first.');
          else if (firework.stage === 'placed') onFeedback('Aim at the placed firecracker from nearby.');
          break;
        case 'shoot': break;
      }
    }
    function keydown(event: KeyboardEvent) {
      if (!locked() || event.repeat) return;
      const action = keyActions.get(event.code);
      if (action) perform(action);
    }
    touchAction.current = touchActive || xrActive ? perform : null;
    canvas.addEventListener('click', click);
    canvas.addEventListener('pointerdown', startTap);
    canvas.addEventListener('pointerup', endTap);
    canvas.addEventListener('pointercancel', endTap);
    window.addEventListener('keydown', keydown);
    return () => {
      touchAction.current = null;
      canvas.removeEventListener('click', click);
      canvas.removeEventListener('pointerdown', startTap);
      canvas.removeEventListener('pointerup', endTap);
      canvas.removeEventListener('pointercancel', endTap);
      window.removeEventListener('keydown', keydown);
    };
  }, [camera, firework, gl, hit, litDiyas, onAction, onEquip, onFeedback, onLightDiya, onLightTaper, onReset, onShoot, pistol, taperLit, touchActive, touchAction, xrActive, xrPointer]);

  return (
    <mesh ref={marker} visible={false} rotation-x={-Math.PI / 2} raycast={() => {}}>
      <ringGeometry args={[0.13, 0.149, 40]} />
      <meshBasicMaterial color="#f5d597" transparent opacity={0.72} depthWrite={false} />
    </mesh>
  );
}

const keyActions = new Map<string, InputAction>([
  ['KeyE', 'pick'], ['KeyG', 'place'], ['KeyF', 'ignite'], ['KeyR', 'reset'],
]);

function diyaIndex(hit?: Intersection) {
  return hit && hit.distance <= 2.5 && hit.object.userData.diya ? hit.instanceId : undefined;
}

function aimedAtProp(hit?: Intersection, distance = 2.5): CrackerId | null {
  if (!hit || hit.distance > distance) return null;
  for (let object: Object3D | null = hit.object; object; object = object.parent) {
    if (object.userData.firecracker) return object.userData.firecracker as CrackerId;
  }
  return null;
}

function aimedAtPistol(hit?: Intersection): PistolId | null {
  if (!hit || hit.distance > 2.5) return null;
  for (let object: Object3D | null = hit.object; object; object = object.parent) {
    if (object.userData.pistol) return object.userData.pistol as PistolId;
  }
  return null;
}

function aimedAtShop(hit?: Intersection): ShopAim | null {
  if (!hit || hit.distance > 2.5) return null;
  if (hit.object.userData.shopTrays && hit.instanceId !== undefined) {
    return `box:${crackerIds[hit.instanceId]}`;
  }
  for (let object: Object3D | null = hit.object; object; object = object.parent) {
    if (object.userData.shopItem) return `stock:${object.userData.shopItem as CrackerId}`;
    if (object.userData.shopBox) {
      const id = object.userData.shopBox as CrackerId;
      return `box:${id}`;
    }
  }
  return null;
}

function placement(hit?: Intersection): Ground | null {
  if (!hit?.object.userData.stagingSurface || hit.distance < 1.8) return null;
  const { x, z } = hit.point;
  return Math.abs(x) < 3.6 && z > -1.65 && z < 4 ? [x, 0, z] : null;
}
