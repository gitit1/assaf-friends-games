import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playRise, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendSay } from '../friends'
import { numberWordNiqqud, randInt } from './util'
import { fitScale, useViewport } from '../useViewport'

// Show one friend and count its blocks out loud, lighting them up. Like the
// Numberblocks "Step Squad": you can count by 1 / 2 / 5 / 10, go up or down, and
// pick the pace. No timer, no pressure — the friend wakes and cheers at the end.
const MAX = 30
const STEPS = [1, 2, 5, 10]
const SPEEDS: { label: string; ms: number }[] = [
  { label: 'איטי', ms: 950 },
  { label: 'רגיל', ms: 620 },
  { label: 'מהיר', ms: 380 },
]

export default function CountGame({ onExit }: GameProps) {
  const [value, setValue] = useState(() => randInt(1, MAX))
  const [lit, setLit] = useState(0)
  const [counting, setCounting] = useState(false)
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState<'up' | 'down'>('up')
  const [speed, setSpeed] = useState(SPEEDS[1].ms)
  const vp = useViewport()

  const timers = useRef<number[]>([])
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  function startCount() {
    unlockAudio()
    clearTimers()
    setCounting(true)
    const n = value
    // the sequence of "how many are lit" at each beat
    const seq: number[] = []
    if (dir === 'up') {
      setLit(0)
      for (let v = step; v < n; v += step) seq.push(v)
      seq.push(n)
    } else {
      setLit(n)
      speak(numberWordNiqqud(n))
      for (let v = n - step; v > 0; v -= step) seq.push(v)
      seq.push(0)
    }

    seq.forEach((litVal, idx) => {
      timers.current.push(
        window.setTimeout(() => {
          setLit(litVal)
          playRise(idx) // climbing notes → the count sings
          if (litVal > 0) speak(numberWordNiqqud(litVal))
        }, (idx + 1) * speed),
      )
    })

    timers.current.push(
      window.setTimeout(
        () => {
          setCounting(false)
          playWin()
          speak(dir === 'up' ? `${numberWordNiqqud(n)}. ${friendSay(n - 1)}` : friendSay(n - 1))
        },
        (seq.length + 1) * speed + 250,
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
        <Friend index={value - 1} scale={fitScale(value - 1, vp, 0.8, 0.42)} litUnits={lit} bouncing={!counting && lit === value} />
      </div>

      <div className="count-readout" aria-hidden="true">
        {counting ? lit : lit === value ? value : '👆'}
      </div>

      <div className="count-opts">
        <div className="count-opt-row">
          <span className="count-opt-label">קפיצות</span>
          {STEPS.map((s) => (
            <button key={s} className={`pill pill-small ${step === s ? 'pill-active' : ''}`} onClick={() => setStep(s)} disabled={counting}>
              {s}
            </button>
          ))}
        </div>
        <div className="count-opt-row">
          <button
            className="pill pill-small"
            onClick={() => setDir((d) => (d === 'up' ? 'down' : 'up'))}
            disabled={counting}
          >
            {dir === 'up' ? '⬆️ עולה' : '⬇️ יורד'}
          </button>
          {SPEEDS.map((sp) => (
            <button key={sp.ms} className={`pill pill-small ${speed === sp.ms ? 'pill-active' : ''}`} onClick={() => setSpeed(sp.ms)} disabled={counting}>
              {sp.label}
            </button>
          ))}
        </div>
      </div>

      <div className="counting-next">
        <button className="big-button" onClick={startCount} disabled={counting}>
          👆 סופרים!
        </button>
        <button className="pill" onClick={newNumber}>
          🎲 עוד
        </button>
      </div>
    </GameShell>
  )
}
