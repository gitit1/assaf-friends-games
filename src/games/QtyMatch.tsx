import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import Confetti from '../components/Confetti'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS } from '../friends'
import { numberWordNiqqud, randInt, shuffle } from './util'
import { speakNumber } from '../voice'
import { screenScale, useViewport } from '../useViewport'
import { getSettings } from '../settings'
import { useT } from '../i18n'

// "Match the number to the quantity" — pick the group that has exactly that many
// friends. From קשה up it also asks "pick the group with MORE than X". Each group
// is a MIX of different friends (same size, so size is never a hint). No timer.
const MAXT = 30

function tokenPx(maxCount: number) {
  if (maxCount <= 5) return 34
  if (maxCount <= 10) return 28
  if (maxCount <= 16) return 22
  if (maxCount <= 22) return 18
  return 15
}

type Group = { count: number; friends: number[] }
type Round = { mode: 'exact' | 'more'; target: number; groups: Group[]; correct: number }

const cluster = (count: number): number[] => Array.from({ length: count }, () => randInt(0, FRIENDS.length - 1))

function newRound(tier: number): Round {
  if (tier >= 2 && Math.random() < 0.5) {
    // "more than X": exactly one group is above the threshold
    const x = randInt(2, MAXT - 4)
    const big = randInt(x + 1, Math.min(MAXT, x + 6))
    const lows = new Set<number>()
    let guard = 0
    while (lows.size < 2 && guard++ < 200) lows.add(randInt(1, x))
    while (lows.size < 2) lows.add(lows.size + 1) // tiny x fallback
    const counts = shuffle([big, ...lows])
    const groups = counts.map((c) => ({ count: c, friends: cluster(c) }))
    return { mode: 'more', target: x, groups, correct: groups.findIndex((g) => g.count === big) }
  }
  const target = randInt(1, MAXT)
  const set = new Set<number>([target])
  let guard = 0
  while (set.size < 3 && guard++ < 200) {
    const d = target + randInt(1, 3) * (randInt(0, 1) === 0 ? -1 : 1)
    if (d >= 1 && d <= MAXT) set.add(d)
  }
  for (let n = 1; n <= MAXT && set.size < 3; n++) set.add(n)
  const counts = shuffle([...set])
  const groups = counts.map((c) => ({ count: c, friends: cluster(c) }))
  return { mode: 'exact', target, groups, correct: groups.findIndex((g) => g.count === target) }
}

export default function QtyMatch({ onExit }: GameProps) {
  const tier = getSettings().difficulty
  const [round, setRound] = useState<Round>(() => newRound(tier))
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const [party, setParty] = useState(false)
  const vp = useViewport()
  const { t } = useT()

  const maxCount = Math.max(...round.groups.map((g) => g.count))
  const px = tokenPx(maxCount) * screenScale(vp.w)
  const scaleFor = (friend: number) => px / friendMaxDim(friend)

  function say() {
    if (round.mode === 'more') speak(`הקבוצה עם יותר מ-${numberWordNiqqud(round.target)}`)
    else speak(`מצאו ${numberWordNiqqud(round.target)}`)
  }

  useEffect(() => {
    say()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  function pick(i: number) {
    if (solved) return
    unlockAudio()
    if (i === round.correct) {
      setSolved(true)
      const ns = score + 1
      setScore(ns)
      if (ns % 5 === 0) {
        playWin()
        speakNumber(ns)
        setParty(true)
        window.setTimeout(() => setParty(false), 2500)
      } else {
        playSuccess()
        speak('כל הכבוד')
      }
      window.setTimeout(() => {
        setRound(newRound(tier))
        setSolved(false)
      }, 1100)
    } else {
      setWrong(i)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
  }

  return (
    <GameShell title={t('game.quantity')} emoji="🔟" onExit={onExit}>
      <Confetti active={party} />
      <div className="qty-head">
        <span className="qty-score" aria-label={t('bs.score', { n: score })}>
          ⭐ {score}
        </span>
      </div>

      <div className="qty-target-row">
        <span className="qty-prompt">{round.mode === 'more' ? t('qty.more') : t('qty.find')}</span>
        <span className="qty-target" dir="ltr">
          {round.mode === 'more' ? `>${round.target}` : round.target}
        </span>
        <button className="pill qty-say" onClick={say} aria-label={t('bs.replay')}>
          🔊
        </button>
      </div>

      <div className="qty-options">
        {round.groups.map((g, i) => (
          <button
            key={i}
            className={`qty-card ${wrong === i ? 'is-wrong' : ''} ${solved && i === round.correct ? 'is-win' : ''}`}
            onClick={() => pick(i)}
            disabled={solved}
            aria-label={t('qty.groupAria', { n: g.count })}
          >
            <span className="qty-cluster">
              {g.friends.map((f, k) => (
                <Friend key={k} index={f} scale={scaleFor(f)} showNumber={false} bouncing={solved && i === round.correct} />
              ))}
            </span>
          </button>
        ))}
      </div>
    </GameShell>
  )
}
