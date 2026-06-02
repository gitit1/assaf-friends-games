// Small shared helpers for the quiz-style games.

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Hebrew feminine number words WITH niqqud (vowel points), built from parts so
// it covers 1–59 correctly. Every place that reads a number ALOUD uses this; the
// niqqud is what makes a Hebrew TTS pronounce it right ("עֶשְׂרִים וּשְׁתַּיִם", not a
// mangled "20 2"). Nothing puts this on screen, so the marks are safe.
const NIQ_ONES = ['', 'אַחַת', 'שְׁתַּיִם', 'שָׁלוֹשׁ', 'אַרְבַּע', 'חָמֵשׁ', 'שֵׁשׁ', 'שֶׁבַע', 'שְׁמוֹנֶה', 'תֵּשַׁע']
const NIQ_TEENS = [
  'עֶשֶׂר', 'אַחַת עֶשְׂרֵה', 'שְׁתֵּים עֶשְׂרֵה', 'שְׁלוֹשׁ עֶשְׂרֵה', 'אַרְבַּע עֶשְׂרֵה', 'חֲמֵשׁ עֶשְׂרֵה',
  'שֵׁשׁ עֶשְׂרֵה', 'שְׁבַע עֶשְׂרֵה', 'שְׁמוֹנֶה עֶשְׂרֵה', 'תְּשַׁע עֶשְׂרֵה',
]
const NIQ_TENS: Record<number, string> = { 20: 'עֶשְׂרִים', 30: 'שְׁלוֹשִׁים', 40: 'אַרְבָּעִים', 50: 'חֲמִשִּׁים' }

export function numberWord(n: number): string {
  if (n >= 1 && n <= 9) return NIQ_ONES[n]
  if (n >= 10 && n <= 19) return NIQ_TEENS[n - 10]
  const tens = n - (n % 10)
  const unit = n % 10
  const tensWord = NIQ_TENS[tens]
  if (tensWord) {
    if (unit === 0) return tensWord
    // the vav is "וּ" before שתיים / שמונה (they start with a shva), else "וְ"
    const vav = unit === 2 || unit === 8 ? 'וּ' : 'וְ'
    return `${tensWord} ${vav}${NIQ_ONES[unit]}`
  }
  return String(n)
}

// kept as an alias so callers that explicitly asked for the vocalised form still work
export const numberWordNiqqud = numberWord

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
