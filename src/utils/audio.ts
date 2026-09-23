// Audio pronunciation service powered by Microsoft Edge Neural TTS with resilient client-side fallback
// Seamless on Vercel Serverless, Web, and Mobile (Android Chrome & iOS Safari)

let activeAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

// Global reference to keep speech synthesis utterance from being garbage-collected on mobile browsers
let activeUtterance: SpeechSynthesisUtterance | null = null;

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
 * Construct URL to our Edge TTS API endpoint (works both in local dev and Vercel serverless /api/tts)
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
 * Native SpeechSynthesis fallback for mobile devices if network is offline or Vercel serverless is cold-starting
 */
export function playNativeSpeechFallback(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85;

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(
        (v) => v.lang.startsWith('ja') || v.lang.replace('_', '-').startsWith('ja')
      );
      if (jaVoice) {
        utterance.voice = jaVoice;
      }

      utterance.onend = () => {
        activeUtterance = null;
        resolve();
      };
      utterance.onerror = () => {
        activeUtterance = null;
        resolve();
      };

      activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

/**
 * Play audio using Microsoft Edge Neural TTS
 * Automatically stops any previously playing pronunciation and plays the new one cleanly.
 * If network fails or returns non-audio, seamlessly falls back to native device TTS.
 */
export async function playHiraganaAudio(
  text: string,
  voice = 'ja-JP-NanamiNeural',
  rate = '-10%'
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) return;

  unlockMobileAudio();

  // Stop any ongoing audio immediately to avoid overlapping
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }

  const url = getAudioUrl(cleanText, voice, rate);

  // Play audio via HTML5 Audio element
  try {
    if (!activeAudio) {
      activeAudio = new Audio();
    }

    activeAudio.src = url;
    activeAudio.currentTime = 0;

    await activeAudio.play();
  } catch (err) {
    console.warn('Edge TTS playback failed or blocked on mobile, using native voice fallback:', err);
    await playNativeSpeechFallback(cleanText);
  }
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
  
  if ('fetch' in window) {
    fetch(url, { method: 'GET', mode: 'cors' }).catch(() => {});
  }
}
