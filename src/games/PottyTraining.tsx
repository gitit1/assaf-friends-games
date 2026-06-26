import { useState } from 'react'
import GameShell from '../components/GameShell'
import KidArt, { type KidGender, type Removing } from '../components/KidArt'
import Friend from '../components/Friend'
import { friendName } from '../friends'
import { useT } from '../i18n'
import { playTap, playSuccess, playPop, playNudge, unlockAudio } from '../audio'
import { speak } from '../speech'
import type { GameProps } from './registry'

// Potty-training — a calm, NO-FAIL, errorless routine shown STEP BY STEP so a
// child sees each real moment: the camera zooms in while the pants slide off,
// then (when weaning) the diaper, leg by leg. Then the toilet: sit, or a boy
// stands and aims; the pee/poop clearly comes out; flush; wash hands; celebrate.
// Accidents in the pants are gentle ("no big deal"). Stars only ever go up.

type Char = 'boy' | 'girl' | 'friend'
type Need = 'pee' | 'poop'
type Step = 'intro' | 'wait' | 'walk' | 'atToilet' | 'go' | 'went' | 'flush' | 'wash' | 'cheer' | 'accident'

export default function PottyTraining({ onExit, friend = 0 }: GameProps) {
  const { t } = useT()
  const [char, setChar] = useState<Char | null>(null)
  const [step, setStep] = useState<Step>('intro')
  const [need, setNeed] = useState<Need>('pee')
  const [pantsOn, setPantsOn] = useState(true)
  const [diaperOn, setDiaperOn] = useState(true)
  const [removing, setRemoving] = useState<Removing>(null)
  const [stars, setStars] = useState(0)

  const isBoy = char === 'boy'
  const aiming = isBoy && need === 'pee' && (step === 'go' || step === 'went')
  const sitting = (step === 'go' || step === 'went') && !aiming
  const zoom = removing !== null // a close-up plays while a garment comes off
  const name = char === 'friend' ? friendName(friend) : char === 'girl' ? t('potty.girl') : t('potty.boy')

  const tap = () => {
    unlockAudio()
    playTap()
  }
  const say = (x: string) => speak(x)

  function choose(c: Char) {
    tap()
    setChar(c)
    setStep('intro')
    setPantsOn(true)
    setDiaperOn(true)
    setRemoving(null)
    setNeed('pee')
  }

  // weaning: take off the PANTS first, then the diaper — each one zoomed-in and
  // sliding off step by step, so it reads as a real "let's take it off" moment.
  function removeDiaper() {
    tap()
    setRemoving('pants')
    say(t('potty.undress.pants'))
    window.setTimeout(() => {
      setPantsOn(false)
      setRemoving('diaper')
      say(t('potty.undress.diaper'))
      window.setTimeout(() => {
        setDiaperOn(false)
        setRemoving(null)
        setPantsOn(true) // into clean big-kid pants
        setStep('wait')
        setNeed('pee')
        say(t('potty.weaned.say'))
      }, 1700)
    }, 1700)
  }
  function toToilet() {
    tap()
    setStep('walk')
    window.setTimeout(() => setStep('atToilet'), 1600)
  }
  function pantsDown() {
    tap()
    setRemoving('pants')
    say(t('potty.undress.pants'))
    window.setTimeout(() => {
      setPantsOn(false)
      setRemoving(null)
      setStep('go')
    }, 1700)
  }
  function doGo() {
    playPop()
    setStep('went')
    say(need === 'pee' ? t('potty.pee.say') : t('potty.poop.say'))
  }
  function flush() {
    tap()
    setPantsOn(true) // pull the pants back up
    setStep('wash')
  }
  function wash() {
    tap()
    setStep('cheer')
    playSuccess()
    setStars((s) => s + 1)
    say(t('potty.cheer.say'))
  }
  function next() {
    tap()
    setStep('wait')
    setNeed((n) => (n === 'pee' ? 'poop' : 'pee'))
  }
  function oops() {
    playNudge()
    setStep('accident')
    say(t('potty.oops.say'))
  }
  function cleanUp() {
    tap()
    setPantsOn(true)
    setStep('wait')
  }

  // ── character picker ──
  if (!char) {
    return (
      <GameShell title={t('game.potty')} emoji="🚽" onExit={onExit}>
        <p className="pet-pick-title">{t('potty.pick')}</p>
        <div className="potty-pick">
          <button className="potty-pick-btn" onClick={() => choose('boy')}>
            <span className="potty-pick-fig"><KidArt gender="boy" pantsOn diaperOn={false} /></span>
            <span>{t('potty.boy')}</span>
          </button>
          <button className="potty-pick-btn" onClick={() => choose('girl')}>
            <span className="potty-pick-fig"><KidArt gender="girl" pantsOn diaperOn={false} /></span>
            <span>{t('potty.girl')}</span>
          </button>
          <button className="potty-pick-btn" onClick={() => choose('friend')}>
            <span className="potty-pick-fig potty-pick-friend">
              <Friend index={friend} scale={0.5} showNumber={false} />
            </span>
            <span>{t('pet.pickFriend')}</span>
          </button>
        </div>
      </GameShell>
    )
  }

  const figure =
    char === 'friend' ? (
      <span className="potty-friend" style={{ fontSize: 0 }}>
        <Friend index={friend} scale={0.72} showNumber={false} />
      </span>
    ) : (
      <KidArt gender={char as KidGender} pantsOn={pantsOn} diaperOn={diaperOn} removing={removing} />
    )

  // bubble text — narrate the current micro-step
  const bubble =
    removing === 'pants'
      ? t('potty.undress.pants')
      : removing === 'diaper'
        ? t('potty.undress.diaper')
        : step === 'intro'
          ? t('potty.intro').replace('{name}', name)
          : step === 'wait'
            ? need === 'pee'
              ? t('potty.need.pee')
              : t('potty.need.poop')
            : step === 'go'
              ? aiming
                ? t('potty.aim')
                : need === 'pee'
                  ? t('potty.sit.pee')
                  : t('potty.sit.poop')
              : step === 'cheer'
                ? t('potty.cheer')
                : step === 'accident'
                  ? t('potty.oops')
                  : ''

  return (
    <GameShell title={t('game.potty')} emoji="🚽" onExit={onExit}>
      <div className="potty-stars">
        {'⭐'.repeat(Math.min(stars, 10))}
        <span className="potty-star-num">{stars}</span>
      </div>

      <div
        className={`potty-room step-${step} ${aiming ? 'is-aiming' : ''} ${sitting ? 'is-sitting' : ''} ${
          zoom ? 'is-zoom' : ''
        } need-${need}`}
      >
        {/* the toilet — a big, clear fixture that's always there */}
        <span className="potty-toilet" aria-hidden="true">
          <span className="pt-tank" />
          <span className="pt-flush" />
          <span className="pt-lid" />
          <span className="pt-seat" />
          <span className="pt-bowl" />
          <span className="pt-base" />
          <span className="pt-stream" aria-hidden="true">
            <svg className="pee-arc" viewBox="0 0 118 86" xmlns="http://www.w3.org/2000/svg">
              <path className="pee-flow" d="M6 46 Q 48 30 86 64" />
              <circle className="pee-drop pee-d1" r="3.2" />
              <circle className="pee-drop pee-d2" r="2.6" />
              <g className="pee-splash">
                <circle cx="86" cy="64" r="3.6" />
                <circle cx="79" cy="60" r="2" />
                <circle cx="93" cy="60" r="1.8" />
              </g>
            </svg>
          </span>
          {need === 'pee' ? <span className="pt-pee" /> : <span className="pt-result">💩</span>}
        </span>
        <span className="potty-sink" aria-hidden="true">
          <span className="ps-basin" />
          {step === 'wash' && <span className="ps-water" />}
        </span>

        {/* the character */}
        <span className={`potty-char ${step === 'walk' ? 'is-walking' : ''} ${char === 'friend' ? 'is-friend' : ''}`}>
          {bubble && (
            <span className="potty-bubble" key={step + need + String(removing)}>
              {bubble}
            </span>
          )}
          {step === 'accident' && <span className="potty-puddle" aria-hidden="true">💦</span>}
          {figure}
        </span>
      </div>

      {/* the one big action button for the current step (hidden while a zoom plays) */}
      <div className="potty-actions">
        {removing && <p className="potty-hint">✨ {t('potty.step')}</p>}
        {!removing && step === 'intro' && (
          <button className="big-button potty-go" onClick={removeDiaper}>
            🧷 {t('potty.btn.removeDiaper')}
          </button>
        )}
        {!removing && step === 'wait' && (
          <>
            <button className="big-button potty-go" onClick={toToilet}>
              🚽 {t('potty.btn.toToilet')}
            </button>
            <button className="potty-oops" onClick={oops}>
              💦 {t('potty.btn.oops')}
            </button>
          </>
        )}
        {step === 'walk' && <p className="potty-hint">🚶 {t('potty.walking')}</p>}
        {!removing && step === 'atToilet' && (
          <button className="big-button potty-go" onClick={pantsDown}>
            👖 {t('potty.btn.pantsDown')}
          </button>
        )}
        {step === 'go' && (
          <button className="big-button potty-go" onClick={doGo}>
            {need === 'pee' ? `💧 ${t('potty.btn.pee')}` : `💩 ${t('potty.btn.poop')}`}
          </button>
        )}
        {step === 'went' && (
          <button className="big-button potty-go" onClick={flush}>
            🚽 {t('potty.btn.flush')}
          </button>
        )}
        {step === 'wash' && (
          <button className="big-button potty-go" onClick={wash}>
            🧼 {t('potty.btn.wash')}
          </button>
        )}
        {step === 'cheer' && (
          <button className="big-button potty-go" onClick={next}>
            🎉 {t('potty.btn.again')}
          </button>
        )}
        {step === 'accident' && (
          <button className="big-button potty-go" onClick={cleanUp}>
            🧽 {t('potty.btn.clean')}
          </button>
        )}
      </div>
    </GameShell>
  )
}
