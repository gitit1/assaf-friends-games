// The cast of "friends" — the heart of the whole app.
// Each friend IS a number: friend #1 is לולו, #2 טוקי, #3 בובי ... so the
// friends carry numeric meaning and help with counting / adding / subtracting.
//
// `name` is what's shown on screen. `say` is a niqqud (vowel-pointed) spelling
// used only for the Hebrew voice, so names like מימי / בובי are pronounced
// correctly. Tweak a single `say` here if the voice still gets one wrong.

export type Friend = {
  color: string
  name: string
  say: string
}

export const FRIENDS: Friend[] = [
  { color: '#ef4444', name: 'לולו', say: 'לוּלוּ' }, // 1 red
  { color: '#f97316', name: 'טוקי', say: 'טוּקִי' }, // 2 orange
  { color: '#facc15', name: 'בובי', say: 'בּוּבִּי' }, // 3 yellow
  { color: '#4ade80', name: 'גוגו', say: 'גוּגוּ' }, // 4 green
  { color: '#14b8a6', name: 'מימי', say: 'מִימִי' }, // 5 teal
  { color: '#22d3ee', name: 'נוני', say: 'נוּנִי' }, // 6 cyan
  { color: '#3b82f6', name: 'פיקו', say: 'פִּיקוֹ' }, // 7 blue
  { color: '#8b5cf6', name: 'דודי', say: 'דוּדִי' }, // 8 violet
  { color: '#ec4899', name: 'זוזו', say: 'זוּזוּ' }, // 9 pink
  { color: '#f43f5e', name: 'קוקו', say: 'קוּקוֹ' }, // 10 red-pink
]

export function friendColor(index: number) {
  return FRIENDS[index % FRIENDS.length].color
}

export function friendName(index: number) {
  return FRIENDS[index % FRIENDS.length].name
}

// What the voice should say (niqqud spelling for correct pronunciation).
export function friendSay(index: number) {
  return FRIENDS[index % FRIENDS.length].say
}

// Each friend's number identity (לולו = 1, טוקי = 2, ...).
export function friendNumber(index: number) {
  return index + 1
}

// Bigger numbers are bigger creatures, so the child sees real magnitudes
// (לולו small, קוקו big). Tunable per screen.
export function friendSize(n: number, base = 70, step = 13, max = 220) {
  return Math.min(max, Math.round(base + (n - 1) * step))
}
