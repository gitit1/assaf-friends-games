import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playPop, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendName, friendSay } from '../friends'
import { useSettings } from '../settings'
import { randInt, shuffle } from './util'

const COUNT = 10 // friend identities (indices 0..9)
const BOARD = 8 // friends visible at once
const MIN_TARGETS = 2 // always keep at least this many catchable targets

type Card = { id: number; index: number; x: number; y: number; popping: boolean }

let nextId = 0

function makeCard(index: number): Card {
  return { id: nextId++, index, x: 4 + Math.random() * 72, y: 6 + Math.random() * 64, popping: false }
}

// Make sure at least `min` of the cards are the target (convert random others).
function ensureTargets(cards: Card[], target: number, min: number): Card[] {
  let have = cards.filter((c) => c.index === target).length
  if (have >= min) return cards
  const copy = cards.map((c) => ({ ...c }))
  for (const c of shuffle(copy)) {
    if (have >= min) break
    if (c.index !== target) {
      c.index = target
      have++
    }
  }
  return copy
}

// Show a target friend; tap matching friends on the board to pop them for a
// point. A mix of friends is always on the board (with at least a couple of
// catchable ones), and the target switches on an interval set in settings.
export default function CatchFriend({ onExit }: GameProps) {
  const { catchSeconds } = useSettings()
  const [target, setTarget] = useState(() => randInt(0, COUNT - 1))
  const [cards, setCards] = useState<Card[]>(() => {
    const arr = Array.from({ length: BOARD }, () => makeCard(randInt(0, COUNT - 1)))
    return ensureTargets(arr, target, MIN_TARGETS)
  })
  const [score, setScore] = useState(0)
  const [wrongId, setWrongId] = useState<number | null>(null)
  const timers = useRef<number[]>([])
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

  // Announce the new target and make sure enough catchable ones are present.
  useEffect(() => {
    speak(`תפסו את ${friendSay(target)}`)
    setCards((cs) => ensureTargets(cs, target, MIN_TARGETS))
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
          const targetsLeft = remaining.filter((c) => c.index === tgt).length
          // Keep a couple of targets around, otherwise add variety (any friend).
          const index = targetsLeft < MIN_TARGETS ? tgt : randInt(0, COUNT - 1)
          return [...remaining, makeCard(index)]
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
            <Friend index={card.index} scale={0.3} showNumber={false} bouncing={card.popping} />
          </button>
        ))}
      </div>
    </GameShell>
  )
}
