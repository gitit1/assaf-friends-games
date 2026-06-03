import type { Dict } from './types'

// Hebrew — the source language. `say` (with niqqud) only where TTS needs help.
// Keys must match en.ts exactly (a build check enforces this).
export const HE: Dict = {
  'app.title': { text: 'עולם החברים' },

  // home screen
  'home.gallery': { text: 'החברים בתלת מימד' },
  'home.meet.title': { text: 'החברים שלי' },
  'home.meet.sub': { text: 'בואו להכיר 👋' },
  'home.categories': { text: 'קטגוריות' },

  // category cubes (ids from registry)
  'cat.numbers': { text: 'מספרים' },
  'cat.thinking': { text: 'חשיבה' },
  'cat.fun': { text: 'כיף' },
  'cat.create': { text: 'יצירה' },
  'cat.letters': { text: 'אותיות' },

  // settings
  'settings.title': { text: 'הגדרות' },
  'settings.lang': { text: 'שפה' },
}
