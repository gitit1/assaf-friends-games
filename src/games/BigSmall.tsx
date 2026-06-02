import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendSay, friendSize } from '../friends'
import { numberWordNiqqud, randInt } from './util'
import { screenScale, useViewport } from '../useViewport'

// "Bigger or smaller?" — two friends appear (each IS its number, so the bigger
// number is also the bigger friend); tap the one the question asks for. No
// timer, wrong taps give a gentle nudge with no penalty.
const MAXN = 10 // compare friends 1..MAXN (clear, steadily growing sizes)

type Goal = 'big' | 'small'
type Round = { a: number; b: number; goal: Goal } // a, b are 1-based numbers

function newRound(prev?: Round): Round {
  const a = randInt(1, MAXN)
  let b = randInt(1, MAXN)
  while (b === a) b = randInt(1, MAXN)
  const goal: Goal = randInt(0, 1) === 0 ? 'big' : 'small'
  // avoid repeating the exact same question back-to-back
  if (prev && prev.goal === goal && Math.max(prev.a, prev.b) === Math.max(a, b) && Math.min(prev.a, prev.b) === Math.min(a, b)) {
    return newRound(prev)
  }
  return { a, b, goal }
}

export default function BigSmall({ onExit }: GameProps) {
  const [round, setRound] = useState<Round>(() => newRound())
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const vp = useViewport()

  const correct = round.goal === 'big' ? Math.max(round.a, round.b) : Math.min(round.a, round.b)
  const prompt = round.goal === 'big' ? 'מי הגדול?' : 'מי הקטן?'

  // Read the question aloud for a non-reader (respects the voice setting).
  useEffect(() => {
    speak(prompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  // Size each friend by its NUMBER (always growing) so the bigger number really
  // looks bigger — scaled up on a big screen, and capped so the two always fit
  // side by side on a phone.
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
        speak(`${numberWordNiqqud(ns)}!`) // calm milestone: announce the running count
      } else {
        playSuccess()
        speak(friendSay(n - 1))
      }
      window.setTimeout(() => {
        setRound((r) => newRound(r))
        setLocked(false)
      }, 950)
    } else {
      setWrong(n)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
  }

  return (
    <GameShell title="גדול או קטן?" emoji="⚖️" onExit={onExit}>
      <div className="bs-head">
        <span className="bs-prompt">{prompt}</span>
        <span className="bs-score" aria-label={`ניקוד ${score}`}>
          ⭐ {score}
        </span>
      </div>
      <button className="pill bs-say" onClick={() => speak(prompt)}>
        🔊 שמע שוב
      </button>

      <div className="bs-pair">
        {[round.a, round.b].map((n, i) => (
          <button
            key={i}
            className={`bs-choice ${wrong === n ? 'is-wrong' : ''} ${locked && n === correct ? 'is-win' : ''}`}
            onClick={() => pick(n)}
            disabled={locked}
            aria-label={`חבר מספר ${n}`}
          >
            <Friend index={n - 1} scale={scaleFor(n)} bouncing={locked && n === correct} />
          </button>
        ))}
      </div>
    </GameShell>
  )
}
