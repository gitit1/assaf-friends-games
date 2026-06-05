import { useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import Confetti from '../components/Confetti'
import type { GameProps } from './registry'
import { playRise, playWin, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { fitScale, useViewport } from '../useViewport'
import { useT } from '../i18n'
import { numberMax } from '../level'

// Skip-counting on a NUMBER LINE: the step-friend (2 / 5 / 10) hops along, landing
// on its multiples. Each landing shows step × hops = current, so skip-counting and
// multiplication click together. Spatial + Numberblocks "Step Squad" — distinct
// from plain block-counting (which lives in the friend's world). No timer/fail.
const ALL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // the whole times table — pick any

export default function SkipCount({ onExit }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  const [step, setStep] = useState(2)
  const [hops, setHops] = useState(0)
  // keep every multiple within the level: only offer steps ≤ max, and stop the
  // line where step × hops would exceed it
  const max = numberMax()
  const STEPS = ALL_STEPS.filter((s) => s <= max)
  const HOPS = Math.max(1, Math.min(10, Math.floor(max / step)))
  const current = step * hops
  const done = hops >= HOPS

  function hop() {
    if (done) return
    unlockAudio()
    const next = hops + 1
    setHops(next)
    playRise(next - 1) // climbing notes → the count sings up the line
    speakNumber(step * next)
    if (next >= HOPS) window.setTimeout(playWin, 380)
  }
  function reset() {
    setHops(0)
  }
  function pickStep(s: number) {
    setStep(s)
    setHops(0)
  }

  return (
    <GameShell title={t('game.skipcount')} emoji="🦘" onExit={onExit}>
      <Confetti active={done} />
      <div className="count-opt-row hop-steps">
        <span className="count-opt-label">{t('skip.by')}</span>
        {STEPS.map((s) => (
          <button key={s} className={`pill pill-small ${step === s ? 'pill-active' : ''}`} onClick={() => pickStep(s)}>
            {s}
          </button>
        ))}
      </div>

      {/* skip-count = multiplication, shown as it grows */}
      <div className="hop-readout" aria-live="polite">
        {hops === 0 ? (
          <span className="hop-hint">{t('skip.tap')}</span>
        ) : (
          // a maths equation reads left-to-right even in Hebrew (else RTL bidi
          // can flip it to "6 = 3 × 2")
          <span dir="ltr">
            <span className="hop-eq-mul">
              {step} × {hops} ={' '}
            </span>
            <strong>{current}</strong>
            {done && ' 🎉'}
          </span>
        )}
      </div>

      {/* the number line — friend hops from one multiple to the next. dir=ltr so it
          reads like a number line (0 on the left), in both languages. */}
      <div className="hop-line" dir="ltr">
        <div className="hop-track">
          {Array.from({ length: HOPS + 1 }).map((_, i) => (
            <span className={`hop-dot ${i > 0 && i <= hops ? 'lit' : ''} ${i === hops ? 'cur' : ''}`} key={i}>
              {i === hops && hops > 0 && (
                // the friend IS the number it's standing on (the current multiple)
                <span className="hop-friend-inner" key={hops}>
                  <Friend index={current - 1} scale={fitScale(current - 1, vp, 0.13, 0.085)} showNumber={false} bouncing={done} lively />
                </span>
              )}
              <span className="hop-num">{i === 0 ? 0 : step * i}</span>
            </span>
          ))}
        </div>
      </div>

      {/* one button that transforms: hop while playing → restart once finished
          (no extra "more" element; the confetti + celebrating friend say "done!") */}
      <div className="counting-next">
        <button className="big-button" onClick={done ? reset : hop}>
          {done ? `🔄 ${t('skip.again')}` : `🦘 ${t('skip.hop')}`}
        </button>
      </div>
    </GameShell>
  )
}
