import { speak, speechOn, stopSpeech } from './speech'

// Plays a PRE-RECORDED clip (public/voice/<id>.mp3) for a fixed line, and falls
// back to the browser voice if the clip isn't there yet. This lets us swap the
// robotic TTS for a natural voice gradually: drop in clips and they're used; if
// a clip is missing the app still talks (TTS). Missing ids are remembered so we
// don't re-fetch a 404 every time.
let current: HTMLAudioElement | null = null
const missing = new Set<string>()

export function stopClip() {
  if (current) {
    current.pause()
    current = null
  }
  stopSpeech()
}

export function playClip(id: string, fallback: string) {
  if (!speechOn()) return
  stopClip()
  if (missing.has(id)) {
    speak(fallback)
    return
  }
  const audio = new Audio(`${import.meta.env.BASE_URL}voice/${id}.wav`)
  current = audio
  let failed = false
  const onFail = () => {
    if (failed) return
    failed = true
    missing.add(id)
    if (current === audio) current = null
    speak(fallback)
  }
  audio.addEventListener('error', onFail)
  audio.play().catch(onFail)
}
