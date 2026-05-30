import type { ComponentType } from 'react'
import MemoryGame from './MemoryGame'
import BubblePopGame from './BubblePopGame'
import CountGame from './CountGame'
import AddGame from './AddGame'
import LettersGame from './LettersGame'
import WordsGame from './WordsGame'

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
    id: 'letters',
    title: 'חידון אותיות',
    emoji: '🔤',
    color: 'linear-gradient(160deg, #9775fa, #6741d9)',
    category: 'more',
    Component: LettersGame,
  },
  {
    id: 'words',
    title: 'חידון מילים',
    emoji: '🗣️',
    color: 'linear-gradient(160deg, #4dabf7, #1c7ed6)',
    category: 'more',
    Component: WordsGame,
  },
  {
    id: 'bubbles',
    title: 'בועות',
    emoji: '🫧',
    color: 'linear-gradient(160deg, #86f5c4, #2f9e8c)',
    category: 'more',
    Component: BubblePopGame,
  },
]

export function gamesInCategory(category: CategoryId) {
  return GAMES.filter((game) => game.category === category)
}
