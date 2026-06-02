import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playDice, playSuccess, playTap, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendSay } from '../friends'
import { numberWord, randInt } from './util'

// "Roll a dice" — pick a dice TYPE (each a different 3D shape), add as many dice
// as fit the screen, tap to roll: they rattle, flicker, and land. The total is
// added up live and read out, and when the total is a friend (1–30) that friend
// pops up. No timer, no losing — keep rolling and adding more dice.
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

type DiceType = { key: string; label: string; sides: number; dots: boolean; color: string; shape: string }
const DICE_TYPES: DiceType[] = [
  { key: 'dots', label: '⚄', sides: 6, dots: true, color: '#eef2f7', shape: 'square' },
  { key: 'd4', label: '4', sides: 4, dots: false, color: '#fca5a5', shape: 'triangle' },
  { key: 'd6', label: '6', sides: 6, dots: false, color: '#fdba74', shape: 'square' },
  { key: 'd8', label: '8', sides: 8, dots: false, color: '#fcd34d', shape: 'diamond' },
  { key: 'd10', label: '10', sides: 10, dots: false, color: '#86efac', shape: 'kite' },
  { key: 'd12', label: '12', sides: 12, dots: false, color: '#93c5fd', shape: 'pentagon' },
  { key: 'd20', label: '20', sides: 20, dots: false, color: '#c4b5fd', shape: 'hexagon' },
]
const MIN_S = 40 // smallest a die shrinks to (drives the screen-based max count)
const GAP = 10
const SAY_EACH = 6 // up to this many dice, read the sum out as an addition sentence

// "שש ועוד ארבע ועוד ארבע, ביחד ארבע-עשרה" — each die read aloud, then the total.
function spokenAddition(vals: number[], sum: number) {
  return `${vals.map((v) => numberWord(v)).join(' ועוד ')}, ביחד ${numberWord(sum)}`
}

function Die({ value, type, size, rolling, onClick }: { value: number; type: DiceType; size: number; rolling: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`die die-${type.shape} ${rolling ? 'is-rolling' : ''} ${type.dots ? '' : 'die-num'}`}
      style={{
        width: size,
        height: size,
        fontSize: `${size}px`,
        ...(type.dots ? {} : { background: `linear-gradient(145deg, #ffffff, ${type.color})` }),
      }}
      onClick={onClick}
      aria-label="קובייה"
    >
      {type.dots ? (
        Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={`pip ${PIPS[value].includes(i) ? 'on' : ''}`} aria-hidden="true" />
        ))
      ) : (
        <span className="die-value">{value}</span>
      )}
    </button>
  )
}

