import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import Stepper from '../components/Stepper'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playRise, playWin, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { randInt } from './util'
import { useT } from '../i18n'

// fixed on-screen sizes (the friend's largest dimension, in px) so they look the
// same on phone and desktop — fitScale could balloon up to 3× on a wide screen
const ADDEND_PX = 78
const RESULT_PX = 110

// Build a Number (Numberblocks-style addition): pick two friends, tap "combine",
// and they slide together and MERGE into the bigger friend (3 + 5 → 8), who
// cheers. The equation is shown and the result is counted out loud. Explore any
// sum freely — no timer, no wrong answers.
const MAXA = 20

export default function BuildNumber({ onExit }: GameProps) {
  const { t } = useT()
  const [a, setA] = useState(() => randInt(1, 9))
  const [b, setB] = useState(() => randInt(1, 9))
  const [phase, setPhase] = useState<'pick' | 'merge' | 'done'>('pick')
  const timers = useRef<number[]>([])
  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(() => clear, [])

  const c = a + b
  const clamp = (n: number) => Math.max(1, Math.min(MAXA, n))
  const set = (fn: (v: number) => void, v: number) => {
    if (phase !== 'pick') return
    fn(clamp(v))
  }

  function combine() {
    if (phase !== 'pick') return
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
    <GameShell title={t('game.build')} emoji="➕" onExit={onExit}>
      <div className="build-screen">
        <div className="build-eq" aria-live="polite">
          <span>{a}</span>
          <span className="build-op">➕</span>
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
                <Friend index={a - 1} scale={ADDEND_PX / friendMaxDim(a - 1)} showNumber />
              </span>
              <span className="build-plus" aria-hidden="true">
                ➕
              </span>
              <span className="build-b">
                <Friend index={b - 1} scale={ADDEND_PX / friendMaxDim(b - 1)} showNumber />
              </span>
            </div>
          ) : (
            <div className="build-result">
              <Friend index={c - 1} scale={RESULT_PX / friendMaxDim(c - 1)} showNumber bouncing />
            </div>
          )}
        </div>

        {phase === 'pick' && (
          <div className="build-controls">
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
            <button className="big-button" onClick={combine}>
              ➕ חברו!
            </button>
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
