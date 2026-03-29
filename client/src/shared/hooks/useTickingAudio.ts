import { useEffect, useRef } from 'react';
import tickingAudioSrc from '@/assets/audio/clock-tick-tock.mp3';

interface UseTickingAudioOptions {
  enabled: boolean;
  timeRemaining: number;
  totalTime: number;
  deadlineAt?: string | null;
}

const UPDATE_INTERVAL_MS = 120;

export function useTickingAudio({
  enabled,
  timeRemaining,
  totalTime,
  deadlineAt = null,
}: UseTickingAudioOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef({
    enabled,
    timeRemaining,
    totalTime,
    deadlineAt,
  });

  useEffect(() => {
    stateRef.current = {
      enabled,
      timeRemaining,
      totalTime,
      deadlineAt,
    };
  }, [deadlineAt, enabled, timeRemaining, totalTime]);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    const audio = new Audio(tickingAudioSrc);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.55;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (!enabled || timeRemaining <= 0) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    let isDisposed = false;

    const getLiveTimeRemaining = () => {
      const nextState = stateRef.current;

      if (!nextState.deadlineAt) {
        return nextState.timeRemaining;
      }

      const remainingMs = new Date(nextState.deadlineAt).getTime() - Date.now();
      return Math.max(0, remainingMs / 1000);
    };

    const syncPlayback = () => {
      if (isDisposed) {
        return;
      }

      const nextState = stateRef.current;

      if (!nextState.enabled) {
        audio.pause();
        audio.currentTime = 0;
        return;
      }

      const liveTimeRemaining = getLiveTimeRemaining();

      if (liveTimeRemaining <= 0) {
        audio.pause();
        audio.currentTime = 0;
        return;
      }

      audio.playbackRate = 1;

      if (audio.paused) {
        void audio.play().catch(() => {
          // Ignore autoplay restrictions; the next user interaction can allow playback.
        });
      }
    };

    syncPlayback();
    const intervalId = window.setInterval(syncPlayback, UPDATE_INTERVAL_MS);

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [enabled, timeRemaining]);
}
