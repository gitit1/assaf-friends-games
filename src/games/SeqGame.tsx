import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playFriend, playNudge, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendSay } from '../friends'
import { numberWord, randInt, shuffle } from './util'

// "Missing friend in the sequence" — a run of friends follows a rule (counting,
// jumps, times-tables, doubling) with one gap; pick the friend that completes
// it. A 💡 hint teaches the rule step by step (e.g. 1×2=2 → 2×2=4 → 3×2=?), so
// the child learns rather than guesses. No timer; wrong = gentle nudge. Values
// stay within the roster so each term is a real friend (grows toward 100).
const LEN = 4
const MAXN = FRIENDS.length

type SeqType = 'add' | 'mult' | 'geo'
type Round = { terms: number[]; gapPos: number; type: SeqType; step: number; choices: number[] }

const LEVELS = ['קל', 'רגיל', 'קשה', 'אתגר']

function buildTerms(type: SeqType, start: number, step: number): number[] {
  return Array.from({ length: LEN }, (_, i) =>
    type === 'geo' ? start * step ** i : type === 'mult' ? (i + 1) * step : start + i * step,
  )
}

function pickConfig(level: number): { type: SeqType; start: number; step: number } {
  const maxN = Math.floor(MAXN / LEN) // biggest times-table that fits (≥×2)
  if (level === 0) return { type: 'add', start: randInt(1, MAXN - 3), step: 1 }
  if (level === 1) {
    const step = [1, -1, 2, -2][randInt(0, 3)]
    const start = step > 0 ? randInt(1, MAXN - 3 * step) : randInt(1 - 3 * step, MAXN)
    return { type: 'add', start, step }
  }
  if (level === 2) {
    const kind = randInt(0, 2)
    if (kind === 0) {
      const step = [2, 3, -2, -3][randInt(0, 3)]
      const start = step > 0 ? randInt(1, MAXN - 3 * step) : randInt(1 - 3 * step, MAXN)
      return { type: 'add', start, step }
    }
    if (kind === 1) return { type: 'mult', start: randInt(2, Math.max(2, maxN)), step: randInt(2, Math.max(2, maxN)) }
    return { type: 'geo', start: randInt(1, 2), step: 2 }
  }
  // level 3 (אתגר) — multiplicative reasoning
  if (randInt(0, 2) === 2) return { type: 'geo', start: randInt(1, 2), step: 2 }
  const n = randInt(2, Math.max(2, maxN))
  return { type: 'mult', start: n, step: n }
}

function pickChoices(missing: number, terms: number[], count: number): number[] {
  const visible = new Set(terms)
  const set = new Set<number>([missing])
  let guard = 0
  while (set.size < count + 1 && guard < 300) {
    guard++
    const d = missing + randInt(1, 3) * (randInt(0, 1) === 0 ? -1 : 1)
    if (d >= 1 && d <= MAXN && !visible.has(d)) set.add(d)
  }
  for (let n = 1; n <= MAXN && set.size < count + 1; n++) if (n === missing || !visible.has(n)) set.add(n)
  return shuffle([...set])
}

function genRound(level: number): Round {
  for (let t = 0; t < 300; t++) {
    const { type, start, step } = pickConfig(level)
    const terms = buildTerms(type, start, step)
    if (terms.every((v) => v >= 1 && v <= MAXN) && new Set(terms).size === LEN) {
      const gapPos = randInt(1, LEN - 1)
      return { terms, gapPos, type, step, choices: pickChoices(terms[gapPos], terms, level === 3 ? 3 : 2) }
    }
  }
  const start = randInt(1, MAXN - 3)
  const terms = [start, start + 1, start + 2, start + 3]
  const gapPos = randInt(1, LEN - 1)
  return { terms, gapPos, type: 'add', step: 1, choices: pickChoices(terms[gapPos], terms, 2) }
}

type HintLine = { text: string; say: string }
function hintLines(r: Round): HintLine[] {
  const g = r.gapPos
  if (r.type === 'mult') {
    const n = r.step
    const lines: HintLine[] = []
    for (let i = 1; i <= g + 1; i++) {
      lines.push(
        i < g + 1
          ? { text: `${i} × ${n} = ${i * n}`, say: `${numberWord(i)} כפול ${numberWord(n)} שווה ${numberWord(i * n)}` }
          : { text: `${i} × ${n} = ?`, say: `${numberWord(i)} כפול ${numberWord(n)}?` },
      )
    }
    return lines
  }
  const prev = r.terms[g - 1]
  if (r.type === 'geo') {
    return [
      { text: `כל פעם × ${r.step}`, say: `כל פעם כפול ${numberWord(r.step)}` },
      { text: `${prev} × ${r.step} = ?`, say: `${numberWord(prev)} כפול ${numberWord(r.step)}?` },
    ]
  }
  const ad = Math.abs(r.step)
  const word = r.step >= 0 ? 'ועוד' : 'פחות'
  const sign = r.step >= 0 ? '+' : '−'
  return [
    { text: `כל פעם ${sign} ${ad}`, say: `כל פעם ${word} ${numberWord(ad)}` },
    { text: `${prev} ${sign} ${ad} = ?`, say: `${numberWord(prev)} ${word} ${numberWord(ad)}?` },
  ]
}

