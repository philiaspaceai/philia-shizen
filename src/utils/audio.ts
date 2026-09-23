// Audio pronunciation service powered by Microsoft Edge Neural TTS
// Clean HTML5 Audio playback without browser SpeechSynthesis

let activeAudio: HTMLAudioElement | null = null;

/**
 * Preload and cache in-memory audio instances for immediate playback
 */
const audioCache = new Map<string, HTMLAudioElement>();

export function getAudioUrl(text: string, voice = 'ja-JP-NanamiNeural', rate = '-10%'): string {
  const params = new URLSearchParams({
    text: text.trim(),
    voice,
    rate,
  });
  return `/api/tts?${params.toString()}`;
}

/**
 * Play audio using Microsoft Edge Neural TTS
 * Automatically stops any previously playing pronunciation and plays the new one.
 */
export function playHiraganaAudio(
  text: string,
  voice = 'ja-JP-NanamiNeural',
  rate = '-10%'
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) return Promise.resolve();

  // Stop any ongoing audio immediately to avoid overlapping
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }

  const url = getAudioUrl(cleanText, voice, rate);

  let audio = audioCache.get(url);
  if (!audio) {
    audio = new Audio(url);
    // Cache for reuse during repeated reviews
    audioCache.set(url, audio);
  }

  activeAudio = audio;
  audio.currentTime = 0;

  return audio.play().catch((err) => {
    console.warn('Audio playback error:', err);
  });
}

/**
 * Preload audio for an upcoming card so it plays instantly when flipped or clicked
 */
export function preloadKanaAudio(
  text: string,
  voice = 'ja-JP-NanamiNeural',
  rate = '-10%'
): void {
  const cleanText = text.trim();
  if (!cleanText) return;

  const url = getAudioUrl(cleanText, voice, rate);
  if (!audioCache.has(url)) {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audioCache.set(url, audio);
  }
}
