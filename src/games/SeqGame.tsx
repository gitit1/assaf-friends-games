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
// it. The 💡 hint opens a pop-up that TEACHES by building the sequence's
// equations one element at a time (friend → + → friend → = → ✨result), each
// result "rising" to the sequence row, ending on the missing one as `???`. No
// timer; wrong = gentle nudge. Values stay within the roster (grows toward 100).
const LEN = 4
const MAXN = FRIENDS.length

type SeqType = 'add' | 'mult' | 'geo'
type Round = { terms: number[]; gapPos: number; type: SeqType; step: number; choices: number[] }
type Op = '+' | '−' | '×'
type Eq = { a: number; op: Op; b: number; c: number | null; target: number }

const LEVELS = ['קל', 'רגיל', 'קשה', 'אתגר']
const OPW: Record<Op, string> = { '+': 'ועוד', '−': 'פחות', '×': 'כפול' }
const TICKS_PER_EQ = 5
const TICK_MS = 750

function buildTerms(type: SeqType, start: number, step: number): number[] {
  return Array.from({ length: LEN }, (_, i) =>
    type === 'geo' ? start * step ** i : type === 'mult' ? (i + 1) * step : start + i * step,
  )
}

function pickConfig(level: number): { type: SeqType; start: number; step: number } {
  const maxN = Math.max(2, Math.floor(MAXN / LEN))
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

// the equations the hint walks through, ending on the missing term as `???`
function buildEquations(r: Round): Eq[] {
  const g = r.gapPos
  const eqs: Eq[] = []
  if (r.type === 'mult') {
    const n = r.step
    for (let k = 1; k <= g + 1; k++) eqs.push({ a: k, op: '×', b: n, c: k === g + 1 ? null : k * n, target: k - 1 })
  } else if (r.type === 'geo') {
    for (let i = 1; i <= g; i++) eqs.push({ a: r.terms[i - 1], op: '×', b: r.step, c: i === g ? null : r.terms[i], target: i })
  } else {
    const op: Op = r.step >= 0 ? '+' : '−'
    const b = Math.abs(r.step)
    for (let i = 1; i <= g; i++) eqs.push({ a: r.terms[i - 1], op, b, c: i === g ? null : r.terms[i], target: i })
  }
  return eqs
}

function NumFig({ v, px }: { v: number; px: number }) {
  return (
    <span className="eq-num">
      <b className="eq-digit">{v}</b>
      <Friend index={v - 1} scale={px / friendMaxDim(v - 1)} showNumber={false} />
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
  const [tick, setTick] = useState(0)
  const timers = useRef<number[]>([])

  const missing = round.terms[round.gapPos]
  const equations = buildEquations(round)
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

  function speakEq(eq: Eq) {
    const w = OPW[eq.op]
    if (eq.c != null) speak(`${numberWord(eq.a)} ${w} ${numberWord(eq.b)} שווה ${numberWord(eq.c)}`)
    else speak(`${numberWord(eq.a)} ${w} ${numberWord(eq.b)}?`)
  }

  function openHint() {
    unlockAudio()
    stopSpeech()
    clearTimers()
    setHintOpen(true)
    setTick(0)
    const total = equations.length * TICKS_PER_EQ
    for (let s = 0; s < total; s++) {
      timers.current.push(
        window.setTimeout(() => {
          setTick(s)
          if (s % TICKS_PER_EQ === 4) speakEq(equations[Math.floor(s / TICKS_PER_EQ)])
        }, s * TICK_MS),
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

  // current hint frame
  const eqIndex = Math.min(Math.floor(tick / TICKS_PER_EQ), equations.length - 1)
  const revealed = (tick % TICKS_PER_EQ) + 1
  const activeEq = equations[eqIndex]
  const eqEls = activeEq
    ? [
        <NumFig key="a" v={activeEq.a} px={50} />,
        <span className="eq-sym" key="op">
          {activeEq.op}
        </span>,
        <NumFig key="b" v={activeEq.b} px={50} />,
        <span className="eq-sym" key="eq">
          =
        </span>,
        activeEq.c != null ? (
          <span className="eq-res" key="c">
            <NumFig v={activeEq.c} px={50} />
            <span className="eq-spark" aria-hidden="true">
              ✨
            </span>
          </span>
        ) : (
          <span className="eq-sym eq-q" key="c">
            ???
          </span>
        ),
      ].slice(0, revealed)
    : []

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

            {/* top: the sequence, with the term being solved highlighted */}
            <div className="hint-seq" dir="ltr">
              {round.terms.map((num, i) => (
                <span
                  className={`hint-seq-item ${activeEq && i === activeEq.target ? 'is-active' : ''}`}
                  key={i}
                >
                  {i === round.gapPos ? (
                    <span className="hint-seq-gap">?</span>
                  ) : (
                    <>
                      <b className="eq-digit">{num}</b>
                      <Friend index={num - 1} scale={32 / friendMaxDim(num - 1)} showNumber={false} />
                    </>
                  )}
                </span>
              ))}
            </div>

            <div className="hint-divider" />

            {/* bottom: the equation building up, element by element */}
            <div className="hint-work">
              <div className="eq-row" dir="ltr">
                {eqEls}
              </div>
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
