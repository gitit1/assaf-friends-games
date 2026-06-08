import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playTap, unlockAudio } from '../audio'
import { randFriendIndex, friendCount } from '../level'
import { useViewport } from '../useViewport'
import { useT } from '../i18n'

// "Parrot": a parrot perches on the chosen friend. In live mode it LISTENS, and
// when the child pauses, it repeats what was said in a funny high parrot voice —
// like a real parrot, no record button needed. (It records each phrase under the
// hood.) No timer, no win/lose. Needs mic permission (asked once).
const SPEAK = 0.045 // RMS above this = the child is speaking
const SILENCE = 0.025 // RMS below this = quiet
const PAUSE_MS = 650 // this much quiet after speech → the parrot repeats
const MIN_SPEECH_MS = 250 // ignore tiny blips
const MAX_UTTER_MS = 10000 // repeat on a pause OR after 10s — whichever comes first

export default function ParrotGame({ onExit, friend }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  const [who, setWho] = useState(() => friend ?? randFriendIndex())
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState<'off' | 'listen' | 'repeat'>('off')
  const [denied, setDenied] = useState(false)

  const acRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const dataRef = useRef<Float32Array<ArrayBuffer> | null>(null)
  const rafRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const capturingRef = useRef(false)
  const repeatingRef = useRef(false)
  const captureStartRef = useRef(0)
  const lastLoudRef = useRef(0)
  const onRef = useRef(false)

  function stopAll() {
    onRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (recRef.current && recRef.current.state !== 'inactive') {
      recRef.current.onstop = null
      try {
        recRef.current.stop()
      } catch {
        /* already stopped */
      }
    }
    capturingRef.current = false
    repeatingRef.current = false
    audioRef.current?.pause()
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
    acRef.current?.close().catch(() => {})
    acRef.current = null
  }
  useEffect(() => () => stopAll(), [])

  function rms() {
    const an = analyserRef.current
    const buf = dataRef.current
    if (!an || !buf) return 0
    an.getFloatTimeDomainData(buf)
    let s = 0
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
    return Math.sqrt(s / buf.length)
  }

  // the parrot repeats the captured phrase, in a funny high voice
  function repeatPhrase() {
    if (!chunksRef.current.length) {
      repeatingRef.current = false
      if (onRef.current) setStatus('listen')
      return
    }
    const type = chunksRef.current[0]?.type || 'audio/webm'
    const url = URL.createObjectURL(new Blob(chunksRef.current, { type }))
    const a = new Audio(url)
    a.preservesPitch = false
    ;(a as unknown as { mozPreservesPitch?: boolean }).mozPreservesPitch = false
    ;(a as unknown as { webkitPreservesPitch?: boolean }).webkitPreservesPitch = false
    a.playbackRate = 1.45
    audioRef.current = a
    repeatingRef.current = true
    setStatus('repeat')
    const done = () => {
      URL.revokeObjectURL(url)
      repeatingRef.current = false
      if (onRef.current) setStatus('listen')
    }
    a.onended = done
    a.play().catch(done)
  }

  function startCapture(now: number) {
    if (!streamRef.current) return
    const rec = new MediaRecorder(streamRef.current)
    chunksRef.current = []
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data)
    }
    rec.onstop = repeatPhrase
    recRef.current = rec
    rec.start()
    capturingRef.current = true
    captureStartRef.current = now
    lastLoudRef.current = now
  }
  function endCapture(doRepeat: boolean) {
    capturingRef.current = false
    const rec = recRef.current
    if (rec && rec.state !== 'inactive') {
      if (!doRepeat) rec.onstop = null
      try {
        rec.stop()
      } catch {
        /* noop */
      }
    }
  }

  function loop() {
    if (!onRef.current) return
    rafRef.current = requestAnimationFrame(loop)
    if (repeatingRef.current) return // don't listen while the parrot is talking
    const now = performance.now()
    const level = rms()
    if (!capturingRef.current) {
      if (level > SPEAK) startCapture(now)
    } else {
      if (level > SILENCE) lastLoudRef.current = now
      const dur = now - captureStartRef.current
      const quiet = now - lastLoudRef.current
      if (dur > MAX_UTTER_MS || quiet > PAUSE_MS) endCapture(dur > MIN_SPEECH_MS)
    }
  }

  async function start() {
    unlockAudio()
    if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
      setDenied(true)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ac = new AC()
      acRef.current = ac
      const an = ac.createAnalyser()
      an.fftSize = 1024
      ac.createMediaStreamSource(stream).connect(an)
      analyserRef.current = an
      dataRef.current = new Float32Array(an.fftSize)
      onRef.current = true
      setListening(true)
      setStatus('listen')
      setDenied(false)
      rafRef.current = requestAnimationFrame(loop)
    } catch {
      setDenied(true)
    }
  }
  function toggle() {
    playTap()
    if (listening) {
      stopAll()
      setListening(false)
      setStatus('off')
    } else {
      start()
    }
  }
  function swap() {
    playTap()
    let n = randFriendIndex()
    if (friendCount() > 1) while (n === who) n = randFriendIndex()
    setWho(n)
  }

  const nat = FRIEND_NATURAL[friendKindForIndex(who)]
  const scale = Math.min((vp.h * 0.26) / nat.h, (vp.w * 0.55) / nat.w)
  const tip = denied
    ? t('parrot.denied')
    : status === 'repeat'
      ? t('parrot.repeating')
      : status === 'listen'
        ? t('parrot.listening')
        : t('parrot.tip')

  return (
    <GameShell title={t('game.parrot')} emoji="🦜" onExit={onExit}>
      <div className="laugh-screen">
        <div className="laugh-stage">
          <button className="dance-swap" onClick={swap} aria-label={t('dance.swap')}>
            🔀
          </button>
          <div className="dancer">
            <Friend index={who} scale={scale} lively />
          </div>
          {/* the parrot, perched on the friend's shoulder */}
          <span
            className={`parrot-bird ${status === 'repeat' ? 'talk' : status === 'listen' ? 'listen' : ''}`}
            aria-hidden="true"
          >
            🦜
          </span>
        </div>

        <button className={`big-button parrot-listen ${listening ? 'on' : ''}`} onClick={toggle}>
          <span aria-hidden="true">{listening ? '⏹️' : '🦜'}</span> {listening ? t('parrot.stop') : t('parrot.start')}
        </button>

        <p className="parrot-tip">{tip}</p>
      </div>
    </GameShell>
  )
}
