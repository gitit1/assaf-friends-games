// Pictures for "colour by number". Each cell holds a colour number (1–10, see
// COLORS in ColorByNumber); 0 = empty. A mix of hand-drawn objects + colourful
// generated patterns, spanning a range of sizes/colour-counts (= difficulties).
export type Picture = { name: string; grid: number[][] }

// build a grid from compact rows ('.' = empty cell, 'a' = colour 10 since it's
// two digits and wouldn't fit one character)
const rows = (a: string[]): number[][] =>
  a.map((s) => s.split('').map((ch) => (ch === '.' ? 0 : ch === 'a' ? 10 : Number(ch))))
const make = (w: number, h: number, fn: (r: number, c: number) => number): number[][] =>
  Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => fn(r, c)))
const cyc = (p: number[], i: number) => p[((i % p.length) + p.length) % p.length]

// ---- generated colourful patterns ----
const stripesH = (w: number, h: number, p: number[], name: string): Picture => ({ name, grid: make(w, h, (r) => cyc(p, r)) })
const stripesV = (w: number, h: number, p: number[], name: string): Picture => ({ name, grid: make(w, h, (_, c) => cyc(p, c)) })
const diag = (w: number, h: number, p: number[], name: string): Picture => ({ name, grid: make(w, h, (r, c) => cyc(p, r + c)) })
const checker = (w: number, h: number, p: number[], name: string): Picture => ({
  name,
  grid: make(w, h, (r, c) => cyc(p, (r % 2) + (c % 2) * 2)),
})
const rings = (size: number, p: number[], name: string): Picture => {
  const m = (size - 1) / 2
  return { name, grid: make(size, size, (r, c) => cyc(p, Math.max(Math.abs(r - m), Math.abs(c - m)))) }
}
const diamonds = (size: number, p: number[], name: string): Picture => {
  const m = (size - 1) / 2
  return {
    name,
    grid: make(size, size, (r, c) => {
      const d = Math.abs(r - m) + Math.abs(c - m)
      return d > m ? 0 : cyc(p, d)
    }),
  }
}

// ---- hand-drawn objects ----
const OBJECTS: Picture[] = [
  {
    name: 'בית',
    grid: rows(['...11...', '..1111..', '.111111.', '11111111', '.222222.', '.232232.', '.225522.', '44444444']),
  },
  {
    name: 'פרח',
    grid: rows(['...676...', '..76667..', '.7763677.', '.7732377.', '.7763677.', '..76667..', '...747...', '....4....', '..44444..']),
  },
  {
    name: 'פרצוף',
    grid: rows(['..3333..', '.333333.', '33533533', '33533533', '37333373', '31333313', '.311113.', '..3333..']),
  },
  {
    name: 'דג',
    grid: rows(['....55...', '.555555..', '555565552', '553555722', '555565552', '.555555..', '....55...']),
  },
  {
    name: 'גלידה',
    grid: rows(['..777..', '.77777.', '3333333', '.33333.', '.55555.', '..555..', '.22222.', '..222..', '...2...']),
  },
  {
    name: 'עץ קישוטים',
    grid: rows(['....4....', '...444...', '...414...', '..44444..', '..43474..', '.4444444.', '.4451544.', '....2....', '...222...']),
  },
]

// ~20 more colourful options
const PATTERNS: Picture[] = [
  stripesH(9, 6, [1, 2, 3, 4, 5, 6], 'קשת'),
  stripesH(9, 6, [6, 5, 4, 3, 2, 1], 'קשת הפוכה'),
  stripesV(9, 9, [1, 2, 3, 4, 5, 6], 'פסים'),
  stripesV(9, 9, [7, 5, 3, 4, 6], 'פסים צבעוניים'),
  diag(9, 9, [1, 2, 3, 4, 5, 6], 'אלכסונים'),
  diag(9, 9, [7, 6, 5, 4], 'אלכסון ורוד'),
  diag(10, 8, [3, 2, 1, 7], 'אלכסון שמש'),
  diag(9, 7, [5, 7, 3, 4], 'גלים'),
  rings(9, [1, 3, 4, 5, 6], 'מטרה'),
  rings(9, [5, 6, 7, 4, 3], 'מטרה כחולה'),
  rings(9, [7, 1, 3, 5, 2], 'מטרה צבעונית'),
  rings(7, [2, 4, 6, 7], 'ריבועים'),
  rings(7, [7, 5, 3, 1], 'ריבועים חמים'),
  diamonds(9, [3, 4, 5, 6, 7], 'יהלום'),
  diamonds(9, [1, 2, 3, 7], 'יהלום אדום'),
  diamonds(9, [5, 6, 7, 1, 2], 'יהלום קסם'),
  checker(8, 8, [1, 3, 5, 7], 'לוח משבצות'),
  checker(8, 8, [7, 2, 4, 6], 'ממתקים'),
  checker(10, 8, [1, 5, 3, 4], 'לוח גדול'),
  diag(9, 9, [2, 4, 6, 1, 3, 5], 'אלכסון קשת'),
]

