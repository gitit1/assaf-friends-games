import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import IconButton from '../components/IconButton'
import Stepper from '../components/Stepper'
import type { GameProps } from './registry'
import { playNudge, playPop, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { numberWord, randInt } from './util'

// "Color by number" — a picture drawn on a grid where every cell holds a
// number. Pick the colour for a number, then tap the cells with that number to
// fill them in. Wrong number = gentle nudge. Fill them all and the picture is
// revealed. Teaches number ↔ colour matching. No timer, no losing.
const COLORS: Record<number, { color: string; name: string }> = {
  1: { color: '#ef4444', name: 'אדום' },
  2: { color: '#f97316', name: 'כתום' },
  3: { color: '#facc15', name: 'צהוב' },
  4: { color: '#22c55e', name: 'ירוק' },
  5: { color: '#3b82f6', name: 'כחול' },
  6: { color: '#8b5cf6', name: 'סגול' },
  7: { color: '#ec4899', name: 'ורוד' },
}

type Picture = { name: string; grid: number[][] }
const PICTURES: Picture[] = [
  {
    name: 'בית',
    grid: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 3, 3, 3, 3, 3, 3, 0],
      [0, 3, 3, 5, 5, 3, 3, 0],
      [0, 3, 3, 5, 5, 3, 3, 0],
      [0, 3, 3, 5, 5, 3, 3, 0],
    ],
  },
  {
    name: 'פרח',
    grid: [
      [0, 0, 0, 7, 7, 7, 0, 0, 0],
      [0, 0, 7, 7, 7, 7, 7, 0, 0],
      [0, 7, 7, 7, 3, 7, 7, 7, 0],
      [0, 7, 7, 3, 3, 3, 7, 7, 0],
      [0, 7, 7, 7, 3, 7, 7, 7, 0],
      [0, 0, 7, 7, 7, 7, 7, 0, 0],
      [0, 0, 0, 7, 4, 7, 0, 0, 0],
      [0, 0, 0, 0, 4, 0, 0, 0, 0],
      [0, 0, 4, 4, 4, 4, 4, 0, 0],
    ],
  },
  {
    name: 'פרצוף',
    grid: [
      [0, 0, 3, 3, 3, 3, 0, 0],
      [0, 3, 3, 3, 3, 3, 3, 0],
      [3, 3, 5, 3, 3, 5, 3, 3],
      [3, 3, 5, 3, 3, 5, 3, 3],
      [3, 3, 3, 3, 3, 3, 3, 3],
      [3, 1, 3, 3, 3, 3, 1, 3],
      [0, 3, 1, 1, 1, 1, 3, 0],
      [0, 0, 3, 3, 3, 3, 0, 0],
    ],
  },
  {
    name: 'דג',
    grid: [
      [0, 0, 0, 0, 5, 5, 0, 0, 0],
      [0, 5, 5, 5, 5, 5, 5, 0, 0],
      [5, 5, 5, 5, 5, 5, 5, 5, 2],
      [5, 5, 3, 5, 5, 5, 5, 2, 2],
      [5, 5, 5, 5, 5, 5, 5, 5, 2],
      [0, 5, 5, 5, 5, 5, 5, 0, 0],
      [0, 0, 0, 0, 5, 5, 0, 0, 0],
    ],
  },
]

function present(grid: number[][]) {
  return [...new Set(grid.flat().filter((v) => v > 0))].sort((a, b) => a - b)
}
function countCells(grid: number[][]) {
  return grid.flat().filter((v) => v > 0).length
}

export default function ColorByNumber({ onExit }: GameProps) {
  const [pic, setPic] = useState(() => randInt(0, PICTURES.length - 1))
  const [filled, setFilled] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState(() => present(PICTURES[pic].grid)[0])
  const [done, setDone] = useState(false)

  const [win, setWin] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 360,
    h: typeof window !== 'undefined' ? window.innerHeight : 700,
  }))
  useEffect(() => {
    const onResize = () => setWin({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const picture = PICTURES[pic]
  const grid = picture.grid
  const cols = grid[0].length
  const rows = grid.length
  const legend = present(grid)
  const total = countCells(grid)
  const cell = Math.min(Math.floor((win.w * 0.92) / cols), Math.floor((win.h * 0.4) / rows), 46)

  useEffect(() => {
    if (!done && total > 0 && filled.size >= total) {
      setDone(true)
      playWin()
      speak(`כל הכבוד! ציירת ${picture.name}!`)
    }
  }, [filled, total, done, picture.name])

  function goTo(next: number) {
    setPic(next)
    setFilled(new Set())
    setSelected(present(PICTURES[next].grid)[0])
    setDone(false)
    playTap()
  }
  function clearAll() {
    setFilled(new Set())
    setDone(false)
    playTap()
  }
  function pickNumber(num: number) {
    unlockAudio()
    setSelected(num)
    playTap()
    speak(numberWord(num))
  }
  function tap(r: number, c: number, v: number) {
    if (done || v === 0) return
    unlockAudio()
    const key = `${r}-${c}`
    if (filled.has(key)) return
    if (v === selected) {
      setFilled((prev) => new Set(prev).add(key))
      playPop()
    } else {
      playNudge()
    }
  }

  return (
    <GameShell title="צביעה לפי מספר" emoji="🧩" onExit={onExit}>
      <div className="color-screen">
        <Stepper
          label={picture.name}
          onPrev={() => goTo((pic + PICTURES.length - 1) % PICTURES.length)}
          onNext={() => goTo((pic + 1) % PICTURES.length)}
        />

        <div className="cbn-legend">
          {legend.map((num) => (
            <button
              key={num}
              className={`cbn-swatch ${selected === num ? 'is-active' : ''}`}
              style={{ background: COLORS[num].color }}
              onClick={() => pickNumber(num)}
              aria-label={`${COLORS[num].name} — מספר ${num}`}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="cbn-stage">
          <div
            className={`cbn-grid ${done ? 'is-done' : ''}`}
            style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px` }}
          >
            {grid.flatMap((row, r) =>
              row.map((v, c) => {
                if (v === 0) return <span key={`${r}-${c}`} className="cbn-cell cbn-empty" />
                const isFilled = filled.has(`${r}-${c}`)
                return (
                  <button
                    key={`${r}-${c}`}
                    className={`cbn-cell ${isFilled ? 'is-filled' : ''}`}
                    style={isFilled ? { background: COLORS[v].color } : undefined}
                    onClick={() => tap(r, c, v)}
                    aria-label={`משבצת ${v}`}
                  >
                    {isFilled ? '' : v}
                  </button>
                )
              }),
            )}
          </div>
        </div>

        <div className="color-actions">
          <IconButton icon="🧽" label="מתחילים מחדש" onClick={clearAll} />
          <IconButton icon="🎲" label="תמונה חדשה" onClick={() => goTo(randInt(0, PICTURES.length - 1))} />
        </div>
      </div>
    </GameShell>
  )
}
