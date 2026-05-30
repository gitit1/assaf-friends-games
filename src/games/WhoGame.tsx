import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendSay } from '../friends'
import { randInt, shuffle } from './util'

// "Who's missing?" — look at a group of friends, cover them when ready (the
// child controls the timing → no time pressure), one hides, and pick who's
// gone. No losing; wrong picks give a gentle nudge. Difficulty = group size.
const LEVELS = [
  { label: 'קל', k: 3 },
  { label: 'רגיל', k: 4 },
  { label: 'אתגר', k: 6 },
]

type Phase = 'show' | 'hide' | 'guess'
type Round = { group: number[]; order: number[] }

function newRound(k: number): Round {
  const group = shuffle(Array.from({ length: FRIENDS.length }, (_, i) => i)).slice(0, k)
  return { group, order: shuffle([...group]) }
}

export default function WhoGame({ onExit }: GameProps) {
  const [levelIdx, setLevelIdx] = useState(1)
  const [round, setRound] = useState<Round>(() => newRound(LEVELS[1].k))
  const [phase, setPhase] = useState<Phase>('show')
  const [missing, setMissing] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)

  const scaleTo = (px: number, n: number) => px / friendMaxDim(n)

  useEffect(() => {
    if (phase === 'guess') speak('מי נעלם?')
  }, [phase])

  function start(k: number, li: number) {
    setLevelIdx(li)
    setPhase('show')
    setMissing(null)
    setSolved(false)
    setWrong(null)
    setRound(newRound(k))
  }

  function cover() {
    unlockAudio()
    if (phase !== 'show') return
    setMissing(round.group[randInt(0, round.group.length - 1)])
    setPhase('hide')
    window.setTimeout(() => setPhase('guess'), 850)
  }

  function pick(n: number) {
    if (phase !== 'guess' || solved) return
    unlockAudio()
    if (n === missing) {
      setSolved(true)
      const ns = score + 1
      setScore(ns)
      if (ns % 5 === 0) playWin()
      else playSuccess()
      speak(`${friendSay(n)}! כל הכבוד`)
      window.setTimeout(() => start(LEVELS[levelIdx].k, levelIdx), 1300)
    } else {
      setWrong(n)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
  }

  return (
    <GameShell title="מי נעלם?" emoji="🙈" onExit={onExit}>
      <div className="who-head">
        <div className="who-levels">
          {LEVELS.map((l, i) => (
            <button key={l.label} className={`pill ${i === levelIdx ? 'pill-active' : ''}`} onClick={() => start(l.k, i)}>
              {l.label}
            </button>
          ))}
        </div>
        <span className="who-score" aria-label={`ניקוד ${score}`}>
          ⭐ {score}
        </span>
      </div>

      <div className="who-row">
        {round.group.map((n) => {
          if (phase === 'hide') {
            return (
              <span className="who-cover" key={n} aria-hidden="true">
                🙈
              </span>
            )
          }
          if (phase === 'guess' && n === missing && !solved) {
            return (
              <span className="who-gap" key={n} aria-hidden="true">
                ?
              </span>
            )
          }
          return (
            <span className="who-item" key={n}>
              <Friend index={n} scale={scaleTo(64, n)} bouncing={solved && n === missing} />
            </span>
          )
        })}
      </div>

      {phase === 'show' && (
        <button className="big-button who-cta" onClick={cover}>
          🙈 כסו אותם!
        </button>
      )}

      {phase === 'guess' && (
        <>
          <p className="who-prompt">מי נעלם?</p>
          <div className="who-choices">
            {round.order.map((n) => (
              <button
                key={n}
                className={`who-choice ${wrong === n ? 'is-wrong' : ''}`}
                onClick={() => pick(n)}
                disabled={solved}
                aria-label={`חבר מספר ${n + 1}`}
              >
                <Friend index={n} scale={scaleTo(72, n)} />
              </button>
            ))}
          </div>
        </>
      )}
    </GameShell>
  )
}
