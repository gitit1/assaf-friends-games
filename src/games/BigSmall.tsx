import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import Confetti from '../components/Confetti'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendSay, friendSize } from '../friends'
import { numberWordNiqqud, randInt } from './util'
import { speakNumber } from '../voice'
import { screenScale, useViewport } from '../useViewport'
import { getSettings } from '../settings'
import { useT } from '../i18n'
import { numberMax } from '../level'

// "Bigger / smaller / closest?" — two friends appear (each IS its number, so the
// bigger number is also the bigger friend). A visual cue SHOWS what we're after
// (a small vs big shape, the wanted one lit + an arrow) because the words alone
// don't mean much to a non-reader. No timer; wrong taps give a gentle nudge.
// Difficulty (from Settings): wider number range, and "closest to X" from קשה up.
type Goal = 'big' | 'small' | 'near'
type Round = { a: number; b: number; goal: Goal; target: number }

const RANGE = [10, 12, 16, 20] // friends 1..N by difficulty tier

function sameQuestion(p: Round, a: number, b: number, goal: Goal) {
  return p.goal === goal && Math.max(p.a, p.b) === Math.max(a, b) && Math.min(p.a, p.b) === Math.min(a, b)
}

function makeRound(maxn: number, allowNear: boolean, prev?: Round): Round {
  const a = randInt(1, maxn)
  let b = randInt(1, maxn)
  while (b === a) b = randInt(1, maxn)
  if (allowNear && Math.random() < 0.4) {
    let x = randInt(1, maxn)
    let guard = 0
    while (Math.abs(a - x) === Math.abs(b - x) && guard++ < 60) x = randInt(1, maxn)
    return { a, b, goal: 'near', target: x }
  }
  const goal: Goal = randInt(0, 1) === 0 ? 'big' : 'small'
  if (prev && sameQuestion(prev, a, b, goal)) return makeRound(maxn, allowNear, prev)
  return { a, b, goal, target: 0 }
}

export default function BigSmall({ onExit }: GameProps) {
  const tier = getSettings().difficulty
  const maxn = Math.max(2, Math.min(RANGE[Math.min(3, tier)], numberMax()))
  const allowNear = tier >= 2
  const [round, setRound] = useState<Round>(() => makeRound(maxn, allowNear))
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [party, setParty] = useState(false) // confetti burst at every 5th in a row
  const vp = useViewport()
  const { t } = useT()

  const correct =
    round.goal === 'big'
      ? Math.max(round.a, round.b)
      : round.goal === 'small'
        ? Math.min(round.a, round.b)
        : Math.abs(round.a - round.target) < Math.abs(round.b - round.target)
          ? round.a
          : round.b

  const prompt =
    round.goal === 'big' ? t('bs.big') : round.goal === 'small' ? t('bs.small') : t('bs.near', { n: round.target })
  // spoken stays Hebrew (the app's voice is Hebrew) regardless of UI language
  const spoken =
    round.goal === 'near'
      ? `מי הכי קרוב ל-${numberWordNiqqud(round.target)}`
      : round.goal === 'big'
        ? 'מי הגדול?'
        : 'מי הקטן?'

  useEffect(() => {
    speak(spoken)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  function scaleFor(n: number) {
    const px = Math.min(friendSize(n, 86, 12, 200) * screenScale(vp.w), vp.w * 0.42, vp.h * 0.42)
    return px / friendMaxDim(n - 1)
  }

  function pick(n: number) {
    if (locked) return
    unlockAudio()
    if (n === correct) {
      setLocked(true)
      const ns = score + 1
      setScore(ns)
      if (ns % 5 === 0) {
        playWin()
        speakNumber(ns)
        setParty(true)
        window.setTimeout(() => setParty(false), 2500)
      } else {
        playSuccess()
        speak(friendSay(n - 1))
      }
      window.setTimeout(() => {
        setRound((r) => makeRound(maxn, allowNear, r))
        setLocked(false)
      }, 950)
    } else {
      setWrong(n)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
  }

  return (
    <GameShell title={t('game.bigsmall')} emoji="⚖️" onExit={onExit}>
      <Confetti active={party} />
      <div className="bs-head">
        <span className="bs-prompt">{prompt}</span>
        <span className="bs-score" aria-label={t('bs.score', { n: score })}>
          ⭐ {score}
        </span>
      </div>

      {/* show the SHAPE of what we want, not just the words */}
      {round.goal === 'near' ? (
        <div className="bs-goal bs-goal-near" aria-hidden="true">
          <span className="bs-goal-bull">🎯</span>
          <span className="bs-goal-num">{round.target}</span>
        </div>
      ) : (
        <div className="bs-goal" aria-hidden="true">
          <span className="bs-goal-arrow">{round.goal === 'big' ? '⬆️' : '⬇️'}</span>
          <span className={`bs-goal-dot small ${round.goal === 'small' ? 'is-target' : ''}`} />
          <span className={`bs-goal-dot big ${round.goal === 'big' ? 'is-target' : ''}`} />
        </div>
      )}

      <button className="pill bs-say" onClick={() => speak(spoken)}>
        🔊 {t('bs.replay')}
      </button>

      <div className="bs-pair">
        {[round.a, round.b].map((n, i) => (
          <button
            key={i}
            className={`bs-choice ${wrong === n ? 'is-wrong' : ''} ${locked && n === correct ? 'is-win' : ''}`}
            onClick={() => pick(n)}
            disabled={locked}
            aria-label={t('bs.friendAria', { n })}
          >
            <Friend index={n - 1} scale={scaleFor(n)} bouncing={locked && n === correct} />
          </button>
        ))}
      </div>
    </GameShell>
  )
}
