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
  'cat.sports': { text: 'ספורט' },

  // shared frame
  'nav.home': { text: 'בית' },
  'nav.home.aria': { text: 'חזרה למסך הבית' },
  'nav.prev': { text: 'הקודם' },
  'nav.next': { text: 'הבא' },

  // meet-the-friends screen
  'meet.intro': { text: 'געו בחבר כדי להיכנס לעולם שלו! 👋' },

  // game titles (ids from registry)
  'game.count': { text: 'סופרים' },
  'game.add': { text: 'מוסיפים' },
  'game.build': { text: 'בונים מספר' },
  'game.bigsmall': { text: 'גדול או קטן?' },
  'game.sequence': { text: 'חבר חסר ברצף' },
  'game.quantity': { text: 'מספר וכמות' },
  'game.calc': { text: 'מחשבון' },
  'game.race': { text: 'מרוץ מכוניות' },
  'game.challenge': { text: 'אתגר חשבון' },
  'game.memory': { text: 'זיכרון חברים' },
  'game.who': { text: 'מי נעלם?' },
  'game.pattern': { text: 'תבניות' },
  'game.sort': { text: 'מיון' },
  'game.catch': { text: 'תופסים חבר' },
  'game.pop': { text: 'פיצוץ חברים' },
  'game.piano': { text: 'פסנתר חברים' },
  'game.pet': { text: 'החבר שלי' },
  'game.dice': { text: 'מגלגלים קובייה' },
  'game.colorme': { text: 'צובעים חבר' },
  'game.dots': { text: 'חיבור נקודות' },
  'game.draw': { text: 'ציור חופשי' },
  'game.paintnum': { text: 'צביעה לפי מספר' },
  'game.drawnum': { text: 'מציירים מספר' },
  'game.letter': { text: 'איזה חבר?' },
  'game.basket': { text: 'זריקה לסל' },
  'game.goal': { text: 'בעיטה לשער' },
  'game.hockey': { text: 'הוקי אוויר' },
  'game.bowling': { text: 'באולינג' },

  // count game
  'count.step': { text: 'קפיצות' },
  'count.up': { text: '⬆️ עולה' },
  'count.down': { text: '⬇️ יורד' },
  'count.go': { text: '👆 סופרים!' },
  'count.new': { text: '🎲 עוד' },
  'speed.slow': { text: 'איטי' },
  'speed.normal': { text: 'רגיל' },
  'speed.fast': { text: 'מהיר' },

  // settings
  'settings.title': { text: 'הגדרות' },
  'settings.lang': { text: 'שפה' },
  'settings.hi': { text: 'שלום אסף', say: 'שָׁלוֹם אָסָף' },
  'settings.voice': { text: '🔊 קול' },
  'settings.voice.hint': { text: 'הקראה ועידוד לאסף' },
  'settings.voiceMissing': { text: 'לא נמצא קול עברי במכשיר הזה. אפשר להתקין קול עברית בהגדרות הטלפון, או להמשיך עם צלילים בלבד.' },
  'settings.sound': { text: '🎵 צלילים' },
  'settings.sound.hint': { text: 'צלילי מגע והצלחה' },
  'settings.names': { text: '🗣️ שמות החברים' },
  'settings.names.hint': { text: 'להשמיע את שם/מספר החבר בלחיצה' },
  'settings.motion': { text: '🌙 תנועה רגועה' },
  'settings.motion.hint': { text: 'פחות אנימציות — נעים יותר לעיניים' },
  'settings.difficulty': { text: '🎯 רמת קושי' },
  'settings.difficulty.hint': { text: 'איך כל משחק מתחיל (אפשר לשנות גם בתוך המשחק)' },
  'settings.catch': { text: '⏱️ החלפת חבר' },
  'settings.catch.hint': { text: 'במשחק "תופסים חבר"' },
  'settings.catch.half': { text: 'חצי דקה' },
  'settings.catch.min': { text: 'דקה' },
  'settings.close': { text: 'סגירה' },
  'diff.0': { text: 'קל' },
  'diff.1': { text: 'בינוני' },
  'diff.2': { text: 'קשה' },
  'diff.3': { text: 'אלוף' },
}