export default function RollDice({ onExit }: GameProps) {
  const [typeIdx, setTypeIdx] = useState(0)
  const [values, setValues] = useState<number[]>([3, 4])
  const [rolling, setRolling] = useState(false)
  const [settled, setSettled] = useState(true)
  const [rollId, setRollId] = useState(0)

  const [win, setWin] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 360,
    h: typeof window !== 'undefined' ? window.innerHeight : 700,
  }))
  useEffect(() => {
    const onResize = () => setWin({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const interval = useRef<number | null>(null)
  const timeout = useRef<number | null>(null)
  function clearTimers() {
    if (interval.current) window.clearInterval(interval.current)
    if (timeout.current) window.clearTimeout(timeout.current)
    interval.current = null
    timeout.current = null
  }
  useEffect(() => clearTimers, [])

  const type = DICE_TYPES[typeIdx]
  const n = values.length
  const sum = values.reduce((a, b) => a + b, 0)

  // how big the dice area is, and how the dice pack into it
  const areaW = Math.min(440, win.w - 24)
  const areaH = Math.max(150, win.h * 0.36)
  const colsAt = (s: number) => Math.max(1, Math.floor((areaW + GAP) / (s + GAP)))
  const rowsAt = (s: number) => Math.max(1, Math.floor((areaH + GAP) / (s + GAP)))
  const maxDice = Math.min(40, colsAt(MIN_S) * rowsAt(MIN_S))
  // largest die size at which all n dice still fit the area
  const dieSize = (() => {
    for (let s = 80; s > MIN_S; s -= 2) if (colsAt(s) * rowsAt(s) >= n) return s
    return MIN_S
  })()

  function roll() {
    if (rolling) return
    unlockAudio()
    clearTimers()
    setSettled(false)
    setRolling(true)
    playDice()
    interval.current = window.setInterval(() => {
      setValues((vs) => vs.map(() => randInt(1, type.sides)))
    }, 90)
    timeout.current = window.setTimeout(() => {
      clearTimers()
      const final = values.map(() => randInt(1, type.sides))
      setValues(final)
      setRolling(false)
      setSettled(true)
      setRollId((r) => r + 1)
      const s = final.reduce((a, b) => a + b, 0)
      playSuccess()
      const tail = s >= 1 && s <= FRIENDS.length ? `! ${friendSay(s - 1)}` : ''
      // with a few dice, read the addition aloud ("6 ועוד 4 ועוד 4, ביחד 14");
      // with many, just the total so it doesn't drone on
      if (final.length >= 2 && final.length <= SAY_EACH) speak(`${spokenAddition(final, s)}${tail}`)
      else speak(`${numberWord(s)}${tail}`)
    }, 1000)
  }

  function addDie() {
    if (rolling || n >= maxDice) return
    playTap()
    setValues((vs) => [...vs, randInt(1, type.sides)])
    setSettled(true)
  }
  function removeDie() {
    if (rolling || n <= 1) return
    playTap()
    setValues((vs) => vs.slice(0, -1))
    setSettled(true)
  }
  function chooseType(i: number) {
    if (rolling) return
    playTap()
    setTypeIdx(i)
    setValues((vs) => vs.map(() => randInt(1, DICE_TYPES[i].sides)))
    setSettled(true)
  }

  const hasFriend = settled && !rolling && sum >= 1 && sum <= FRIENDS.length

  return (
    <GameShell title="מגלגלים קובייה" emoji="🎲" onExit={onExit}>
      <div className="roll-screen">
        <div className="dice-types">
          {DICE_TYPES.map((t, i) => (
            <button
              key={t.key}
              className={`die-type-chip ${i === typeIdx ? 'is-active' : ''}`}
              style={t.dots ? undefined : { background: t.color }}
              onClick={() => chooseType(i)}
              aria-label={t.dots ? 'קובייה עם נקודות' : `קובייה עד ${t.sides}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="dice-count">
          <button className="icon-button" onClick={removeDie} disabled={rolling || n <= 1} aria-label="פחות קוביות">
            ➖
          </button>
          <span className="dice-count-label">{n} קוביות</span>
          <button className="icon-button" onClick={addDie} disabled={rolling || n >= maxDice} aria-label="עוד קובייה">
            ➕
          </button>
        </div>

        <div className="dice-stage" style={{ maxWidth: areaW }}>
          {values.map((v, i) => (
            <Die key={i} value={v} type={type} size={dieSize} rolling={rolling} onClick={roll} />
          ))}
        </div>

        <div className="roll-result">
          {settled && !rolling && n >= 2 && n <= 12 && (
            <div className="roll-expr" dir="ltr" aria-hidden="true">
              {values.join(' + ')} = {sum}
            </div>
          )}
          <div className="roll-sum" aria-label={`סך הכל ${sum}`}>
            <span className="roll-sum-label">סך הכל</span>
            <span className="roll-sum-num">{sum}</span>
          </div>
          {hasFriend && (
            <span key={rollId} className="roll-friend is-in">
              <Friend index={sum - 1} scale={104 / friendMaxDim(sum - 1)} bouncing showNumber={false} />
            </span>
          )}
        </div>

        <button className="icon-button roll-icon" onClick={roll} disabled={rolling} aria-label="גלגלו">
          <span aria-hidden="true">🎲</span>
        </button>
      </div>
    </GameShell>
  )
}
