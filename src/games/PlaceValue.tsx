import { useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import Confetti from '../components/Confetti'
import type { GameProps } from './registry'
import { playRise, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendSay } from '../friends'
import { numberWord, randInt } from './util'
import { fitScale, useViewport } from '../useViewport'
import { useT } from '../i18n'

// Build a two-digit number from TEN-rods and ONE-cubes — place value the
// Numberblocks "Tens" way. A live "X tens + Y ones = N" updates as you build, and
// the matching friend lights up. No timer, no wrong answers — over/undershoot just
// adjusts. Distinct from "Build a Number" (which composes a±×÷b) and from counting.
export default function PlaceValue({ onExit }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  const [target, setTarget] = useState(() => randInt(11, 99))
  const [tens, setTens] = useState(0)
  const [ones, setOnes] = useState(0)
  const current = tens * 10 + ones
  const done = current === target

  const [pop, setPop] = useState(false)
  const popTimer = useRef<number | undefined>(undefined)
  function bump() {
    setPop(true)
    window.clearTimeout(popTimer.current)
    popTimer.current = window.setTimeout(() => setPop(false), 280)
  }

  function react(now: number, added: boolean, riseIdx: number) {
    if (now === target) {
      playWin()
      speak(`${numberWord(target)}! ${friendSay(target - 1)}!`)
    } else if (added) {
      playRise(riseIdx % 8) // climbing notes as it grows
    } else {
      playTap()
    }
  }
  function changeTens(d: number) {
    if (done) return
    const next = Math.max(0, Math.min(9, tens + d))
    if (next === tens) return
    unlockAudio()
    setTens(next)
    bump()
    react(next * 10 + ones, d > 0, next - 1)
  }
  function changeOnes(d: number) {
    if (done) return
    const next = Math.max(0, Math.min(9, ones + d))
    if (next === ones) return
    unlockAudio()
    setOnes(next)
    bump()
    react(tens * 10 + next, d > 0, tens + next - 1)
  }

  function newTarget() {
    setTens(0)
    setOnes(0)
    let next = randInt(11, 99)
    if (next === target) next = target >= 99 ? 11 : target + 1
    setTarget(next)
  }

  return (
    <GameShell title={t('game.placevalue')} emoji="🔟" onExit={onExit}>
      <Confetti active={done} />
      <p className="count-target" aria-hidden="true">
        {t('pv.make')} <strong>{target}</strong>
      </p>

      <div className="friends-stage">
        <Friend
          index={target - 1}
          scale={fitScale(target - 1, vp, 0.7, 0.24)}
          litUnits={current > target ? target : current}
          bouncing={done || pop}
          lively
        />
      </div>

      {/* base-10 blocks: tall ten-rods (10 cells each) + single ones */}
      <div className="pv-blocks" aria-hidden="true">
        <div className="pv-col">
          <span className="pv-col-label">{t('pv.tens')}</span>
          <div className="pv-rods">
            {tens === 0 && <span className="pv-empty">0</span>}
            {Array.from({ length: tens }).map((_, i) => (
              <span className="pv-rod" key={i}>
                {Array.from({ length: 10 }).map((_, j) => (
                  <span className="pv-rod-cell" key={j} />
                ))}
              </span>
            ))}
          </div>
        </div>
        <div className="pv-col">
          <span className="pv-col-label">{t('pv.ones')}</span>
          <div className="pv-cubes">
            {ones === 0 && <span className="pv-empty">0</span>}
            {Array.from({ length: ones }).map((_, i) => (
              <span className="pv-cube" key={i} />
            ))}
          </div>
        </div>
      </div>

      <div className="pv-eq" aria-live="polite">
        <strong>{tens}</strong> {t('pv.tens')} + <strong>{ones}</strong> {t('pv.ones')} ={' '}
        <strong className={done ? 'pv-eq-done' : ''}>{current}</strong>
        {done && ' 🎉'}
      </div>

      {/* on completion the steppers become a single "new number" button — no extra
          banner; the confetti + bouncing friend + green equation say "done!" */}
      {done ? (
        <div className="pv-controls">
          <button className="big-button" onClick={newTarget}>
            🔄 {t('pv.new')}
          </button>
        </div>
      ) : (
        <div className="pv-controls">
          <div className="pv-stepper">
            <button className="pill pill-small" onClick={() => changeTens(-1)} aria-label={`−10 ${t('pv.tens')}`}>
              ➖
            </button>
            <span className="pv-stepper-label">{t('pv.tens')}</span>
            <button className="pill pill-small" onClick={() => changeTens(1)} aria-label={`+10 ${t('pv.tens')}`}>
              ➕
            </button>
          </div>
          <div className="pv-stepper">
            <button className="pill pill-small" onClick={() => changeOnes(-1)} aria-label={`−1 ${t('pv.ones')}`}>
              ➖
            </button>
            <span className="pv-stepper-label">{t('pv.ones')}</span>
            <button className="pill pill-small" onClick={() => changeOnes(1)} aria-label={`+1 ${t('pv.ones')}`}>
              ➕
            </button>
          </div>
        </div>
      )}
    </GameShell>
  )
}
