import { useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playNudge, playPiano, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendColor } from '../friends'
import { randInt, shuffle } from './util'

// "Friends piano" — Guitar-Hero / Just-Dance style but SELF-PACED (no timer):
// the next note of a known kids' tune falls down its lane as a number, its key
// glows, and the child taps it to play. Tapping through plays the whole melody.
// A free-play mode lets them just make music. No losing. The friends on the
// keys are drawn at random from the whole roster (fresh each play).
const LANES = 6 // 6 lanes = Do Re Mi Fa Sol La (the pitch is fixed per lane)

function pickBand(): number[] {
  return shuffle(Array.from({ length: FRIENDS.length }, (_, i) => i)).slice(0, LANES)
}

type Song = { name: string; emoji: string; notes: number[] } // notes = scale degrees 0..5
const SONGS: Song[] = [
  // Twinkle Twinkle / the ABC song
  { name: 'כוכב', emoji: '⭐', notes: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0] },
  // Mary Had a Little Lamb
  { name: 'כבשה', emoji: '🐑', notes: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4] },
]

export default function PianoFriends({ onExit }: GameProps) {
  const [songIdx, setSongIdx] = useState(() => randInt(0, SONGS.length - 1))
  const [free, setFree] = useState(false)
  const [pos, setPos] = useState(0)
  const [pressed, setPressed] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number | null>(null)
  const [band, setBand] = useState<number[]>(pickBand) // which friends sit on the keys

  const song = SONGS[songIdx]
  const done = !free && pos >= song.notes.length
  const current = !free && !done ? song.notes[pos] : null

  function bounce(i: number) {
    setPressed(i)
    window.setTimeout(() => setPressed((p) => (p === i ? null : p)), 350)
  }

  function chooseSong(i: number) {
    unlockAudio()
    setFree(false)
    setSongIdx(i)
    setPos(0)
    setWrong(null)
    setBand(pickBand())
  }
  function chooseFree() {
    unlockAudio()
    setFree(true)
    setWrong(null)
    setBand(pickBand())
  }
  function restart() {
    setPos(0)
    setWrong(null)
    setBand(pickBand())
  }

  function tap(i: number) {
    unlockAudio()
    if (free) {
      playPiano(i)
      bounce(i)
      return
    }
    if (done) return
    if (i === current) {
      playPiano(i)
      bounce(i)
      const np = pos + 1
      setPos(np)
      if (np >= song.notes.length) window.setTimeout(() => { playWin(); speak('כל הכבוד!') }, 350)
    } else {
      setWrong(i)
      playNudge()
      window.setTimeout(() => setWrong(null), 350)
    }
  }

  return (
    <GameShell title="פסנתר חברים" emoji="🎹" onExit={onExit}>
      <div className="gh-songs">
        {SONGS.map((s, i) => (
          <button key={s.name} className={`pill ${!free && i === songIdx ? 'pill-active' : ''}`} onClick={() => chooseSong(i)}>
            {s.emoji} {s.name}
          </button>
        ))}
        <button className={`pill ${free ? 'pill-active' : ''}`} onClick={chooseFree}>
          🎵 חופשי
        </button>
      </div>

      {!free && !done && <p className="gh-hint" aria-hidden="true">געו במספר שמופיע כדי לנגן 🎵</p>}
      {free && <p className="gh-hint" aria-hidden="true">געו בחברים ונגנו מה שבא לכם 🎶</p>}

      <div className="gh-board" style={{ '--lanes': LANES } as React.CSSProperties}>
        {current != null && (
          <span
            className="gh-note"
            key={pos}
            style={{ '--lane': current, '--c': friendColor(band[current]) } as React.CSSProperties}
          >
            <span className="gh-tile">{band[current] + 1}</span>
          </span>
        )}
        {done && <span className="gh-board-done" aria-hidden="true">🎉</span>}
      </div>

      <div className="gh-keys">
        {Array.from({ length: LANES }).map((_, i) => (
          <button
            key={i}
            className={`gh-key ${current === i ? 'is-active' : ''} ${wrong === i ? 'is-wrong' : ''}`}
            onClick={() => tap(i)}
            aria-label={`צליל ${i + 1}`}
          >
            <Friend index={band[i]} scale={44 / friendMaxDim(band[i])} showNumber={false} bouncing={pressed === i} />
          </button>
        ))}
      </div>

      {!free && (
        <div className="gh-foot">
          {done ? (
            <div className="counting-next">
              <div className="banner banner-success" role="status">
                כל הכבוד! 🎉
              </div>
              <button className="big-button" onClick={restart}>
                🔁 עוד פעם
              </button>
            </div>
          ) : (
            <span className="gh-progress" aria-hidden="true">
              ♪ {pos} / {song.notes.length}
            </span>
          )}
        </div>
      )}
    </GameShell>
  )
}
