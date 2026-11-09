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
import { CrackerProps, PropShape } from '../fireworks/CrackerProps';
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
import { Room } from '../scene/Room';
import { Taper } from '../fireworks/Taper';
import { eyeHeight, roomDiyaLocations, roomTable } from '../scene/layout';
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
  const [mrSupported, setMRSupported] = useState(false);
  const [xrMode, setXRMode] = useState<'immersive-ar' | 'immersive-vr' | null>(null);
  const xrActive = xrMode !== null;
  const passthrough = xrMode === 'immersive-ar';
  const counter = passthrough ? roomTable : undefined;
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
  const spent = useStore(shop, state => state.spent);
  const target = parseShopAim(aim);
  const box = useStore(shop, state => target ? state.boxes[target.id] : null);
  const [pistol, setPistol] = useState<PistolId | null>(null);
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
  const equip = useCallback((id: PistolId | null) => {
    if (id === pistol) return;
    setPistol(id);
    setFeedback(id ? pistols[id].label + ' equipped.' : 'Pistol returned to the counter.');
  }, [pistol]);
  const reset = useCallback(() => {
    paper.current?.clear();
    setPistol(null);
    setShot(null);
    lastShot.current = -Infinity;
    act({ type: 'reset' });
  }, [act]);
  const shoot = useCallback((next: CapShot, target: CrackerId | null) => {
    if (next.at - lastShot.current < 280) return;
    lastShot.current = next.at;
    setShot(next);
    if (firework.stage === 'placed' && firework.id === target) {
      act({ type: 'ignite' });
      setFeedback('Direct hit. Firecracker lit.');
    }
  }, [act, firework]);
  const clearShot = useCallback(() => setShot(null), []);
  useEffect(() => disposeAudio, []);
  useEffect(() => {
    let mounted = true;
    if (window.isSecureContext) {
      void navigator.xr?.isSessionSupported('immersive-vr').then(supported => {
        if (mounted) setXRSupported(supported);
      }).catch(() => {});
      void navigator.xr?.isSessionSupported('immersive-ar').then(supported => {
        if (mounted) setMRSupported(supported);
      }).catch(() => {});
    }
    const unsubscribe = questStore.subscribe((state, previous) => {
      if (state.mode === previous.mode) return;
      if (state.mode === 'immersive-ar' || previous.mode === 'immersive-ar') {
        reset();
        setTaperLit(false);
        setLitDiyas(initialLitDiyas);
        setAim(null);
      }
      setXRMode(state.mode === 'inline' ? null : state.mode);
    });
    return () => { mounted = false; unsubscribe(); };
  }, [reset]);

  function enterXR(mode: 'immersive-ar' | 'immersive-vr') {
    prepareAudio();
    setTouchActive(false);
    if (document.pointerLockElement) document.exitPointerLock();
    const sessionRequest = mode === 'immersive-ar' ? questStore.enterAR() : questStore.enterVR();
    void sessionRequest.then(session => {
      if (session) {
        setVisited(true);
        setLockError('');
      } else setLockError('The immersive session could not start.');
    }).catch(() => setLockError(mode === 'immersive-ar'
      ? 'Unable to start mixed reality. Check floor setup and open this HTTPS page in Meta Quest Browser.'
      : 'Unable to enter VR. Open this HTTPS page in Meta Quest Browser.'));
  }

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(''), 2300);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const onCreated = useCallback(({ gl, camera }: RootState) => {
    canvas.current = gl.domElement;
    gl.setClearAlpha(0);
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

  const shopPrompt = target && box ? {
    title: crackers[target.id].label,
    empty: box.stock === 0,
    action: target.part === 'stock' ? 'Take one' : box.phase === 'closed' ? 'Open box'
      : box.phase === 'opening' ? 'Opening…' : box.phase === 'closing' ? 'Closing…' : 'Close box',
    animating: box.phase === 'opening' || box.phase === 'closing',
  } : null;
  const xrHint = feedback || (shopPrompt ? `${shopPrompt.title} · ${shopPrompt.empty ? 'Empty · ' : ''}${shopPrompt.action}`
    : aim === 'spent' ? 'Hold right trigger, then release to replay'
    : firework.stage === 'burning' && (firework.id === 'skyshot' || firework.id === 'rocket') ? 'Look up for the burst'
    : pistol ? (passthrough ? 'Left trigger: fire · Left grip: return pistol'
      : 'Left trigger: fire · Grip: holster · Stick click: teleport')
    : !taperLit ? 'Touch your stick tip to a burning diya'
    : firework.stage === 'held' && firework.id === 'sparkler' ? 'Touch the stick to the left-hand sparkler'
    : firework.stage === 'held' ? (passthrough ? 'Aim at clear floor and pull right trigger' : 'Aim to place, or ignite the sparkler')
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
          <QuestRig active={xrActive} passthrough={passthrough} armed={pistol !== null} pointer={xrPointer} leftPointer={xrLeftPointer} actions={touchAction} hint={xrHint} />
          <Suspense fallback={null}>
            {passthrough ? <Room litDiyas={litDiyas} /> : <Courtyard litDiyas={litDiyas} />}
            <FirecrackerShop aimed={target ? aim : null} counter={counter} />
            <PaperDebris pool={paper} />
            <pointLight ref={fireworkLight} intensity={0} />
            <pointLight ref={capLight} intensity={0} color="#ff9e52" distance={1.4} />
            {!passthrough && <NightAmbience active={locked || touchActive || xrActive} fireworks={firework.stage === 'burning' || shot !== null} />}
            <CrackerProps firework={firework} touchActive={touchActive} xrActive={xrActive} pointer={xrPointer}
              leftPointer={xrLeftPointer} fuse={fuse}
              aim={(locked || touchActive || xrActive) && aim && aim in crackers ? aim as CrackerId : null} />
            {spent.map(({ id, ground }, index) => (
              <group key={index} position={ground} userData={{ spentIndex: index }}>
                <PropShape id={id} highlighted={false} spent />
              </group>
            ))}
            <CapPistols equipped={pistol} aimed={aim === 'cap' || aim === 'roll' ? aim : null} shot={shot} xrActive={xrActive} pointer={xrLeftPointer} counter={counter} />
            {shot && <CapFlash key={shot.at} shot={shot} onComplete={clearShot} light={capLight} />}
            {(locked || touchActive || xrActive) && firework.stage !== 'burning'
              && (!pistol || xrActive) && <Taper lit={taperLit} xrActive={xrActive} pointer={xrPointer} {...{ fuse, canIgnite, litDiyas }}
                locations={passthrough ? roomDiyaLocations : undefined}
                onLight={lightTaper} onDiya={lightDiya} onIgnite={ignite} />}
            {firework.stage === 'burning' && <FireworkEffect id={firework.id} ground={firework.ground}
              onFinish={finish} touchActive={touchActive} xrActive={xrActive} pointer={xrLeftPointer} light={fireworkLight} paper={paper} />}
            <Player {...{ onLockChange, onLockError, touchActive, touchMove }} />
            <Selection firework={firework} onAim={setAim} onAction={act} onFeedback={setFeedback}
              onLightTaper={lightTaper} onLightDiya={lightDiya}
              onEquip={equip} onShoot={shoot} onReset={reset}
              {...{ touchActive, touchAction, xrActive, xrPointer, xrLeftPointer, litDiyas, taperLit, pistol, passthrough }} />
            <SceneReady onReady={setReady} />
          </Suspense>
        </XR>
      </Canvas>
      {!xrActive && <CourtyardHud
        {...{ ready, visited, lockError, aim, firework, feedback, touch, touchMove, taperLit, xrSupported, mrSupported, pistol, shopPrompt }}
        locked={locked || touchActive}
        onTouchAction={action => touchAction.current?.(action)}
        onTouchPause={() => setTouchActive(false)}
        onEnter={enter}
        onEnterVR={() => enterXR('immersive-vr')}
        onEnterMR={() => enterXR('immersive-ar')}
      />}
    </main>
  );
}
