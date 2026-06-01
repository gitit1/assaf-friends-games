// Hebrew text-to-speech using the browser's built-in speechSynthesis.
// No audio files needed. Lets a non-reading child play on his own.
// Controlled by the user's settings (see settings.ts).

let enabled = true
let namesEnabled = true
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

// Separate, parent-controllable toggle just for friend name/number call-outs
// (e.g. tapping a friend says its name). General voice prompts still work.
export function setNamesEnabled(value: boolean) {
  namesEnabled = value
}

// True only when a real Hebrew voice exists on this device.
export function hasHebrewVoice() {
  return voice !== null
}

// Whether the voice is on (used by the pre-recorded clip player).
export function speechOn() {
  return enabled
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

// Speak a friend's name/number. Silent when the parent has muted name call-outs
// (or when the voice is off entirely). Use this for "tap a friend → says its
// name" so it can be turned off without silencing game instructions.
export function speakName(text: string, opts?: SpeakOptions) {
  if (!namesEnabled) return
  speak(text, opts)
}

export function stopSpeech() {
  if (supported()) window.speechSynthesis.cancel()
}
