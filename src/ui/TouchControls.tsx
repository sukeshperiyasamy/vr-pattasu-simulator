import { useRef } from 'react';
import type { PointerEvent, RefObject } from 'react';
import type { TouchMove } from '../input/Player';
import type { InputAction } from '../interaction/Selection';

interface Props {
  movement: RefObject<TouchMove>;
  action: InputAction | null;
  actionLabel?: string;
  onAction: (action: InputAction) => void;
  onPause: () => void;
}

export function TouchControls({ movement, action, actionLabel, onAction, onPause }: Props) {
  const pointer = useRef<number | null>(null);
  const knob = useRef<HTMLSpanElement>(null);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== pointer.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = bounds.width * 0.32;
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    const scale = Math.max(radius, Math.hypot(x, y));
    movement.current.x = x / scale;
    movement.current.y = -y / scale;
    if (knob.current) knob.current.style.transform = `translate(${x / scale * radius}px, ${y / scale * radius}px)`;
  }

  function stop(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== pointer.current) return;
    pointer.current = null;
    movement.current.x = movement.current.y = 0;
    if (knob.current) knob.current.style.transform = '';
  }

  return (
    <>
      <button className="touch-pause" onClick={onPause}>Pause</button>
      <div className="touch-stick" role="group" aria-label="Movement joystick"
        onPointerDown={event => {
          if (pointer.current !== null) return;
          pointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          move(event);
        }}
        onPointerMove={move} onLostPointerCapture={stop}
      ><span ref={knob} /></div>
      <div className="touch-actions">
        {action && <button onClick={() => onAction(action)}>
          {actionLabel ?? { pick: 'Pick up', place: 'Place', ignite: 'Ignite', reset: 'Reset', use: 'Use diya', shoot: 'Fire' }[action]}
        </button>}
        {action !== 'reset' && <button onClick={() => onAction('reset')}>Reset</button>}
      </div>
    </>
  );
}
