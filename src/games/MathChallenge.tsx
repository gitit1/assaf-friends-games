import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendSay } from '../friends'
import { numberWord, randInt, shuffle } from './util'

// "Math challenge" — multi-step expressions (a × b ± c) for a number-strong kid
// who already does combined operations in his head. Multiple choice, no timer,
// wrong answers give a gentle nudge. Three difficulty levels.
type Op = '+' | '-'
type Level = { label: string; maxFactor: number; maxC: number; ops: Op[] }
const LEVELS: Level[] = [
  { label: 'קל', maxFactor: 5, maxC: 5, ops: ['+'] },
  { label: 'בינוני', maxFactor: 9, maxC: 9, ops: ['+', '-'] },
  { label: 'קשה', maxFactor: 10, maxC: 12, ops: ['+', '-'] },
]

type Problem = { a: number; b: number; op: Op; c: number; answer: number; choices: number[] }

function makeChoices(answer: number): number[] {
  const set = new Set<number>([answer])
  let guard = 0
  while (set.size < 4 && guard < 300) {
    guard++
    const d = answer + randInt(1, 6) * (randInt(0, 1) === 0 ? -1 : 1)
    if (d >= 0) set.add(d)
  }
  let extra = 1
  while (set.size < 4) set.add(answer + extra++)
  return shuffle([...set])
}

function makeProblem(level: Level): Problem {
  const a = randInt(2, level.maxFactor)
  const b = randInt(2, level.maxFactor)
  const op = level.ops[randInt(0, level.ops.length - 1)]
  const prod = a * b
  const c = op === '-' ? randInt(1, Math.min(level.maxC, prod)) : randInt(1, level.maxC)
  const answer = op === '+' ? prod + c : prod - c
  return { a, b, op, c, answer, choices: makeChoices(answer) }
}

export default function MathChallenge({ onExit }: GameProps) {
  const [level, setLevel] = useState(0)
  const [problem, setProblem] = useState<Problem>(() => makeProblem(LEVELS[0]))
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [mascot] = useState(() => randInt(0, FRIENDS.length - 1))

  function say(p: Problem = problem) {
    const opw = p.op === '+' ? 'ועוד' : 'פחות'
    speak(`${numberWord(p.a)} כפול ${numberWord(p.b)} ${opw} ${numberWord(p.c)}`)
  }

  useEffect(() => {
    say(problem)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem])

  function chooseLevel(i: number) {
    unlockAudio()
    setLevel(i)
    setLocked(false)
    setWrong(null)
    setProblem(makeProblem(LEVELS[i]))
  }

  function pick(n: number) {
    if (locked) return
    unlockAudio()
    if (n === problem.answer) {
      setLocked(true)
      const ns = score + 1
      setScore(ns)
      if (ns % 5 === 0) playWin()
      else playSuccess()
      speak(`${numberWord(problem.answer)}! ${friendSay(mascot)}`)
      window.setTimeout(() => {
        setProblem(makeProblem(LEVELS[level]))
        setLocked(false)
      }, 1000)
    } else {
      setWrong(n)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
  }

  const sym = problem.op === '-' ? '−' : '+'

  return (
    <GameShell title="אתגר חשבון" emoji="🎓" onExit={onExit}>
      <div className="chal-head">
        <div className="chal-levels">
          {LEVELS.map((l, i) => (
            <button key={l.label} className={`pill ${i === level ? 'pill-active' : ''}`} onClick={() => chooseLevel(i)}>
              {l.label}
            </button>
          ))}
        </div>
        <span className="chal-score" aria-label={`ניקוד ${score}`}>
          ⭐ {score}
        </span>
      </div>

      <div className="chal-mascot" aria-hidden="true">
        <Friend index={mascot} scale={0.5} showNumber={false} bouncing={locked} />
      </div>

      <div className="math-q" dir="ltr">
        <span className="math-n">{problem.a}</span>
        <span className="math-op">×</span>
        <span className="math-n">{problem.b}</span>
        <span className="math-op">{sym}</span>
        <span className="math-n">{problem.c}</span>
        <span className="math-eq">= ?</span>
      </div>
      <button className="pill math-say" onClick={() => say()}>
        🔊 שמע שוב
      </button>

      <div className="math-choices">
        {problem.choices.map((n) => (
          <button
            key={n}
            className={`math-choice ${wrong === n ? 'is-wrong' : ''}`}
            onClick={() => pick(n)}
            disabled={locked}
          >
            {n}
          </button>
        ))}
      </div>
    </GameShell>
  )
}
