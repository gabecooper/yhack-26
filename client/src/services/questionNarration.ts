const narrationCache = new Map<string, Promise<string>>();

let activeNarrationAudio: HTMLAudioElement | null = null;
let activeNarrationToken = 0;

function getNarrationCacheKey(questionId: string, text: string) {
  return `${questionId}::${text.trim()}`;
}

function isPlaybackAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function stopActiveNarrationAudio() {
  if (!activeNarrationAudio) {
    return;
  }

  activeNarrationAudio.pause();
  activeNarrationAudio.currentTime = 0;
  activeNarrationAudio.src = '';
  activeNarrationAudio.load();
  activeNarrationAudio = null;
}

export function stopQuestionNarration() {
  activeNarrationToken += 1;
  stopActiveNarrationAudio();
}

export function getQuestionNarrationAudioUrl(questionId: string, text: string) {
  const cacheKey = getNarrationCacheKey(questionId, text);
  const cached = narrationCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const request = fetch('/api/elevenlabs-question-audio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  }).then(async response => {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Unable to load question narration');
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  });

  narrationCache.set(cacheKey, request);

  return request;
}

export async function playQuestionNarration(questionId: string, text: string) {
  const normalizedText = text.trim();

  if (!normalizedText) {
    stopQuestionNarration();
    return;
  }

  const playbackToken = activeNarrationToken + 1;
  activeNarrationToken = playbackToken;
  stopActiveNarrationAudio();

  try {
    const audioUrl = await getQuestionNarrationAudioUrl(questionId, normalizedText);

    if (playbackToken !== activeNarrationToken) {
      return;
    }

    const narrationAudio = new Audio(audioUrl);
    narrationAudio.preload = 'auto';
    narrationAudio.volume = 0.9;
    activeNarrationAudio = narrationAudio;

    await narrationAudio.play();
  } catch (error) {
    if (!isPlaybackAbortError(error)) {
      console.warn('Question narration unavailable', error);
    }
  }
}
