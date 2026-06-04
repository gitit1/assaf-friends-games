import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import Confetti from '../components/Confetti'
import { friendMaxDim } from '../components/FriendArt'
import { friendName } from '../friends'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playTap, playWin, unlockAudio } from '../audio'
import { randInt, shuffle } from './util'
import { speakNumber } from '../voice'
import { useT } from '../i18n'

// "Sort it" — drag each item into its matching basket. Four modes: by colour
// (smiley faces), by number, by letter (A–Z), or by friend. No timer, no losing:
// a wrong basket sends it gently back. Add baskets (up to the mode's max); every
// basket keeps a running counter, and each drop says the new count in (niqqud)
// Hebrew. Smiley baskets are coloured; number/letter/friend baskets show the
// symbol with the counter beneath.
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
  { c: '#db2777', name: 'מג׳נטה' },
  { c: '#06b6d4', name: 'ציאן' },
  { c: '#d9b88f', name: 'בז׳' },
  { c: '#991b1b', name: 'בורדו' },
  { c: '#86efac', name: 'ירוק בהיר' },
  { c: '#bae6fd', name: 'תכלת בהיר' },
  { c: '#5b21b6', name: 'סגול כהה' },
  { c: '#f59e0b', name: 'ענבר' },
  { c: '#e879f9', name: 'לילך' },
  { c: '#cbd5e1', name: 'אפור בהיר' },
]
const NEUTRAL = '#cbb994' // basket colour in friend mode, so the friend reads clearly
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const MIN_CATS = 2

type Mode = 'smiley' | 'number' | 'letter' | 'friend'
const MODES: { id: Mode; label: string; max: number }[] = [
  { id: 'smiley', label: '🙂 סמיילים', max: 30 },
  { id: 'number', label: '🔢 מספרים', max: 30 },
  { id: 'letter', label: '🔤 אותיות', max: 26 },
  { id: 'friend', label: '⭐ חברים', max: 30 },
]

const catColor = (i: number) => PALETTE[i % PALETTE.length].c
const keyOf = (m: Mode, i: number) => (m === 'smiley' ? PALETTE[i % PALETTE.length].c : `${m}${i}`)
// readable text colour for a given background
function textOn(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#1f2937' : '#ffffff'
}

