import { useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import Confetti from '../components/Confetti'
import type { GameProps } from './registry'
import { playNudge, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendSay } from '../friends'
import { numberWord, randInt } from './util'
import { fitScale, useViewport } from '../useViewport'
import { useT } from '../i18n'
import { numberMax } from '../level'

// "The missing number": a + ? = c — find the friend that fills the blank. Unlike
// "Build a Number" (which computes a result), here the RESULT is given and an
// addend is hidden, so it's the reverse / algebraic step. Tap the right friend →
// it fills the slot and celebrates. Wrong tap just wiggles — no fail, no timer.
type Puzzle = { a: number; b: number; c: number; missing: 'a' | 'b'; answer: number; choices: number[] }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makePuzzle(prev?: number): Puzzle {
  const hi = Math.max(4, Math.min(18, numberMax())) // result stays within the level
  let c = randInt(4, hi)
  if (c === prev) c = c >= hi ? 4 : c + 1
  const a = randInt(1, c - 1)
  const b = c - a
  const missing: 'a' | 'b' = Math.random() < 0.5 ? 'a' : 'b'
  const answer = missing === 'a' ? a : b
  // two distractors near the answer, valid (1..c-1), distinct
  const pool = [answer - 2, answer - 1, answer + 1, answer + 2].filter((n) => n >= 1 && n <= c - 1 && n !== answer)
  const choices = shuffle([answer, ...shuffle(pool).slice(0, 2)])
  return { a, b, c, missing, answer, choices }
}

export default function MissingNumber({ onExit }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  const [puz, setPuz] = useState<Puzzle>(() => makePuzzle())
  const [solved, setSolved] = useState(false)
  const [wrong, setWrong] = useState<number | null>(null)

  function pick(n: number) {
    if (solved) return
    unlockAudio()
    if (n === puz.answer) {
      setSolved(true)
      playWin()
      speak(`${numberWord(puz.answer)}! ${friendSay(puz.answer - 1)}!`)
    } else {
      setWrong(n)
      playNudge() // gentle wiggle, never a "wrong" penalty
      window.setTimeout(() => setWrong((w) => (w === n ? null : w)), 520)
    }
  }
  function next() {
    setSolved(false)
    setWrong(null)
    setPuz(makePuzzle(puz.c))
  }

  // an operand slot: shows its friend, or a "?" box while it's the hidden one
  const slot = (which: 'a' | 'b') => {
    const value = which === 'a' ? puz.a : puz.b
    const hidden = puz.missing === which && !solved
    if (hidden) return <span className="miss-q">?</span>
    return (
      <span className="miss-friend">
        <Friend index={value - 1} scale={fitScale(value - 1, vp, 0.18, 0.16)} showNumber lively />
        <span className="miss-num">{value}</span>
      </span>
    )
  }

  return (
    <GameShell title={t('game.missing')} emoji="❓" onExit={onExit}>
      <Confetti active={solved} />
      <p className="count-target" aria-hidden="true">
        {t('missing.prompt')}
      </p>

      {/* the equation reads left-to-right (maths), in both languages */}
      <div className="miss-eq" dir="ltr">
        {slot('a')}
        <span className="miss-op">+</span>
        {slot('b')}
        <span className="miss-op">=</span>
        <span className="miss-friend">
          <Friend index={puz.c - 1} scale={fitScale(puz.c - 1, vp, 0.18, 0.16)} showNumber bouncing={solved} lively />
          <span className="miss-num">{puz.c}</span>
        </span>
      </div>

      {!solved ? (
        <div className="miss-choices">
          {puz.choices.map((n) => (
            <button
              key={n}
              className={`miss-choice ${wrong === n ? 'is-wrong' : ''}`}
              onClick={() => pick(n)}
              aria-label={String(n)}
            >
              <Friend index={n - 1} scale={fitScale(n - 1, vp, 0.16, 0.12)} showNumber lively />
              <span className="miss-num">{n}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="counting-next">
          <button className="big-button" onClick={next}>
            🔄 {t('missing.new')}
          </button>
        </div>
      )}
    </GameShell>
  )
}
