import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS } from '../friends'
import { numberWord, randInt, shuffle } from './util'

// "Match the number to the quantity" — a big numeral is shown; pick the group
// that has exactly that many friends. No timer, wrong picks give a gentle
// nudge. The count is capped (counting huge groups isn't useful) but the friend
// shown is drawn from the whole roster, so new friends appear here too.
const MAXT = 10

type Round = { target: number; token: number; counts: number[] }

function newRound(): Round {
  const target = randInt(1, MAXT)
  const token = randInt(0, FRIENDS.length - 1)
  const counts = new Set<number>([target])
  let guard = 0
  while (counts.size < 3 && guard < 200) {
    guard++
    const d = target + randInt(1, 3) * (randInt(0, 1) === 0 ? -1 : 1)
    if (d >= 1 && d <= MAXT) counts.add(d)
  }
  for (let n = 1; n <= MAXT && counts.size < 3; n++) counts.add(n)
  return { target, token, counts: shuffle([...counts]) }
}

export default function QtyMatch({ onExit }: GameProps) {
  const [round, setRound] = useState<Round>(() => newRound())
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)

  const tokenScale = 34 / friendMaxDim(round.token)

  function say() {
    speak(`מצאו ${numberWord(round.target)}`)
  }

  useEffect(() => {
    say()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  function pick(count: number) {
    if (solved) return
    unlockAudio()
    if (count === round.target) {
      setSolved(true)
      const ns = score + 1
      setScore(ns)
      if (ns % 5 === 0) playWin()
      else playSuccess()
      speak(`${numberWord(round.target)}! כל הכבוד`)
      window.setTimeout(() => {
        setRound(newRound())
        setSolved(false)
      }, 1100)
    } else {
      setWrong(count)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
  }

  return (
    <GameShell title="מספר וכמות" emoji="🔟" onExit={onExit}>
      <div className="qty-head">
        <span className="qty-score" aria-label={`ניקוד ${score}`}>
          ⭐ {score}
        </span>
      </div>

      <div className="qty-target-row">
        <span className="qty-prompt">מצאו</span>
        <span className="qty-target">{round.target}</span>
        <button className="pill qty-say" onClick={say} aria-label="שמע שוב">
          🔊
        </button>
      </div>

      <div className="qty-options">
        {round.counts.map((count) => (
          <button
            key={count}
            className={`qty-card ${wrong === count ? 'is-wrong' : ''} ${
              solved && count === round.target ? 'is-win' : ''
            }`}
            onClick={() => pick(count)}
            disabled={solved}
            aria-label={`קבוצה של ${count}`}
          >
            <span className="qty-cluster">
              {Array.from({ length: count }).map((_, k) => (
                <Friend
                  key={k}
                  index={round.token}
                  scale={tokenScale}
                  showNumber={false}
                  bouncing={solved && count === round.target}
                />
              ))}
            </span>
          </button>
        ))}
      </div>
    </GameShell>
  )
}
