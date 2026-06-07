// Gentle Web Audio feedback. No external files, no harsh sounds.
// Designed to be calm and predictable for sensory comfort.

import { getSong } from './music/songs'

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

// A wooden "rattle" of clacks for rolling a die.
export function playDice() {
  ;[0, 0.08, 0.16, 0.24, 0.34].forEach((delay, i) =>
    tone({ freq: 150 + (i % 2) * 40, duration: 0.05, type: 'square', volume: 0.1, delay }),
  )
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

// One rising note for the "counting becomes a melody" games (count / connect-
// the-dots / draw-a-number). `step` is 0-based; the pitch climbs a major
// pentatonic scale across three octaves and then wraps, so a count of ANY length
// sounds like a pleasant tune that keeps going up — and never lands on a sour
// note. Honours mute via tone().
const RISE_PENTA = [0, 2, 4, 7, 9] // major-pentatonic semitone offsets
export function playRise(step: number) {
  const i = ((Math.floor(step) % 15) + 15) % 15 // 3-octave climbing riff, then wraps
  const semis = RISE_PENTA[i % RISE_PENTA.length] + Math.floor(i / RISE_PENTA.length) * 12
  const freq = 261.63 * Math.pow(2, semis / 12)
  tone({ freq, duration: 0.22, type: 'triangle', volume: 0.16 })
  tone({ freq: freq * 2, duration: 0.14, type: 'sine', volume: 0.045 }) // soft sparkle
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

// Musical piano-ish note for the "friends piano" (C-major scale: Do Re Mi…),
// longer and softer so a melody sounds nice.
const PIANO_SCALE = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25]
export function playPiano(degree: number) {
  const n = PIANO_SCALE.length
  const freq = PIANO_SCALE[((degree % n) + n) % n]
  tone({ freq, duration: 0.5, type: 'triangle', volume: 0.2 })
  tone({ freq: freq * 2, duration: 0.4, type: 'sine', volume: 0.06, delay: 0 })
}

// Cheerful rising chime for a correct answer / match.
export function playSuccess() {
  tone({ freq: 523.25, duration: 0.18, type: 'sine', volume: 0.16 })
  tone({ freq: 659.25, duration: 0.18, type: 'sine', volume: 0.16, delay: 0.12 })
  tone({ freq: 783.99, duration: 0.26, type: 'sine', volume: 0.16, delay: 0.24 })
}

// Soft "nom" munch for eating.
export function playMunch() {
  tone({ freq: 180, duration: 0.13, type: 'sine', volume: 0.17 })
  tone({ freq: 130, duration: 0.11, type: 'triangle', volume: 0.12, delay: 0.07 })
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

// ── Children's melodies (the list lives in src/music/songs.ts — public-domain
// tunes generated in code, no audio files). Loops the chosen song.
let melodyTimer: number | null = null
let melodyStop = false
export function stopMelody() {
  melodyStop = true
  if (melodyTimer) {
    window.clearTimeout(melodyTimer)
    melodyTimer = null
  }
}
export function playMelody(id: string, opts: { loop?: boolean; onEnd?: () => void } = {}) {
  const { loop = true, onEnd } = opts
  stopMelody()
  const song = getSong(id)
  if (!song) return
  melodyStop = false
  const beat = 60 / song.bpm
  let i = 0
  const step = () => {
    if (melodyStop) return
    const [semi, beats] = song.notes[i]
    const freq = 261.63 * Math.pow(2, semi / 12)
    tone({ freq, duration: beat * beats * 0.9, type: 'triangle', volume: 0.16 })
    tone({ freq: freq * 2, duration: beat * beats * 0.6, type: 'sine', volume: 0.035 })
    const dur = beat * beats * 1000
    i += 1
    if (i < song.notes.length) {
      melodyTimer = window.setTimeout(step, dur)
    } else if (loop) {
      i = 0
      melodyTimer = window.setTimeout(step, dur)
    } else {
      // play through ONCE (a preview), then signal it's done
      melodyTimer = window.setTimeout(() => {
        melodyTimer = null
        if (!melodyStop) onEnd?.()
      }, dur)
    }
  }
  step()
}

// A short, bright "hit" per dance move (each move a different pitch).
export function playMove(i: number) {
  const scale = [392, 440, 523.25, 587.33, 659.25]
  tone({ freq: scale[i % scale.length], duration: 0.16, type: 'triangle', volume: 0.18 })
}

// ── Silly sounds for the laugh game ──
export function playGiggle() {
  ;[680, 760, 680, 800, 720].forEach((f, i) => tone({ freq: f, duration: 0.07, type: 'sine', volume: 0.14, delay: i * 0.08 }))
}
export function playRaspberry() {
  ;[0, 0.05, 0.1, 0.15, 0.2, 0.25].forEach((d, i) =>
    tone({ freq: 95 + (i % 2) * 30, duration: 0.06, type: 'sawtooth', volume: 0.12, delay: d }),
  )
}
export function playHonk() {
  tone({ freq: 330, duration: 0.18, type: 'square', volume: 0.12 })
  tone({ freq: 247, duration: 0.2, type: 'square', volume: 0.12, delay: 0.16 })
}

// A REAL recorded laugh (royalty-free sound files in public/sfx/) — used by the
// laugh game instead of a robotic spoken "ha ha".
let laughEl: HTMLAudioElement | null = null
const LAUGH_FILES = ['sfx/laugh1.wav', 'sfx/laugh2.mp3']
export function playLaugh() {
  if (muted || typeof Audio === 'undefined') return
  if (laughEl) laughEl.pause()
  laughEl = new Audio(import.meta.env.BASE_URL + LAUGH_FILES[Math.floor(Math.random() * LAUGH_FILES.length)])
  laughEl.volume = 0.75
  laughEl.play().catch(() => {})
}
