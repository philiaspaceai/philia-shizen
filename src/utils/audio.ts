// Play pronunciation using SpeechSynthesis API (Web Speech API)
export function playHiraganaAudio(text: string): void {
  if (!('speechSynthesis' in window)) {
    console.warn("SpeechSynthesis API is not supported in this browser.");
    return;
  }

  // Stop any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85; // Natural learning pace

  // Dynamically query available voices to find a natural Japanese speaker
  let voices = window.speechSynthesis.getVoices();
  let jaVoice = voices.find((v) => v.lang === 'ja-JP' || v.lang.startsWith('ja'));

  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  // Handle asynchronous voice loading (some browsers require this callback)
  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
    jaVoice = voices.find((v) => v.lang === 'ja-JP' || v.lang.startsWith('ja'));
    if (jaVoice && !utterance.voice) {
      utterance.voice = jaVoice;
    }
  };

  window.speechSynthesis.speak(utterance);
}
