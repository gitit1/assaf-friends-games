// Small shared helpers for the quiz-style games.

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Hebrew number words (feminine, for counting things), 1–50.
const NUM_WORDS = [
  'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר',
  'אחת עשרה', 'שתים עשרה', 'שלוש עשרה', 'ארבע עשרה', 'חמש עשרה',
  'שש עשרה', 'שבע עשרה', 'שמונה עשרה', 'תשע עשרה', 'עשרים',
  'עשרים ואחת', 'עשרים ושתיים', 'עשרים ושלוש', 'עשרים וארבע', 'עשרים וחמש',
  'עשרים ושש', 'עשרים ושבע', 'עשרים ושמונה', 'עשרים ותשע', 'שלושים',
  'שלושים ואחת', 'שלושים ושתיים', 'שלושים ושלוש', 'שלושים וארבע', 'שלושים וחמש',
  'שלושים ושש', 'שלושים ושבע', 'שלושים ושמונה', 'שלושים ותשע', 'ארבעים',
  'ארבעים ואחת', 'ארבעים ושתיים', 'ארבעים ושלוש', 'ארבעים וארבע', 'ארבעים וחמש',
  'ארבעים ושש', 'ארבעים ושבע', 'ארבעים ושמונה', 'ארבעים ותשע', 'חמישים',
]
export function numberWord(n: number) {
  return NUM_WORDS[n - 1] ?? String(n)
}

// Vocalised (niqqud) feminine number words 1–20, for the clearest possible TTS
// pronunciation when we read a count out loud. Falls back to the plain word.
const NUM_WORDS_NIQQUD = [
  'אַחַת', 'שְׁתַּיִם', 'שָׁלוֹשׁ', 'אַרְבַּע', 'חָמֵשׁ', 'שֵׁשׁ', 'שֶׁבַע', 'שְׁמוֹנֶה', 'תֵּשַׁע', 'עֶשֶׂר',
  'אַחַת עֶשְׂרֵה', 'שְׁתֵּים עֶשְׂרֵה', 'שְׁלוֹשׁ עֶשְׂרֵה', 'אַרְבַּע עֶשְׂרֵה', 'חֲמֵשׁ עֶשְׂרֵה',
  'שֵׁשׁ עֶשְׂרֵה', 'שְׁבַע עֶשְׂרֵה', 'שְׁמוֹנֶה עֶשְׂרֵה', 'תְּשַׁע עֶשְׂרֵה', 'עֶשְׂרִים',
]
export function numberWordNiqqud(n: number) {
  return NUM_WORDS_NIQQUD[n - 1] ?? numberWord(n)
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function pickOne<T>(items: T[]): T {
  return items[randInt(0, items.length - 1)]
}

// Build `count` answer choices: the correct value plus nearby numeric distractors,
// all within [min, max], returned in random order.
export function numberChoices(correct: number, count: number, min: number, max: number): number[] {
  const choices = new Set<number>([correct])
  let guard = 0
  while (choices.size < count && guard < 200) {
    guard++
    const delta = randInt(1, 3) * (Math.random() < 0.5 ? -1 : 1)
    const candidate = correct + delta
    if (candidate >= min && candidate <= max) choices.add(candidate)
  }
  // Fall back to filling sequentially if the range was too tight.
  for (let n = min; n <= max && choices.size < count; n++) choices.add(n)
  return shuffle([...choices])
}
