import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playMelody, stopMelody, playMove, playTap, unlockAudio } from '../audio'
import { SONGS } from '../music/songs'
import { randFriendIndex } from '../level'
import { useViewport } from '../useViewport'
import { useT } from '../i18n'

// "Dance floor": pick a (public-domain) children's tune, then tap moves to make
// the friend dance — the taps are RECORDED into a little dance you can replay.
// No timer, no winning or losing — just build a dance and watch it again.
const MOVES = [
  { key: 'left', emoji: '⬅️' },
  { key: 'right', emoji: '➡️' },
  { key: 'spin', emoji: '🌀' },
  { key: 'jump', emoji: '⬆️' },
  { key: 'wiggle', emoji: '🪩' },
]

export default function DanceGame({ onExit }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  const [dancer] = useState(() => randFriendIndex())
  const [song, setSong] = useState<string | null>(null)
  const [move, setMove] = useState<{ key: string; n: number } | null>(null)
  const [replaying, setReplaying] = useState(false)
  const [recCount, setRecCount] = useState(0)
  const rec = useRef<{ i: number; t: number }[]>([])
  const startT = useRef(0)
  const moveN = useRef(0)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(
    () => () => {
      stopMelody()
      clearTimers()
    },
    [],
  )

  function chooseSong(id: string) {
    unlockAudio()
    playTap()
    if (song === id) {
      stopMelody()
      setSong(null)
    } else {
      playMelody(id)
      setSong(id)
    }
  }

  // do (and animate) one move; record it unless we're replaying
  function doMove(i: number, record = true) {
    unlockAudio()
    moveN.current += 1
    setMove({ key: MOVES[i].key, n: moveN.current })
    playMove(i)
    if (record && !replaying) {
      if (rec.current.length === 0) startT.current = Date.now()
      rec.current.push({ i, t: Date.now() - startT.current })
      setRecCount(rec.current.length)
    }
  }

  function clearDance() {
    playTap()
    clearTimers()
    rec.current = []
    setRecCount(0)
  }

  // replay the recorded dance: each move fires at the time it was tapped
  function playDance() {
    if (!rec.current.length || replaying) return
    unlockAudio()
    clearTimers()
    setReplaying(true)
    const moves = rec.current
    moves.forEach((m) => timers.current.push(window.setTimeout(() => doMove(m.i, false), m.t)))
    const last = moves[moves.length - 1]?.t ?? 0
    timers.current.push(window.setTimeout(() => setReplaying(false), last + 900))
  }

  const nat = FRIEND_NATURAL[friendKindForIndex(dancer)]
  const scale = Math.min((vp.h * 0.24) / nat.h, (vp.w * 0.55) / nat.w)

  return (
    <GameShell title={t('game.dance')} emoji="💃" onExit={onExit}>
      <div className="dance-screen">
        <div className="dance-songs" aria-label={t('dance.pick')}>
          {SONGS.map((s) => (
            <button
              key={s.id}
              className={`pill pill-small ${song === s.id ? 'pill-active' : ''}`}
              onClick={() => chooseSong(s.id)}
            >
              <span aria-hidden="true">{song === s.id ? '⏸️' : '🎵'}</span> {s.label}
            </button>
          ))}
        </div>

        <div className="dance-floor">
          <div className={`dancer ${move ? `dance-${move.key}` : ''}`} key={move?.n ?? 0}>
            <Friend index={dancer} scale={scale} lively bouncing={!!song} />
          </div>
        </div>

        <div className="dance-moves">
          {MOVES.map((m, i) => (
            <button key={m.key} className="dance-move-btn" onClick={() => doMove(i)} disabled={replaying}>
              <span className="dance-move-emoji" aria-hidden="true">
                {m.emoji}
              </span>
              <span>{t(`dance.${m.key}`)}</span>
            </button>
          ))}
        </div>

        <div className="dance-controls">
          <button className="big-button" onClick={playDance} disabled={!recCount || replaying}>
            ▶️ {t('dance.play')} {recCount ? `(${recCount})` : ''}
          </button>
          <button className="pill pill-small" onClick={clearDance} disabled={!recCount || replaying}>
            🗑️ {t('dance.clear')}
          </button>
        </div>
      </div>
    </GameShell>
  )
}
