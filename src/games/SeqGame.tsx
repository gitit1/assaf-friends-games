import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playFriend, playNudge, playSuccess, playWin, unlockAudio } from '../audio'
import { speak, stopSpeech } from '../speech'
import { FRIENDS, friendSay } from '../friends'
import { numberWord, randInt, shuffle } from './util'

// "Missing friend in the sequence" — a run of friends follows a rule (counting,
// jumps, times-tables, doubling) with one gap; pick the friend that completes
// it. The 💡 hint opens a pop-up that VISUALLY shows the calculation with
// friends combining (e.g. 3 groups of 2 friends → 6), step by step + spoken, so
// the child learns the method. No timer; wrong = gentle nudge. Values stay
// within the roster so each term is a real friend (grows toward 100).
const LEN = 4
const MAXN = FRIENDS.length
const UNIT = 0 // friend used as a counting token in the hint (לולו = 1)

type SeqType = 'add' | 'mult' | 'geo'
type Round = { terms: number[]; gapPos: number; type: SeqType; step: number; choices: number[] }

const LEVELS = ['קל', 'רגיל', 'קשה', 'אתגר']

function buildTerms(type: SeqType, start: number, step: number): number[] {
  return Array.from({ length: LEN }, (_, i) =>
    type === 'geo' ? start * step ** i : type === 'mult' ? (i + 1) * step : start + i * step,
  )
}

function pickConfig(level: number): { type: SeqType; start: number; step: number } {
  const maxN = Math.max(2, Math.floor(MAXN / LEN)) // biggest times-table that fits
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
    if (kind === 1) {
      const n = randInt(2, maxN)
      return { type: 'mult', start: n, step: n }
    }
    return { type: 'geo', start: randInt(1, 2), step: 2 }
  }
  // level 3 (אתגר) — multiplicative reasoning
  if (randInt(0, 2) === 2) return { type: 'geo', start: randInt(1, 2), step: 2 }
  const n = randInt(2, maxN)
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

// what the hint pop-up demonstrates
type Plan =
  | { kind: 'mult'; n: number; stages: number; title: string }
  | { kind: 'geo'; prev: number; r: number; stages: number; title: string }
  | { kind: 'add'; prev: number; d: number; stages: number; title: string }

function hintPlan(r: Round): Plan {
  const g = r.gapPos
  if (r.type === 'mult') return { kind: 'mult', n: r.step, stages: g + 1, title: 'סופרים בקבוצות' }
  const prev = r.terms[g - 1]
  if (r.type === 'geo') return { kind: 'geo', prev, r: r.step, stages: 2, title: 'מַכְפִּילִים' }
  return { kind: 'add', prev, d: r.step, stages: 2, title: r.step >= 0 ? 'מוסיפים' : 'מורידים' }
}

function Token({ state = '' }: { state?: string }) {
  return (
    <span className={`hint-token ${state}`}>
      <Friend index={UNIT} scale={0.22} showNumber={false} />
    </span>
  )
}

export default function SeqGame({ onExit }: GameProps) {
  const [levelIdx, setLevelIdx] = useState(0)
  const [round, setRound] = useState<Round>(() => genRound(0))
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const [poked, setPoked] = useState<number | null>(null)
  const [hintOpen, setHintOpen] = useState(false)
  const [stage, setStage] = useState(0)
  const timers = useRef<number[]>([])

  const missing = round.terms[round.gapPos]
  const plan = hintPlan(round)
  const seqScale = (n: number) => 78 / friendMaxDim(n - 1)
  const choiceScale = (n: number) => 84 / friendMaxDim(n - 1)

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  useEffect(() => {
    speak('איזה חבר חסר?')
  }, [round])

  function next(level = levelIdx) {
    clearTimers()
    setHintOpen(false)
    setRound(genRound(level))
    setSolved(false)
    setWrong(null)
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

  function speakStage(s: number) {
    if (plan.kind === 'mult') {
      speak(`${numberWord(s)} כפול ${numberWord(plan.n)} שווה ${numberWord(s * plan.n)}`)
    } else if (plan.kind === 'geo') {
      if (s === 1) speak(numberWord(plan.prev))
      else speak(`${numberWord(plan.prev)} כפול ${numberWord(plan.r)} שווה ${numberWord(plan.prev * plan.r)}`)
    } else {
      const w = plan.d >= 0 ? 'ועוד' : 'פחות'
      if (s === 1) speak(numberWord(plan.prev))
      else speak(`${numberWord(plan.prev)} ${w} ${numberWord(Math.abs(plan.d))} שווה ${numberWord(plan.prev + plan.d)}`)
    }
  }

  // open the pop-up and play the demonstration stage by stage
  function openHint() {
    unlockAudio()
    stopSpeech()
    clearTimers()
    setHintOpen(true)
    setStage(0)
    for (let s = 1; s <= plan.stages; s++) {
      timers.current.push(
        window.setTimeout(() => {
          setStage(s)
          speakStage(s)
        }, (s - 1) * 1700),
      )
    }
  }

  function closeHint() {
    clearTimers()
    stopSpeech()
    setHintOpen(false)
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

  // the friend tokens + caption shown for the current stage of the demo
  function renderStage() {
    if (plan.kind === 'mult') {
      return Array.from({ length: stage }).map((_, gi) => (
        <span className="hint-group" key={gi}>
          {Array.from({ length: plan.n }).map((_, ti) => (
            <Token key={ti} />
          ))}
        </span>
      ))
    }
    if (plan.kind === 'geo') {
      const groups = stage <= 1 ? 1 : plan.r
      return Array.from({ length: groups }).map((_, gi) => (
        <span className="hint-group" key={gi}>
          {Array.from({ length: plan.prev }).map((_, ti) => (
            <Token key={ti} state={gi > 0 ? 'is-new' : ''} />
          ))}
        </span>
      ))
    }
    // add / subtract
    const remove = plan.d < 0 ? Math.abs(plan.d) : 0
    return (
      <span className="hint-group">
        {Array.from({ length: plan.prev }).map((_, ti) => (
          <Token key={ti} state={stage >= 2 && remove > 0 && ti >= plan.prev - remove ? 'is-leaving' : ''} />
        ))}
        {plan.d >= 0 &&
          stage >= 2 &&
          Array.from({ length: plan.d }).map((_, ti) => <Token key={`n${ti}`} state="is-new" />)}
      </span>
    )
  }

  function caption() {
    if (stage === 0) return ''
    if (plan.kind === 'mult') return `${stage} × ${plan.n} = ${stage * plan.n}`
    if (plan.kind === 'geo') return stage <= 1 ? `${plan.prev}` : `${plan.prev} × ${plan.r} = ${plan.prev * plan.r}`
    const sign = plan.d >= 0 ? '+' : '−'
    return stage <= 1 ? `${plan.prev}` : `${plan.prev} ${sign} ${Math.abs(plan.d)} = ${plan.prev + plan.d}`
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
        <button className="pill" onClick={openHint}>
          💡 הראו לי
        </button>
      </div>

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

      {hintOpen && (
        <div className="hint-overlay" onClick={closeHint}>
          <div className="hint-card" onClick={(e) => e.stopPropagation()}>
            <button className="hint-close" onClick={closeHint} aria-label="סגור">
              ✕
            </button>
            <h3 className="hint-title">{plan.title}</h3>
            <div className="hint-stage">{renderStage()}</div>
            <div className="hint-caption" dir="ltr">
              {caption()}
            </div>
            <button className="pill hint-replay" onClick={openHint}>
              ↻ עוד פעם
            </button>
          </div>
        </div>
      )}
    </GameShell>
  )
}
