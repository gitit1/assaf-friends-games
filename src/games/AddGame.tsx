import { useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playCount, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendSay } from '../friends'
import { numberWord, randInt } from './util'

// A target number is shown as an empty outline; tap to add one segment at a
// time, building the friend up from the bottom until it's complete and wakes.
const MAX = 20 // build up to 20 (a sane cap, even as the roster grows)

export default function AddGame({ onExit }: GameProps) {
  const [target, setTarget] = useState(() => randInt(2, MAX))
  const [built, setBuilt] = useState(0)

  const done = built === target

  function addOne() {
    if (built >= target) return
    unlockAudio()
    const next = built + 1
    setBuilt(next)
    if (next === target) {
      playWin()
      speak(`${numberWord(target)}! בנית את ${friendSay(target - 1)}!`)
    } else {
      playCount(next)
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
        <Friend index={target - 1} scale={0.9} litUnits={built} bouncing={done} />
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
