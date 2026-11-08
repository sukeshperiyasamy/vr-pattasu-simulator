import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { createXRStore, XROrigin } from '@react-three/xr';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, Quaternion, Ray, Vector3 } from 'three';
import type { Group, Object3D, Sprite } from 'three';
import { canWalk } from '../scene/layout';
import type { InputAction } from '../interaction/Selection';

export const questStore = createXRStore({
  controller: false, hand: false, gaze: false, screenInput: false,
  emulate: false, enterGrantedSession: false, offerSession: false,
  foveation: 0.65, frameBufferScaling: 0.85,
  baseAssetPath: new URL(import.meta.env.BASE_URL + 'assets/xr/', window.location.href).href,
  defaultControllerProfileId: 'generic-trigger-squeeze-thumbstick',
});

interface Props {
  active: boolean;
  passthrough: boolean;
  pointer: RefObject<Object3D | null>;
  leftPointer: RefObject<Object3D | null>;
  actions: RefObject<((action: InputAction) => void) | null>;
  hint: string;
}

function Guide({ hint, passthrough }: { hint: string; passthrough: boolean }) {
  const sprite = useRef<Sprite>(null);
  const screen = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 192;
    return { canvas, texture: new CanvasTexture(canvas) };
  }, []);
  const offset = useMemo(() => new Vector3(), []);
  const rotation = useMemo(() => new Quaternion(), []);
  useEffect(() => () => screen.texture.dispose(), [screen]);
  useEffect(() => {
    const ctx = screen.canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 1024, 192);
    ctx.fillStyle = '#141c27e9';
    ctx.beginPath();
    ctx.roundRect(8, 8, 1008, 176, 32);
    ctx.fill();
    ctx.fillStyle = '#ffe2b6';
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px system-ui';
    ctx.fillText(hint, 512, 81, 950);
    ctx.fillStyle = '#d7cfc5';
    ctx.font = '32px system-ui';
    ctx.fillText(passthrough ? 'Right trigger: interact   •   B: reset   •   Quest menu: exit'
      : 'Left trigger: teleport   •   Right trigger: interact   •   B: reset', 512, 136, 950);
    screen.texture.needsUpdate = true;
  }, [hint, passthrough, screen]);
  useFrame(({ camera }) => {
    if (!sprite.current) return;
    camera.getWorldPosition(sprite.current.position);
    camera.getWorldQuaternion(rotation);
    offset.set(0, -0.43, -1.12).applyQuaternion(rotation);
    sprite.current.position.add(offset);
  });
  return (
    <sprite ref={sprite} scale={[0.96, 0.18, 1]} renderOrder={20} raycast={() => {}}>
      <spriteMaterial map={screen.texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

export function QuestRig({ active, passthrough, pointer, leftPointer, actions, hint }: Props) {
  const { gl } = useThree();
  const origin = useRef<Group>(null);
  const controllers = useMemo(() => [gl.xr.getController(0), gl.xr.getController(1)], [gl]);
  const sources = useRef<(XRInputSource | null)[]>([null, null]);
  const previousButtons = useRef([false, false]);
  const snapReady = useRef(true);
  const ray = useMemo(() => new Ray(), []);
  const target = useMemo(() => new Vector3(), []);
  const head = useMemo(() => new Vector3(), []);

  useLayoutEffect(() => {
    origin.current?.position.set(0, 0, passthrough ? 0 : 5.45);
    origin.current?.rotation.set(0, 0, 0);
  }, [active, passthrough]);

  useEffect(() => {
    const remove = controllers.map((controller, index) => {
      const connect = (event: { data: XRInputSource }) => { sources.current[index] = event.data; };
      const disconnect = () => { sources.current[index] = null; previousButtons.current[index] = false; };
      const select = (event: { data: XRInputSource }) => {
        if (!gl.xr.isPresenting || !origin.current || event.data.targetRayMode !== 'tracked-pointer') return;
        if (event.data.handedness === 'left') {
          if (passthrough) return;
          controller.getWorldPosition(ray.origin);
          controller.getWorldDirection(ray.direction).negate();
          if (ray.direction.y >= -0.08) return;
          const distance = -ray.origin.y / ray.direction.y;
          if (distance > 8) return;
          ray.at(distance, target);
          if (!canWalk(target.x, target.z)) return;
          gl.xr.getCamera().getWorldPosition(head);
          origin.current.position.x += target.x - head.x;
          origin.current.position.z += target.z - head.z;
        } else {
          pointer.current = controller;
          actions.current?.('use');
        }
        void event.data.gamepad?.hapticActuators?.[0]?.pulse?.(0.16, 30).catch(() => {});
      };
      controller.addEventListener('connected', connect);
      controller.addEventListener('disconnected', disconnect);
      controller.addEventListener('select', select);
      return () => {
        controller.removeEventListener('connected', connect);
        controller.removeEventListener('disconnected', disconnect);
        controller.removeEventListener('select', select);
      };
    });
    return () => { remove.forEach(dispose => dispose()); pointer.current = leftPointer.current = null; };
  }, [actions, controllers, gl, head, leftPointer, passthrough, pointer, ray, target]);

  useFrame(() => {
    if (!active || !origin.current) {
      pointer.current = null;
      leftPointer.current = null;
      return;
    }
    const index = sources.current.findIndex(source => source?.handedness === 'right');
    const left = sources.current.findIndex(source => source?.handedness === 'left');
    leftPointer.current = left < 0 ? null : controllers[left];
    pointer.current = index < 0 ? null : controllers[index];
    if (index < 0) return;
    const pad = sources.current[index]?.gamepad;
    const reset = Boolean(pad?.buttons[5]?.pressed);
    if (reset && !previousButtons.current[index]) actions.current?.('reset');
    previousButtons.current[index] = reset;
    if (passthrough) return;
    const axis = pad?.axes[2] ?? 0;
    if (Math.abs(axis) < 0.3) snapReady.current = true;
    if (!snapReady.current || Math.abs(axis) < 0.75) return;
    snapReady.current = false;
    const camera = gl.xr.getCamera();
    camera.getWorldPosition(head);
    origin.current.rotation.y -= Math.sign(axis) * Math.PI / 6;
    origin.current.updateMatrixWorld(true);
    camera.getWorldPosition(target);
    origin.current.position.x += head.x - target.x;
    origin.current.position.z += head.z - target.z;
  }, -2);

  return (
    <>
      <XROrigin name="Quest origin" ref={origin} disabled={!active}>
        {controllers.map((controller, index) => (
          <primitive object={controller} key={controller.uuid}>
            {active && <mesh position-z={-0.53} raycast={() => {}}>
              <boxGeometry args={[0.0025, 0.0025, 1]} />
              <meshBasicMaterial color={index === 0 ? '#a2c4ff' : '#ffdbab'} transparent opacity={0.68} />
            </mesh>}
          </primitive>
        ))}
      </XROrigin>
      {active && <Guide hint={hint} passthrough={passthrough} />}
    </>
  );
}
