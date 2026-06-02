import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { numberWordNiqqud, randInt, shuffle } from './util'

// "Sort by colour" — drag each little friend into the basket of its colour.
// No timer, no losing: a wrong basket sends it gently back. You can add baskets
// (up to 20 colours); every basket keeps a running counter of how many landed
// in it, and each drop says the new count out loud in (vocalised) Hebrew.
const PALETTE = [
  { c: '#ef4444', name: 'אדום' },
  { c: '#facc15', name: 'צהוב' },
  { c: '#22c55e', name: 'ירוק' },
  { c: '#3b82f6', name: 'כחול' },
  { c: '#f97316', name: 'כתום' },
  { c: '#8b5cf6', name: 'סגול' },
  { c: '#ec4899', name: 'ורוד' },
  { c: '#14b8a6', name: 'טורקיז' },
  { c: '#38bdf8', name: 'תכלת' },
  { c: '#92400e', name: 'חום' },
  { c: '#84cc16', name: 'ליים' },
  { c: '#fb7185', name: 'ורוד בהיר' },
  { c: '#15803d', name: 'ירוק כהה' },
  { c: '#1e3a8a', name: 'כחול כהה' },
  { c: '#6d28d9', name: 'סגול כהה' },
  { c: '#eab308', name: 'זהב' },
  { c: '#c2410c', name: 'חמרה' },
  { c: '#0e7490', name: 'כחול ים' },
  { c: '#1f2937', name: 'שחור' },
  { c: '#94a3b8', name: 'אפור' },
]
const MIN_COLORS = 2
const MAX_COLORS = 20

type Blob = { id: number; color: string }
let SEQ = 0
function freshBatch(colors: { c: string }[]): Blob[] {
  const n = Math.min(12, Math.max(5, colors.length))
  return shuffle(Array.from({ length: n }, () => ({ id: SEQ++, color: colors[randInt(0, colors.length - 1)].c })))
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
  const [numColors, setNumColors] = useState(4)
  const colors = PALETTE.slice(0, numColors)
  const [blobs, setBlobs] = useState<Blob[]>(() => freshBatch(PALETTE.slice(0, 4)))
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [drag, setDrag] = useState<{ id: number; color: string; x: number; y: number } | null>(null)

  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 360))
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // baskets fill the screen width: a roughly square-ish wrap, sized from the
  // available width (so they're big on a computer) and capped per basket.
  const availW = Math.min(vw - 20, 760)
  const perRow = Math.min(numColors, Math.ceil(Math.sqrt(numColors * 1.6)))
  const bw = Math.max(46, Math.min(170, Math.floor((availW - (perRow - 1) * 14) / perRow)))
  const bh = Math.round(bw * 0.84)
  const countFont = Math.round(bw * 0.42)

  function newRound() {
    playTap()
    setDrag(null)
    setBlobs(freshBatch(colors))
  }
  function changeColors(d: number) {
    const next = Math.min(MAX_COLORS, Math.max(MIN_COLORS, numColors + d))
    if (next === numColors) return
    playTap()
    setNumColors(next)
    setDrag(null)
    setBlobs(freshBatch(PALETTE.slice(0, next)))
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
      const newCount = (counts[drag.color] ?? 0) + 1
      setCounts((c) => ({ ...c, [drag.color]: newCount }))
      const left = blobs.filter((x) => x.id !== drag.id)
      setBlobs(left)
      // say how many are now in that basket, in clear vocalised Hebrew
      speak(numberWordNiqqud(newCount))
      if (left.length === 0) {
        playWin()
        window.setTimeout(() => setBlobs(freshBatch(colors)), 1400)
      } else {
        playSuccess()
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

        <div className="sort-controls">
          <button className="pill" onClick={() => changeColors(-1)} disabled={numColors <= MIN_COLORS} aria-label="פחות סלים">
            ➖
          </button>
          <span className="sort-controls-label">{numColors} סלים</span>
          <button className="pill" onClick={() => changeColors(1)} disabled={numColors >= MAX_COLORS} aria-label="עוד סל">
            ➕
          </button>
        </div>

        <div className="sort-baskets">
          {colors.map((col) => (
            <div
              key={col.c}
              className="sort-basket"
              data-basket={col.c}
              style={{ '--c': col.c, width: bw, height: bh } as React.CSSProperties}
              aria-label={`${col.name} — ${counts[col.c] ?? 0}`}
            >
              <span className="sort-basket-lip" />
              <span className="sort-count" style={{ fontSize: countFont }}>
                {counts[col.c] ?? 0}
              </span>
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
