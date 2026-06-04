import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playRise, playWin, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { fitScale, useViewport } from '../useViewport'
import { randInt, shuffle } from './util'
import { useT } from '../i18n'
import Confetti from '../components/Confetti'

// Bowling: the 10 pins ARE friends 1–10. Roll the ball, some pins fall, and we
// COUNT how many fell (spoken in Hebrew). No gutter, no fail — every roll counts.
const ROWS = [1, 2, 3, 4] // triangle: 1+2+3+4 = 10 pins

export default function BowlingGame({ onExit }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  const [down, setDown] = useState<boolean[]>(() => Array(10).fill(false))
  const [rolling, setRolling] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const [party, setParty] = useState(false)
  const timers = useRef<number[]>([])
  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(() => clear, [])

  function roll() {
    if (rolling) return
    unlockAudio()
    clear()
    setRolling(true)
    setCount(null)
    setDown(Array(10).fill(false))
    // how many fall — biased toward "lots" (more satisfying), full 1–10 range
    const n = Math.max(randInt(1, 10), randInt(1, 10))
    const order = shuffle([...Array(10).keys()])
    const falling = new Set(order.slice(0, n))
    timers.current.push(
      window.setTimeout(() => {
        setDown(Array.from({ length: 10 }, (_, i) => falling.has(i)))
        playRise(3)
      }, 650),
    )
    timers.current.push(
      window.setTimeout(() => {
        setCount(n)
        playWin()
        speakNumber(n)
        setRolling(false)
        setParty(true)
        timers.current.push(window.setTimeout(() => setParty(false), 2200))
      }, 1200),
    )
  }

  function reset() {
    clear()
    setRolling(false)
    setCount(null)
    setDown(Array(10).fill(false))
  }

  let pin = 0
  return (
    <GameShell title={t('game.bowling')} emoji="🎳" onExit={onExit}>
      <Confetti active={party} />
      <div className="sport-screen">
        <div className="sport-score" aria-live="polite">
          {count === null ? '🎳' : t('bowl.knocked', { n: count })}
        </div>

        <div className="bowl-lane">
          <div className="bowl-pins">
            {ROWS.map((c, r) => (
              <div className="bowl-row" key={r}>
                {Array.from({ length: c }).map(() => {
                  const i = pin++
                  return (
                    <span className={`bowl-pin ${down[i] ? 'is-down' : ''}`} key={i}>
                      <Friend index={i} scale={fitScale(i, vp, 0.13, 0.1)} showNumber />
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
          <span className={`bowl-ball ${rolling ? 'is-rolling' : ''}`} aria-hidden="true" />
        </div>

        <div className="sport-buttons">
          <button className="big-button" onClick={roll} disabled={rolling}>
            🎳 {t('bowl.roll')}
          </button>
          <button className="pill" onClick={reset}>
            ↺ {t('seq.again')}
          </button>
        </div>
      </div>
    </GameShell>
  )
}
