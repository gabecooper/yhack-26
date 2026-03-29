import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface AudioSettingsContextValue {
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  setSoundEffectsEnabled: (enabled: boolean) => void;
}

const MUSIC_ENABLED_STORAGE_KEY = 'heist_music_enabled';
const SOUND_EFFECTS_ENABLED_STORAGE_KEY = 'heist_sound_effects_enabled';

const AudioSettingsContext = createContext<AudioSettingsContextValue | null>(null);

function getInitialMusicEnabledState() {
  return getInitialToggleState(MUSIC_ENABLED_STORAGE_KEY);
}

function getInitialSoundEffectsEnabledState() {
  return getInitialToggleState(SOUND_EFFECTS_ENABLED_STORAGE_KEY);
}

function getInitialToggleState(storageKey: string) {
  if (typeof window === 'undefined') {
    return true;
  }

  const storedValue = window.localStorage.getItem(storageKey);

  if (storedValue === null) {
    return true;
  }

  return storedValue === 'true';
}

export function AudioSettingsProvider({ children }: { children: ReactNode }) {
  const [musicEnabled, setMusicEnabled] = useState(getInitialMusicEnabledState);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(getInitialSoundEffectsEnabledState);

  useEffect(() => {
    window.localStorage.setItem(MUSIC_ENABLED_STORAGE_KEY, String(musicEnabled));
  }, [musicEnabled]);

  useEffect(() => {
    window.localStorage.setItem(SOUND_EFFECTS_ENABLED_STORAGE_KEY, String(soundEffectsEnabled));
  }, [soundEffectsEnabled]);

  const value = useMemo<AudioSettingsContextValue>(() => ({
    musicEnabled,
    soundEffectsEnabled,
    setMusicEnabled,
    setSoundEffectsEnabled,
  }), [musicEnabled, soundEffectsEnabled]);

  return (
    <AudioSettingsContext.Provider value={value}>
      {children}
    </AudioSettingsContext.Provider>
  );
}

export function useAudioSettings() {
  const context = useContext(AudioSettingsContext);

  if (!context) {
    throw new Error('useAudioSettings must be used within an AudioSettingsProvider');
  }

  return context;
}
