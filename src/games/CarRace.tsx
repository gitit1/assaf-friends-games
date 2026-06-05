import { useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import Stepper from '../components/Stepper'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import Confetti from '../components/Confetti'
import { playNudge, playSuccess, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendColor, friendName } from '../friends'
import { numberChoices, randInt, shuffle } from './util'
import { getSettings } from '../settings'
import { levelForTier } from '../difficulty'
import { useT } from '../i18n'
import { friendCount, randFriendIndex, opEnabled } from '../level'

// "Garage + race" — build a car (driver friend + colour), then race a slow rival
// by solving maths. Every correct answer drives YOU forward. NO timer. A race is
// 15 questions, and the scenery changes every 5 correct answers, picking from 10
// random environments per game.
const CAR_COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#111827']
// three levels mapped onto the canonical difficulty tiers (their labels reuse the
// shared diff.* i18n keys: 0 easy / 1 medium / 3 champ)
const LEVEL_TIERS = [0, 1, 3]
const WIN = 15 // correct answers to finish a race
const SEGMENT = 5 // environment changes every 5 correct answers

type Env = {
  key: string // i18n key (race.env.<key>)
  skyTop: string
  skyBottom: string
  ground: string
  road: string
  clouds: string[]
  scenery: string[]
  overlay?: 'rain' | 'snow' | 'stars' | 'rainbow'
}
const ENVIRONMENTS: Env[] = [
  { key: 'forest', skyTop: '#bae6fd', skyBottom: '#dcfce7', ground: '#4ade80', road: '#586273', clouds: ['☁️', '⛅'], scenery: ['🌲', '🌳', '🍄', '🦌', '🌲', '🌳'] },
  { key: 'beach', skyTop: '#7dd3fc', skyBottom: '#bae6fd', ground: '#fde68a', road: '#cbb58a', clouds: ['☁️', '🌤️'], scenery: ['🌴', '⛱️', '🏖️', '🐚', '🦀', '🌴'] },
  { key: 'winter', skyTop: '#cfe8f5', skyBottom: '#eef6fb', ground: '#e5eef5', road: '#9aa7b3', clouds: ['☁️', '🌫️'], scenery: ['🌲', '🏔️', '⛄', '🌲'] },
  { key: 'rain', skyTop: '#94a3b8', skyBottom: '#cbd5e1', ground: '#65a30d', road: '#4b5563', clouds: ['☁️', '🌧️', '☁️'], scenery: ['🌳', '🏠', '🌳', '☂️'], overlay: 'rain' },
  { key: 'snow', skyTop: '#dbeafe', skyBottom: '#eff6ff', ground: '#eef6fb', road: '#94a3b8', clouds: ['🌨️', '☁️'], scenery: ['⛄', '🌲', '🏔️', '🌲'], overlay: 'snow' },
  { key: 'desert', skyTop: '#fdba74', skyBottom: '#fde68a', ground: '#fbbf24', road: '#d6a77a', clouds: ['☀️', '🌤️'], scenery: ['🌵', '🏜️', '🐫', '🌵', '🦂'] },
  { key: 'rainbow', skyTop: '#bfdbfe', skyBottom: '#e0f2fe', ground: '#86efac', road: '#586273', clouds: ['☁️', '☁️'], scenery: ['🌳', '🏠', '🌷', '🌳'], overlay: 'rainbow' },
  { key: 'night', skyTop: '#1e293b', skyBottom: '#334155', ground: '#1f3d2f', road: '#2f3a49', clouds: ['🌙', '⭐'], scenery: ['🏠', '🌲', '🦉', '🌲'], overlay: 'stars' },
  { key: 'city', skyTop: '#93c5fd', skyBottom: '#dbeafe', ground: '#9ca3af', road: '#4b5563', clouds: ['☁️', '🏙️'], scenery: ['🏢', '🏬', '🚦', '🏢', '🏪'] },
  { key: 'mountains', skyTop: '#a5d8f3', skyBottom: '#dceefb', ground: '#86efac', road: '#586273', clouds: ['☁️', '🦅'], scenery: ['⛰️', '🏔️', '🌲', '🏕️', '⛰️'] },
]

function makeProblem(level: number) {
  let text: string
  let ans: number
  // honour the parent's enabled operations: only use × on the harder levels if it
  // is on, and respect which of + − are available on the easy level
  const useMul = level >= 1 && opEnabled('mul')
  if (useMul) {
    const cap = level >= 3 ? 6 : 9
    const a = randInt(2, cap)
    const b = randInt(2, cap)
    const c = randInt(1, 9)
    if (level >= 3 && opEnabled('sub') && Math.random() < 0.4 && a * b > c) {
      text = `${a} × ${b} − ${c}`
      ans = a * b - c
    } else if (level >= 3 && opEnabled('add') && Math.random() < 0.5) {
      text = `${a} × ${b} + ${c}`
      ans = a * b + c
    } else {
      text = `${a} × ${b}`
      ans = a * b
    }
  } else {
    const a = randInt(2, 9)
    const b = randInt(1, 9)
    if (opEnabled('sub') && (!opEnabled('add') || Math.random() < 0.5) && a >= b) {
      text = `${a} − ${b}`
      ans = a - b
    } else {
      text = `${a} + ${b}` // add is always available (enabledOps never empty)
      ans = a + b
    }
  }
  return { text, ans, choices: numberChoices(ans, 3, Math.max(0, ans - 6), ans + 6) }
}

function pickEnvs() {
  return shuffle(ENVIRONMENTS).slice(0, 3)
}

function SceneRow({ items, dur, className }: { items: string[]; dur: number; className: string }) {
  return (
    <div className={`scene-row ${className}`} style={{ animationDuration: `${dur}s` }} aria-hidden="true">
      {[...items, ...items].map((e, i) => (
        <span className="scene-item" key={i}>
          {e}
        </span>
      ))}
    </div>
  )
}

function Car({ color, driver }: { color: string; driver: number }) {
  return (
    <span className="car" style={{ '--car': color } as React.CSSProperties}>
      <span className="car-driver">
        <Friend index={driver} scale={50 / friendMaxDim(driver)} showNumber={false} />
      </span>
      <span className="car-body" aria-hidden="true" />
      <span className="car-stripe" aria-hidden="true" />
      <span className="car-light" aria-hidden="true" />
      <span className="car-wheel l" aria-hidden="true" />
      <span className="car-wheel r" aria-hidden="true" />
    </span>
  )
}

export default function CarRace({ onExit }: GameProps) {
  const { t } = useT()
  const [phase, setPhase] = useState<'garage' | 'race'>('garage')
  const [driver, setDriver] = useState(() => randFriendIndex())
  const [carColor, setCarColor] = useState<string>(() => friendColor(driver))
  const [level, setLevel] = useState(() => levelForTier(LEVEL_TIERS, getSettings().difficulty))

  const [correct, setCorrect] = useState(0)
  const [rivalProg, setRivalProg] = useState(0)
  const [envSeq, setEnvSeq] = useState<Env[]>(pickEnvs)
  const [problem, setProblem] = useState(() => makeProblem(levelForTier(LEVEL_TIERS, getSettings().difficulty)))
  const [wrong, setWrong] = useState<number | null>(null)
  const [result, setResult] = useState<null | 'win' | 'lose'>(null)

  const env = envSeq[Math.min(envSeq.length - 1, Math.floor(correct / SEGMENT))]
  const playerProg = correct / WIN

  function startRace() {
    unlockAudio()
    playTap()
    setEnvSeq(pickEnvs())
    setCorrect(0)
    setRivalProg(0)
    setResult(null)
    setProblem(makeProblem(level))
    setPhase('race')
  }

  function raceAgain() {
    playTap()
    setEnvSeq(pickEnvs())
    setCorrect(0)
    setRivalProg(0)
    setResult(null)
    setProblem(makeProblem(level))
  }

  function answer(choice: number) {
    if (result) return
    unlockAudio()
    const isCorrect = choice === problem.ans
    const nextRival = rivalProg + 1 / (WIN + 8) // slower than a steady stream of correct answers
    if (isCorrect) {
      const nc = correct + 1
      setCorrect(nc)
      if (nc >= WIN) {
        setResult('win')
        playWin()
        speak('ניצחת!')
        return
      }
      playSuccess()
      setProblem(makeProblem(level))
    } else {
      setWrong(choice)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
    if (nextRival >= 1 && !isCorrect) {
      setRivalProg(1)
      setResult('lose')
      speak('כמעט! עוד פעם?')
      return
    }
    setRivalProg(nextRival)
  }

  if (phase === 'garage') {
    return (
      <GameShell title={t('race.garage')} emoji="🏎️" onExit={onExit}>
        <div className="garage">
          <p className="garage-title">{t('race.build')} 🔧</p>
          <div className="garage-preview">
            <Car color={carColor} driver={driver} />
          </div>

          <Stepper
            label={`${t('race.driver')}: ${friendName(driver)}`}
            onPrev={() => setDriver((d) => (d + friendCount() - 1) % friendCount())}
            onNext={() => setDriver((d) => (d + 1) % friendCount())}
          />

          <div className="garage-colors">
            {CAR_COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${carColor === c ? 'is-active' : ''}`}
                style={{ background: c }}
                onClick={() => {
                  playTap()
                  setCarColor(c)
                }}
                aria-label={t('race.colorAria')}
              />
            ))}
          </div>

          <div className="garage-levels">
            {LEVEL_TIERS.map((tier, i) => (
              <button
                key={tier}
                className={`pill ${level === i ? 'pill-active' : ''}`}
                onClick={() => {
                  playTap()
                  setLevel(i)
                }}
              >
                {t(`diff.${tier}`)}
              </button>
            ))}
          </div>

          <button className="big-button" onClick={startRace}>
            🏁 {t('race.go')}
          </button>
        </div>
      </GameShell>
    )
  }

  return (
    <GameShell title={t('game.race')} emoji="🏎️" onExit={onExit}>
      <Confetti active={result === 'win'} />
      <div className="race">
        <div className="race-top">
          <button className="pill" onClick={() => setPhase('garage')}>
            🔧 {t('race.garageBtn')}
          </button>
          <span className="race-count">✅ {correct} / {WIN}</span>
          <span className="race-level">{t(`diff.${LEVEL_TIERS[level]}`)}</span>
        </div>

        <div className="race-progress" aria-hidden="true">
          <span className="race-pin rival" style={{ left: `${6 + rivalProg * 82}%` }}>
            🚗
          </span>
          <span className="race-pin player" style={{ left: `${6 + playerProg * 82}%` }}>
            🏎️
          </span>
          <span className="race-flag">🏁</span>
        </div>

        <div
          className="road-scene"
          style={{
            background: `linear-gradient(180deg, ${env.skyTop} 0%, ${env.skyBottom} 54%, ${env.ground} 54%, ${env.ground} 100%)`,
          }}
        >
          <span className="env-name">{t(`race.env.${env.key}`)}</span>
          <SceneRow items={env.clouds} dur={22} className="layer-clouds" />
          <SceneRow items={env.scenery} dur={7} className="layer-scenery" />
          {env.overlay === 'rainbow' && (
            <span className="env-rainbow" aria-hidden="true">
              🌈
            </span>
          )}
          {(env.overlay === 'rain' || env.overlay === 'snow' || env.overlay === 'stars') && (
            <div className={`env-overlay ${env.overlay}`} aria-hidden="true" />
          )}
          <div className="road" aria-hidden="true" style={{ background: env.road }}>
            <div className="road-line" />
          </div>
          <span className={`scene-car ${result === 'win' ? 'is-win' : ''}`}>
            <Car color={carColor} driver={driver} />
          </span>
        </div>

        {result ? (
          <div className="race-result">
            <p className="race-result-text">{result === 'win' ? t('race.win') : t('race.lose')}</p>
            <div className="race-result-btns">
              <button className="big-button" onClick={raceAgain}>
                🔁 {t('race.again')}
              </button>
              <button className="pill" onClick={() => setPhase('garage')}>
                🔧 {t('race.garageBtn')}
              </button>
            </div>
          </div>
        ) : (
          <div className="race-q">
            <span className="race-expr" dir="ltr">
              {problem.text} =
            </span>
            <div className="race-choices">
              {problem.choices.map((n) => (
                <button key={n} className={`race-choice ${wrong === n ? 'is-wrong' : ''}`} onClick={() => answer(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </GameShell>
  )
}
