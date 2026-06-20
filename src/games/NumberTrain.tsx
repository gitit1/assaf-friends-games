import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import type { GameProps } from './registry'
import { playPop, playSuccess, playNudge, unlockAudio } from '../audio'
import { randInt } from './util'
import { useT } from '../i18n'

// Number train: build the train by tapping the number CARS in order — 1, 2, 3 …
// The next car needed is shown as a faded slot, so it teaches what comes next.
// When the train is complete it chugs off. No timer, no fail — a wrong number
// just nudges gently.
const CAR = ['#ef4444', '#f59e0b', '#fbbf24', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
function shuffled(n: number) {
  const a = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function NumberTrain({ onExit }: GameProps) {
  const { t } = useT()
  const [len, setLen] = useState(() => randInt(4, 7))
  const [placed, setPlaced] = useState<number[]>([])
  const [choices, setChoices] = useState<number[]>(() => shuffled(len))
  const [done, setDone] = useState(false)
  const [built, setBuilt] = useState(0)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  const next = placed.length + 1

  function newRound() {
    const n = randInt(4, 7)
    setLen(n)
    setPlaced([])
    setChoices(shuffled(n))
    setDone(false)
  }

  function tap(num: number) {
    if (done) return
    unlockAudio()
    if (num !== next) {
      playNudge() // gentle — which number comes next?
      return
    }
    playPop()
    const nowPlaced = [...placed, num]
    setPlaced(nowPlaced)
    setChoices((c) => c.filter((x) => x !== num))
    if (nowPlaced.length === len) {
      // the train is complete — it chugs off, then a fresh train
      timers.current.push(window.setTimeout(() => { setDone(true); playSuccess() }, 250))
      timers.current.push(window.setTimeout(() => setBuilt((b) => b + 1), 400))
      timers.current.push(window.setTimeout(newRound, 2000))
    }
  }

  return (
    <GameShell title={t('game.train')} emoji="🚂" onExit={onExit}>
      <div className="train-screen">
        <span className="train-score" aria-hidden="true">🚂 {built}</span>

        <div className="train-wrap">
          <div className={`train-track ${done ? 'go' : ''}`}>
            <span className="train-engine" aria-hidden="true">🚂</span>
            {placed.map((n) => (
              <span key={n} className="train-car" style={{ background: CAR[(n - 1) % CAR.length] }}>
                {n}
              </span>
            ))}
            {!done && placed.length < len && (
              <span className="train-slot" aria-hidden="true">{next}</span>
            )}
          </div>
          <span className="train-rail" aria-hidden="true" />
        </div>

        <div className="train-choices">
          {choices.map((n) => (
            <button key={n} className="train-num" onClick={() => tap(n)} style={{ background: CAR[(n - 1) % CAR.length] }}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  )
}
