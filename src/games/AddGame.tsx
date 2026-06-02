import { useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playRise, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendSay } from '../friends'
import { numberWord, randInt } from './util'
import { fitScale, useViewport } from '../useViewport'

// A target number is shown as an empty outline; tap to add one segment at a
// time, building the friend up from the bottom until it's complete and wakes.
const MAX = 30 // build up to 30 — the whole current roster (friends 1–30)

export default function AddGame({ onExit }: GameProps) {
  const [target, setTarget] = useState(() => randInt(2, MAX))
  const [built, setBuilt] = useState(0)
  const [pop, setPop] = useState(false) // a quick "merge" jump each time a cube joins
  const popTimer = useRef<number | undefined>(undefined)
  const vp = useViewport()

  const done = built === target

  function bump() {
    setPop(true)
    window.clearTimeout(popTimer.current)
    popTimer.current = window.setTimeout(() => setPop(false), 300)
  }
  // place value: how many full tens, and the leftover ones (a ten-frame)
  const tens = Math.floor(built / 10)
  const ones = built % 10

  function addOne() {
    if (built >= target) return
    unlockAudio()
    const next = built + 1
    setBuilt(next)
    bump()
    if (next === target) {
      playWin()
      speak(`${numberWord(target)}! בנית את ${friendSay(target - 1)}!`)
    } else {
      playRise(next - 1) // each cube climbs the scale → building sings
      speak(numberWord(next))
    }
  }

  function removeOne() {
    if (built === 0) return
    playTap()
    setBuilt(built - 1)
  }

  function newTarget() {
    setBuilt(0)
    let next = randInt(2, MAX)
    if (next === target) next = target >= MAX ? 2 : target + 1
    setTarget(next)
  }

  return (
    <GameShell title="מוסיפים" emoji="➕" onExit={onExit}>
      <p className="count-target" aria-hidden="true">
        בנו את <strong>{target}</strong>
      </p>

      <div className="friends-stage">
        <Friend index={target - 1} scale={fitScale(target - 1, vp, 0.8, 0.42)} litUnits={built} bouncing={done || pop} />
      </div>

      {/* same number a second way: tens as "10" tiles + ones in a ten-frame, so
          the carry from 9→10 is visible (place value) */}
      <div className="pv" aria-hidden="true">
        <div className="pv-tens">
          {Array.from({ length: tens }).map((_, i) => (
            <span className="pv-ten" key={i}>
              10
            </span>
          ))}
        </div>
        <div className="pv-ones">
          {Array.from({ length: 10 }).map((_, i) => (
            <span className={`pv-one ${i < ones ? 'on' : ''}`} key={i} />
          ))}
        </div>
      </div>

      {done ? (
        <div className="counting-next">
          <div className="banner banner-success" role="status">
            {target} 🎉
          </div>
          <button className="big-button" onClick={newTarget}>
            ✨ עוד
          </button>
        </div>
      ) : (
        <div className="counting-next">
          <button className="big-button" onClick={addOne}>
            ➕ עוד קוביה
          </button>
          <div className="reward-mini-controls">
            <span className="reward-total">
              {built} / {target}
            </span>
            <button className="pill pill-small" onClick={removeOne} aria-label="הסרת קוביה">
              ➖
            </button>
          </div>
        </div>
      )}
    </GameShell>
  )
}
