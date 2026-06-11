import { useState } from 'react'
import GameShell from '../components/GameShell'
import { friendCount } from '../level'
import Friend from '../components/Friend'
import Confetti from '../components/Confetti'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playSuccess, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendName, friendSay } from '../friends'
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
// "open" mode: the grown-up picks how many CARDS (always even — they come in
// pairs). Step by 2, from 4 up to the cast size (capped so the board stays sane).
const MIN_CARDS = 4
const OPEN_DEFAULT = 8

type Card = { id: number; friend: number }

// Draw distinct friends from the cast (capped by the level so we never ask for
// more pairs than there are friends; cards auto-scale to fit any friend).
function buildDeck(pairs: number): Card[] {
  const friends = shuffle(Array.from({ length: friendCount() }, (_, i) => i)).slice(0, Math.min(pairs, friendCount()))
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
  const [open, setOpen] = useState(false) // "open" mode: pick the number of cards
  const [openCards, setOpenCards] = useState(OPEN_DEFAULT) // always even
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(initial.pairs))
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [locked, setLocked] = useState(false)

  const vp = useViewport()
  // most cards = the whole cast (paired), capped so the board stays playable
  const maxCards = Math.min(friendCount(), 12) * 2
  // how many pairs are in play right now (open mode vs a preset level)
  const pairs = open ? openCards / 2 : level.pairs
  // win when every distinct friend in the (possibly capped) deck is matched
  const totalPairs = deck.length / 2
  const won = matched.length === totalPairs
  // column count by density; the board fills up to 720px so it's big on a
  // desktop, and each friend fills its (responsive) card.
  const cols = pairs <= 3 ? 3 : pairs <= 8 ? 4 : pairs <= 12 ? 5 : 6
  const boardW = Math.min(720, vp.w * 0.92)
  const cardSize = (boardW - (cols - 1) * 12) / cols
  const friendPx = cardSize * 0.72

  function newDeck(p: number) {
    setDeck(buildDeck(p))
    setFlipped([])
    setMatched([])
    setLocked(false)
  }
  function startPreset(next: Level) {
    unlockAudio()
    playTap()
    setOpen(false)
    setLevel(next)
    newDeck(next.pairs)
  }
  function startOpen(cards = openCards) {
    unlockAudio()
    playTap()
    setOpen(true)
    setOpenCards(cards)
    newDeck(cards / 2)
  }
  function changeCards(delta: number) {
    const next = Math.max(MIN_CARDS, Math.min(maxCards, openCards + delta))
    if (next !== openCards) startOpen(next)
  }
  // 🔄 reshuffle the current board (same mode / size)
  function reshuffle() {
    playTap()
    newDeck(pairs)
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
          if (nextMatched.length === deck.length / 2) playWin()
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
            className={`pill ${!open && lvl.pairs === level.pairs ? 'pill-active' : ''}`}
            onClick={() => startPreset(lvl)}
          >
            {t(`diff.${i}`)}
          </button>
        ))}
        <button className={`pill ${open ? 'pill-active' : ''}`} onClick={() => startOpen()}>
          🎚️ {t('mem.open')}
        </button>
        <button className="pill" onClick={reshuffle}>
          🔄 {t('mem.new')}
        </button>
      </div>

      {open && (
        // pick the number of cards (even, in pairs). dir=ltr keeps ➖ on the left
        // and ➕ on the right in both Hebrew and English.
        <div className="memory-open" dir="ltr">
          <button
            className="pill memory-step"
            onClick={() => changeCards(-2)}
            disabled={openCards <= MIN_CARDS}
            aria-label={t('mem.fewer')}
          >
            ➖
          </button>
          <span className="memory-open-count">
            {openCards} {t('mem.cards')}
          </span>
          <button
            className="pill memory-step"
            onClick={() => changeCards(2)}
            disabled={openCards >= maxCards}
            aria-label={t('mem.more')}
          >
            ➕
          </button>
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
