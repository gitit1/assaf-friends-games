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
// child controls the timing → no time pressure), one hides, and recall who's
// gone. The answer options are the missing friend + friends that were NEVER in
// the group (NOT the ones still on the board), so it's a real memory task, not
// "spot the one not shown". No losing; wrong picks give a gentle nudge.
const LEVELS = [
  { label: 'קל', k: 3 },
  { label: 'רגיל', k: 4 },
  { label: 'אתגר', k: 6 },
]

type Phase = 'show' | 'hide' | 'guess'

function newGroup(k: number): number[] {
  return shuffle(Array.from({ length: FRIENDS.length }, (_, i) => i)).slice(0, k)
}

// options: the missing friend + `count` friends drawn from `outsiders` (friends
// that were NOT in the group)
function pickChoices(missing: number, outsiders: number[], count: number): number[] {
  return shuffle([missing, ...shuffle(outsiders).slice(0, count)])
}

export default function WhoGame({ onExit }: GameProps) {
  const [levelIdx, setLevelIdx] = useState(1)
  const [group, setGroup] = useState<number[]>(() => newGroup(LEVELS[1].k))
  const [phase, setPhase] = useState<Phase>('show')
  const [missing, setMissing] = useState<number | null>(null)
  const [choices, setChoices] = useState<number[]>([])
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
    setChoices([])
    setSolved(false)
    setWrong(null)
    setGroup(newGroup(k))
  }

  function cover() {
    unlockAudio()
    if (phase !== 'show') return
    const m = group[randInt(0, group.length - 1)]
    const outsiders = Array.from({ length: FRIENDS.length }, (_, i) => i).filter((i) => !group.includes(i))
    const count = levelIdx === 2 ? 3 : 2 // a couple more decoys on the hard level
    setMissing(m)
    setChoices(pickChoices(m, outsiders, count))
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
        {group.map((n) => {
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
            {choices.map((n) => (
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
