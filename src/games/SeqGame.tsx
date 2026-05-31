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
// it. The 💡 hint pop-up TEACHES: in the bottom work area it builds the first
// equation element-by-element (friend + friend = ✨friend), then for each next
// term ONLY the changing operand swaps (the constant operand, the operator and
// the = stay put); every finished equation flies UP and stacks in a list; the
// missing term shows `???`. Slow + spoken. No timer; wrong = gentle nudge.
const LEN = 4
const MAXN = FRIENDS.length

type SeqType = 'add' | 'mult' | 'geo'
type Round = { terms: number[]; gapPos: number; type: SeqType; step: number; choices: number[] }
type Op = '+' | '−' | '×'
type Frame = { left: number; op: Op; right: number; result: number; target: number; missing: boolean }
type Bottom = { leftVal: number | null; op: Op | null; rightVal: number | null; eq: boolean; res: number | '?' | null }

const LEVELS = ['קל', 'רגיל', 'קשה', 'אתגר']
const OPW: Record<Op, string> = { '+': 'ועוד', '−': 'פחות', '×': 'כפול' }
// slow, comfortable pacing (ms)
const ENTER = 750 // gap between elements entering (first equation)
const SWAP = 1600 // pause showing the swapped operand (later equations)
const HOLD = 1100 // how long the result shows before flying up
const RISE = 1900 // after the equation flies up, before the next term

function buildTerms(type: SeqType, start: number, step: number): number[] {
  return Array.from({ length: LEN }, (_, i) =>
    type === 'geo' ? start * step ** i : type === 'mult' ? (i + 1) * step : start + i * step,
  )
}

function pickConfig(level: number): { type: SeqType; start: number; step: number } {
  const maxN = Math.max(2, Math.floor(MAXN / LEN))
  if (level === 0) return { type: 'add', start: randInt(2, MAXN - 3), step: 1 }
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
  for (let t = 0; t < 400; t++) {
    const { type, start, step } = pickConfig(level)
    const terms = buildTerms(type, start, step)
    if (!terms.every((v) => v >= 1 && v <= MAXN) || new Set(terms).size !== LEN) continue
    if (type === 'add') {
      const c = terms[0] - step
      if (c < 1 || c > MAXN || 4 * Math.abs(step) > MAXN) continue
    }
    const gapPos = randInt(1, LEN - 1)
    return { terms, gapPos, type, step, choices: pickChoices(terms[gapPos], terms, level === 3 ? 3 : 2) }
  }
  const start = randInt(2, MAXN - 3)
  const terms = [start, start + 1, start + 2, start + 3]
  const gapPos = randInt(1, LEN - 1)
  return { terms, gapPos, type: 'add', step: 1, choices: pickChoices(terms[gapPos], terms, 2) }
}

function buildFrames(r: Round): Frame[] {
  const g = r.gapPos
  if (r.type === 'mult') {
    const n = r.step
    return Array.from({ length: LEN }, (_, t) => ({
      left: t + 1,
      op: '×' as Op,
      right: n,
      result: (t + 1) * n,
      target: t,
      missing: t === g,
    }))
  }
  if (r.type === 'geo') {
    const frames: Frame[] = []
    for (let i = 1; i <= g; i++)
      frames.push({ left: r.terms[i - 1], op: '×', right: r.step, result: r.terms[i], target: i, missing: i === g })
    return frames
  }
  const c = r.terms[0] - r.step
  const op: Op = r.step >= 0 ? '+' : '−'
  const ad = Math.abs(r.step)
  return Array.from({ length: LEN }, (_, t) => ({
    left: c,
    op,
    right: (t + 1) * ad,
    result: r.terms[t],
    target: t,
    missing: t === g,
  }))
}

function NumFig({ v, px }: { v: number; px: number }) {
  return (
    <span className="eq-num">
      <b className="eq-digit">{v}</b>
      <Friend index={v - 1} scale={px / friendMaxDim(v - 1)} showNumber={false} />
    </span>
  )
}

// small figure used in the accumulated list
function SmallNum({ v }: { v: number }) {
  return (
    <span className="hint-snum">
      <Friend index={v - 1} scale={42 / friendMaxDim(v - 1)} showNumber={false} />
      <b>{v}</b>
    </span>
  )
}

const EMPTY_BOTTOM: Bottom = { leftVal: null, op: null, rightVal: null, eq: false, res: null }

