import type { Firework } from '../fireworks/lifecycle';
import type { RefObject } from 'react';
import type { TouchMove } from '../input/Player';
import { crackers, pistols } from '../fireworks/registry';
import type { PistolId } from '../fireworks/registry';
import type { Aim, InputAction } from '../interaction/Selection';
import { useSettings } from '../store/settings';
import { TouchControls } from './TouchControls';

interface HudProps {
  ready: boolean;
  locked: boolean;
  visited: boolean;
  lockError: string;
  aim: Aim;
  firework: Firework;
  feedback: string;
  touch: boolean;
  touchMove: RefObject<TouchMove>;
  onTouchAction: (action: InputAction) => void;
  onTouchPause: () => void;
  onEnter: () => void;
  taperLit: boolean;
  xrSupported: boolean;
  mrSupported: boolean;
  onEnterVR: () => void;
  onEnterMR: () => void;
  pistol: PistolId | null;
  shopPrompt: { title: string; empty: boolean; action: string; animating: boolean } | null;
}

export function CourtyardHud({
  ready, locked, visited, lockError, aim, firework, feedback, touch, touchMove,
  onTouchAction, onTouchPause, onEnter, taperLit, xrSupported, mrSupported, onEnterVR, onEnterMR, pistol, shopPrompt,
}: HudProps) {
  const { quality, muted, reducedFlash, volume, update } = useSettings();
  const stage = firework.stage;
  const aimedPistol = aim === 'cap' || aim === 'roll' ? pistols[aim] : null;
  const target = firework.stage !== 'available' ? crackers[firework.id]
    : aim && aim in crackers ? crackers[aim as keyof typeof crackers] : null;
  const touchAction = shopPrompt ? (shopPrompt.animating ? null : 'pick') : pistol ? 'shoot' : aim === 'spent' ? 'replay' : aimedPistol ? 'pick' : aim === 'diya' ? 'use' : stage === 'available' ? (aim ? 'pick' : null)
    : stage === 'held' ? (target?.placement === 'handheld' ? 'ignite' : 'place')
    : stage === 'placed' ? 'ignite' : null;
  const ignite = !taperLit ? 'Light your taper at a burning diya first' : touch ? 'Tap Ignite' : 'F to ignite virtually';
  const prompt = pistol ? (touch ? 'Tap Fire' : 'Aim and click to fire')
    : aim === 'spent' ? (touch ? 'Tap Replay' : 'Hold click, then release to replay')
    : aimedPistol ? (touch ? 'Tap Pick up' : 'Click or E to equip')
    : aim === 'diya' ? (touch ? 'Tap Use diya' : 'F to use diya')
    : stage === 'available' && aim ? (touch ? 'Tap Pick up' : 'Click or E to pick up')
    : stage === 'held' ? (target?.placement === 'handheld' ? ignite
      : aim === 'ground' ? (touch ? 'Tap Place' : 'G to place') : 'Aim at open paving')
    : stage === 'placed' && aim ? ignite : '';
  const status = {
    available: '', held: 'Holding', placed: 'Placed',
    burning: firework.stage === 'burning' && (firework.id === 'skyshot' || firework.id === 'rocket') ? 'Active · Look up' : 'Active',
    finished: touch ? 'Finished · Tap Reset' : 'Finished · R to reset',
  }[stage];
  return (
    <>
      <div className="scene-label" aria-hidden="true">
        <span>VR PATTASU</span>
        <span>01 / THE COURTYARD</span>
      </div>
      {locked ? (
        <>
          <span className={aim ? 'reticle reticle-active' : 'reticle'} aria-hidden="true" />
          {shopPrompt ? <div className="aim-prompt" role="status">
            <span>{shopPrompt.title}</span>
            {shopPrompt.empty && <span>Box empty · Reset to restock</span>}
            <span>{shopPrompt.action}{!touch && !shopPrompt.animating ? ' · Click / E' : ''}</span>
          </div> : prompt && <div className="aim-prompt"><span>{pistol ? pistols[pistol].label : aimedPistol?.label ?? (aim === 'diya' ? 'Clay diya' : target?.label)}</span><span>{prompt}</span></div>}
          {touch
            ? <TouchControls movement={touchMove} action={touchAction} actionLabel={shopPrompt?.action} onAction={onTouchAction} onPause={onTouchPause} />
            : <p className="exit-hint"><kbd>Esc</kbd> Pause{(stage !== 'available' || pistol) && <> <kbd>R</kbd> Reset</>}</p>}
        </>
      ) : (
        <div className="entry-shade">
          <section className="entry-panel" aria-labelledby="courtyard-title">
            <p className="eyebrow">{visited ? 'COURTYARD PAUSED' : 'A DIWALI NIGHT'}</p>
            <h1 id="courtyard-title">{visited ? 'Take a breath.' : 'The Courtyard'}</h1>
            <p className="entry-description">
              Open a box at the shop and take one cracker. Light your taper at a burning diya or use a toy cap pistol on a placed cracker.
            </p>
            <button type="button" className="enter-button" disabled={!ready} onClick={onEnter}>
              {ready ? (visited ? 'Resume courtyard' : 'Enter courtyard') : 'Loading courtyard…'}
            </button>
            {xrSupported && <button type="button" className="enter-button vr-button" disabled={!ready} onClick={onEnterVR}>
              Enter VR
            </button>}
            {xrSupported && mrSupported && <div>
              <button type="button" className="enter-button" disabled={!ready} onClick={onEnterMR}>
                Play in Your Room
              </button>
              <p className="entry-description">Mixed reality passthrough. Start facing clear floor space.</p>
            </div>}
            {touch ? <p className="controls">Drag to look. Use the joystick to move and the on-screen buttons to interact.</p> :
            <ul className="controls" aria-label="Desktop controls">
              <li><kbd>W A S D</kbd> Move</li>
              <li><kbd>Mouse</kbd> Look</li>
              <li><kbd>Click / E</kbd> Pick up</li>
              <li><kbd>G</kbd> Place</li>
              <li><kbd>F</kbd> Use diya / ignite</li>
              <li><kbd>R</kbd> Reset</li>
              <li><kbd>Esc</kbd> Pause</li>
              <li><kbd>Shift</kbd> Move faster</li>
            </ul>}
            <fieldset className="game-settings">
              <legend>Settings</legend>
              <label>Graphics <select value={quality} onChange={event => {
                const value = event.currentTarget.value;
                if (value === 'low' || value === 'medium' || value === 'high') update({ quality: value });
              }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select></label>
              <label><input type="range" min={0} max={1} step={0.05} value={volume}
                onChange={event => update({ volume: event.currentTarget.valueAsNumber })} /> Volume</label>
              <label><input type="checkbox" checked={muted} onChange={event => update({ muted: event.target.checked })} /> Mute</label>
              <label><input type="checkbox" checked={reducedFlash} onChange={event => update({ reducedFlash: event.target.checked })} /> Reduce flashes</label>
            </fieldset>
            {lockError && <p className="lock-error" role="alert">{lockError}</p>}
            <a className="credits" href={import.meta.env.BASE_URL + 'assets/licenses/credits.txt'} target="_blank" rel="noreferrer">
              Asset credits
            </a>
          </section>
        </div>
      )}
      <div className="selection-status" role="status">
        {feedback && locked && <div className="selection-card">{feedback}</div>}
        {pistol && <div className="selection-card"><strong>{pistols[pistol].label}</strong><span>Unlimited caps</span></div>}
        {status && target && (
          <div className="selection-card">
            <span className="eyebrow">{target.type.toUpperCase()}</span>
            <strong>{target.label}</strong>
            <span>{status}</span>
          </div>
        )}
      </div>
    </>
  );
}
