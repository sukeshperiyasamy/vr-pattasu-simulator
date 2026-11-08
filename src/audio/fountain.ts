import { Howl, Howler } from 'howler';
import type { Camera } from 'three';
import { Quaternion, Vector3 } from 'three';
import { crackerIds, groundPopTimes, pistols } from '../fireworks/registry';
import type { CrackerId, PistolId } from '../fireworks/registry';
import { useSettings } from '../store/settings';

const forward = new Vector3();
const up = new Vector3();
const listener = new Vector3();
const orientation = new Quaternion();
const shopCues = ['shop-open', 'shop-close', 'shop-pick', 'shop-empty', 'shop-select'] as const;
type ShopCue = typeof shopCues[number];
type Cue = CrackerId | PistolId | ShopCue | 'ground-pop';
const bank = new Map<Cue, Howl>();

export function prepareAudio() {
  crackerIds.filter(id => !groundPopTimes[id]).forEach(getSound);
  getSound('ground-pop');
  (Object.keys(pistols) as PistolId[]).forEach(getSound);
  shopCues.forEach(getSound);
  const context = Howler.ctx;
  if (context?.state === 'suspended') void context.resume().catch(() => {});
}

function getSound(cracker: Cue) {
  const existing = bank.get(cracker);
  if (existing) return existing;
  const clip = cracker === 'rocket' ? 'skyshot' : cracker;
  const extension = cracker === 'cap' || cracker === 'roll' || cracker === 'ground-pop' || cracker.startsWith('shop-') ? '.wav' : '.ogg';
  const sound = new Howl({
    src: [import.meta.env.BASE_URL + 'assets/audio/' + clip + extension],
    volume: 0.56,
  });
  bank.set(cracker, sound);
  return sound;
}

export function disposeAudio() {
  bank.forEach(sound => sound.unload());
  bank.clear();
}

export function playShopCue(cue: ShopCue, point: Vector3, camera: Camera) {
  const { muted, volume } = useSettings.getState();
  if (muted || !volume) return;
  const sound = getSound(cue);
  if (sound.state() !== 'loaded') return;
  camera.getWorldPosition(listener);
  Howler.pos(listener.x, listener.y, listener.z);
  camera.getWorldDirection(forward);
  up.set(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(orientation));
  Howler.orientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
  sound.stop();
  const instance = sound.play();
  sound.volume(volume * (cue === 'shop-select' ? 0.18 : 0.36), instance);
  sound.pos(point.x, point.y, point.z, instance);
}

export function createFountainAudio(cracker: CrackerId | PistolId) {
  const perPop = cracker !== 'cap' && cracker !== 'roll' && !!groundPopTimes[cracker];
  const sound = getSound(perPop ? 'ground-pop' : cracker);
  const isCap = cracker === 'cap' || cracker === 'roll';
  const isAerial = cracker === 'skyshot' || cracker === 'rocket';
  const baseGain = isCap ? 0.41 : isAerial ? 0.57 : cracker === 'sparkler' ? 0.46 : 0.62;
  const variation = 0.93 + Math.random() * 0.13;
  let id: number | undefined;
  let paused = false;
  let gain = -1;

  return {
    pop(x: number, y: number, z: number, accent: boolean) {
      const { muted, volume } = useSettings.getState();
      if (muted || !volume || sound.state() !== 'loaded') return;
      const instance = sound.play();
      const heavy = cracker === 'atom';
      sound.rate(heavy ? 0.64 : (cracker === 'bijili' ? 1.22 : 0.92) + Math.random() * 0.21, instance);
      sound.volume(volume * (heavy ? 0.85 : accent ? 0.78 : 0.59), instance);
      sound.pannerAttr({ distanceModel: 'inverse', refDistance: 2.1, rolloffFactor: 0.75, panningModel: 'HRTF' }, instance);
      sound.pos(x, y, z, instance);
    },
    update(camera: Camera, playing: boolean, muted: boolean, volume: number, x: number, y: number, z: number, elapsed = 0) {
      const targetGain = muted ? 0 : volume * baseGain * variation;
      if (targetGain !== gain) {
        gain = targetGain;
        sound.volume(gain);
      }
      if (!playing) {
        if (id !== undefined && sound.playing(id)) {
          sound.pause(id);
          paused = true;
        }
        return;
      }
      if (!perPop && id === undefined && sound.state() === 'loaded') {
        id = sound.play();
        sound.pannerAttr({
          distanceModel: 'inverse', refDistance: isAerial ? 2.8 : 1.3,
          rolloffFactor: isCap ? 1.1 : isAerial ? 0.64 : 0.82, panningModel: 'HRTF',
        }, id);
        if (isCap) sound.rate(0.96 + Math.random() * 0.08, id);
        else if (elapsed > 0.09 && elapsed < sound.duration(id)) sound.seek(elapsed, id);
      }
      else if (id !== undefined && paused) {
        sound.play(id);
        paused = false;
      }

      if (id !== undefined) sound.pos(x, y, z, id);
      camera.getWorldDirection(forward);
      up.set(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(orientation));
      camera.getWorldPosition(listener);
      Howler.pos(listener.x, listener.y, listener.z);
      Howler.orientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    },
    dispose() {
      if (perPop) sound.stop();
      else if (id !== undefined) sound.stop(id);
    },
  };
}
