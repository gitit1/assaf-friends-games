import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playRise, playWin, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { fitScale, useViewport } from '../useViewport'
import { randInt } from './util'
import { useT } from '../i18n'

// Basketball: a friend (a number!) is the ball. Tap to shoot — it always swishes
// in (no misses, no pressure), the basket counter climbs and is counted out loud.
export default function BasketGame({ onExit }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  const [score, setScore] = useState(0)
  const [ball, setBall] = useState(() => randInt(0, 9))
  const [flying, setFlying] = useState(false)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  function shoot() {
    if (flying) return
    unlockAudio()
    setFlying(true)
    playRise(score % 8)
    timers.current.push(
      window.setTimeout(() => {
        const n = score + 1
        setScore(n)
        playWin()
        speakNumber(n)
        setFlying(false)
        setBall(randInt(0, 9)) // a fresh friend to shoot next
      }, 850),
    )
  }

  return (
    <GameShell title={t('game.basket')} emoji="🏀" onExit={onExit}>
      <div className="sport-screen">
        <div className="sport-score" aria-live="polite">
          <span aria-hidden="true">🏀</span> {score}
        </div>

        <div className="basket-court">
          <div className="basket-hoop" aria-hidden="true">
            <span className="basket-board" />
            <span className="basket-rim" />
            <span className="basket-net" />
          </div>
          <button
            className={`basket-ball ${flying ? 'is-flying' : ''}`}
            onClick={shoot}
            aria-label="לזרוק לסל"
          >
            <Friend index={ball} scale={fitScale(ball, vp, 0.32, 0.16)} showNumber />
          </button>
        </div>

        <button className="big-button" onClick={shoot} disabled={flying}>
          🏀 לזרוק!
        </button>
      </div>
    </GameShell>
  )
}
