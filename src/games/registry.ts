import type { ComponentType } from 'react'
import MemoryGame from './MemoryGame'
import SkipCount from './SkipCount'
import PlaceValue from './PlaceValue'
import MissingNumber from './MissingNumber'
import CatchFriend from './CatchFriend'
import CalcFriends from './CalcFriends'
import CarRace from './CarRace'
import PopFriends from './PopFriends'
import BigSmall from './BigSmall'
import SeqGame from './SeqGame'
import QtyMatch from './QtyMatch'
import MathChallenge from './MathChallenge'
import WhoGame from './WhoGame'
import PianoFriends from './PianoFriends'
import Tamagotchi from './Tamagotchi'
import ColorFriends from './ColorFriends'
import ConnectDots from './ConnectDots'
import RollDice from './RollDice'
import DrawBoard from './DrawBoard'
import ColorByNumber from './ColorByNumber'
import DrawNumber from './DrawNumber'
import SortByColor from './SortByColor'
import WhichFriend from './WhichFriend'
import BuildNumber from './BuildNumber'
import PatternGame from './PatternGame'
import BasketGame from './BasketGame'
import GoalGame from './GoalGame'
import HockeyGame from './HockeyGame'
import BowlingGame from './BowlingGame'
import DanceGame from './DanceGame'
import LaughGame from './LaughGame'
import ParrotGame from './ParrotGame'
import IceCreamGame from './IceCreamGame'
import BubblePopGame from './BubblePopGame'
import SpellWord from './SpellWord'

// Every game gets a callback to return to the home screen.
export type GameProps = {
  onExit: () => void
  // when opened from a friend's world, that friend's index (so e.g. the dance
  // game shows THAT friend dancing)
  friend?: number
}

