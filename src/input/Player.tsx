import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Euler, MathUtils, Vector3 } from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { canWalk, eyeHeight } from '../scene/layout';

const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight']);

export type TouchMove = { x: number; y: number };

interface PlayerProps {
  onLockChange: (locked: boolean) => void;
  onLockError: () => void;
  touchActive: boolean;
  touchMove: RefObject<TouchMove>;
}

export function Player({ onLockChange, onLockError, touchActive, touchMove }: PlayerProps) {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const forward = useRef(new Vector3());
  const movement = useRef(new Vector3());
  const velocity = useRef(new Vector3());
  const active = useRef(false);

  useEffect(() => {
    if (!touchActive) return;
    const canvas = gl.domElement;
    const look = new Euler(0, 0, 0, 'YXZ');
    let pointer: { id: number; x: number; y: number } | null = null;
    function start(event: PointerEvent) {
      if (event.pointerType !== 'touch' || pointer) return;
      canvas.setPointerCapture(event.pointerId);
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }
    function move(event: PointerEvent) {
      if (pointer?.id !== event.pointerId) return;
      look.setFromQuaternion(camera.quaternion);
      look.y -= (event.clientX - pointer.x) * 0.004;
      look.x = MathUtils.clamp(look.x - (event.clientY - pointer.y) * 0.004, -1.42, 1.42);
      camera.quaternion.setFromEuler(look);
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }
    function end(event: PointerEvent) {
      if (pointer?.id === event.pointerId) pointer = null;
    }
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('lostpointercapture', end);
    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('lostpointercapture', end);
      touchMove.current = { x: 0, y: 0 };
    };
  }, [camera, gl, touchActive, touchMove]);

  useEffect(() => {
    const canvas = gl.domElement;
    const controls = new PointerLockControls(camera, canvas);
    controls.pointerSpeed = 0.75;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI - 0.15;
    const clear = () => keys.current.clear();
    const syncLock = () => {
      active.current = document.pointerLockElement === canvas;
      clear();
      onLockChange(active.current);
    };
    const keyDown = (event: KeyboardEvent) => {
      if (active.current && event.code === 'Escape') {
        document.exitPointerLock();
        return;
      }
      if (active.current && movementKeys.has(event.code)) {
        event.preventDefault();
        keys.current.add(event.code);
      }
    };
    const keyUp = (event: KeyboardEvent) => keys.current.delete(event.code);
    document.addEventListener('pointerlockchange', syncLock);
    document.addEventListener('pointerlockerror', onLockError);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', clear);
    return () => {
      controls.dispose();
      document.removeEventListener('pointerlockchange', syncLock);
      document.removeEventListener('pointerlockerror', onLockError);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', clear);
      clear();
      active.current = false;
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, [camera, gl, onLockChange, onLockError]);

  useFrame((_, delta) => {
    if ((!active.current && !touchActive) || document.hidden) {
      velocity.current.set(0, 0, 0);
      return;
    }
    const pressed = keys.current;
    const advance = touchActive ? touchMove.current.y : Number(pressed.has('KeyW')) - Number(pressed.has('KeyS'));
    const strafe = touchActive ? touchMove.current.x : Number(pressed.has('KeyD')) - Number(pressed.has('KeyA'));
    const direction = camera.getWorldDirection(forward.current);
    direction.y = 0;
    direction.normalize();
    const speed = pressed.has('ShiftLeft') || pressed.has('ShiftRight') ? 3.15 : 2.15;
    const dt = Math.min(delta, 0.05);
    const target = movement.current.set(
      direction.x * advance - direction.z * strafe,
      0,
      direction.z * advance + direction.x * strafe,
    ).clampLength(0, 1).multiplyScalar(speed);
    if (!advance && !strafe) velocity.current.set(0, 0, 0);
    else velocity.current.lerp(target, 1 - Math.exp(-dt * 16));

    const position = camera.position;
    const x = velocity.current.x * dt;
    const z = velocity.current.z * dt;
    if (canWalk(position.x + x, position.z)) position.x += x;
    if (canWalk(position.x, position.z + z)) position.z += z;
    position.y = eyeHeight;
  });

  return null;
}
