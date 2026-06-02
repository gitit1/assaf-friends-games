import { useState } from 'react'
import GameShell from '../components/GameShell'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { randInt, shuffle } from './util'

// "Sort by colour" — drag each little friend into the basket of its colour.
// No timer, no losing: a wrong basket sends it gently back. Sort them all and
// everyone cheers, then a fresh batch drops in.
const COLORS = [
  { c: '#ef4444', name: 'אדום' },
  { c: '#facc15', name: 'צהוב' },
  { c: '#22c55e', name: 'ירוק' },
  { c: '#3b82f6', name: 'כחול' },
]
const PER_ROUND = 6

type Blob = { id: number; color: string }
let SEQ = 0
function freshBatch(): Blob[] {
  return shuffle(Array.from({ length: PER_ROUND }, () => ({ id: SEQ++, color: COLORS[randInt(0, COLORS.length - 1)].c })))
}

function Face() {
  return (
    <span className="sb-face" aria-hidden="true">
      <i className="sb-eye" />
      <i className="sb-eye" />
      <i className="sb-mouth" />
    </span>
  )
}

export default function SortByColor({ onExit }: GameProps) {
  const [blobs, setBlobs] = useState<Blob[]>(() => freshBatch())
  const [drag, setDrag] = useState<{ id: number; color: string; x: number; y: number } | null>(null)

  function newRound() {
    playTap()
    setDrag(null)
    setBlobs(freshBatch())
  }

  function down(e: React.PointerEvent, b: Blob) {
    unlockAudio()
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    setDrag({ id: b.id, color: b.color, x: e.clientX, y: e.clientY })
  }
  function move(e: React.PointerEvent) {
    setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d))
  }
  function up(e: React.PointerEvent) {
    if (!drag) return
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
    const basket = el?.closest('[data-basket]') as HTMLElement | null
    if (basket && basket.dataset.basket === drag.color) {
      const name = COLORS.find((c) => c.c === drag.color)?.name ?? ''
      const left = blobs.filter((x) => x.id !== drag.id)
      setBlobs(left)
      if (left.length === 0) {
        playWin()
        speak('כל הכבוד!')
        window.setTimeout(() => setBlobs(freshBatch()), 1400)
      } else {
        playSuccess()
        speak(name)
      }
    } else {
      playNudge()
    }
    setDrag(null)
  }

  return (
    <GameShell title="מיון לפי צבע" emoji="🧺" onExit={onExit}>
      <div className="sort-screen">
        <p className="sort-intro">גררו כל חבר לסל בצבע שלו! 🧺</p>

        <div className="sort-tray">
          {blobs.map((b) => (
            <button
              key={b.id}
              className="sort-blob"
              style={{ '--c': b.color, opacity: drag?.id === b.id ? 0 : 1 } as React.CSSProperties}
              onPointerDown={(e) => down(e, b)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={() => setDrag(null)}
              aria-label="חבר"
            >
              <Face />
            </button>
          ))}
        </div>

        <div className="sort-baskets">
          {COLORS.map((col) => (
            <div key={col.c} className="sort-basket" data-basket={col.c} style={{ '--c': col.c } as React.CSSProperties} aria-label={col.name}>
              <span className="sort-basket-lip" />
            </div>
          ))}
        </div>

        <div className="color-actions">
          <button className="big-button" onClick={newRound}>
            🔄 עוד
          </button>
        </div>
      </div>

      {drag && (
        <span
          className="sort-blob is-drag"
          style={{ '--c': drag.color, left: drag.x, top: drag.y } as React.CSSProperties}
          aria-hidden="true"
        >
          <Face />
        </span>
      )}
    </GameShell>
  )
}
