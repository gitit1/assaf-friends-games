import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendSay } from '../friends'
import { numberChoices, numberWord, randInt } from './util'

// A calm "race" quiz (no timer): every correct +/−/× answer hops a friend one
// step toward the finish flag. Wrong answers give a gentle nudge — no penalty,
// no scary sound, and the friend simply doesn't move. Reaching the flag wins.
type Op = '+' | '-' | '×'
const STEPS = 5 // correct answers needed to reach the finish line

const OPS: { id: Op; label: string; word: string }[] = [
  { id: '+', label: '➕', word: 'ועוד' },
  { id: '-', label: '➖', word: 'פחות' },
  { id: '×', label: '✖️', word: 'כפול' },
]

type Round = { a: number; b: number; answer: number; choices: number[] }

function newRound(op: Op): Round {
  let a: number
  let b: number
  if (op === '+') {
    a = randInt(1, 9)
    b = randInt(1, 9)
  } else if (op === '-') {
    a = randInt(2, 10)
    b = randInt(1, a - 1)
  } else {
    a = randInt(1, 5)
    b = randInt(1, 5)
  }
  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b
  const max = op === '×' ? 30 : 20
  return { a, b, answer, choices: numberChoices(answer, 3, 0, max) }
}

function opWord(op: Op) {
  return OPS.find((o) => o.id === op)?.word ?? ''
}

export default function MathRace({ onExit }: GameProps) {
  const [op, setOp] = useState<Op>('+')
  const [round, setRound] = useState<Round>(() => newRound('+'))
  const [step, setStep] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [racer, setRacer] = useState(() => randInt(0, FRIENDS.length - 1))

  const won = step >= STEPS

  function sayQuestion(r: Round = round) {
    speak(`${numberWord(r.a)} ${opWord(op)} ${numberWord(r.b)}?`)
  }

  // Read each new question aloud for a non-reader (respects the voice setting).
  useEffect(() => {
    if (!won) sayQuestion(round)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  function chooseOp(next: Op) {
    unlockAudio()
    setOp(next)
    setStep(0)
    setLocked(false)
    setWrong(null)
    setRacer(randInt(0, FRIENDS.length - 1))
    setRound(newRound(next))
  }

  function restart() {
    setStep(0)
    setLocked(false)
    setWrong(null)
    setRacer(randInt(0, FRIENDS.length - 1))
    setRound(newRound(op))
  }

  function answer(n: number) {
    if (locked || won) return
    unlockAudio()
    if (n === round.answer) {
      setLocked(true)
      playSuccess()
      const ns = step + 1
      setStep(ns)
      window.setTimeout(() => {
        if (ns >= STEPS) {
          playWin()
          speak(`כל הכבוד! ${friendSay(racer)}!`)
        } else {
          setRound(newRound(op))
        }
        setLocked(false)
      }, 800)
    } else {
      setWrong(n)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
  }

  const sym = op === '-' ? '−' : op
  const progress = step / STEPS

  return (
    <GameShell title="מירוץ חשבון" emoji="🏁" onExit={onExit}>
      <div className="race-ops">
        {OPS.map((o) => (
          <button key={o.id} className={`pill ${o.id === op ? 'pill-active' : ''}`} onClick={() => chooseOp(o.id)}>
            {o.label}
          </button>
        ))}
      </div>

      <div className="race-track">
        <span className="race-runner" style={{ '--p': progress } as React.CSSProperties}>
          <Friend index={racer} scale={0.38} showNumber={false} bouncing={locked || won} />
        </span>
        <span className="race-flag" aria-hidden="true">
          🏁
        </span>
      </div>

      <div className="race-progress" aria-hidden="true">
        ⭐ {step} / {STEPS}
      </div>

      {won ? (
        <div className="counting-next">
          <div className="banner banner-success" role="status">
            ניצחת! 🎉
          </div>
          <button className="big-button" onClick={restart}>
            🏁 עוד מירוץ
          </button>
        </div>
      ) : (
        <>
          <div className="math-q" dir="ltr">
            <span className="math-n">{round.a}</span>
            <span className="math-op">{sym}</span>
            <span className="math-n">{round.b}</span>
            <span className="math-eq">= ?</span>
          </div>
          <button className="pill math-say" onClick={() => sayQuestion()}>
            🔊 שמע שוב
          </button>

          <div className="math-choices">
            {round.choices.map((c) => (
              <button
                key={c}
                className={`math-choice ${wrong === c ? 'is-wrong' : ''}`}
                onClick={() => answer(c)}
                disabled={locked}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}
    </GameShell>
  )
}
