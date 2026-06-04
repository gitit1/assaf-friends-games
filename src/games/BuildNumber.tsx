import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import Stepper from '../components/Stepper'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playRise, playWin, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { screenScale, useViewport } from '../useViewport'
import { randInt } from './util'
import { takeBuildPreset } from './buildPreset'
import { useT } from '../i18n'

// One arithmetic game with a chooser for ➕ ➖ ✖️ ➗. Pick an operation and two
// friends, tap "how much?", and they merge into the answer friend (who bounces),
// with the equation shown and the result counted out loud. No timer, no wrong
// answers — combos that can't make a whole friend (negative / non-divisible) just
// wait for friendlier numbers, with a gentle hint.
type Op = 'add' | 'sub' | 'mul' | 'div'
const OPS: { id: Op; sym: string; label: string }[] = [
  { id: 'add', sym: '➕', label: 'חיבור' },
  { id: 'sub', sym: '➖', label: 'חיסור' },
  { id: 'mul', sym: '✖️', label: 'כפל' },
  { id: 'div', sym: '➗', label: 'חילוק' },
]
const MAXOP = 10 // operands 1–10 → results stay 1–100 (a real friend)
const ADDEND_PX = 104
const RESULT_PX = 150

function compute(op: Op, a: number, b: number): number {
  if (op === 'add') return a + b
  if (op === 'sub') return a - b
  if (op === 'mul') return a * b
  return b !== 0 && a % b === 0 ? a / b : NaN // div: whole results only
}

export default function BuildNumber({ onExit }: GameProps) {
  const { t } = useT()
  const grow = screenScale(useViewport().w, 1.6)
  // if a friend's world sent us here via "build me!", open already set to that
  // split (e.g. 3 + 4) instead of a random one — read once on mount
  const [preset] = useState(takeBuildPreset)
  const [op, setOp] = useState<Op>('add')
  const [a, setA] = useState(() => preset?.a ?? randInt(1, 9))
  const [b, setB] = useState(() => preset?.b ?? randInt(1, 9))
  const [phase, setPhase] = useState<'pick' | 'merge' | 'done'>('pick')
  const timers = useRef<number[]>([])
  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(() => clear, [])

  const c = compute(op, a, b)
  const valid = Number.isInteger(c) && c >= 1 && c <= 100
  const sym = OPS.find((o) => o.id === op)!.sym
  const clamp = (n: number) => Math.max(1, Math.min(MAXOP, n))
  const set = (fn: (v: number) => void, v: number) => {
    if (phase === 'pick') fn(clamp(v))
  }
  const pickOp = (o: Op) => {
    if (phase === 'pick') setOp(o)
  }

  const hint =
    valid || phase !== 'pick'
      ? ''
      : op === 'sub'
        ? 'בחרו מספר ראשון גדול יותר ➖'
        : 'בחרו מספרים שמתחלקים יפה ➗'

  function combine() {
    if (phase !== 'pick' || !valid) return
    unlockAudio()
    setPhase('merge')
    playRise(2)
    timers.current.push(
      window.setTimeout(() => {
        setPhase('done')
        playWin()
        speakNumber(c)
      }, 750),
    )
  }
  function again() {
    clear()
    setPhase('pick')
    setA(randInt(1, 9))
    setB(randInt(1, 9))
  }

  return (
    <GameShell title={t('game.build')} emoji="🧮" onExit={onExit}>
      <div className="build-screen">
        <div className="build-eq" aria-live="polite">
          <span>{a}</span>
          <span className="build-op">{sym}</span>
          <span>{b}</span>
          {phase === 'done' && (
            <>
              <span className="build-op">=</span>
              <span className="build-c">{c}</span>
            </>
          )}
        </div>

        <div className="build-stage">
          {phase !== 'done' ? (
            <div className={`build-pair ${phase === 'merge' ? 'is-merging' : ''}`}>
              <span className="build-a">
                <Friend index={a - 1} scale={(ADDEND_PX / friendMaxDim(a - 1)) * grow} showNumber />
              </span>
              <span className="build-plus" aria-hidden="true">
                {sym}
              </span>
              <span className="build-b">
                <Friend index={b - 1} scale={(ADDEND_PX / friendMaxDim(b - 1)) * grow} showNumber />
              </span>
            </div>
          ) : (
            <div className="build-result">
              <Friend index={c - 1} scale={(RESULT_PX / friendMaxDim(c - 1)) * grow} showNumber bouncing lively />
            </div>
          )}
        </div>

        {phase === 'pick' && (
          <div className="build-controls">
            <div className="build-ops">
              {OPS.map((o) => (
                <button
                  key={o.id}
                  className={`pill pill-small ${op === o.id ? 'pill-active' : ''}`}
                  onClick={() => pickOp(o.id)}
                  aria-label={o.label}
                >
                  {o.sym}
                </button>
              ))}
            </div>
            <div className="build-steppers">
              <Stepper
                label={<span className="build-num">{a}</span>}
                onPrev={() => set(setA, a - 1)}
                onNext={() => set(setA, a + 1)}
              />
              <Stepper
                label={<span className="build-num">{b}</span>}
                onPrev={() => set(setB, b - 1)}
                onNext={() => set(setB, b + 1)}
              />
            </div>
            {hint ? (
              <p className="build-hint">{hint}</p>
            ) : (
              <button className="big-button" onClick={combine}>
                🟰 כמה יוצא?
              </button>
            )}
          </div>
        )}
        {phase === 'done' && (
          <button className="big-button" onClick={again}>
            🎲 עוד
          </button>
        )}
      </div>
    </GameShell>
  )
}
