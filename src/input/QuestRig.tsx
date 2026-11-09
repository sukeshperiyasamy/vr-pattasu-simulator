import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { createXRStore, XROrigin } from '@react-three/xr';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, Quaternion, Ray, Vector3 } from 'three';
import type { Group, Mesh, MeshBasicMaterial, Object3D, Sprite } from 'three';
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
  armed: boolean;
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
    ctx.fillText(passthrough ? 'Right: interact   •   Left: fire when armed   •   B: reset'
      : 'Right: interact   •   Left: teleport / fire   •   B: reset', 512, 136, 950);
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

const beamAxis = new Vector3(0, 1, 0);
const noRaycast = () => {};

export function QuestRig({ active, passthrough, armed, pointer, leftPointer, actions, hint }: Props) {
  const { gl } = useThree();
  const origin = useRef<Group>(null);
  const controllers = useMemo(() => [gl.xr.getController(0), gl.xr.getController(1)], [gl]);
  const sources = useRef<(XRInputSource | null)[]>([null, null]);
  const previousButtons = useRef([false, false]);
  const leftStickPressed = useRef(false);
  const rightTriggerAt = useRef<number | null>(null);
  const snapReady = useRef(true);
  const ray = useMemo(() => new Ray(), []);
  const target = useMemo(() => new Vector3(), []);
  const head = useMemo(() => new Vector3(), []);
  const beam = useRef<Mesh>(null);
  const landing = useRef<Mesh>(null);

  useLayoutEffect(() => {
    origin.current?.position.set(0, 0, passthrough ? 0 : 5.45);
    origin.current?.rotation.set(0, 0, 0);
  }, [active, passthrough]);

  const teleport = useMemo(() => {
    function point(controller: Object3D) {
      controller.getWorldPosition(ray.origin);
      controller.getWorldDirection(ray.direction).negate();
      const distance = -ray.origin.y / ray.direction.y;
      const reachesFloor = ray.direction.y < -0.08 && distance > 0 && distance <= 8;
      ray.at(reachesFloor ? distance : 8, target);
      return reachesFloor && canWalk(target.x, target.z);
    }
    return {
      point,
      move(controller: Object3D) {
        if (!origin.current || !point(controller)) return;
        gl.xr.getCamera().getWorldPosition(head);
        origin.current.position.x += target.x - head.x;
        origin.current.position.z += target.z - head.z;
      },
    };
  }, [gl, head, ray, target]);

  useEffect(() => {
    const remove = controllers.map((controller, index) => {
      const connect = (event: { data: XRInputSource }) => { sources.current[index] = event.data; };
      const disconnect = () => {
        if (sources.current[index]?.handedness === 'right') rightTriggerAt.current = null;
        if (sources.current[index]?.handedness === 'left') leftStickPressed.current = false;
        sources.current[index] = null;
        previousButtons.current[index] = false;
      };
      const start = (event: { data: XRInputSource }) => {
        if (event.data.handedness === 'right') rightTriggerAt.current = performance.now();
      };
      const end = (event: { data: XRInputSource }) => {
        if (event.data.handedness === 'right') rightTriggerAt.current = null;
      };
      const holster = (event: { data: XRInputSource }) => {
        if (armed && event.data.handedness === 'left') actions.current?.('holster');
      };
      const select = (event: { data: XRInputSource }) => {
        if (!gl.xr.isPresenting || !origin.current || event.data.targetRayMode !== 'tracked-pointer') return;
        if (event.data.handedness === 'left') {
          if (armed) { leftPointer.current = controller; actions.current?.('shoot'); }
          else if (!passthrough) teleport.move(controller);
          else return;
        } else {
          pointer.current = controller;
          const started = rightTriggerAt.current;
          actions.current?.(started !== null && performance.now() - started >= 650 ? 'replay' : 'use');
        }
        void event.data.gamepad?.hapticActuators?.[0]?.pulse?.(0.16, 30).catch(() => {});
      };
      controller.addEventListener('connected', connect);
      controller.addEventListener('disconnected', disconnect);
      controller.addEventListener('select', select);
      controller.addEventListener('selectstart', start);
      controller.addEventListener('selectend', end);
      controller.addEventListener('squeezestart', holster);
      return () => {
        controller.removeEventListener('connected', connect);
        controller.removeEventListener('disconnected', disconnect);
        controller.removeEventListener('select', select);
        controller.removeEventListener('selectstart', start);
        controller.removeEventListener('selectend', end);
        controller.removeEventListener('squeezestart', holster);
      };
    });
    return () => { remove.forEach(dispose => dispose()); pointer.current = leftPointer.current = null; };
  }, [actions, armed, controllers, gl, leftPointer, passthrough, pointer, teleport]);

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
    if (beam.current && landing.current) {
      const controller = leftPointer.current;
      const stickButton = sources.current[left]?.gamepad?.buttons[3];
      const show = !passthrough && Boolean(controller?.visible) && (!armed || Boolean(stickButton?.touched || stickButton?.pressed));
      beam.current.visible = show;
      landing.current.visible = false;
      if (show && controller) {
        const stick = Boolean(stickButton?.pressed);
        if (stick && !leftStickPressed.current) teleport.move(controller);
        leftStickPressed.current = stick;
        const valid = teleport.point(controller);
        beam.current.position.copy(ray.origin).lerp(target, 0.5);
        beam.current.quaternion.setFromUnitVectors(beamAxis, ray.direction);
        beam.current.scale.y = ray.origin.distanceTo(target);
        (beam.current.material as MeshBasicMaterial).color.set(valid ? '#7cd9ff' : '#bd785b');
        landing.current.visible = valid;
        landing.current.position.set(target.x, 0.018, target.z);
      } else leftStickPressed.current = false;
    }
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
            {active && <mesh position-z={-0.53} raycast={noRaycast}>
              <boxGeometry args={[0.004, 0.004, 1]} />
              <meshBasicMaterial color={index === 0 ? '#a2c4ff' : '#ffdbab'} transparent opacity={0.75} toneMapped={false} />
            </mesh>}
          </primitive>
        ))}
      </XROrigin>
      {active && !passthrough && <>
        <mesh ref={beam} name="Teleport beam" visible={false} raycast={noRaycast}>
          <cylinderGeometry args={[0.006, 0.006, 1, 6]} />
          <meshBasicMaterial color="#7cd9ff" toneMapped={false} />
        </mesh>
        <mesh ref={landing} name="Teleport landing ring" visible={false} rotation-x={-Math.PI / 2} raycast={noRaycast}>
          <ringGeometry args={[0.22, 0.26, 40]} />
          <meshBasicMaterial color="#7cd9ff" toneMapped={false} />
        </mesh>
      </>}
      {active && <Guide hint={hint} passthrough={passthrough} />}
    </>
  );
}
