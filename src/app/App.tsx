import { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import type { RootState } from '@react-three/fiber';
import { XR } from '@react-three/xr';
import type { Object3D, PointLight } from 'three';
import { QuestRig, questStore } from '../input/QuestRig';
import { Player } from '../input/Player';
import { Selection } from '../interaction/Selection';
import type { Aim, InputAction } from '../interaction/Selection';
import { CrackerProps } from '../fireworks/CrackerProps';
import { CapFlash, CapPistols } from '../fireworks/CapPistols';
import type { CapShot } from '../fireworks/CapPistols';
import { crackers, pistols } from '../fireworks/registry';
import type { CrackerId, PistolId } from '../fireworks/registry';
import { FireworkEffect } from '../fireworks/FireworkEffect';
import { PaperDebris } from '../fireworks/PaperDebris';
import type { PaperPool } from '../fireworks/PaperDebris';
import { FirecrackerShop } from '../shop/FirecrackerShop';
import { parseShopAim, shop } from '../store/shop';
import type { Action } from '../fireworks/lifecycle';
import { disposeAudio, prepareAudio } from '../audio/fountain';
import { NightAmbience } from '../audio/NightAmbience';
import { qualityOptions, useSettings } from '../store/settings';
import { Courtyard, initialLitDiyas } from '../scene/Courtyard';
import { Taper } from '../fireworks/Taper';
import { eyeHeight } from '../scene/layout';
import { CourtyardHud } from '../ui/CourtyardHud';

function Unavailable() {
  return (
    <main className="entry-shade">
      <section className="entry-panel">
        <p className="eyebrow">VR PATTASU</p>
        <h1>Courtyard unavailable</h1>
        <p>The scene could not load. Retry in a desktop browser with WebGL2 enabled.</p>
        <button className="enter-button" onClick={() => window.location.reload()}>Reload courtyard</button>
      </section>
    </main>
  );
}

export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <Unavailable /> : this.props.children;
  }
}

function SceneReady({ onReady }: { onReady: (ready: boolean) => void }) {
  useEffect(() => {
    onReady(true);
    return () => onReady(false);
  }, [onReady]);
  return null;
}

