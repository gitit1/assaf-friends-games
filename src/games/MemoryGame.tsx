import { useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import Confetti from '../components/Confetti'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playSuccess, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendName, friendSay } from '../friends'
import { shuffle } from './util'
import { getSettings } from '../settings'
import { levelForTier } from '../difficulty'
import { useViewport } from '../useViewport'
import { useT } from '../i18n'

type Level = { label: string; pairs: number }
const LEVELS: Level[] = [
  { label: 'קל', pairs: 3 },
  { label: 'רגיל', pairs: 6 },
  { label: 'קשה', pairs: 8 },
  { label: 'אלוף', pairs: 10 },
]
// קל / רגיל / קשה / אלוף on the canonical scale
const LEVEL_TIERS = [0, 1, 2, 3]

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
  const { t } = useT()
  const initial = LEVELS[levelForTier(LEVEL_TIERS, getSettings().difficulty)]
  const [level, setLevel] = useState<Level>(initial)
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(initial.pairs))
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [locked, setLocked] = useState(false)

  const vp = useViewport()
  const won = matched.length === level.pairs
  // column count by density; the board fills up to 720px so it's big on a
  // desktop, and each friend fills its (responsive) card.
  const cols = level.pairs <= 3 ? 3 : level.pairs <= 8 ? 4 : 5
  const boardW = Math.min(720, vp.w * 0.92)
  const cardSize = (boardW - (cols - 1) * 12) / cols
  const friendPx = cardSize * 0.72

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
    <GameShell title={t('game.memory')} emoji="🧠" onExit={onExit}>
      <Confetti active={won} />
      <div className="memory-controls">
        {LEVELS.map((lvl, i) => (
          <button
            key={i}
            className={`pill ${lvl.pairs === level.pairs ? 'pill-active' : ''}`}
            onClick={() => reset(lvl)}
          >
            {t(`diff.${i}`)}
          </button>
        ))}
        <button className="pill" onClick={() => reset()}>
          🔄 {t('mem.new')}
        </button>
      </div>

      {won && (
        <div className="banner banner-success" role="status">
          {t('mem.win')}
        </div>
      )}

      <div
        className={`memory-grid ${cols >= 5 ? 'is-wide-board' : ''}`}
        style={{ '--cols': cols, maxWidth: boardW } as React.CSSProperties}
      >
        {deck.map((card, index) => {
          const isMatched = matched.includes(card.friend)
          const isOpen = flipped.includes(index) || isMatched
          return (
            <button
              key={card.id}
              className={`memory-card ${isOpen ? 'is-open' : ''} ${isMatched ? 'is-matched' : ''}`}
              onClick={() => handleFlip(index)}
              aria-label={isOpen ? friendName(card.friend) : t('mem.closed')}
            >
              <span className="memory-inner">
                <span className="memory-front" aria-hidden="true">
                  ❓
                </span>
                <span className="memory-back" aria-hidden="true">
                  {isOpen && <Friend index={card.friend} scale={friendPx / friendMaxDim(card.friend)} showNumber={false} />}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}
