import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playCount, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendSay } from '../friends'
import { numberWord, randInt } from './util'

// Show one friend and count its segments one-by-one out loud (1, 2, 3...),
// lighting each unit from the bottom up — then the friend wakes and cheers.
const MAX = 20 // count up to 20 (a sane spoken cap, even as the roster grows)

export default function CountGame({ onExit }: GameProps) {
  const [value, setValue] = useState(() => randInt(1, MAX))
  const [lit, setLit] = useState(0)
  const [counting, setCounting] = useState(false)

  const timers = useRef<number[]>([])
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  function startCount(n: number = value) {
    unlockAudio()
    clearTimers()
    setCounting(true)
    setLit(0)
    for (let i = 1; i <= n; i++) {
      timers.current.push(
        window.setTimeout(() => {
          setLit(i)
          playCount(i)
          speak(numberWord(i))
        }, i * 750),
      )
    }
    timers.current.push(
      window.setTimeout(
        () => {
          setCounting(false)
          playWin()
          // The friend's number is the total — then it says its name.
          speak(`${numberWord(n)}. ${friendSay(n - 1)}`)
        },
        n * 750 + 550,
      ),
    )
  }

  function newNumber() {
    clearTimers()
    setCounting(false)
    setLit(0)
    let next = randInt(1, MAX)
    if (next === value) next = value >= MAX ? 1 : value + 1
    setValue(next)
  }

  return (
    <GameShell title="סופרים" emoji="🔢" onExit={onExit}>
      <div className="friends-stage">
        <Friend index={value - 1} scale={0.9} litUnits={lit} bouncing={!counting && lit === value} />
      </div>

      <div className="count-readout" aria-hidden="true">
        {counting ? lit || '' : lit === value ? value : '👆'}
      </div>

      <div className="counting-next">
        <button className="big-button" onClick={() => startCount()} disabled={counting}>
          👆 סופרים!
        </button>
        <button className="pill" onClick={newNumber}>
          🎲 עוד
        </button>
      </div>
    </GameShell>
  )
}