type Blob = { id: number; cat: number }
let SEQ = 0
function freshBatch(numCats: number): Blob[] {
  const n = Math.min(12, Math.max(5, numCats))
  return shuffle(Array.from({ length: n }, () => ({ id: SEQ++, cat: randInt(0, numCats - 1) })))
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
  const { t } = useT()
  const [mode, setMode] = useState<Mode>('smiley')
  const [numCats, setNumCats] = useState(4)
  const [blobs, setBlobs] = useState<Blob[]>(() => freshBatch(4))
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [drag, setDrag] = useState<{ id: number; cat: number; key: string; x: number; y: number } | null>(null)
  const [popped, setPopped] = useState<string | null>(null) // basket that just got a drop
  const [party, setParty] = useState(false)

  const maxCats = MODES.find((m) => m.id === mode)!.max

  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 360))
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Lay the baskets out to fill the width: use as many columns as comfortably
  // fit (so a wide screen gets more columns → smaller baskets & fewer rows,
  // instead of a few giant ones), with a square-ish minimum so a phone doesn't
  // get too many tiny columns. The balls (tray items) track the basket size so
  // they're never huge next to small baskets.
  const GAP = 14
  const availW = Math.min(vw - 20, 760)
  const sqrtCols = Math.ceil(Math.sqrt(numCats * 1.6))
  const fitCols = Math.floor((availW + GAP) / (60 + GAP))
  const perRow = Math.min(numCats, Math.max(sqrtCols, fitCols))
  const bw = Math.max(46, Math.min(108, Math.floor((availW - (perRow - 1) * GAP) / perRow)))
  const bh = Math.round(bw * 0.84)
  const countFont = Math.round(bw * 0.42)
  const labelFont = Math.round(bw * 0.5)
  const ballSize = Math.max(40, Math.min(74, Math.round(bw * 0.95)))

  function newRound() {
    playTap()
    setDrag(null)
    setBlobs(freshBatch(numCats))
  }
  function changeCats(d: number) {
    const next = Math.min(maxCats, Math.max(MIN_CATS, numCats + d))
    if (next === numCats) return
    playTap()
    setNumCats(next)
    setDrag(null)
    setCounts({})
    setBlobs(freshBatch(next))
  }
  function chooseMode(m: Mode) {
    if (m === mode) return
    playTap()
    const nc = Math.min(numCats, MODES.find((x) => x.id === m)!.max)
    setMode(m)
    setNumCats(nc)
    setDrag(null)
    setCounts({})
    setBlobs(freshBatch(nc))
  }

  function down(e: React.PointerEvent, b: Blob) {
    unlockAudio()
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    setDrag({ id: b.id, cat: b.cat, key: keyOf(mode, b.cat), x: e.clientX, y: e.clientY })
  }
  function move(e: React.PointerEvent) {
    setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d))
  }
  function up(e: React.PointerEvent) {
    if (!drag) return
    // forgiving: snap to the NEAREST basket (no need to land exactly on it), as
    // long as it's the right one and the drop is reasonably close to it
    let basket: HTMLElement | null = null
    let bestD = Infinity
    document.querySelectorAll<HTMLElement>('[data-basket]').forEach((t) => {
      const r = t.getBoundingClientRect()
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
      if (d < bestD) {
        bestD = d
        basket = t
      }
    })
    const tol = Math.max(bw, bh) * 1.15
    if (basket && bestD <= tol && (basket as HTMLElement).dataset.basket === drag.key) {
      const newCount = (counts[drag.key] ?? 0) + 1
      setCounts((c) => ({ ...c, [drag.key]: newCount }))
      const left = blobs.filter((x) => x.id !== drag.id)
      setBlobs(left)
      speakNumber(newCount)
      const droppedKey = drag.key
      setPopped(droppedKey)
      window.setTimeout(() => setPopped((p) => (p === droppedKey ? null : p)), 380)
      if (left.length === 0) {
        playWin()
        setParty(true)
        window.setTimeout(() => setParty(false), 2500)
        window.setTimeout(() => setBlobs(freshBatch(numCats)), 1400)
      } else {
        playSuccess()
      }
    } else {
      playNudge()
    }
    setDrag(null)
  }

  // the contents of a draggable item, per mode
  function ItemInner({ cat }: { cat: number }) {
    if (mode === 'smiley') return <Face />
    if (mode === 'friend') return <Friend index={cat} scale={(ballSize * 0.85) / friendMaxDim(cat)} showNumber={false} />
    return (
      <span className="sort-sym" style={{ color: textOn(catColor(cat)) }}>
        {mode === 'number' ? cat + 1 : LETTERS[cat]}
      </span>
    )
  }
  const itemClass = `sort-blob ${mode === 'friend' ? 'is-friend' : ''}`

  function basketAria(i: number) {
    if (mode === 'smiley') return PALETTE[i % PALETTE.length].name
    if (mode === 'number') return t('sort.numAria', { n: i + 1 })
    if (mode === 'letter') return t('sort.letterAria', { l: LETTERS[i] })
    return friendName(i)
  }

  return (
    <GameShell title={t('game.sort')} emoji="🧺" onExit={onExit}>
      <Confetti active={party} />
      <div className="sort-screen">
        <div className="sort-modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`pill pill-small ${mode === m.id ? 'pill-active' : ''}`}
              onClick={() => chooseMode(m.id)}
            >
              {t(`sort.${m.id}`)}
            </button>
          ))}
        </div>

        <div className="sort-tray">
          {blobs.map((b) => (
            <button
              key={b.id}
              className={itemClass}
              style={{ '--c': catColor(b.cat), '--bs': `${ballSize}px`, opacity: drag?.id === b.id ? 0 : 1 } as React.CSSProperties}
              onPointerDown={(e) => down(e, b)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={() => setDrag(null)}
              aria-label={t('sort.item')}
            >
              <ItemInner cat={b.cat} />
            </button>
          ))}
        </div>

        <div className="sort-controls">
          <button className="pill" onClick={() => changeCats(-1)} disabled={numCats <= MIN_CATS} aria-label={t('sort.fewer')}>
            ➖
          </button>
          <span className="sort-controls-label">{t('sort.baskets', { n: numCats })}</span>
          <button className="pill" onClick={() => changeCats(1)} disabled={numCats >= maxCats} aria-label={t('sort.more')}>
            ➕
          </button>
        </div>

        <div className="sort-baskets">
          {Array.from({ length: numCats }, (_, i) => {
            const key = keyOf(mode, i)
            const count = counts[key] ?? 0
            return (
              <div className="sort-basket-cell" key={key}>
                <div
                  className={`sort-basket ${popped === key ? 'is-pop' : ''}`}
                  data-basket={key}
                  style={{ '--c': mode === 'friend' ? NEUTRAL : catColor(i), width: bw, height: bh } as React.CSSProperties}
                  aria-label={basketAria(i)}
                >
                  <span className="sort-basket-lip" />
                  {mode === 'smiley' ? (
                    <span className="sort-count" style={{ fontSize: countFont, color: textOn(catColor(i)) }}>
                      {count}
                    </span>
                  ) : mode === 'friend' ? (
                    <span className="sort-basket-friend">
                      <Friend index={i} scale={(bw * 0.6) / friendMaxDim(i)} showNumber={false} />
                    </span>
                  ) : (
                    <span className="sort-basket-label" style={{ fontSize: labelFont, color: textOn(catColor(i)) }}>
                      {mode === 'number' ? i + 1 : LETTERS[i]}
                    </span>
                  )}
                </div>
                {mode !== 'smiley' && <span className="sort-count-below">{count}</span>}
              </div>
            )
          })}
        </div>

        <div className="color-actions">
          <button className="big-button" onClick={newRound}>
            🔄 {t('sort.new')}
          </button>
        </div>
      </div>

      {drag && (
        <span
          className={`${itemClass} is-drag`}
          style={{ '--c': catColor(drag.cat), '--bs': `${ballSize}px`, left: drag.x, top: drag.y } as React.CSSProperties}
          aria-hidden="true"
        >
          <ItemInner cat={drag.cat} />
        </span>
      )}
    </GameShell>
  )
}
