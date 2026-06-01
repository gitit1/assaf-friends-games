import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import IconButton from '../components/IconButton'
import Stepper from '../components/Stepper'
import FriendArt, {
  FRIEND_NATURAL,
  friendKindForIndex,
  friendPartCount,
} from '../components/FriendArt'
import type { GameProps } from './registry'
import { playPop, playSuccess, playTap, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendName, friendSay } from '../friends'
import { randInt } from './util'
import { MORE_COLORS, type Swatch } from './palette'

// "Color a friend" — a friend appears as a blank outline (its body bumps are
// empty). Pick a colour, then tap each bump to fill it in. No timer, no wrong:
// any colour anywhere is fine. Undo/redo, clear, and 🎲 for a new random friend.
// When every bump is filled the friend wakes and cheers.
type Grid = (string | null)[]

const PALETTE: Swatch[] = [
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

const MAX_NAT = 278
const blank = (n: number): Grid => Array(n).fill(null)

function useIsWide() {
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 720px)').matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 720px)')
    const onChange = () => setWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return wide
}

export default function ColorFriends({ onExit }: GameProps) {
  const [index, setIndex] = useState(() => randInt(0, FRIENDS.length - 1))
  const [colors, setColors] = useState<Grid>(() => blank(friendPartCount(friendKindForIndex(index))))
  const [undoStack, setUndoStack] = useState<Grid[]>([])
  const [redoStack, setRedoStack] = useState<Grid[]>([])
  const [sel, setSel] = useState<Swatch>(PALETTE[0])
  const [done, setDone] = useState(false)
  const [more, setMore] = useState(false)
  const wide = useIsWide()

  // live screen size, so big friends can be sized against the real screen width
  const [win, setWin] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 360,
    h: typeof window !== 'undefined' ? window.innerHeight : 700,
  }))
  useEffect(() => {
    const onResize = () => setWin({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const kind = friendKindForIndex(index)
  const nat = FRIEND_NATURAL[kind]
  // Friends above 10 are sized so the WHOLE friend (arms included, hence +14)
  // spans ~98% of the screen width; height is capped so the stack still fits.
  const scale =
    index >= 10
      ? Math.min((win.w * 0.98) / (nat.w + 14), (win.h * 0.46) / nat.h)
      : (wide ? 440 : 290) / MAX_NAT

  function goTo(next: number) {
    setIndex(next)
    setColors(blank(friendPartCount(friendKindForIndex(next))))
    setUndoStack([])
    setRedoStack([])
    setDone(false)
    playTap()
  }

  function clearAll() {
    // clearing is itself undoable — keep the history so ↺ brings the colours
    // back. Only switching friend (goTo) or leaving the game resets it.
    setUndoStack((s) => [...s, colors])
    setRedoStack([])
    setColors(blank(friendPartCount(kind)))
    setDone(false)
    playTap()
  }

  function pickColor(s: Swatch) {
    unlockAudio()
    setSel(s)
    playTap()
    speak(s.name)
  }

  function paintPart(i: number) {
    unlockAudio()
    setUndoStack((s) => [...s, colors])
    setRedoStack([])
    const next = colors.slice()
    next[i] = sel.color
    setColors(next)
    playPop()
    speak(sel.name)
    const full = next.every((c) => c !== null)
    if (full && !done) {
      setDone(true)
      window.setTimeout(() => {
        playSuccess()
        speak(`כל הכבוד! צבעת את ${friendSay(index)}`)
      }, 260)
    } else if (!full && done) {
      setDone(false)
    }
  }

  function undo() {
    if (!undoStack.length) return
    const prev = undoStack[undoStack.length - 1]
    setUndoStack((s) => s.slice(0, -1))
    setRedoStack((r) => [...r, colors])
    setColors(prev)
    setDone(prev.every((c) => c !== null))
    playTap()
  }

  function redo() {
    if (!redoStack.length) return
    const nxt = redoStack[redoStack.length - 1]
    setRedoStack((r) => r.slice(0, -1))
    setUndoStack((s) => [...s, colors])
    setColors(nxt)
    setDone(nxt.every((c) => c !== null))
    playTap()
  }

  return (
    <GameShell title="צובעים חבר" emoji="🖌️" onExit={onExit}>
      <div className="color-screen">
        <Stepper
          label={`${friendName(index)} · ${index + 1}`}
          onPrev={() => goTo((index + FRIENDS.length - 1) % FRIENDS.length)}
          onNext={() => goTo((index + 1) % FRIENDS.length)}
        />

        <div className="color-stage">
          <span
            className={`color-fit ${done ? 'is-done' : ''}`}
            style={{ width: nat.w * scale, height: nat.h * scale }}
          >
            <span className="color-scaler" style={{ width: nat.w, transform: `scale(${scale})` }}>
              <FriendArt kind={kind} showHalo={false} paint={{ colors, onPick: paintPart }} />
            </span>
          </span>
        </div>

        <div className="color-palette">
          {PALETTE.map((p) => (
            <button
              key={p.color}
              type="button"
              className={`color-swatch ${sel.color === p.color ? 'is-active' : ''}`}
              style={{ background: p.color }}
              onClick={() => pickColor(p)}
              aria-label={p.name}
            />
          ))}
          <button
            type="button"
            className={`color-swatch color-more-btn ${!PALETTE.some((p) => p.color === sel.color) ? 'is-active' : ''}`}
            style={!PALETTE.some((p) => p.color === sel.color) ? { background: sel.color } : undefined}
            onClick={() => {
              playTap()
              setMore(true)
            }}
            aria-label="עוד צבעים"
          >
            <span aria-hidden="true">➕</span>
          </button>
        </div>

        <div className="color-actions">
          <IconButton icon="↺" label="ביטול" onClick={undo} disabled={!undoStack.length} />
          <IconButton icon="↻" label="חזרה" onClick={redo} disabled={!redoStack.length} />
          <IconButton icon="🧽" label="מחיקה" onClick={clearAll} />
          <IconButton icon="🎲" label="חבר חדש" onClick={() => goTo(randInt(0, FRIENDS.length - 1))} />
        </div>
      </div>

      {more && (
        <div className="color-more-overlay" onClick={() => setMore(false)}>
          <div className="color-more-card" onClick={(e) => e.stopPropagation()}>
            <button className="hint-close" onClick={() => setMore(false)} aria-label="סגור">
              ✕
            </button>
            <h3 className="color-more-title">🌈 עוד צבעים</h3>
            <div className="color-more-grid">
              {MORE_COLORS.map((p, i) => (
                <button
                  key={`${p.color}-${i}`}
                  type="button"
                  className={`color-swatch ${sel.color === p.color ? 'is-active' : ''}`}
                  style={{ background: p.color }}
                  onClick={() => {
                    pickColor(p)
                    setMore(false)
                  }}
                  aria-label={p.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </GameShell>
  )
}