export default function SeqGame({ onExit }: GameProps) {
  const [levelIdx, setLevelIdx] = useState(0)
  const [round, setRound] = useState<Round>(() => genRound(0))
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const [poked, setPoked] = useState<number | null>(null)
  const [hintOpen, setHintOpen] = useState(false)
  const [bottom, setBottom] = useState<Bottom>(EMPTY_BOTTOM)
  const [history, setHistory] = useState<Frame[]>([])
  const [done, setDone] = useState(false)
  const timers = useRef<number[]>([])

  const missing = round.terms[round.gapPos]
  const frames = buildFrames(round)
  const changing: 'left' | 'right' = round.type === 'add' ? 'right' : 'left'
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
    setBottom(EMPTY_BOTTOM)
    setHistory([])
    setDone(false)
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

  function speakFrame(f: Frame) {
    const w = OPW[f.op]
    if (f.missing) speak(`${numberWord(f.left)} ${w} ${numberWord(f.right)}?`)
    else speak(`${numberWord(f.left)} ${w} ${numberWord(f.right)} שווה ${numberWord(f.result)}`)
  }

  function openHint() {
    unlockAudio()
    stopSpeech()
    clearTimers()
    setHintOpen(true)
    setBottom(EMPTY_BOTTOM)
    setHistory([])
    setDone(false)

    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))
    let t = 300
    frames.forEach((fr, k) => {
      if (k === 0) {
        // build the first equation element by element
        at(t, () => setBottom((b) => ({ ...b, leftVal: fr.left })))
        t += ENTER
        at(t, () => setBottom((b) => ({ ...b, op: fr.op })))
        t += ENTER
        at(t, () => setBottom((b) => ({ ...b, rightVal: fr.right })))
        t += ENTER
        at(t, () => setBottom((b) => ({ ...b, eq: true })))
        t += ENTER
        at(t, () => {
          setBottom((b) => ({ ...b, res: fr.missing ? '?' : fr.result }))
          speakFrame(fr)
        })
        t += HOLD
      } else {
        // only the changing operand swaps; constant + op + = stay (slow, so the
        // swap is clearly seen)
        at(t, () =>
          setBottom((b) => ({
            ...b,
            res: null,
            leftVal: changing === 'left' ? fr.left : b.leftVal,
            rightVal: changing === 'right' ? fr.right : b.rightVal,
          })),
        )
        t += SWAP
        at(t, () => {
          setBottom((b) => ({ ...b, res: fr.missing ? '?' : fr.result }))
          speakFrame(fr)
        })
        t += HOLD
      }
      // the finished equation flies up to the list, and the result clears below
      at(t, () => {
        setHistory((h) => [...h, fr])
        setBottom((b) => ({ ...b, res: null }))
      })
      t += RISE
    })
    // once the last equation has risen, hide the work area so all the
    // equations are seen together in the list
    at(t, () => setDone(true))
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

            {/* top: equations that finished, flying up and stacking */}
            <div className="hint-list" dir="ltr">
              {history.map((fr, i) => (
                <div className="hint-eq" key={i}>
                  <SmallNum v={fr.left} />
                  <span className="hint-eq-op">{fr.op}</span>
                  <SmallNum v={fr.right} />
                  <span className="hint-eq-op">=</span>
                  {fr.missing ? <span className="hint-eq-q">???</span> : <SmallNum v={fr.result} />}
                </div>
              ))}
            </div>

            {/* bottom work area — hidden once every equation has risen, so the
                full list of equations is seen together */}
            {!done && (
              <>
                <div className="hint-divider" />
                <div className="hint-work">
                  <div className="eq-row" dir="ltr">
                    {bottom.leftVal != null && <NumFig key={`L${bottom.leftVal}`} v={bottom.leftVal} px={60} />}
                    {bottom.op && (
                      <span className="eq-sym" key="op">
                        {bottom.op}
                      </span>
                    )}
                    {bottom.rightVal != null && <NumFig key={`R${bottom.rightVal}`} v={bottom.rightVal} px={60} />}
                    {bottom.eq && (
                      <span className="eq-sym" key="eq">
                        =
                      </span>
                    )}
                    {bottom.res === '?' && (
                      <span className="eq-sym eq-q" key="resq">
                        ???
                      </span>
                    )}
                    {typeof bottom.res === 'number' && (
                      <span className="eq-res" key={`res${bottom.res}`}>
                        <NumFig v={bottom.res} px={60} />
                        <span className="eq-spark" aria-hidden="true">
                          ✨
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            <button className="pill hint-replay" onClick={openHint}>
              ↻ עוד פעם
            </button>
          </div>
        </div>
      )}
    </GameShell>
  )
}
