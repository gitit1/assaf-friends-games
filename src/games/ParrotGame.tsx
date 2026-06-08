import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playMove, playTap, unlockAudio } from '../audio'
import { randFriendIndex, friendCount } from '../level'
import { useViewport } from '../useViewport'
import { useT } from '../i18n'

// "Parrot": the child records their voice (talking or singing) and the friend
// repeats it back in a funny high parrot voice. A 3·2·1 countdown before
// recording. No timer, no win/lose. Needs mic permission (asked once).
type Phase = 'idle' | 'count' | 'recording' | 'has'

export default function ParrotGame({ onExit, friend }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  const [who, setWho] = useState(() => friend ?? randFriendIndex())
  const [phase, setPhase] = useState<Phase>('idle')
  const [count, setCount] = useState<number | null>(null)
  const [talking, setTalking] = useState(false)
  const [denied, setDenied] = useState(false)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const urlRef = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  const dropStream = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
  }
  useEffect(
    () => () => {
      clearTimers()
      audioRef.current?.pause()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      dropStream()
    },
    [],
  )

  // the friend repeats the recording back, in a funny high "parrot" voice
  function repeat() {
    if (!urlRef.current) return
    audioRef.current?.pause()
    const a = new Audio(urlRef.current)
    // raise the pitch (faster playback, pitch NOT preserved) → parrot voice
    a.preservesPitch = false
    ;(a as unknown as { mozPreservesPitch?: boolean }).mozPreservesPitch = false
    ;(a as unknown as { webkitPreservesPitch?: boolean }).webkitPreservesPitch = false
    a.playbackRate = 1.45
    audioRef.current = a
    setTalking(true)
    a.onended = () => setTalking(false)
    a.play().catch(() => setTalking(false))
  }

  async function beginRecording() {
    if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
      setDenied(true)
      setPhase('idle')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        const type = chunksRef.current[0]?.type || 'audio/webm'
        urlRef.current = URL.createObjectURL(new Blob(chunksRef.current, { type }))
        dropStream()
        setPhase('has')
        timers.current.push(window.setTimeout(repeat, 250)) // friend repeats right away
      }
      recRef.current = rec
      rec.start()
      setPhase('recording')
    } catch {
      setDenied(true)
      setPhase('idle')
    }
  }

  function startCountdown() {
    unlockAudio()
    playTap()
    setDenied(false)
    audioRef.current?.pause()
    setTalking(false)
    setPhase('count')
    setCount(3)
    playMove(0)
    timers.current.push(
      window.setTimeout(() => {
        setCount(2)
        playMove(1)
      }, 700),
    )
    timers.current.push(
      window.setTimeout(() => {
        setCount(1)
        playMove(2)
      }, 1400),
    )
    timers.current.push(
      window.setTimeout(() => {
        setCount(null)
        beginRecording()
      }, 2100),
    )
  }

  function stopRecording() {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
  }

  function recordButton() {
    if (phase === 'recording') stopRecording()
    else startCountdown()
  }

  function del() {
    audioRef.current?.pause()
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    setTalking(false)
    setPhase('idle')
  }
  function swap() {
    playTap()
    let n = randFriendIndex()
    if (friendCount() > 1) while (n === who) n = randFriendIndex()
    setWho(n)
  }

  const nat = FRIEND_NATURAL[friendKindForIndex(who)]
  const scale = Math.min((vp.h * 0.26) / nat.h, (vp.w * 0.55) / nat.w)

  return (
    <GameShell title={t('game.parrot')} emoji="🦜" onExit={onExit}>
      <div className="laugh-screen">
        <div className="laugh-stage">
          <button className="dance-swap" onClick={swap} aria-label={t('dance.swap')}>
            🔀
          </button>
          <div className={`dancer ${talking ? 'parrot-talk' : ''}`}>
            <Friend index={who} scale={scale} lively bouncing={talking} />
          </div>
          {count !== null && (
            <div className="dance-count" key={count} aria-hidden="true">
              {count}
            </div>
          )}
          {phase === 'recording' && <div className="parrot-badge">🎤</div>}
        </div>

        {denied && <p className="parrot-hint">{t('parrot.denied')}</p>}

        <div className="dance-controls">
          <button
            className={`dance-ctrl dance-rec ${phase === 'recording' ? 'is-on' : ''}`}
            onClick={recordButton}
            disabled={phase === 'count'}
            aria-label={t(phase === 'recording' ? 'dance.stop' : 'parrot.record')}
          >
            <span aria-hidden="true">{phase === 'recording' ? '⏹️' : '⏺️'}</span>
          </button>
          <button className="dance-ctrl" onClick={repeat} disabled={phase !== 'has'} aria-label={t('parrot.play')}>
            <span aria-hidden="true">🦜</span>
          </button>
          <button className="dance-ctrl" onClick={del} disabled={phase !== 'has'} aria-label={t('dance.delete')}>
            <span aria-hidden="true">🗑️</span>
          </button>
        </div>

        <p className="parrot-tip">{t('parrot.tip')}</p>
      </div>
    </GameShell>
  )
}
