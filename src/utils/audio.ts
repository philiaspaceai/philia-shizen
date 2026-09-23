// Audio pronunciation service powered by Microsoft Edge Neural TTS
// Clean HTML5 Audio playback engineered for Desktop and Mobile (iOS Safari & Android Chrome)

let activeAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

/**
 * Mobile browsers (iOS Safari, Android Chrome) require a user gesture
 * to unlock audio playback. This plays a silent buffer on first user touch/click.
 */
export function unlockMobileAudio(): void {
  if (isAudioUnlocked || typeof window === 'undefined') return;

  try {
    // 1-sample silent WAV base64
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentAudio.volume = 0.01;
    const playPromise = silentAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isAudioUnlocked = true;
          silentAudio.pause();
        })
        .catch(() => {
          // Will retry on next interaction
        });
    }
  } catch {
    // Ignore unlock errors
  }
}

// Automatically bind to first touch/click event to unlock mobile audio
if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'click', 'keydown'];
  const handleInteraction = () => {
    unlockMobileAudio();
    unlockEvents.forEach((evt) => {
      window.removeEventListener(evt, handleInteraction);
    });
  };
  unlockEvents.forEach((evt) => {
    window.addEventListener(evt, handleInteraction, { once: true, passive: true });
  });
}

/**
 * Construct URL to our backend Edge TTS service
 */
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
 * Automatically stops any previously playing pronunciation and plays the new one cleanly.
 */
export function playHiraganaAudio(
  text: string,
  voice = 'ja-JP-NanamiNeural',
  rate = '-10%'
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) return Promise.resolve();

  unlockMobileAudio();

  // Stop any ongoing audio immediately to avoid overlapping
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }

  const url = getAudioUrl(cleanText, voice, rate);

  // Reuse singleton Audio instance on mobile or instantiate new Audio
  if (!activeAudio) {
    activeAudio = new Audio();
  }

  activeAudio.src = url;
  activeAudio.currentTime = 0;

  return activeAudio.play().catch((err) => {
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
  if (!cleanText || typeof window === 'undefined') return;

  const url = getAudioUrl(cleanText, voice, rate);
  
  // Use HTML link preload or fetch to populate browser HTTP cache without blocking audio hardware
  if ('fetch' in window) {
    fetch(url, { method: 'GET', mode: 'cors' }).catch(() => {});
  }
}