export function App() {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const touchMove = useRef({ x: 0, y: 0 });
  const touchAction = useRef<((action: InputAction) => void) | null>(null);
  const xrPointer = useRef<Object3D>(null);
  const xrLeftPointer = useRef<Object3D>(null);
  const fuse = useRef<Object3D>(null);
  const fireworkLight = useRef<PointLight>(null);
  const paper = useRef<PaperPool>(null);
  const capLight = useRef<PointLight>(null);
  const [xrSupported, setXRSupported] = useState(false);
  const [xrActive, setXRActive] = useState(false);
  const [taperLit, setTaperLit] = useState(false);
  const [litDiyas, setLitDiyas] = useState<ReadonlySet<number>>(initialLitDiyas);
  const lightTaper = useCallback(() => setTaperLit(true), []);
  const lightDiya = useCallback((index: number) => setLitDiyas(previous => new Set(previous).add(index)), []);
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  const [touchActive, setTouchActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [visited, setVisited] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lockError, setLockError] = useState('');
  const [aim, setAim] = useState<Aim>(null);
  const [feedback, setFeedback] = useState('');
  const firework = useStore(shop, state => state.firework);
  const target = parseShopAim(aim);
  const box = useStore(shop, state => target ? state.boxes[target.id] : null);
  const [pistol, setPistol] = useState<PistolId | null>(null);
  const [rounds, setRounds] = useState(0);
  const [shot, setShot] = useState<CapShot | null>(null);
  const lastShot = useRef(-Infinity);
  const quality = useSettings(state => state.quality);
  const act = useCallback((action: Exclude<Action, { type: 'pick' }>) => {
    setFeedback('');
    shop.getState().act(action);
  }, []);
  const finish = useCallback(() => act({ type: 'finish' }), [act]);
  const ignite = useCallback(() => act({ type: 'ignite' }), [act]);
  const canIgnite = firework.stage === 'placed' || (firework.stage === 'held' && crackers[firework.id].placement === 'handheld');
  const equip = useCallback((id: PistolId) => {
    if (id === pistol) return;
    setPistol(id);
    setRounds(pistols[id].rounds);
    setFeedback(pistols[id].label + ' equipped.');
  }, [pistol]);
  const reset = useCallback(() => {
    paper.current?.clear();
    setPistol(null);
    setRounds(0);
    setShot(null);
    lastShot.current = -Infinity;
    act({ type: 'reset' });
  }, [act]);
  const shoot = useCallback((next: CapShot, target: CrackerId | null) => {
    if (next.at - lastShot.current < 280) return;
    if (!rounds) { setFeedback('No caps left. Reset to refill.'); return; }
    lastShot.current = next.at;
    setRounds(count => count - 1);
    setShot(next);
    if (firework.stage === 'placed' && firework.id === target) {
      act({ type: 'ignite' });
      setFeedback('Direct hit. Firecracker lit.');
    }
  }, [act, firework, rounds]);
  const clearShot = useCallback(() => setShot(null), []);
  useEffect(() => disposeAudio, []);
  useEffect(() => {
    let mounted = true;
    if (window.isSecureContext) {
      void navigator.xr?.isSessionSupported('immersive-vr').then(supported => {
        if (mounted) setXRSupported(supported);
      }).catch(() => {});
    }
    const unsubscribe = questStore.subscribe(state => setXRActive(Boolean(state.session)));
    return () => { mounted = false; unsubscribe(); };
  }, []);

  function enterVR() {
    prepareAudio();
    setTouchActive(false);
    if (document.pointerLockElement) document.exitPointerLock();
    void questStore.enterVR().then(session => {
      if (session) {
        setVisited(true);
        setLockError('');
      } else setLockError('The immersive session could not start.');
    }).catch(() => setLockError('Unable to enter VR. Open this HTTPS page in Meta Quest Browser.'));
  }

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(''), 2300);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const onCreated = useCallback(({ gl, camera }: RootState) => {
    canvas.current = gl.domElement;
    camera.lookAt(0, 1.42, -5.2);
  }, []);

  const onLockChange = useCallback((value: boolean) => {
    setLocked(value);
    if (value) {
      setVisited(true);
      setLockError('');
    }
  }, []);

  const onLockError = useCallback(() => {
    setLockError('Mouse capture was unavailable. Click to try again.');
  }, []);

  function enter() {
    if (touch) {
      prepareAudio();
      setVisited(true);
      setTouchActive(true);
      return;
    }
    const element = canvas.current;
    if (!element?.requestPointerLock) {
      onLockError();
      return;
    }
    try {
      prepareAudio();
      void element.requestPointerLock()?.catch(onLockError);
    } catch {
      onLockError();
    }
  }

  useEffect(() => {
    const element = canvas.current;
    if (!ready || !element) return;
    const onContextLost = () => setFailed(true);
    element.addEventListener('webglcontextlost', onContextLost);
    return () => element.removeEventListener('webglcontextlost', onContextLost);
  }, [ready]);

  if (failed) return <Unavailable />;

  const shopPrompt = target && box && !pistol ? {
    title: crackers[target.id].label,
    stock: box.stock,
    action: target.part === 'stock' ? 'Take one' : box.phase === 'closed' ? 'Open box'
      : box.phase === 'opening' ? 'Opening…' : box.phase === 'closing' ? 'Closing…' : 'Close box',
    animating: box.phase === 'opening' || box.phase === 'closing',
  } : null;
  const xrHint = feedback || (shopPrompt ? `${shopPrompt.title} · ${shopPrompt.stock ? shopPrompt.stock + ' left' : 'Empty'} · ${shopPrompt.action}`
    : firework.stage === 'burning' && (firework.id === 'skyshot' || firework.id === 'rocket') ? 'Look up for the burst'
    : pistol ? (rounds ? 'Aim and pull right trigger to fire' : 'Out of caps · B to reset')
    : !taperLit ? 'Touch your stick tip to a burning diya'
    : firework.stage === 'held' && firework.id === 'sparkler' ? 'Touch the stick to the left-hand sparkler'
    : firework.stage === 'held' ? 'Aim to place, or ignite the sparkler'
    : firework.stage === 'placed' ? 'Touch the glowing tip to the fuse' : 'Choose a box at the shop');

  return (
    <main className={touch ? 'game touch-game' : 'game'}>
      <Canvas
        shadows="percentage" dpr={[1, qualityOptions[quality].dpr]}
        camera={{ position: [0, eyeHeight, 5.45], fov: 63, near: 0.06, far: 50 }}
        fallback={<Unavailable />}
        onCreated={onCreated}
      >
        <XR store={questStore}>
          <QuestRig active={xrActive} pointer={xrPointer} leftPointer={xrLeftPointer} actions={touchAction} hint={xrHint} />
          <Suspense fallback={null}>
            <Courtyard litDiyas={litDiyas} />
            <FirecrackerShop aimed={target ? aim : null} />
            <PaperDebris pool={paper} />
            <pointLight ref={fireworkLight} intensity={0} />
            <pointLight ref={capLight} intensity={0} color="#ff9e52" distance={1.4} />
            <NightAmbience active={locked || touchActive || xrActive} fireworks={firework.stage === 'burning' || shot !== null} />
            <CrackerProps firework={firework} touchActive={touchActive} xrActive={xrActive} pointer={xrPointer}
              leftPointer={xrLeftPointer} fuse={fuse}
              aim={(locked || touchActive || xrActive) && aim && aim in crackers ? aim as CrackerId : null} />
            <CapPistols equipped={pistol} aimed={aim === 'cap' || aim === 'roll' ? aim : null} shot={shot} xrActive={xrActive} pointer={xrPointer} />
            {shot && <CapFlash key={shot.at} shot={shot} onComplete={clearShot} light={capLight} />}
            {(locked || touchActive || xrActive) && firework.stage !== 'burning'
              && !pistol && <Taper lit={taperLit} xrActive={xrActive} pointer={xrPointer} {...{ fuse, canIgnite, litDiyas }}
                onLight={lightTaper} onDiya={lightDiya} onIgnite={ignite} />}
            {firework.stage === 'burning' && <FireworkEffect id={firework.id} ground={firework.ground}
              onFinish={finish} touchActive={touchActive} xrActive={xrActive} pointer={xrLeftPointer} light={fireworkLight} paper={paper} />}
            <Player {...{ onLockChange, onLockError, touchActive, touchMove }} />
            <Selection firework={firework} onAim={setAim} onAction={act} onFeedback={setFeedback}
              onLightTaper={lightTaper} onLightDiya={lightDiya}
              onEquip={equip} onShoot={shoot} onReset={reset}
              {...{ touchActive, touchAction, xrActive, xrPointer, litDiyas, taperLit, pistol }} />
            <SceneReady onReady={setReady} />
          </Suspense>
        </XR>
      </Canvas>
      {!xrActive && <CourtyardHud
        {...{ ready, visited, lockError, aim, firework, feedback, touch, touchMove, taperLit, xrSupported, pistol, rounds, shopPrompt }}
        locked={locked || touchActive}
        onTouchAction={action => touchAction.current?.(action)}
        onTouchPause={() => setTouchActive(false)}
        onEnter={enter}
        onEnterVR={enterVR}
      />}
    </main>
  );
}
