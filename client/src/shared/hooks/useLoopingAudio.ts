import { useEffect, useRef } from 'react';

interface UseLoopingAudioOptions {
  enabled: boolean;
  src: string;
  volume?: number;
}

export function useLoopingAudio({
  enabled,
  src,
  volume = 0.5,
}: UseLoopingAudioOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, [src, volume]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = volume;

    if (!enabled) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    void audio.play().catch(() => {
      // Ignore autoplay restrictions until the next user interaction.
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [enabled, volume]);
}
