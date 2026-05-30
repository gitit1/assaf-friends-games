import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playPop, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendName, friendSay } from '../friends'
import { useSettings } from '../settings'
import { randInt } from './util'

const COUNT = 10 // friend identities (indices 0..9)
const BOARD = 6 // friends visible at once

type Card = { id: number; index: number; x: number; y: number; popping: boolean }

let nextId = 0

function makeCard(target: number): Card {
  // Bias toward the target so there's usually one to catch.
  const index = Math.random() < 0.45 ? target : randInt(0, COUNT - 1)
  return { id: nextId++, index, x: 4 + Math.random() * 68, y: 6 + Math.random() * 62, popping: false }
}

// Show a target friend; tap matching friends on the board to pop them for a
// point. The target friend changes on an interval set in settings. No timer
// pressure on each tap, no penalty for wrong taps.
export default function CatchFriend({ onExit }: GameProps) {
  const { catchSeconds } = useSettings()
  const [target, setTarget] = useState(() => randInt(0, COUNT - 1))
  const [cards, setCards] = useState<Card[]>(() => {
    const arr = Array.from({ length: BOARD }, () => makeCard(target))
    if (!arr.some((c) => c.index === target)) arr[0].index = target
    return arr
  })
  const [score, setScore] = useState(0)
  const [wrongId, setWrongId] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  // Latest target, readable from delayed callbacks (spawning a replacement).
  const targetRef = useRef(target)
  useEffect(() => {
    targetRef.current = target
  }, [target])

  useEffect(() => {
    const all = timers.current
    return () => all.forEach((t) => window.clearTimeout(t))
  }, [])

  // Switch the target friend every `catchSeconds`.
  useEffect(() => {
    const id = window.setInterval(() => {
      setTarget((prev) => {
        let next = randInt(0, COUNT - 1)
        if (next === prev) next = (next + 1) % COUNT
        return next
      })
    }, catchSeconds * 1000)
    return () => window.clearInterval(id)
  }, [catchSeconds])

  // Announce the target and make sure at least one is on the board.
  useEffect(() => {
    speak(`תפסו את ${friendSay(target)}`)
    setCards((cs) => {
      if (cs.some((c) => c.index === target)) return cs
      const i = randInt(0, cs.length - 1)
      return cs.map((c, idx) => (idx === i ? { ...c, index: target } : c))
    })
  }, [target])

  function tap(card: Card) {
    unlockAudio()
    if (card.popping) return
    if (card.index === target) {
      setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, popping: true } : c)))
      playPop()
      setScore((s) => {
        const ns = s + 1
        if (ns % 5 === 0) playWin()
        else playSuccess()
        return ns
      })
      const t = window.setTimeout(() => {
        setCards((cs) => {
          const remaining = cs.filter((c) => c.id !== card.id)
          const tgt = targetRef.current
          const next = makeCard(tgt)
          // Always keep at least one catchable target on the board.
          if (!remaining.some((c) => c.index === tgt)) next.index = tgt
          return [...remaining, next]
        })
      }, 430)
      timers.current.push(t)
    } else {
      setWrongId(card.id)
      const t = window.setTimeout(() => setWrongId(null), 360)
      timers.current.push(t)
    }
  }

  return (
    <GameShell title="תופסים חבר" emoji="🎯" onExit={onExit}>
      <div className="catch-target">
        <span className="catch-target-label">תפסו את</span>
        <Friend index={target} scale={0.42} />
        <span className="catch-target-name">{friendName(target)}</span>
        <span className="catch-score" aria-label={`ניקוד ${score}`}>
          ⭐ {score}
        </span>
      </div>

      <div className="catch-board">
        {cards.map((card) => (
          <button
            key={card.id}
            className={`catch-card ${card.popping ? 'is-pop' : ''} ${wrongId === card.id ? 'is-wrong' : ''}`}
            style={{ left: `${card.x}%`, top: `${card.y}%` }}
            onClick={() => tap(card)}
            aria-label={friendName(card.index)}
          >
            <Friend index={card.index} scale={0.32} showNumber={false} bouncing={card.popping} />
          </button>
        ))}
      </div>
    </GameShell>
  )
}
