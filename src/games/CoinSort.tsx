import { useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendColor } from '../friends'
import { useT } from '../i18n'
import { playTap, playPop, playSuccess, playNudge, unlockAudio } from '../audio'
import { speak } from '../speech'
import { useSettings } from '../settings'
import type { GameProps } from './registry'

// "מטבעות חברים" — a coin sort + MERGE game in the spirit of Pocket Sort, but the
// coins are the FRIENDS (each already has a colour + a number). You herd matching
// friend-coins together; a tube full of 4 identical MERGES into one coin of the
// NEXT number — climbing 1 → 2 → 3 … → 100. Built so a child on the spectrum can
// NEVER get stuck: generous empty tubes, a free "+ tube", a DRAW button (more
// coins), a SORT button (auto-tidy), unlimited undo, no timer, no fail.

const CAP = 4 // coins per tube; 4 identical -> merge to the next number
const TOP = 100 // highest friend

type Tube = number[] // friend NUMBERS (1..100), bottom .. top

const clone = (tubes: Tube[]): Tube[] => tubes.map((t) => t.slice())
const shuffle = <T,>(a: T[]): T[] => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// how many identical coins sit on top of a tube
function topRun(t: Tube): { value: number; count: number } | null {
  if (!t.length) return null
  const value = t[t.length - 1]
  let count = 0
  for (let i = t.length - 1; i >= 0 && t[i] === value; i--) count++
  return { value, count }
}
const canDrop = (dst: Tube, value: number) => dst.length < CAP && (dst.length === 0 || dst[dst.length - 1] === value)
const maxVal = (tubes: Tube[]) => tubes.reduce((m, t) => Math.max(m, ...t, 0), 0)

// merge any tube that is full of one number into a single coin of the next number
function settleMerges(tubes: Tube[]): { tubes: Tube[]; merged: number | null } {
  let merged: number | null = null
  const out = tubes.map((t) => {
    if (t.length === CAP && t.every((x) => x === t[0]) && t[0] < TOP) {
      merged = t[0] + 1
      return [t[0] + 1]
    }
    return t
  })
  return { tubes: out, merged }
}

// difficulty -> how many distinct friend-coins start out, and how many spare tubes
function config(difficulty: number, maxNumber: number) {
  const kinds = Math.min([3, 4, 5, 6][difficulty] ?? 4, Math.max(2, Math.min(maxNumber, 12)))
  const spares = [4, 4, 3, 3][difficulty] ?? 3
  return { kinds, spares }
}

function deal(kinds: number, spares: number): Tube[] {
  const coins: number[] = []
  for (let v = 1; v <= kinds; v++) for (let i = 0; i < CAP; i++) coins.push(v)
  shuffle(coins)
  const tubes: Tube[] = []
  for (let t = 0; t < kinds; t++) tubes.push(coins.slice(t * CAP, (t + 1) * CAP))
  for (let s = 0; s < spares; s++) tubes.push([])
  return tubes
}

