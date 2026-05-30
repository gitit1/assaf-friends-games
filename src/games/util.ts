// Small shared helpers for the quiz-style games.

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Hebrew number words (feminine, for counting things), 1–10.
const NUM_WORDS = ['אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר']
export function numberWord(n: number) {
  return NUM_WORDS[n - 1] ?? String(n)
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
