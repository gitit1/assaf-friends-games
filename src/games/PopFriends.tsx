import { useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playPop, playSuccess, playWin, unlockAudio } from '../audio'
import { randInt } from './util'

// A calm "pop" game (no timer, no losing): drag across 3+ connected friends of
// the SAME kind, then let go to pop them all. Friends above fall down and fresh
// ones drop in from the top. Longer chains = more stars. Inspired by tap/pop
// games but our own, and gentle for sensory comfort.
const COLS = 6
const ROWS = 6
const TYPES = 5 // how many different friends appear (indices 0..TYPES-1)
const MIN_CHAIN = 3 // need at least 3 connected same friends to pop
const FRIEND_PX = 44 // on-screen size target for each friend in a cell

function makeGrid(): number[] {
  return Array.from({ length: ROWS * COLS }, () => randInt(0, TYPES - 1))
}

const rowOf = (i: number) => Math.floor(i / COLS)
const colOf = (i: number) => i % COLS
function adjacent(a: number, b: number) {
  return Math.abs(rowOf(a) - rowOf(b)) + Math.abs(colOf(a) - colOf(b)) === 1
}

// Remove the popped cells; survivors in each column fall to the bottom and new
// random friends fill the gaps at the top.
function collapse(grid: number[], popped: Set<number>): number[] {
  const next = grid.slice()
  for (let c = 0; c < COLS; c++) {
    const survivors: number[] = []
    for (let r = ROWS - 1; r >= 0; r--) {
      const idx = r * COLS + c
      if (!popped.has(idx)) survivors.push(grid[idx])
    }
    let writeRow = ROWS - 1
    let k = 0
    for (; k < survivors.length; k++, writeRow--) next[writeRow * COLS + c] = survivors[k]
    for (; writeRow >= 0; writeRow--) next[writeRow * COLS + c] = randInt(0, TYPES - 1)
  }
  return next
}

export default function PopFriends({ onExit }: GameProps) {
  const [grid, setGrid] = useState<number[]>(makeGrid)
  const [chain, setChain] = useState<number[]>([])
  const [popping, setPopping] = useState<Set<number>>(() => new Set())
  const [score, setScore] = useState(0)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const lastCell = useRef<number | null>(null)
  const chainRef = useRef<number[]>([])

  function setChainBoth(next: number[]) {
    chainRef.current = next
    setChain(next)
  }

  function cellFromEvent(e: React.PointerEvent): number | null {
    const el = boardRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const col = Math.floor((e.clientX - rect.left) / (rect.width / COLS))
    const row = Math.floor((e.clientY - rect.top) / (rect.height / ROWS))
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null
    return row * COLS + col
  }

  function onDown(e: React.PointerEvent) {
    unlockAudio()
    if (popping.size) return
    const idx = cellFromEvent(e)
    if (idx == null) return
    dragging.current = true
    lastCell.current = idx
    boardRef.current?.setPointerCapture(e.pointerId)
    setChainBoth([idx])
  }

  function onMove(e: React.PointerEvent) {
    if (!dragging.current) return
    const idx = cellFromEvent(e)
    if (idx == null || idx === lastCell.current) return
    lastCell.current = idx
    const prev = chainRef.current
    if (prev.length === 0) return
    // backtrack — sliding back onto the previous friend shortens the chain
    if (prev.length >= 2 && idx === prev[prev.length - 2]) {
      setChainBoth(prev.slice(0, -1))
      return
    }
    const type = grid[prev[0]]
    const last = prev[prev.length - 1]
    if (grid[idx] === type && !prev.includes(idx) && adjacent(idx, last)) {
      playPop()
      setChainBoth([...prev, idx])
    }
  }

  function onUp() {
    if (!dragging.current) return
    dragging.current = false
    lastCell.current = null
    const picked = chainRef.current
    setChainBoth([])
    if (picked.length < MIN_CHAIN) return

    const popped = new Set(picked)
    const gained = picked.length
    setPopping(popped)
    window.setTimeout(() => {
      setGrid((g) => collapse(g, popped))
      setPopping(new Set())
      setScore((s) => {
        const ns = s + gained
        if (Math.floor(ns / 25) > Math.floor(s / 25)) playWin()
        else playSuccess()
        return ns
      })
    }, 320)
  }

  function shuffle() {
    dragging.current = false
    lastCell.current = null
    setChainBoth([])
    setPopping(new Set())
    setGrid(makeGrid())
  }

  const chainSet = new Set(chain)

  return (
    <GameShell title="פיצוץ חברים" emoji="🎈" onExit={onExit}>
      <div className="pop-head">
        <span className="pop-score" aria-label={`ניקוד ${score}`}>
          ⭐ {score}
        </span>
        <button className="pill pill-small" onClick={shuffle}>
          🔄 חדש
        </button>
      </div>
      <p className="pop-hint" aria-hidden="true">
        חברו 3 חברים זהים ושחררו 💥
      </p>

      <div
        className="pop-board"
        ref={boardRef}
        style={{ '--cols': COLS } as React.CSSProperties}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {grid.map((type, i) => (
          <span
            key={i}
            className={`pop-cell ${chainSet.has(i) ? 'is-picked' : ''} ${popping.has(i) ? 'is-pop' : ''}`}
          >
            <Friend index={type} scale={FRIEND_PX / friendMaxDim(type)} showNumber={false} />
          </span>
        ))}
      </div>
    </GameShell>
  )
}
