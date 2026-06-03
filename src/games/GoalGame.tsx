import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playRise, playWin, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { fitScale, useViewport } from '../useViewport'
import { randInt } from './util'
import { useT } from '../i18n'

// Soccer: kick the friend-ball into the goal. Always a goal (no keeper to beat,
// no misses) — every kick scores, the count climbs and is spoken in Hebrew.
export default function GoalGame({ onExit }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  const [score, setScore] = useState(0)
  const [ball, setBall] = useState(() => randInt(0, 9))
  const [kicking, setKicking] = useState(false)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  function kick() {
    if (kicking) return
    unlockAudio()
    setKicking(true)
    playRise(score % 8)
    timers.current.push(
      window.setTimeout(() => {
        const n = score + 1
        setScore(n)
        playWin()
        speakNumber(n)
        setKicking(false)
        setBall(randInt(0, 9))
      }, 800),
    )
  }

  return (
    <GameShell title={t('game.goal')} emoji="⚽" onExit={onExit}>
      <div className="sport-screen">
        <div className="sport-score" aria-live="polite">
          <span aria-hidden="true">⚽</span> {score}
        </div>

        <div className="goal-field">
          <div className="goal-net" aria-hidden="true">
            <span className="goal-post l" />
            <span className="goal-post r" />
            <span className="goal-bar" />
            <span className="goal-mesh" />
          </div>
          <button
            className={`goal-ball ${kicking ? 'is-kicking' : ''}`}
            onClick={kick}
            aria-label="לבעוט לשער"
          >
            <Friend index={ball} scale={fitScale(ball, vp, 0.3, 0.15)} showNumber />
          </button>
        </div>

        <button className="big-button" onClick={kick} disabled={kicking}>
          ⚽ לבעוט!
        </button>
      </div>
    </GameShell>
  )
}