// ---- 13 more hand-drawn objects (the surprise reveals) ----
const OBJECTS2: Picture[] = [
  { name: 'לב', grid: rows(['.11.11.', '1131311', '1111111', '1111111', '.11111.', '..111..', '...1...']) },
  { name: 'תפוח', grid: rows(['...8...', '...84..', '.11111.', '1111111', '1111111', '1111111', '.11111.', '..1.1..']) },
  { name: 'בלון', grid: rows(['.66666.', '6666666', '6666666', '6666666', '.66666.', '..666..', '...6...', '...a...', '...a...']) },
  { name: 'פרפר', grid: rows(['77.....77', '7777a7777', '7766a6677', '6666a6666', '7766a6677', '7777a7777', '77.....77']) },
  { name: 'שמש', grid: rows(['....2....', '2..333..2', '..33333..', '.3333333.', '233333332', '.3333333.', '..33333..', '2..333..2', '....2....']) },
  { name: 'עץ', grid: rows(['...4...', '..444..', '.44444.', '4444444', '.44444.', '..444..', '...8...', '...8...']) },
  { name: 'רקטה', grid: rows(['...5...', '..555..', '..595..', '..555..', '.55555.', '.55555.', '1.555.1', '...2...', '...2...']) },
  { name: 'סירה', grid: rows(['...7.....', '...77....', '...777...', '...7777..', '888888888', '.8888888.', '555555555']) },
  { name: 'מטרייה', grid: rows(['...1...', '.11111.', '1212121', '1111111', '...a...', '...a...', '...a...', '..aa...']) },
  { name: 'פטרייה', grid: rows(['.11111.', '1711171', '1111111', '1117111', '.11111.', '..888..', '..888..']) },
  { name: 'כתר', grid: rows(['3.3.3.3', '3.3.3.3', '3333333', '3173713', '3333333', '3333333']) },
  { name: 'עוגה', grid: rows(['....1....', '....3....', '.7777777.', '888888888', '888888888', '.8888888.', '999999999']) },
  { name: 'ציפור', grid: rows(['..5555..', '.555555.', '55a55552', '.555555.', '..5..5..']) },
]

// ---- 17 more generated patterns (varied size + colour count = difficulty) ----
const PATTERNS2: Picture[] = [
  stripesH(10, 10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'קשת ענקית'),
  stripesV(9, 9, [10, 8, 6, 4, 2], 'פסים כהים'),
  diag(10, 10, [1, 3, 5, 7, 9, 2, 4, 6, 8, 10], 'אלכסון קשת'),
  diag(9, 7, [8, 9, 10, 1], 'אלכסון אדמה'),
  checker(8, 8, [8, 9], 'שחמט'),
  checker(9, 7, [10, 3], 'לילה'),
  rings(11, [9, 5, 6, 8, 1, 2], 'מטרה גדולה'),
  rings(9, [10, 3, 1, 4], 'עין'),
  diamonds(9, [1, 2, 3, 4, 5], 'יהלום גדול'),
  diamonds(9, [6, 7, 8, 9, 10], 'יהלום קר'),
  stripesH(8, 8, [7, 8], 'פסי שוקולד'),
  stripesV(9, 7, [4, 9, 5], 'גלי ים'),
  diag(9, 9, [1, 2, 3], 'אש'),
  checker(9, 9, [1, 3, 5, 7], 'ממתקים'),
  rings(9, [1, 2, 3, 4, 5], 'מטרת קשת'),
  stripesH(10, 8, [5, 6, 9, 10], 'לילה כחול'),
  diamonds(11, [8, 9, 10], 'יהלום אדמה'),
]

export const PICTURES: Picture[] = [...OBJECTS, ...OBJECTS2, ...PATTERNS, ...PATTERNS2]