// Home-screen sections. Games are grouped so the home screen stays tidy as the
// roster of games grows. Empty categories are simply not shown.
export type CategoryId = 'numbers' | 'thinking' | 'fun' | 'create' | 'letters' | 'sports' | 'english'

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
  { id: 'create', title: 'יצירה', emoji: '🎨', color: 'linear-gradient(160deg, #facc15, #ec4899)' },
  { id: 'letters', title: 'אותיות', emoji: '🔤', color: 'linear-gradient(160deg, #a855f7, #7c3aed)' },
  { id: 'sports', title: 'ספורט', emoji: '🏀', color: 'linear-gradient(160deg, #fb923c, #ea580c)' },
  { id: 'english', title: 'אנגלית', emoji: '🔠', color: 'linear-gradient(160deg, #0ea5e9, #4338ca)' },
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
    id: 'skipcount',
    title: 'קפיצות',
    emoji: '🦘',
    color: 'linear-gradient(160deg, #8b5cf6, #6d28d9)',
    category: 'numbers',
    Component: SkipCount,
  },
  {
    id: 'placevalue',
    title: 'עשרות ואחדות',
    emoji: '🔟',
    color: 'linear-gradient(160deg, #ec4899, #be185d)',
    category: 'numbers',
    Component: PlaceValue,
  },
  {
    id: 'build',
    title: 'בונים מספר',
    emoji: '🧱',
    color: 'linear-gradient(160deg, #f472b6, #7c3aed)',
    category: 'numbers',
    Component: BuildNumber,
  },
  {
    id: 'missing',
    title: 'המספר החסר',
    emoji: '❓',
    color: 'linear-gradient(160deg, #2dd4bf, #0d9488)',
    category: 'numbers',
    Component: MissingNumber,
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
    title: 'מרוץ מכוניות',
    emoji: '🏎️',
    color: 'linear-gradient(160deg, #f43f5e, #be123c)',
    category: 'numbers',
    Component: CarRace,
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
    id: 'who',
    title: 'מי נעלם?',
    emoji: '🙈',
    color: 'linear-gradient(160deg, #c084fc, #7e22ce)',
    category: 'thinking',
    Component: WhoGame,
  },
  {
    id: 'pattern',
    title: 'תבניות',
    emoji: '🔵',
    color: 'linear-gradient(160deg, #38bdf8, #6366f1)',
    category: 'thinking',
    Component: PatternGame,
  },
  {
    id: 'sort',
    title: 'מיון',
    emoji: '🧺',
    color: 'linear-gradient(160deg, #34d399, #0d9488)',
    category: 'thinking',
    Component: SortByColor,
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
  {
    id: 'piano',
    title: 'פסנתר חברים',
    emoji: '🎹',
    color: 'linear-gradient(160deg, #2dd4bf, #0891b2)',
    category: 'fun',
    Component: PianoFriends,
  },
  {
    id: 'pet',
    title: 'החבר שלי',
    emoji: '🐣',
    color: 'linear-gradient(160deg, #86efac, #16a34a)',
    category: 'fun',
    Component: Tamagotchi,
  },
  {
    id: 'dice',
    title: 'מגלגלים קובייה',
    emoji: '🎲',
    color: 'linear-gradient(160deg, #fb7185, #9333ea)',
    category: 'fun',
    Component: RollDice,
  },
  {
    id: 'dance',
    title: 'ריקוד',
    emoji: '💃',
    color: 'linear-gradient(160deg, #f472b6, #a855f7)',
    category: 'fun',
    Component: DanceGame,
  },
  {
    id: 'laugh',
    title: 'צחוק',
    emoji: '😂',
    color: 'linear-gradient(160deg, #fbbf24, #f97316)',
    category: 'fun',
    Component: LaughGame,
  },
  {
    id: 'parrot',
    title: 'תוכי',
    emoji: '🦜',
    color: 'linear-gradient(160deg, #4ade80, #0891b2)',
    category: 'fun',
    Component: ParrotGame,
  },
  {
    id: 'icecream',
    title: 'גלידה',
    emoji: '🍦',
    color: 'linear-gradient(160deg, #f9a8d4, #c084fc)',
    category: 'fun',
    Component: IceCreamGame,
  },
  {
    id: 'bubbles',
    title: 'בועות',
    emoji: '🫧',
    color: 'linear-gradient(160deg, #7cc4f5, #c084fc)',
    category: 'fun',
    Component: BubblePopGame,
  },
  {
    id: 'colorme',
    title: 'צובעים חבר',
    emoji: '🖌️',
    color: 'linear-gradient(160deg, #f472b6, #be185d)',
    category: 'create',
    Component: ColorFriends,
  },
  {
    id: 'dots',
    title: 'חיבור נקודות',
    emoji: '✏️',
    color: 'linear-gradient(160deg, #38bdf8, #6366f1)',
    category: 'create',
    Component: ConnectDots,
  },
  {
    id: 'draw',
    title: 'ציור חופשי',
    emoji: '🖍️',
    color: 'linear-gradient(160deg, #34d399, #0ea5e9)',
    category: 'create',
    Component: DrawBoard,
  },
  {
    id: 'paintnum',
    title: 'צביעה לפי מספר',
    emoji: '🧩',
    color: 'linear-gradient(160deg, #fbbf24, #16a34a)',
    category: 'create',
    Component: ColorByNumber,
  },
  {
    id: 'drawnum',
    title: 'מציירים מספר',
    emoji: '✍️',
    color: 'linear-gradient(160deg, #fb923c, #db2777)',
    category: 'create',
    Component: DrawNumber,
  },
  {
    id: 'letter',
    title: 'איזה חבר?',
    emoji: '🔤',
    color: 'linear-gradient(160deg, #a855f7, #6d28d9)',
    category: 'letters',
    Component: WhichFriend,
  },
  {
    id: 'basket',
    title: 'זריקה לסל',
    emoji: '🏀',
    color: 'linear-gradient(160deg, #fb923c, #ea580c)',
    category: 'sports',
    Component: BasketGame,
  },
  {
    id: 'goal',
    title: 'בעיטה לשער',
    emoji: '⚽',
    color: 'linear-gradient(160deg, #4ade80, #16a34a)',
    category: 'sports',
    Component: GoalGame,
  },
  {
    id: 'hockey',
    title: 'הוקי אוויר',
    emoji: '🏒',
    color: 'linear-gradient(160deg, #38bdf8, #0369a1)',
    category: 'sports',
    Component: HockeyGame,
  },
  {
    id: 'bowling',
    title: 'באולינג',
    emoji: '🎳',
    color: 'linear-gradient(160deg, #f472b6, #be185d)',
    category: 'sports',
    Component: BowlingGame,
  },
  {
    id: 'spell',
    title: 'בונים מילה',
    emoji: '🔠',
    color: 'linear-gradient(160deg, #0ea5e9, #4338ca)',
    category: 'english',
    Component: SpellWord,
  },
]

export function gamesInCategory(category: CategoryId) {
  return GAMES.filter((game) => game.category === category)
}
