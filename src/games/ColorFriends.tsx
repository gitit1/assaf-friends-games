import { useState } from 'react'
import GameShell from '../components/GameShell'
import FriendArt, {
  FRIEND_NATURAL,
  friendKindForIndex,
  friendMaxDim,
  friendPartCount,
} from '../components/FriendArt'
import type { GameProps } from './registry'
import { playPop, playSuccess, playTap, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendName, friendSay } from '../friends'
import { randInt } from './util'

// "Color a friend" — a friend appears as a blank outline (its body bumps are
// empty). Pick a colour, then tap each bump to fill it in. No timer, no wrong:
// any colour anywhere is fine. When every bump is filled the friend wakes and
// cheers. The friend is drawn from the whole roster (◀ ▶ to choose, 🎲 random).
const PALETTE: { color: string; name: string }[] = [
  { color: '#ef4444', name: 'אדום' },
  { color: '#f97316', name: 'כתום' },
  { color: '#facc15', name: 'צהוב' },
  { color: '#22c55e', name: 'ירוק' },
  { color: '#14b8a6', name: 'טורקיז' },
  { color: '#3b82f6', name: 'כחול' },
  { color: '#8b5cf6', name: 'סגול' },
  { color: '#ec4899', name: 'ורוד' },
  { color: '#a16207', name: 'חום' },
  { color: '#f8fafc', name: 'לבן' },
  { color: '#111827', name: 'שחור' },
  { color: '#9ca3af', name: 'אפור' },
]

const STAGE = 240 // target on-screen size of the friend (px)

export default function ColorFriends({ onExit }: GameProps) {
  const [index, setIndex] = useState(() => randInt(0, FRIENDS.length - 1))
  const [colors, setColors] = useState<(string | null)[]>(() =>
    Array(friendPartCount(friendKindForIndex(index))).fill(null),
  )
  const [picked, setPicked] = useState(0)
  const [done, setDone] = useState(false)

  const kind = friendKindForIndex(index)
  const nat = FRIEND_NATURAL[kind]
  const scale = STAGE / friendMaxDim(index)

  function goTo(next: number) {
    setIndex(next)
    setColors(Array(friendPartCount(friendKindForIndex(next))).fill(null))
    setDone(false)
    playTap()
  }

  function clearAll() {
    setColors(Array(friendPartCount(kind)).fill(null))
    setDone(false)
    playTap()
  }

  function pickColor(i: number) {
    unlockAudio()
    setPicked(i)
    playTap()
    speak(PALETTE[i].name)
  }

  function paintPart(i: number) {
    if (done) return
    unlockAudio()
    const sel = PALETTE[picked]
    const next = colors.slice()
    next[i] = sel.color
    setColors(next)
    playPop()
    speak(sel.name)
    if (next.every((c) => c !== null)) {
      setDone(true)
      window.setTimeout(() => {
        playSuccess()
        speak(`כל הכבוד! צבעת את ${friendSay(index)}`)
      }, 260)
    }
  }

  return (
    <GameShell title="צובעים חבר" emoji="🖌️" onExit={onExit}>
      <div className="color-head">
        <button
          className="pill pet-arrow"
          onClick={() => goTo((index + FRIENDS.length - 1) % FRIENDS.length)}
          aria-label="הקודם"
        >
          ◀
        </button>
        <span className="color-name">
          {friendName(index)} · {index + 1}
        </span>
        <button
          className="pill pet-arrow"
          onClick={() => goTo((index + 1) % FRIENDS.length)}
          aria-label="הבא"
        >
          ▶
        </button>
      </div>

      <div className="color-stage">
        <span
          className={`color-fit ${done ? 'is-done' : ''}`}
          style={{ width: nat.w * scale, height: nat.h * scale }}
        >
          <span style={{ width: nat.w, transform: `scale(${scale})`, transformOrigin: 'top left', display: 'inline-block' }}>
            <FriendArt kind={kind} showHalo={false} paint={{ colors, onPick: paintPart }} />
          </span>
        </span>
      </div>

      <div className="color-palette">
        {PALETTE.map((p, i) => (
          <button
            key={p.color}
            type="button"
            className={`color-swatch ${i === picked ? 'is-active' : ''}`}
            style={{ background: p.color }}
            onClick={() => pickColor(i)}
            aria-label={p.name}
          />
        ))}
      </div>

      <div className="color-actions">
        <button className="pill" onClick={clearAll}>
          🧽 מנקים
        </button>
        <button className="big-button" onClick={() => goTo(randInt(0, FRIENDS.length - 1))}>
          🎲 חבר חדש
        </button>
      </div>
    </GameShell>
  )
}
