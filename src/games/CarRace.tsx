import { useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import Stepper from '../components/Stepper'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendColor, friendName } from '../friends'
import { numberChoices, randInt } from './util'

// "Garage + race" — first build a car (driver friend + colour), then race a
// (slow) rival by solving maths. Every correct answer drives YOU forward. NO
// timer — take all the time you like; a wrong answer just doesn't move you.
const CAR_COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#111827']
const LEVELS = [
  { name: 'קל' },
  { name: 'בינוני' },
  { name: 'אלוף' },
]
const WIN = 6 // correct answers to reach the finish

function makeProblem(level: number) {
  let text: string
  let ans: number
  if (level === 0) {
    const a = randInt(2, 9)
    const b = randInt(1, 9)
    if (Math.random() < 0.5 && a >= b) {
      text = `${a} − ${b}`
      ans = a - b
    } else {
      text = `${a} + ${b}`
      ans = a + b
    }
  } else if (level === 1) {
    const a = randInt(2, 9)
    const b = randInt(2, 9)
    text = `${a} × ${b}`
    ans = a * b
  } else {
    const a = randInt(2, 6)
    const b = randInt(2, 6)
    const c = randInt(1, 9)
    if (Math.random() < 0.4 && a * b > c) {
      text = `${a} × ${b} − ${c}`
      ans = a * b - c
    } else {
      text = `${a} × ${b} + ${c}`
      ans = a * b + c
    }
  }
  return { text, ans, choices: numberChoices(ans, 3, Math.max(0, ans - 6), ans + 6) }
}

function Car({ color, driver }: { color: string; driver: number }) {
  return (
    <span className="car" style={{ '--car': color } as React.CSSProperties}>
      <span className="car-driver">
        <Friend index={driver} scale={50 / friendMaxDim(driver)} showNumber={false} />
      </span>
      <span className="car-body" aria-hidden="true" />
      <span className="car-stripe" aria-hidden="true" />
      <span className="car-light" aria-hidden="true" />
      <span className="car-wheel l" aria-hidden="true" />
      <span className="car-wheel r" aria-hidden="true" />
    </span>
  )
}

export default function CarRace({ onExit }: GameProps) {
  const [phase, setPhase] = useState<'garage' | 'race'>('garage')
  const [driver, setDriver] = useState(() => randInt(0, FRIENDS.length - 1))
  const [carColor, setCarColor] = useState<string>(() => friendColor(driver))
  const [level, setLevel] = useState(1)

  const [rival, setRival] = useState({ driver: 0, color: '#111827' })
  const [playerProg, setPlayerProg] = useState(0)
  const [rivalProg, setRivalProg] = useState(0)
  const [problem, setProblem] = useState(() => makeProblem(1))
  const [wrong, setWrong] = useState<number | null>(null)
  const [result, setResult] = useState<null | 'win' | 'lose'>(null)

  function startRace() {
    unlockAudio()
    playTap()
    let r = randInt(0, FRIENDS.length - 1)
    if (r === driver) r = (r + 1) % FRIENDS.length
    let rc = CAR_COLORS[randInt(0, CAR_COLORS.length - 1)]
    if (rc === carColor) rc = CAR_COLORS[(CAR_COLORS.indexOf(rc) + 1) % CAR_COLORS.length]
    setRival({ driver: r, color: rc })
    setPlayerProg(0)
    setRivalProg(0)
    setResult(null)
    setProblem(makeProblem(level))
    setPhase('race')
  }

  function raceAgain() {
    playTap()
    setPlayerProg(0)
    setRivalProg(0)
    setResult(null)
    setProblem(makeProblem(level))
  }

  function answer(choice: number) {
    if (result) return
    unlockAudio()
    const correct = choice === problem.ans
    const nextRival = rivalProg + 1 / (WIN + 5) // rival is slower than a steady stream of correct answers
    if (correct) {
      const np = playerProg + 1 / WIN
      if (np >= 1) {
        setPlayerProg(1)
        setResult('win')
        playWin()
        speak('ניצחת!')
        return
      }
      setPlayerProg(np)
      playSuccess()
      setProblem(makeProblem(level))
    } else {
      setWrong(choice)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
    if (nextRival >= 1 && !correct) {
      setRivalProg(1)
      setResult('lose')
      speak('כמעט! עוד פעם?')
      return
    }
    setRivalProg(nextRival)
  }

  if (phase === 'garage') {
    return (
      <GameShell title="מוסך ומרוץ" emoji="🏎️" onExit={onExit}>
        <div className="garage">
          <p className="garage-title">בנו את המכונית! 🔧</p>
          <div className="garage-preview">
            <Car color={carColor} driver={driver} />
          </div>

          <Stepper
            label={`נהג: ${friendName(driver)}`}
            onPrev={() => setDriver((d) => (d + FRIENDS.length - 1) % FRIENDS.length)}
            onNext={() => setDriver((d) => (d + 1) % FRIENDS.length)}
          />

          <div className="garage-colors">
            {CAR_COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${carColor === c ? 'is-active' : ''}`}
                style={{ background: c }}
                onClick={() => {
                  playTap()
                  setCarColor(c)
                }}
                aria-label="צבע מכונית"
              />
            ))}
          </div>

          <div className="garage-levels">
            {LEVELS.map((l, i) => (
              <button
                key={l.name}
                className={`pill ${level === i ? 'pill-active' : ''}`}
                onClick={() => {
                  playTap()
                  setLevel(i)
                }}
              >
                {l.name}
              </button>
            ))}
          </div>

          <button className="big-button" onClick={startRace}>
            🏁 למרוץ!
          </button>
        </div>
      </GameShell>
    )
  }

  return (
    <GameShell title="מרוץ מכוניות" emoji="🏎️" onExit={onExit}>
      <div className="race">
        <div className="race-top">
          <button className="pill" onClick={() => setPhase('garage')}>
            🔧 מוסך
          </button>
          <span className="race-level">רמה: {LEVELS[level].name}</span>
        </div>

        <div className="race-track">
          <span className="race-finish" aria-hidden="true" />
          <span className="race-car rival" style={{ left: `${rivalProg * 80}%` }}>
            <Car color={rival.color} driver={rival.driver} />
          </span>
          <span className={`race-car player ${result === 'win' ? 'is-win' : ''}`} style={{ left: `${playerProg * 80}%` }}>
            <Car color={carColor} driver={driver} />
          </span>
        </div>

        {result ? (
          <div className="race-result">
            <p className="race-result-text">{result === 'win' ? 'ניצחת! 🏁🎉' : 'כמעט! עוד פעם?'}</p>
            <div className="race-result-btns">
              <button className="big-button" onClick={raceAgain}>
                🔁 עוד מרוץ
              </button>
              <button className="pill" onClick={() => setPhase('garage')}>
                🔧 מוסך
              </button>
            </div>
          </div>
        ) : (
          <div className="race-q">
            <span className="race-expr" dir="ltr">
              {problem.text} =
            </span>
            <div className="race-choices">
              {problem.choices.map((n) => (
                <button key={n} className={`race-choice ${wrong === n ? 'is-wrong' : ''}`} onClick={() => answer(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </GameShell>
  )
}
