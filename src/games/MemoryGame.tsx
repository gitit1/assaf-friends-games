import { useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playSuccess, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendName, friendSay } from '../friends'
import { shuffle } from './util'

type Level = { label: string; pairs: number }
const LEVELS: Level[] = [
  { label: 'קל', pairs: 3 },
  { label: 'רגיל', pairs: 6 },
  { label: 'קשה', pairs: 8 },
  { label: 'אלוף', pairs: 10 },
]

type Card = { id: number; friend: number }

// Draw distinct friends from the whole cast (cards auto-scale to fit any friend).
function buildDeck(pairs: number): Card[] {
  const friends = shuffle(Array.from({ length: FRIENDS.length }, (_, i) => i)).slice(0, pairs)
  const deck = friends.flatMap((friend, i) => [
    { id: i * 2, friend },
    { id: i * 2 + 1, friend },
  ])
  return shuffle(deck)
}

// Find the matching friends by color/face — when two match, that friend says hi.
export default function MemoryGame({ onExit }: GameProps) {
  const [level, setLevel] = useState<Level>(LEVELS[0])
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(LEVELS[0].pairs))
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [locked, setLocked] = useState(false)

  const won = matched.length === level.pairs
  // Friend body size + column count — denser boards use smaller cards.
  const cardPx = level.pairs <= 3 ? 78 : level.pairs <= 6 ? 56 : level.pairs <= 8 ? 50 : 44
  const cols = level.pairs <= 3 ? 3 : level.pairs <= 8 ? 4 : 5

  function reset(next: Level = level) {
    setLevel(next)
    setDeck(buildDeck(next.pairs))
    setFlipped([])
    setMatched([])
    setLocked(false)
  }

  function handleFlip(index: number) {
    if (locked || flipped.includes(index)) return
    const card = deck[index]
    if (matched.includes(card.friend)) return

    unlockAudio()
    playTap()
    const next = [...flipped, index]
    setFlipped(next)

    if (next.length === 2) {
      setLocked(true)
      const [a, b] = next
      if (deck[a].friend === deck[b].friend) {
        const friend = deck[a].friend
        const nextMatched = [...matched, friend]
        window.setTimeout(() => {
          setMatched(nextMatched)
          setFlipped([])
          setLocked(false)
          if (nextMatched.length === level.pairs) playWin()
          else {
            playSuccess()
            speak(friendSay(friend))
          }
        }, 600)
      } else {
        // Gentle: just flip back, no error sound or penalty.
        window.setTimeout(() => {
          setFlipped([])
          setLocked(false)
        }, 900)
      }
    }
  }

  return (
    <GameShell title="זיכרון חברים" emoji="🧠" onExit={onExit}>
      <div className="memory-controls">
        {LEVELS.map((lvl) => (
          <button
            key={lvl.label}
            className={`pill ${lvl.pairs === level.pairs ? 'pill-active' : ''}`}
            onClick={() => reset(lvl)}
          >
            {lvl.label}
          </button>
        ))}
        <button className="pill" onClick={() => reset()}>
          🔄 משחק חדש
        </button>
      </div>

      {won && (
        <div className="banner banner-success" role="status">
          כל הכבוד אסף! 🎉
        </div>
      )}

      <div
        className={`memory-grid ${cols >= 5 ? 'is-wide-board' : ''}`}
        style={{ '--cols': cols } as React.CSSProperties}
      >
        {deck.map((card, index) => {
          const isMatched = matched.includes(card.friend)
          const isOpen = flipped.includes(index) || isMatched
          return (
            <button
              key={card.id}
              className={`memory-card ${isOpen ? 'is-open' : ''} ${isMatched ? 'is-matched' : ''}`}
              onClick={() => handleFlip(index)}
              aria-label={isOpen ? friendName(card.friend) : 'קלף סגור'}
            >
              {isOpen ? (
                <Friend index={card.friend} scale={cardPx / friendMaxDim(card.friend)} showNumber={false} />
              ) : (
                <span className="memory-face" aria-hidden="true">
                  ❓
                </span>
              )}
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}
