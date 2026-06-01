import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playDice, playSuccess, playTap, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendSay } from '../friends'
import { numberWord, randInt } from './util'

// "Roll a dice" — tap the die (or the big button) to roll: it rattles, the
// faces flicker, then it lands on a number. The friend that IS that number
// pops up to say hello. With two dice you also get the sum (a little addition).
// No timer, no losing — just an endless, satisfying roll.
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function Die({ value, rolling, onClick }: { value: number; rolling: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`die ${rolling ? 'is-rolling' : ''}`} onClick={onClick} aria-label="קובייה">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={`pip ${PIPS[value].includes(i) ? 'on' : ''}`} aria-hidden="true" />
      ))}
    </button>
  )
}

export default function RollDice({ onExit }: GameProps) {
  const [count, setCount] = useState(1) // 1 or 2 dice
  const [values, setValues] = useState<number[]>([6])
  const [rolling, setRolling] = useState(false)
  const [revealed, setRevealed] = useState(true)
  const [rollId, setRollId] = useState(0) // bumps each settle so the reveal re-animates

  const interval = useRef<number | null>(null)
  const timeout = useRef<number | null>(null)
  function clearTimers() {
    if (interval.current) window.clearInterval(interval.current)
    if (timeout.current) window.clearTimeout(timeout.current)
    interval.current = null
    timeout.current = null
  }
  useEffect(() => clearTimers, [])

  const sum = values.reduce((a, b) => a + b, 0)

  function roll() {
    if (rolling) return
    unlockAudio()
    clearTimers()
    setRevealed(false)
    setRolling(true)
    playDice()
    // flicker through random faces while "tumbling"
    interval.current = window.setInterval(() => {
      setValues(Array.from({ length: count }, () => randInt(1, 6)))
    }, 90)
    timeout.current = window.setTimeout(() => {
      clearTimers()
      const final = Array.from({ length: count }, () => randInt(1, 6))
      setValues(final)
      setRolling(false)
      setRevealed(true)
      setRollId((r) => r + 1)
      const s = final.reduce((a, b) => a + b, 0)
      playSuccess()
      if (count === 1) {
        speak(`${numberWord(final[0])}! ${friendSay(final[0] - 1)}`)
      } else {
        speak(`${numberWord(final[0])} ועוד ${numberWord(final[1])}, ${numberWord(s)}! ${friendSay(s - 1)}`)
      }
    }, 1000)
  }

  function setDice(c: number) {
    if (rolling) return
    playTap()
    clearTimers()
    setCount(c)
    setValues(Array.from({ length: c }, () => 6))
    setRevealed(true)
  }

  const friendIdx = sum - 1
  const friendScale = 150 / friendMaxDim(friendIdx)

  return (
    <GameShell title="מגלגלים קובייה" emoji="🎲" onExit={onExit}>
      <div className="roll-screen">
        <div className="roll-toggle">
          <button className={`pill ${count === 1 ? 'pill-active' : ''}`} onClick={() => setDice(1)}>
            🎲 אחת
          </button>
          <button className={`pill ${count === 2 ? 'pill-active' : ''}`} onClick={() => setDice(2)}>
            🎲🎲 שתיים
          </button>
        </div>

        <div className="dice-stage">
          {values.map((v, i) => (
            <Die key={i} value={v} rolling={rolling} onClick={roll} />
          ))}
        </div>

        <div className="roll-result">
          {revealed && !rolling && (
            <>
              {count === 2 && (
                <p className="roll-eq" aria-hidden="true">
                  {values[0]} <span className="roll-op">+</span> {values[1]} <span className="roll-op">=</span> {sum}
                </p>
              )}
              <span key={rollId} className="roll-friend is-in">
                <Friend index={friendIdx} scale={friendScale} bouncing showNumber />
              </span>
            </>
          )}
        </div>

        <button className="big-button roll-button" onClick={roll} disabled={rolling}>
          🎲 גלגלו!
        </button>
      </div>
    </GameShell>
  )
}