export default function CoinSort({ onExit }: GameProps) {
  const { t } = useT()
  const { difficulty, maxNumber } = useSettings()
  const cfg = config(difficulty, maxNumber)

  const [tubes, setTubes] = useState<Tube[]>(() => deal(cfg.kinds, cfg.spares))
  const [sel, setSel] = useState<number | null>(null) // picked-up tube
  const [best, setBest] = useState(cfg.kinds) // highest number reached (climbs)
  const [style, setStyle] = useState<'stack' | 'tube'>('stack') // coin-pile board vs glass tubes
  const [history, setHistory] = useState<Tube[][]>([])
  const [pop, setPop] = useState<number | null>(null) // tube index that just merged (for the animation)

  const tap = () => {
    unlockAudio()
    playTap()
  }
  const push = () => setHistory((h) => [...h.slice(-30), clone(tubes)])

  // settle merges, update the height, celebrate a new high, and commit to state
  function commit(next: Tube[], announce = true) {
    let cur = next
    for (let pass = 0; pass < 12; pass++) {
      const { tubes: m, merged } = settleMerges(cur)
      cur = m
      if (merged == null) break
    }
    const hi = maxVal(cur)
    if (hi > best) {
      setBest(hi)
      const idx = cur.findIndex((tb) => tb.length && tb[tb.length - 1] === hi)
      if (idx >= 0) {
        setPop(idx)
        window.setTimeout(() => setPop(null), 500)
      }
      if (announce) {
        playSuccess()
        speak(String(hi))
      }
    }
    setTubes(cur)
  }

  function tapTube(i: number) {
    unlockAudio()
    if (sel == null) {
      if (!tubes[i].length) return
      playTap()
      setSel(i)
      return
    }
    if (sel === i) {
      playTap()
      setSel(null)
      return
    }
    const run = topRun(tubes[sel])
    if (!run || !canDrop(tubes[i], run.value)) {
      // illegal — gentle nudge, no penalty (errorless)
      playNudge()
      setSel(null)
      return
    }
    push()
    const next = clone(tubes)
    const move = Math.min(run.count, CAP - next[i].length)
    for (let k = 0; k < move; k++) {
      next[sel].pop()
      next[i].push(run.value)
    }
    playPop()
    setSel(null)
    commit(next)
  }

  // DRAW — deal a few new coins onto the board (at/below the current frontier, so
  // you climb by MERGING, not by being handed higher coins). Never jams.
  function draw() {
    tap()
    push()
    const next = clone(tubes)
    const lo = Math.max(1, best - 2)
    const hi = best
    for (let n = 0; n < 4; n++) {
      const v = lo + Math.floor(Math.random() * (hi - lo + 1))
      let dst = next.findIndex((tb) => tb.length && tb[tb.length - 1] === v && tb.length < CAP)
      if (dst < 0) dst = next.findIndex((tb) => tb.length === 0)
      if (dst < 0) dst = next.findIndex((tb) => tb.length < CAP)
      if (dst < 0) {
        next.push([v]) // out of room — grow rather than jam
      } else next[dst].push(v)
    }
    setSel(null)
    commit(next, false)
  }

  // SORT — auto-tidy: gather every coin by number and merge everything possible
  function autoSort() {
    tap()
    push()
    const counts = new Map<number, number>()
    for (const tb of tubes) for (const v of tb) counts.set(v, (counts.get(v) ?? 0) + 1)
    // cascade merges from low to high (4 of v -> 1 of v+1)
    for (let v = 1; v < TOP; v++) {
      let c = counts.get(v) ?? 0
      while (c >= CAP) {
        c -= CAP
        counts.set(v + 1, (counts.get(v + 1) ?? 0) + 1)
      }
      counts.set(v, c)
    }
    const values = [...counts.keys()].filter((v) => (counts.get(v) ?? 0) > 0).sort((a, b) => a - b)
    const next: Tube[] = values.map((v) => Array(counts.get(v) as number).fill(v))
    const keep = Math.max(tubes.length, next.length + 1)
    while (next.length < keep) next.push([])
    setSel(null)
    commit(next)
  }

  function addTube() {
    tap()
    push()
    setTubes((ts) => [...ts, []])
  }
  function undo() {
    if (!history.length) return
    tap()
    setSel(null)
    setTubes(history[history.length - 1])
    setHistory((h) => h.slice(0, -1))
  }
  function restart() {
    tap()
    setSel(null)
    setHistory([])
    setBest(cfg.kinds)
    setTubes(deal(cfg.kinds, cfg.spares))
  }

  return (
    <GameShell title={t('game.coinsort')} emoji="🪙" onExit={onExit}>
      <div className="cs-top">
        <span className="cs-best-label">{t('cs.best')}</span>
        <span className="cs-best-coin">
          <Coin v={best} />
        </span>
        <span className="cs-style-toggle">
          <button className={style === 'stack' ? 'on' : ''} onClick={() => setStyle('stack')}>
            🪙 {t('cs.styleStack')}
          </button>
          <button className={style === 'tube' ? 'on' : ''} onClick={() => setStyle('tube')}>
            🧪 {t('cs.styleTube')}
          </button>
        </span>
      </div>

      <div className={`cs-board style-${style}`}>
        {tubes.map((tube, i) => {
          const run = sel === i ? topRun(tubes[i]) : null
          const isLifted = (d: number) => run != null && d >= tube.length - run.count
          const topV = tube.length ? tube[tube.length - 1] : 0
          return (
            <button
              key={i}
              className={`cs-tube ${sel === i ? 'is-sel' : ''} ${pop === i ? 'is-pop' : ''}`}
              onClick={() => tapTube(i)}
              aria-label={`lane ${i + 1}`}
            >
              {style === 'tube' ? (
                tube.map((v, d) => (
                  <span key={d} className={`cs-slot ${isLifted(d) ? 'lifted' : ''}`}>
                    <Coin v={v} />
                  </span>
                ))
              ) : (
                <>
                  {tube.length > 0 && (
                    <span className="cs-lane-num" style={{ '--c': friendColor(topV - 1) } as React.CSSProperties}>
                      {topV}
                    </span>
                  )}
                  <span className="cs-pile" style={{ height: tube.length * 12 + 22 }}>
                    {tube.map((v, d) => (
                      <span
                        key={d}
                        className={`cs-chip ${d === tube.length - 1 ? 'top' : ''} ${isLifted(d) ? 'lifted' : ''}`}
                        style={{ '--c': friendColor(v - 1), bottom: d * 12, zIndex: d } as React.CSSProperties}
                      >
                        <span className="cs-chip-num">{v}</span>
                      </span>
                    ))}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      <div className="cs-controls">
        <button className="cs-btn cs-draw" onClick={draw}>
          🪙 {t('cs.draw')}
        </button>
        <button className="cs-btn cs-sort" onClick={autoSort}>
          ✨ {t('cs.sort')}
        </button>
        <button className="cs-btn cs-add" onClick={addTube}>
          ➕ {t('cs.addTube')}
        </button>
        <button className="cs-btn cs-undo" onClick={undo} disabled={!history.length}>
          ↩️ {t('cs.undo')}
        </button>
        <button className="cs-btn cs-restart" onClick={restart}>
          🔄 {t('cs.restart')}
        </button>
      </div>
    </GameShell>
  )
}

// a friend-coin: a round disc in the friend's colour, the small friend, a big number
function Coin({ v }: { v: number }) {
  return (
    <span className="cs-coin" style={{ '--c': friendColor(v - 1) } as React.CSSProperties}>
      <span className="cs-coin-face">
        <Friend index={v - 1} scale={0.34} showNumber={false} />
      </span>
      <span className="cs-coin-num">{v}</span>
    </span>
  )
}
