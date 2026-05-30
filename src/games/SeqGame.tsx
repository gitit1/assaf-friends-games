import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playFriend, playNudge, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendSay } from '../friends'
import { numberWord, randInt, shuffle } from './util'

// "Missing friend in the sequence" — show a run of friends in order with one
// gap (e.g. 1 · 2 · _ · 4) and pick the friend that completes it. No timer,
// wrong picks give a gentle nudge with no penalty. Tap any friend to hear its
// number + name.
const LEN = 4 // how many friends in the run
const MAXN = 20

type Round = { start: number; gapPos: number; choices: number[] }

// answer options: the missing number + nearby distractors, none of them a
// number already visible in the run
function pickChoices(missing: number, visible: number[]): number[] {
  const set = new Set<number>([missing])
  let guard = 0
  while (set.size < 3 && guard < 200) {
    guard++
    const d = missing + randInt(1, 3) * (randInt(0, 1) === 0 ? -1 : 1)
    if (d >= 1 && d <= MAXN && !visible.includes(d)) set.add(d)
  }
  for (let n = 1; n <= MAXN && set.size < 3; n++) if (n === missing || !visible.includes(n)) set.add(n)
  return shuffle([...set])
}

function newRound(): Round {
  const start = randInt(1, MAXN - LEN + 1)
  const gapPos = randInt(1, LEN - 1) // interior or last (never the first — needs context)
  const missing = start + gapPos
  const visible = Array.from({ length: LEN }, (_, i) => start + i).filter((_, i) => i !== gapPos)
  return { start, gapPos, choices: pickChoices(missing, visible) }
}

export default function SeqGame({ onExit }: GameProps) {
  const [round, setRound] = useState<Round>(() => newRound())
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const [poked, setPoked] = useState<number | null>(null)

  const missing = round.start + round.gapPos
  const seqScale = (n: number) => 78 / friendMaxDim(n - 1)
  const choiceScale = (n: number) => 84 / friendMaxDim(n - 1)

  useEffect(() => {
    speak('איזה חבר חסר?')
  }, [round])

  // tap a friend to hear its number + name
  function sayFriend(n: number) {
    unlockAudio()
    playFriend(n - 1)
    speak(`${numberWord(n)}. ${friendSay(n - 1)}`)
    setPoked(n)
    window.setTimeout(() => setPoked(null), 550)
  }

  function pick(n: number) {
    if (solved) return
    unlockAudio()
    if (n === missing) {
      setSolved(true)
      const ns = score + 1
      setScore(ns)
      if (ns % 5 === 0) playWin()
      else playSuccess()
      speak(`${numberWord(missing)}. ${friendSay(missing - 1)}`)
      window.setTimeout(() => {
        setRound(newRound())
        setSolved(false)
      }, 1100)
    } else {
      setWrong(n)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
  }

  return (
    <GameShell title="חבר חסר ברצף" emoji="🧩" onExit={onExit}>
      <div className="seq-head">
        <span className="seq-prompt">איזה חבר חסר?</span>
        <span className="seq-score" aria-label={`ניקוד ${score}`}>
          ⭐ {score}
        </span>
      </div>
      <button className="pill seq-say" onClick={() => speak('איזה חבר חסר?')}>
        🔊 שמע שוב
      </button>

      <div className="seq-row" dir="ltr">
        {Array.from({ length: LEN }).map((_, i) => {
          const num = round.start + i
          if (i === round.gapPos && !solved) {
            return (
              <span className="seq-item" key={i}>
                <span className="seq-num seq-num-empty">?</span>
                <span className="seq-gap">?</span>
              </span>
            )
          }
          return (
            <button
              className="seq-item"
              key={i}
              onClick={() => sayFriend(num)}
              aria-label={`חבר מספר ${num}`}
            >
              <span className="seq-num">{num}</span>
              <Friend index={num - 1} scale={seqScale(num)} showNumber={false} bouncing={poked === num || (i === round.gapPos && solved)} />
            </button>
          )
        })}
      </div>

      <div className="seq-choices">
        {round.choices.map((n) => (
          <button
            key={n}
            className={`seq-choice ${wrong === n ? 'is-wrong' : ''}`}
            onClick={() => pick(n)}
            disabled={solved}
            aria-label={`חבר מספר ${n}`}
          >
            <span className="seq-num">{n}</span>
            <Friend index={n - 1} scale={choiceScale(n)} showNumber={false} />
          </button>
        ))}
      </div>
    </GameShell>
  )
}
