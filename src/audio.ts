// Gentle Web Audio feedback. No external files, no harsh sounds.
// Designed to be calm and predictable for sensory comfort.

let ctx: AudioContext | null = null
let muted = false

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  // Mobile browsers suspend the context until a user gesture resumes it.
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// Should be called from within a user gesture (tap) to unlock audio on mobile.
export function unlockAudio() {
  getCtx()
}

export function setMuted(value: boolean) {
  muted = value
}

export function isMuted() {
  return muted
}

type ToneOptions = {
  freq: number
  duration?: number
  type?: OscillatorType
  volume?: number
  delay?: number
}

function tone({ freq, duration = 0.18, type = 'sine', volume = 0.18, delay = 0 }: ToneOptions) {
  const audio = getCtx()
  if (!audio || muted) return
  const start = audio.currentTime + delay
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  // Soft attack + release so nothing clicks or startles.
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(audio.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

// A soft tap/select sound.
export function playTap() {
  tone({ freq: 440, duration: 0.12, type: 'sine', volume: 0.14 })
}

// A friendly "bubble pop".
export function playPop() {
  tone({ freq: 660, duration: 0.1, type: 'triangle', volume: 0.16 })
  tone({ freq: 990, duration: 0.08, type: 'sine', volume: 0.1, delay: 0.03 })
}

// One step of counting — pitch rises with each number, like climbing the blocks.
export function playCount(step: number) {
  // C major scale-ish so a full count sounds musical.
  const scale = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.25]
  const freq = scale[Math.min(step - 1, scale.length - 1)]
  tone({ freq, duration: 0.16, type: 'triangle', volume: 0.16 })
}

// A friend's little "voice" boop when poked — each friend a distinct pitch.
export function playFriend(index: number) {
  // Two octaves so friends 1–20 each sound different.
  const scale = [
    392, 440, 494, 523, 587, 659, 698, 784, 880, 988,
    1047, 1175, 1319, 1397, 1568, 1760, 1865, 2093, 2349, 2637,
  ]
  const freq = scale[index % scale.length]
  tone({ freq, duration: 0.16, type: 'sine', volume: 0.18 })
  tone({ freq: freq * 1.5, duration: 0.12, type: 'triangle', volume: 0.09, delay: 0.05 })
}

// Cheerful rising chime for a correct answer / match.
export function playSuccess() {
  tone({ freq: 523.25, duration: 0.18, type: 'sine', volume: 0.16 })
  tone({ freq: 659.25, duration: 0.18, type: 'sine', volume: 0.16, delay: 0.12 })
  tone({ freq: 783.99, duration: 0.26, type: 'sine', volume: 0.16, delay: 0.24 })
}

// A gentle, non-punishing "try again" — soft and low, never harsh.
export function playNudge() {
  tone({ freq: 300, duration: 0.16, type: 'sine', volume: 0.12 })
}

// Little fanfare when a whole game is finished.
export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, i) => tone({ freq, duration: 0.24, type: 'triangle', volume: 0.16, delay: i * 0.14 }))
}
