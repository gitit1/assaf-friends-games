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
  // 31–40 — a fresh, bright rainbow (a new "candy" set); colours match BIG
  { color: '#dc2626', name: 'טינו', say: 'טִינוֹ' }, // 31
  { color: '#f59e0b', name: 'רוזי', say: 'רוֹזִי' }, // 32
  { color: '#eab308', name: 'ליאו', say: 'לֵיאוֹ' }, // 33
  { color: '#84cc16', name: 'מיקה', say: 'מִיקָה' }, // 34
  { color: '#10b981', name: 'גוזי', say: 'גוּזִי' }, // 35
  { color: '#06b6d4', name: 'בינו', say: 'בִּינוֹ' }, // 36
  { color: '#0ea5e9', name: 'טופי', say: 'טוֹפִי' }, // 37
  { color: '#6366f1', name: 'קימי', say: 'קִימִי' }, // 38
  { color: '#a855f7', name: 'שומי', say: 'שׁוּמִי' }, // 39
  { color: '#d946ef', name: 'דיני', say: 'דִּינִי' }, // 40
  // 41–50 — a brighter pastel rainbow (a fresh set); colours match BIG
  { color: '#e23670', name: 'פפו', say: 'פַּפּוֹ' }, // 41
  { color: '#fb923c', name: 'ניבי', say: 'נִיבִּי' }, // 42
  { color: '#fcd34d', name: 'לוקי', say: 'לוּקִי' }, // 43
  { color: '#a3e635', name: 'ריו', say: 'רִיוֹ' }, // 44
  { color: '#34d399', name: 'מיו', say: 'מִיוֹ' }, // 45
  { color: '#2dd4bf', name: 'גוני', say: 'גוֹנִי' }, // 46
  { color: '#38bdf8', name: 'בובא', say: 'בּוּבָּה' }, // 47
  { color: '#818cf8', name: 'קלי', say: 'קָלִי' }, // 48
  { color: '#c084fc', name: 'שיר', say: 'שִׁיר' }, // 49
  { color: '#f0abfc', name: 'דנה', say: 'דָּנָה' }, // 50
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

// Simple, kid-friendly colour name per friend (for the spoken "my colour is…").
const COLOR_NAMES = [
  'אדום', 'כתום', 'צהוב', 'ירוק', 'טורקיז', 'תכלת', 'כחול', 'סגול', 'ורוד', 'ורוד',
  'אדום', 'כתום', 'צהוב', 'ירוק', 'טורקיז', 'תכלת', 'כחול', 'סגול', 'ורוד', 'אדום',
  'ורוד', 'כתום', 'צהוב', 'ירוק', 'ירוק', 'טורקיז', 'כחול', 'סגול', 'ורוד', 'אדום',
  'אדום', 'כתום', 'צהוב', 'ירוק', 'ירוק', 'טורקיז', 'תכלת', 'כחול', 'סגול', 'ורוד',
  'ורוד', 'כתום', 'צהוב', 'ירוק', 'ירוק', 'טורקיז', 'תכלת', 'כחול', 'סגול', 'ורוד',
]
export function friendColorName(index: number) {
  return COLOR_NAMES[index % COLOR_NAMES.length]
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
