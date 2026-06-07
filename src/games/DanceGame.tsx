import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import IconButton from '../components/IconButton'
import { FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playMelody, stopMelody, playMove, playTap, unlockAudio } from '../audio'
import { SONGS } from '../music/songs'
import { randFriendIndex, friendCount } from '../level'
import { useViewport } from '../useViewport'
import { useT } from '../i18n'

// "Dance floor": pick a (public-domain) children's tune from the song pager, then
// tap moves to make the friend dance. A universal RECORD button captures the
// taps into a little dance you can PLAY back; a trash button clears it. The
// child can also swap to another friend. No timer, no winning or losing.
const MOVES = [
  { key: 'left', emoji: '⬅️' },
  { key: 'right', emoji: '➡️' },
  { key: 'spin', emoji: '🌀' },
  { key: 'jump', emoji: '⬆️' },
  { key: 'wiggle', emoji: '🪩' },
]

export default function DanceGame({ onExit, friend }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  // dance the friend we came from (e.g. Toki), else a random one
  const [dancer, setDancer] = useState(() => friend ?? randFriendIndex())
  const [songIdx, setSongIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [move, setMove] = useState<{ key: string; n: number } | null>(null)
  const [recording, setRecording] = useState(false)
  const [replaying, setReplaying] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null) // 3·2·1 before recording
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

  const song = SONGS[songIdx]
  function gotoSong(d: number) {
    playTap()
    const next = (songIdx + d + SONGS.length) % SONGS.length
    setSongIdx(next)
    // while recording the song loops as backing; a preview just plays once
    if (recording) playMelody(SONGS[next].id, { loop: true })
    else if (playing) playMelody(SONGS[next].id, { loop: false, onEnd: () => setPlaying(false) })
  }
  // preview the song ONCE (not a loop)
  function togglePlaySong() {
    unlockAudio()
    playTap()
    if (playing) {
      stopMelody()
      setPlaying(false)
    } else {
      setPlaying(true)
      playMelody(song.id, { loop: false, onEnd: () => setPlaying(false) })
    }
  }

  // animate + sound one move; record it while the record button is on
  function doMove(i: number, fromTap: boolean) {
    unlockAudio()
    moveN.current += 1
    setMove({ key: MOVES[i].key, n: moveN.current })
    playMove(i)
    if (fromTap && recording) {
      rec.current.push({ i, t: Date.now() - startT.current })
      setRecCount(rec.current.length)
    }
  }

  // ⏺️ record / ⏹️ stop
  function toggleRecord() {
    unlockAudio()
    playTap()
    if (recording) {
      setRecording(false)
      stopMelody()
      setPlaying(false)
      return
    }
    if (countdown !== null) {
      // cancel the countdown
      clearTimers()
      setCountdown(null)
      return
    }
    startCountdown()
  }

  // 3 · 2 · 1 on screen so the child can get ready, then start recording
  function startCountdown() {
    clearTimers()
    setReplaying(false)
    setCountdown(3)
    playMove(0)
    timers.current.push(
      window.setTimeout(() => {
        setCountdown(2)
        playMove(1)
      }, 700),
    )
    timers.current.push(
      window.setTimeout(() => {
        setCountdown(1)
        playMove(2)
      }, 1400),
    )
    timers.current.push(
      window.setTimeout(() => {
        setCountdown(null)
        beginRecording()
      }, 2100),
    )
  }

  function beginRecording() {
    rec.current = []
    setRecCount(0)
    startT.current = Date.now()
    setRecording(true)
    setPlaying(true)
    // the song plays once; when it finishes, recording stops automatically
    playMelody(song.id, {
      loop: false,
      onEnd: () => {
        setRecording(false)
        setPlaying(false)
      },
    })
  }

  // ▶️ play / ⏸️ stop the replay
  function togglePlayback() {
    if (replaying) {
      clearTimers()
      setReplaying(false)
      return
    }
    if (!rec.current.length || recording) return
    unlockAudio()
    playTap()
    clearTimers()
    setReplaying(true)
    const moves = rec.current
    moves.forEach((m) => timers.current.push(window.setTimeout(() => doMove(m.i, false), m.t)))
    const last = moves[moves.length - 1]?.t ?? 0
    timers.current.push(window.setTimeout(() => setReplaying(false), last + 900))
  }

  // 🗑️ clear the recorded dance
  function deleteDance() {
    if (recording || replaying) return
    playTap()
    clearTimers()
    rec.current = []
    setRecCount(0)
  }

  function swapDancer() {
    playTap()
    let n = randFriendIndex()
    if (friendCount() > 1) while (n === dancer) n = randFriendIndex()
    setDancer(n)
  }

  const nat = FRIEND_NATURAL[friendKindForIndex(dancer)]
  const scale = Math.min((vp.h * 0.22) / nat.h, (vp.w * 0.5) / nat.w)

  return (
    <GameShell title={t('game.dance')} emoji="💃" onExit={onExit}>
      <div className="dance-screen">
        {/* song pager (LTR so ◀ prev sits left, ▶ next right) */}
        <div className="dance-songs" dir="ltr">
          <IconButton icon="◀" label={t('nav.prev')} onClick={() => gotoSong(-1)} />
          <button className={`dance-song ${playing ? 'is-playing' : ''}`} onClick={togglePlaySong}>
            <span aria-hidden="true">{playing ? '⏸️' : '🎵'}</span> {song.label}
          </button>
          <IconButton icon="▶" label={t('nav.next')} onClick={() => gotoSong(1)} />
        </div>

        <div className="dance-floor">
          <button className="dance-swap" onClick={swapDancer} aria-label={t('dance.swap')}>
            🔀
          </button>
          <div className={`dancer ${move ? `dance-${move.key}` : ''}`} key={move?.n ?? 0}>
            <Friend index={dancer} scale={scale} lively bouncing={playing} />
          </div>
          {countdown !== null && (
            <div className="dance-count" key={countdown} aria-hidden="true">
              {countdown}
            </div>
          )}
        </div>

        {/* moves — LTR so שמאלה is physically on the left and ימינה on the right;
            nowrap so they always stay in one row, shrinking to fit the screen */}
        <div className="dance-moves" dir="ltr">
          {MOVES.map((m, i) => (
            <button
              key={m.key}
              className="dance-move-btn"
              onClick={() => doMove(i, true)}
              disabled={replaying || countdown !== null}
            >
              <span className="dance-move-emoji" aria-hidden="true">
                {m.emoji}
              </span>
              <span className="dance-move-label">{t(`dance.${m.key}`)}</span>
            </button>
          ))}
        </div>

        {/* universal media controls — icons only (kids know the convention) */}
        <div className="dance-controls">
          <button
            className={`dance-ctrl dance-rec ${recording ? 'is-on' : ''}`}
            onClick={toggleRecord}
            disabled={replaying}
            aria-label={t(recording ? 'dance.stop' : 'dance.record')}
          >
            <span aria-hidden="true">{recording ? '⏹️' : '⏺️'}</span>
          </button>
          <button
            className="dance-ctrl"
            onClick={togglePlayback}
            disabled={recording || countdown !== null || (!recCount && !replaying)}
            aria-label={t(replaying ? 'dance.pause' : 'dance.play')}
          >
            <span aria-hidden="true">{replaying ? '⏸️' : '▶️'}</span>
          </button>
          <button
            className="dance-ctrl"
            onClick={deleteDance}
            disabled={recording || replaying || countdown !== null || !recCount}
            aria-label={t('dance.delete')}
          >
            <span aria-hidden="true">🗑️</span>
          </button>
        </div>
      </div>
    </GameShell>
  )
}
