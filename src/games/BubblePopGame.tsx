import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playPop, unlockAudio } from '../audio'
import { randFriendIndex } from '../level'

const COLORS = ['#ffd466', '#86f5c4', '#7cc4f5', '#ff9fb0', '#c9a7ff', '#ffb37c']

type Bubble = {
  id: number
  left: number // percentage 0–100
  size: number // px
  duration: number // seconds to rise
  color: string
  friend: number // a friend floats inside the bubble
}

// A calm, no-fail sensory game: friendly bubbles drift up, tap to pop them.
export default function BubblePopGame({ onExit }: GameProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [popped, setPopped] = useState(0)
  const nextId = useRef(0)

  useEffect(() => {
    const spawn = window.setInterval(() => {
      setBubbles((current) => {
        // Keep the screen from ever feeling crowded/overwhelming.
        if (current.length >= 8) return current
        const id = nextId.current++
        const bubble: Bubble = {
          id,
          left: 6 + Math.random() * 88,
          size: 78 + Math.random() * 56,
          duration: 5 + Math.random() * 3,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          friend: randFriendIndex(),
        }
        return [...current, bubble]
      })
    }, 850)
    return () => window.clearInterval(spawn)
  }, [])

  function remove(id: number) {
    setBubbles((current) => current.filter((b) => b.id !== id))
  }

  function pop(id: number) {
    unlockAudio()
    playPop()
    setPopped((p) => p + 1)
    remove(id)
  }

  return (
    <GameShell title="בועות" emoji="🫧" onExit={onExit}>
      <div className="bubble-counter" aria-label={`פוצצת ${popped} בועות`}>
        🫧 {popped}
      </div>

      <div className="bubble-stage">
        {bubbles.map((bubble) => (
          <button
            key={bubble.id}
            className="bubble"
            style={{
              left: `${bubble.left}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              background: `radial-gradient(circle at 50% 50%, transparent 40%, ${bubble.color}3a 60%, ${bubble.color}66 80%, rgba(255, 255, 255, 0.5))`,
              animationDuration: `${bubble.duration}s`,
            }}
            onAnimationEnd={() => remove(bubble.id)}
            onClick={() => pop(bubble.id)}
            aria-label="בועה"
          >
            <span className="bubble-friend">
              <Friend index={bubble.friend} scale={(bubble.size * 0.6) / FRIEND_NATURAL[friendKindForIndex(bubble.friend)].h} />
            </span>
          </button>
        ))}
      </div>
    </GameShell>
  )
}
