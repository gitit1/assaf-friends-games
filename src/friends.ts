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
  // 11–20 — the bigger friends (deeper rainbow); colours match BIG in FriendArt
  { color: '#e11d48', name: 'טוטו', say: 'טוֹטוֹ' }, // 11
  { color: '#ea580c', name: 'לילי', say: 'לִילִי' }, // 12
  { color: '#ca8a04', name: 'מומו', say: 'מוֹמוֹ' }, // 13
  { color: '#65a30d', name: 'ריקי', say: 'רִיקִי' }, // 14
  { color: '#0d9488', name: 'שושו', say: 'שׁוּשׁוּ' }, // 15
  { color: '#0891b2', name: 'גילי', say: 'גִילִי' }, // 16
  { color: '#2563eb', name: 'רוני', say: 'רוֹנִי' }, // 17
  { color: '#7c3aed', name: 'יויו', say: 'יוֹיוֹ' }, // 18
  { color: '#c026d3', name: 'סופי', say: 'סוֹפִי' }, // 19
  { color: '#be123c', name: 'קיקי', say: 'קִיקִי' }, // 20
  // 21–30 — the biggest friends (deepest, jewel-tone rainbow); colours match BIG
  { color: '#be185d', name: 'רומי', say: 'רוֹמִי' }, // 21
  { color: '#c2410c', name: 'ניני', say: 'נִינִי' }, // 22
  { color: '#a16207', name: 'פופי', say: 'פּוּפִּי' }, // 23
  { color: '#4d7c0f', name: 'תותי', say: 'תּוּתִי' }, // 24
  { color: '#047857', name: 'מישי', say: 'מִישִׁי' }, // 25
  { color: '#0e7490', name: 'בוזי', say: 'בּוּזִי' }, // 26
  { color: '#1d4ed8', name: 'דגי', say: 'דַּגִּי' }, // 27
  { color: '#6d28d9', name: 'לאלה', say: 'לַאלָה' }, // 28
  { color: '#a21caf', name: 'חומי', say: 'חוּמִי' }, // 29
  { color: '#9f1239', name: 'צוצי', say: 'צוּצִי' }, // 30
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
