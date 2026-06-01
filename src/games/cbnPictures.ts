// Pictures for "colour by number". Each cell holds a colour number (1–7, see
// COLORS in ColorByNumber); 0 = empty. Every picture uses 4–6 colours (3 is too
// easy). A mix of hand-drawn objects + colourful generated patterns.
export type Picture = { name: string; grid: number[][] }

// build a grid from compact rows ('.' = empty cell)
const rows = (a: string[]): number[][] => a.map((s) => s.split('').map((ch) => (ch === '.' ? 0 : Number(ch))))
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

export const PICTURES: Picture[] = [...OBJECTS, ...PATTERNS]
