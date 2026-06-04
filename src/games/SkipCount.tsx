import { useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playRise, playWin, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { fitScale, useViewport } from '../useViewport'
import { useT } from '../i18n'

// Skip-counting on a NUMBER LINE: the step-friend (2 / 5 / 10) hops along, landing
// on its multiples. Each landing shows step × hops = current, so skip-counting and
// multiplication click together. Spatial + Numberblocks "Step Squad" — distinct
// from plain block-counting (which lives in the friend's world). No timer/fail.
const STEPS = [2, 5, 10]
const HOPS = 10 // land on step×1 … step×10

export default function SkipCount({ onExit }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  const [step, setStep] = useState(2)
  const [hops, setHops] = useState(0)
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
          </span>
        )}
      </div>

      {/* the number line — friend hops from one multiple to the next. dir=ltr so it
          reads like a number line (0 on the left), in both languages. */}
      <div className="hop-line" dir="ltr">
        <div className="hop-track">
          {Array.from({ length: HOPS + 1 }).map((_, i) => (
            <span className={`hop-dot ${i > 0 && i <= hops ? 'lit' : ''} ${i === hops ? 'cur' : ''}`} key={i}>
              {i === hops && (
                <span className="hop-friend-inner" key={hops}>
                  <Friend index={step - 1} scale={fitScale(step - 1, vp, 0.13, 0.085)} showNumber={false} lively />
                </span>
              )}
              <span className="hop-num">{i === 0 ? 0 : step * i}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="counting-next">
        {done ? (
          <>
            <div className="banner banner-success" role="status">
              {current} 🎉
            </div>
            <button className="big-button" onClick={reset}>
              ✨ {t('skip.again')}
            </button>
          </>
        ) : (
          <>
            <button className="big-button" onClick={hop}>
              🦘 {t('skip.hop')}
            </button>
            {hops > 0 && (
              <button className="pill" onClick={reset}>
                {t('skip.again')}
              </button>
            )}
          </>
        )}
      </div>
    </GameShell>
  )
}
