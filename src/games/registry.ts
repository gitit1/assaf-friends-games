import type { ComponentType } from 'react'
import MemoryGame from './MemoryGame'
import CountGame from './CountGame'
import AddGame from './AddGame'
import CatchFriend from './CatchFriend'
import CalcFriends from './CalcFriends'
import MathRace from './MathRace'
import PopFriends from './PopFriends'

// Every game gets a callback to return to the home screen.
export type GameProps = {
  onExit: () => void
}

// Sections shown on the home screen.
export type CategoryId = 'friends' | 'more'

export type Category = {
  id: CategoryId
  title: string
}

export const CATEGORIES: Category[] = [
  { id: 'friends', title: 'החברים' },
  { id: 'more', title: 'עוד' },
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
    category: 'friends',
    Component: CountGame,
  },
  {
    id: 'add',
    title: 'מוסיפים',
    emoji: '➕',
    color: 'linear-gradient(160deg, #ec4899, #be185d)',
    category: 'friends',
    Component: AddGame,
  },
  {
    id: 'memory',
    title: 'זיכרון חברים',
    emoji: '🧠',
    color: 'linear-gradient(160deg, #3ba1dc, #1d5f8c)',
    category: 'friends',
    Component: MemoryGame,
  },
  {
    id: 'catch',
    title: 'תופסים חבר',
    emoji: '🎯',
    color: 'linear-gradient(160deg, #f59f00, #d8632f)',
    category: 'friends',
    Component: CatchFriend,
  },
  {
    id: 'calc',
    title: 'מחשבון',
    emoji: '🧮',
    color: 'linear-gradient(160deg, #14b8a6, #0f766e)',
    category: 'friends',
    Component: CalcFriends,
  },
  {
    id: 'race',
    title: 'מירוץ חשבון',
    emoji: '🏁',
    color: 'linear-gradient(160deg, #f43f5e, #be123c)',
    category: 'friends',
    Component: MathRace,
  },
  {
    id: 'pop',
    title: 'פיצוץ חברים',
    emoji: '🎈',
    color: 'linear-gradient(160deg, #fbbf24, #d97706)',
    category: 'friends',
    Component: PopFriends,
  },
]

export function gamesInCategory(category: CategoryId) {
  return GAMES.filter((game) => game.category === category)
}