export default function SeqGame({ onExit }: GameProps) {
  const [levelIdx, setLevelIdx] = useState(0)
  const [round, setRound] = useState<Round>(() => genRound(0))
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const [poked, setPoked] = useState<number | null>(null)
  const [hintShown, setHintShown] = useState(0)

  const missing = round.terms[round.gapPos]
  const hints = hintLines(round)
  const seqScale = (n: number) => 78 / friendMaxDim(n - 1)
  const choiceScale = (n: number) => 84 / friendMaxDim(n - 1)

  useEffect(() => {
    speak('איזה חבר חסר?')
  }, [round])

  function next(level = levelIdx) {
    setRound(genRound(level))
    setSolved(false)
    setWrong(null)
    setHintShown(0)
  }

  function chooseLevel(i: number) {
    unlockAudio()
    setLevelIdx(i)
    next(i)
  }

  function sayFriend(n: number) {
    unlockAudio()
    playFriend(n - 1)
    speak(`${numberWord(n)}. ${friendSay(n - 1)}`)
    setPoked(n)
    window.setTimeout(() => setPoked(null), 550)
  }

  function showHint() {
    unlockAudio()
    if (hintShown >= hints.length) return
    speak(hints[hintShown].say)
    setHintShown((h) => h + 1)
  }

  function pick(n: number) {
    if (solved) return
    unlockAudio()
    if (n === missing) {
      setSolved(true)
      const ns = score + 1
      setScore(ns)
      if (ns % 5 === 0) playWin()
      else playSuccess()
      speak(`${numberWord(missing)}. ${friendSay(missing - 1)}`)
      window.setTimeout(() => next(), 1200)
    } else {
      setWrong(n)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
  }

  return (
    <GameShell title="חבר חסר ברצף" emoji="🧩" onExit={onExit}>
      <div className="seq-head">
        <div className="seq-levels">
          {LEVELS.map((label, i) => (
            <button key={label} className={`pill ${i === levelIdx ? 'pill-active' : ''}`} onClick={() => chooseLevel(i)}>
              {label}
            </button>
          ))}
        </div>
        <span className="seq-score" aria-label={`ניקוד ${score}`}>
          ⭐ {score}
        </span>
      </div>

      <div className="seq-row" dir="ltr">
        {round.terms.map((num, i) => {
          if (i === round.gapPos && !solved) {
            return (
              <span className="seq-item" key={i}>
                <span className="seq-num seq-num-empty">?</span>
                <span className="seq-gap">?</span>
              </span>
            )
          }
          return (
            <button className="seq-item" key={i} onClick={() => sayFriend(num)} aria-label={`חבר מספר ${num}`}>
              <span className="seq-num">{num}</span>
              <Friend
                index={num - 1}
                scale={seqScale(num)}
                showNumber={false}
                bouncing={poked === num || (i === round.gapPos && solved)}
              />
            </button>
          )
        })}
      </div>

      <div className="seq-tools">
        <button className="pill" onClick={() => speak('איזה חבר חסר?')}>
          🔊 שמע שוב
        </button>
        <button className="pill" onClick={showHint} disabled={hintShown >= hints.length}>
          💡 רמז
        </button>
      </div>

      {hintShown > 0 && (
        <div className="seq-hints" aria-live="polite">
          {hints.slice(0, hintShown).map((line, i) => (
            <span key={i} className={`seq-hint-line ${line.text.includes('?') ? 'is-q' : ''}`} dir="ltr">
              {line.text}
            </span>
          ))}
        </div>
      )}

      <div className="seq-choices">
        {round.choices.map((n) => (
          <button
            key={n}
            className={`seq-choice ${wrong === n ? 'is-wrong' : ''}`}
            onClick={() => pick(n)}
            disabled={solved}
            aria-label={`חבר מספר ${n}`}
          >
            <span className="seq-num">{n}</span>
            <Friend index={n - 1} scale={choiceScale(n)} showNumber={false} />
          </button>
        ))}
      </div>
    </GameShell>
  )
}
