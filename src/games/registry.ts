import type { ComponentType } from 'react'
import MemoryGame from './MemoryGame'
import CountGame from './CountGame'
import AddGame from './AddGame'
import CatchFriend from './CatchFriend'
import CalcFriends from './CalcFriends'
import MathRace from './MathRace'
import PopFriends from './PopFriends'
import BigSmall from './BigSmall'
import SeqGame from './SeqGame'
import QtyMatch from './QtyMatch'
import MathChallenge from './MathChallenge'

// Every game gets a callback to return to the home screen.
export type GameProps = {
  onExit: () => void
}

// Home-screen sections. Games are grouped so the home screen stays tidy as the
// roster of games grows. Empty categories are simply not shown.
export type CategoryId = 'numbers' | 'thinking' | 'fun' | 'letters'

export type Category = {
  id: CategoryId
  title: string
  emoji: string
  // Background gradient for the category cube on the home screen.
  color: string
}

export const CATEGORIES: Category[] = [
  { id: 'numbers', title: 'מספרים', emoji: '🔢', color: 'linear-gradient(160deg, #6366f1, #4338ca)' },
  { id: 'thinking', title: 'חשיבה', emoji: '🧠', color: 'linear-gradient(160deg, #22c55e, #15803d)' },
  { id: 'fun', title: 'כיף', emoji: '🎉', color: 'linear-gradient(160deg, #f97316, #db2777)' },
  { id: 'letters', title: 'אותיות', emoji: '🔤', color: 'linear-gradient(160deg, #a855f7, #7c3aed)' },
]

export type GameDef = {
  id: string
  title: string
  emoji: string
  // Background gradient for the game card.
  color: string
  category: CategoryId
  Component: ComponentType<GameProps>
}

// Add a new game by dropping a component here and tagging its category.
export const GAMES: GameDef[] = [
  {
    id: 'count',
    title: 'סופרים',
    emoji: '🔢',
    color: 'linear-gradient(160deg, #8b5cf6, #6d28d9)',
    category: 'numbers',
    Component: CountGame,
  },
  {
    id: 'add',
    title: 'מוסיפים',
    emoji: '➕',
    color: 'linear-gradient(160deg, #ec4899, #be185d)',
    category: 'numbers',
    Component: AddGame,
  },
  {
    id: 'bigsmall',
    title: 'גדול או קטן?',
    emoji: '⚖️',
    color: 'linear-gradient(160deg, #34d399, #059669)',
    category: 'numbers',
    Component: BigSmall,
  },
  {
    id: 'sequence',
    title: 'חבר חסר ברצף',
    emoji: '🧩',
    color: 'linear-gradient(160deg, #38bdf8, #0369a1)',
    category: 'numbers',
    Component: SeqGame,
  },
  {
    id: 'quantity',
    title: 'מספר וכמות',
    emoji: '🔟',
    color: 'linear-gradient(160deg, #fb923c, #c2410c)',
    category: 'numbers',
    Component: QtyMatch,
  },
  {
    id: 'calc',
    title: 'מחשבון',
    emoji: '🧮',
    color: 'linear-gradient(160deg, #14b8a6, #0f766e)',
    category: 'numbers',
    Component: CalcFriends,
  },
  {
    id: 'race',
    title: 'מירוץ חשבון',
    emoji: '🏁',
    color: 'linear-gradient(160deg, #f43f5e, #be123c)',
    category: 'numbers',
    Component: MathRace,
  },
  {
    id: 'challenge',
    title: 'אתגר חשבון',
    emoji: '🎓',
    color: 'linear-gradient(160deg, #818cf8, #4f46e5)',
    category: 'numbers',
    Component: MathChallenge,
  },
  {
    id: 'memory',
    title: 'זיכרון חברים',
    emoji: '🧠',
    color: 'linear-gradient(160deg, #3ba1dc, #1d5f8c)',
    category: 'thinking',
    Component: MemoryGame,
  },
  {
    id: 'catch',
    title: 'תופסים חבר',
    emoji: '🎯',
    color: 'linear-gradient(160deg, #f59f00, #d8632f)',
    category: 'fun',
    Component: CatchFriend,
  },
  {
    id: 'pop',
    title: 'פיצוץ חברים',
    emoji: '🎈',
    color: 'linear-gradient(160deg, #fbbf24, #d97706)',
    category: 'fun',
    Component: PopFriends,
  },
]

export function gamesInCategory(category: CategoryId) {
  return GAMES.filter((game) => game.category === category)
}
