// Hebrew text-to-speech using the browser's built-in speechSynthesis.
// No audio files needed. Lets a non-reading child play on his own.
// Controlled by the user's settings (see settings.ts).

let enabled = true
let voice: SpeechSynthesisVoice | null = null

function supported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickVoice() {
  if (!supported()) return
  const voices = window.speechSynthesis.getVoices()
  // Hebrew is "he" in modern browsers, "iw" in some older ones.
  voice =
    voices.find((v) => v.lang.toLowerCase().startsWith('he')) ??
    voices.find((v) => v.lang.toLowerCase().startsWith('iw')) ??
    null
}

if (supported()) {
  pickVoice()
  // Voices often load asynchronously on first run.
  window.speechSynthesis.onvoiceschanged = pickVoice
}

export function setSpeechEnabled(value: boolean) {
  enabled = value
  if (!value && supported()) window.speechSynthesis.cancel()
}

// True only when a real Hebrew voice exists on this device.
export function hasHebrewVoice() {
  return voice !== null
}

type SpeakOptions = { rate?: number; pitch?: number }

export function speak(text: string, { rate = 0.92, pitch = 1.05 }: SpeakOptions = {}) {
  if (!enabled || !supported()) return
  // Cancel anything in flight so prompts never overlap or queue up.
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  } else {
    utterance.lang = 'he-IL'
  }
  utterance.rate = rate
  utterance.pitch = pitch
  window.speechSynthesis.speak(utterance)
}

export function stopSpeech() {
  if (supported()) window.speechSynthesis.cancel()
}
