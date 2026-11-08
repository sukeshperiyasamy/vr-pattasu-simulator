import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Howl } from 'howler';
import { useSettings } from '../store/settings';

export function NightAmbience({ active, fireworks }: { active: boolean; fireworks: boolean }) {
  const audio = useRef<Howl | null>(null);
  const playback = useRef<number | undefined>(undefined);
  const volume = useRef(0);
  const applied = useRef(-1);
  useEffect(() => () => { audio.current?.unload(); audio.current = null; playback.current = undefined; }, []);

  useFrame(({ gl }, delta) => {
    const settings = useSettings.getState();
    const audible = active && !settings.muted && settings.volume > 0
      && (gl.xr.isPresenting ? gl.xr.getSession()?.visibilityState === 'visible' : !document.hidden);
    if (!audio.current && !audible) return;
    const sound = audio.current ??= new Howl({
      src: [import.meta.env.BASE_URL + 'assets/audio/night-courtyard.ogg'], loop: true, volume: 0,
    });
    const target = audible ? settings.volume * (fireworks ? 0.16 : 0.3) : 0;
    volume.current += (target - volume.current) * (1 - Math.exp(-delta * 8));
    if (Math.abs(applied.current - volume.current) > 0.002 || (target === 0 && applied.current !== 0 && volume.current < 0.002)) {
      applied.current = volume.current < 0.002 ? 0 : volume.current;
      sound.volume(applied.current);
    }
    if (audible && sound.state() === 'loaded' && !sound.playing(playback.current)) {
      playback.current = sound.play(playback.current);
    } else if (!audible && applied.current === 0 && playback.current !== undefined && sound.playing(playback.current)) {
      sound.pause(playback.current);
    }
  });
  return null;
}
