import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playDice, playSuccess, playTap, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendSay } from '../friends'
import { numberWord, randInt } from './util'

// "Roll a dice" — pick a dice TYPE, add as many dice as you like, tap to roll:
// they rattle, flicker, and land. The total is added up live and read out, and
// when the total is a friend (1–30) that friend pops up. No timer, no losing —
// just keep rolling and adding more dice.
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

type DiceType = { key: string; label: string; sides: number; dots: boolean; color: string }
const DICE_TYPES: DiceType[] = [
  { key: 'dots', label: '⚄', sides: 6, dots: true, color: '#ffffff' },
  { key: 'n6', label: '6', sides: 6, dots: false, color: '#fca5a5' },
  { key: 'n10', label: '10', sides: 10, dots: false, color: '#93c5fd' },
  { key: 'n12', label: '12', sides: 12, dots: false, color: '#86efac' },
  { key: 'n20', label: '20', sides: 20, dots: false, color: '#fcd34d' },
]
const MIN_DICE = 1
const MAX_DICE = 6

function Die({ value, type, rolling, onClick }: { value: number; type: DiceType; rolling: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`die ${rolling ? 'is-rolling' : ''} ${type.dots ? '' : 'die-num'}`}
      style={type.dots ? undefined : { background: `linear-gradient(150deg, #ffffff, ${type.color})` }}
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
      if (s >= 1 && s <= FRIENDS.length) speak(`${numberWord(s)}! ${friendSay(s - 1)}`)
      else speak(numberWord(s))
    }, 1000)
  }

  function addDie() {
    if (rolling || n >= MAX_DICE) return
    playTap()
    setValues((vs) => [...vs, randInt(1, type.sides)])
    setSettled(true)
  }
  function removeDie() {
    if (rolling || n <= MIN_DICE) return
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
          <button className="icon-button" onClick={removeDie} disabled={rolling || n <= MIN_DICE} aria-label="פחות קוביות">
            ➖
          </button>
          <span className="dice-count-label">{n} קוביות</span>
          <button className="icon-button" onClick={addDie} disabled={rolling || n >= MAX_DICE} aria-label="עוד קובייה">
            ➕
          </button>
        </div>

        <div className="dice-stage">
          {values.map((v, i) => (
            <Die key={i} value={v} type={type} rolling={rolling} onClick={roll} />
          ))}
        </div>

        <div className="roll-result">
          <div className="roll-sum" aria-label={`סך הכל ${sum}`}>
            <span className="roll-sum-label">סך הכל</span>
            <span className="roll-sum-num">{sum}</span>
          </div>
          {hasFriend && (
            <span key={rollId} className="roll-friend is-in">
              <Friend index={sum - 1} scale={110 / friendMaxDim(sum - 1)} bouncing showNumber={false} />
            </span>
          )}
        </div>

        <button className="big-button roll-button" onClick={roll} disabled={rolling}>
          🎲 גלגלו!
        </button>
      </div>
    </GameShell>
  )
}
