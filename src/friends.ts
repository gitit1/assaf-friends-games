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
  gender?: 'f' | 'm' // set per batch as voices are recorded; defaults 'm'
  special?: number // index into FriendWorld's LIKES (the friend's special button); defaults index % 12
  game?: string // registry id the special button leads to; undefined = no matching game yet
}

export const FRIENDS: Friend[] = [
  { color: '#ef4444', name: 'לולו', say: 'לוּלוּ', gender: 'f', special: 0, game: 'skipcount' }, // 1 red — קפיצה → קפיצות
  { color: '#f97316', name: 'טוקי', say: 'טוּקִי', gender: 'm', special: 1, game: 'dance' }, // 2 orange — ריקוד → משחק ריקוד
  { color: '#facc15', name: 'בובי', say: 'בּוּבִּי', gender: 'm', special: 2, game: 'laugh' }, // 3 yellow — צחוק → משחק צחוק
  { color: '#4ade80', name: 'גוגו', say: 'גוּגוּ', gender: 'f', special: 8, game: 'draw' }, // 4 green — ציור → משחק ציור
  { color: '#14b8a6', name: 'דובי', say: 'דּוּבִּי', gender: 'm', special: 4 }, // 5 teal — שיר
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
  // 51–60 — a bright neon rainbow; colours match BIG in FriendArt
  { color: '#fb7185', name: 'רוקי', say: 'רוֹקִי' }, // 51
  { color: '#fdba74', name: 'ננה', say: 'נָנָה' }, // 52
  { color: '#fde047', name: 'פינו', say: 'פִּינוֹ' }, // 53
  { color: '#a3e635', name: 'מולי', say: 'מוֹלִי' }, // 54
  { color: '#34d399', name: 'מיקי', say: 'מִיקִי' }, // 55
  { color: '#22d3ee', name: 'ליבי', say: 'לִיבִּי' }, // 56
  { color: '#60a5fa', name: 'דומי', say: 'דּוֹמִי' }, // 57
  { color: '#818cf8', name: 'נטי', say: 'נָטִי' }, // 58
  { color: '#c084fc', name: 'פלי', say: 'פְּלִי' }, // 59
  { color: '#e879f9', name: 'זיו', say: 'זִיו' }, // 60
  // 61–70 — a deep vivid rainbow; colours match BIG in FriendArt
  { color: '#f43f5e', name: 'ריקו', say: 'רִיקוֹ' }, // 61
  { color: '#fb923c', name: 'דאבי', say: 'דָּאבִּי' }, // 62
  { color: '#fbbf24', name: 'פוקי', say: 'פוֹקִי' }, // 63
  { color: '#a3e635', name: 'לוטי', say: 'לוֹטִי' }, // 64
  { color: '#22c55e', name: 'ביבו', say: 'בִּיבּוֹ' }, // 65
  { color: '#14b8a6', name: 'טוני', say: 'טוֹנִי' }, // 66
  { color: '#06b6d4', name: 'נוקי', say: 'נוּקִי' }, // 67
  { color: '#3b82f6', name: 'לומי', say: 'לוּמִי' }, // 68
  { color: '#8b5cf6', name: 'גבי', say: 'גָּבִּי' }, // 69
  { color: '#d946ef', name: 'זומי', say: 'זוּמִי' }, // 70
  // 71–100 — the rest of the cast (full rainbow); colours match BIG in FriendArt
  { color: '#ef4444', name: 'טיקה', say: 'טִיקָה' }, // 71
  { color: '#f97316', name: 'בומי', say: 'בּוּמִי' }, // 72
  { color: '#f59e0b', name: 'לאלו', say: 'לָאלוֹ' }, // 73
  { color: '#eab308', name: 'פיני', say: 'פִּינִי' }, // 74
  { color: '#84cc16', name: 'ססי', say: 'סָסִי' }, // 75
  { color: '#22c55e', name: 'מומי', say: 'מוֹמִי' }, // 76
  { color: '#10b981', name: 'דודו', say: 'דּוּדוּ' }, // 77
  { color: '#14b8a6', name: 'נונו', say: 'נוֹנוֹ' }, // 78
  { color: '#06b6d4', name: 'קולי', say: 'קוּלִי' }, // 79
  { color: '#0ea5e9', name: 'רביב', say: 'רָבִיב' }, // 80
  { color: '#3b82f6', name: 'תמי', say: 'תָּמִי' }, // 81
  { color: '#6366f1', name: 'גיגי', say: 'גִיגִי' }, // 82
  { color: '#8b5cf6', name: 'לובי', say: 'לוּבִּי' }, // 83
  { color: '#a855f7', name: 'נימי', say: 'נִימִי' }, // 84
  { color: '#d946ef', name: 'פולי', say: 'פּוֹלִי' }, // 85
  { color: '#ec4899', name: 'זאזא', say: 'זָאזָא' }, // 86
  { color: '#f43f5e', name: 'לואי', say: 'לוּאִי' }, // 87
  { color: '#fb7185', name: 'מילו', say: 'מִילוֹ' }, // 88
  { color: '#fb923c', name: 'רינה', say: 'רִינָה' }, // 89
  { color: '#fbbf24', name: 'בובו', say: 'בּוֹבּוֹ' }, // 90
  { color: '#a3e635', name: 'קוקי', say: 'קוֹקִי' }, // 91
  { color: '#34d399', name: 'לולה', say: 'לוֹלָה' }, // 92
  { color: '#2dd4bf', name: 'דידי', say: 'דִּידִי' }, // 93
  { color: '#22d3ee', name: 'פיצי', say: 'פִּיצִי' }, // 94
  { color: '#38bdf8', name: 'נונה', say: 'נוּנָה' }, // 95
  { color: '#818cf8', name: 'גאגא', say: 'גָּאגָּא' }, // 96
  { color: '#c084fc', name: 'טיפו', say: 'טִיפּוֹ' }, // 97
  { color: '#e879f9', name: 'סוסו', say: 'סוּסוּ' }, // 98
  { color: '#f0abfc', name: 'תומי', say: 'תּוֹמִי' }, // 99
  { color: '#fda4af', name: 'מאיה', say: 'מָאיָה' }, // 100
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

// Boy/girl — drives the recorded voice + spoken verb agreement. Defaults male
// until set per batch. Kept in sync with GENDER in scripts/gen-voice.mjs.
export function friendGender(index: number): 'f' | 'm' {
  return FRIENDS[index % FRIENDS.length].gender ?? 'm'
}

// Which special button this friend has (index into FriendWorld's LIKES).
export function friendSpecial(index: number): number {
  return FRIENDS[index % FRIENDS.length].special ?? index % 12
}

// The game id this friend's special button leads to (or undefined if its game
// isn't built yet). Two-way: every friend should eventually point at a game,
// and every game should be reachable from at least one friend.
export function friendGame(index: number): string | undefined {
  return FRIENDS[index % FRIENDS.length].game
}

// The recorded Narakeet voice for this friend — boys cycle the male voices,
// girls the female ones, by rank within their gender. MUST mirror voiceFor in
// scripts/gen-voice.mjs so the per-voice button clips (fx-*-<Voice>) line up.
const FEMALE_VOICES = ['Ayelet', 'Tamar', 'Nurit']
const MALE_VOICES = ['Erez', 'Doron']
export function friendVoice(index: number): string {
  const i = index % FRIENDS.length
  const g = friendGender(i)
  const pool = g === 'f' ? FEMALE_VOICES : MALE_VOICES
  let rank = 0
  for (let j = 0; j < i; j++) if (friendGender(j) === g) rank++
  return pool[rank % pool.length]
}

// Simple, kid-friendly colour name per friend (for the spoken "my colour is…").
const COLOR_NAMES = [
  'אדום', 'כתום', 'צהוב', 'ירוק', 'טורקיז', 'תכלת', 'כחול', 'סגול', 'ורוד', 'ורוד',
  'אדום', 'כתום', 'צהוב', 'ירוק', 'טורקיז', 'תכלת', 'כחול', 'סגול', 'ורוד', 'אדום',
  'ורוד', 'כתום', 'צהוב', 'ירוק', 'ירוק', 'טורקיז', 'כחול', 'סגול', 'ורוד', 'אדום',
  'אדום', 'כתום', 'צהוב', 'ירוק', 'ירוק', 'טורקיז', 'תכלת', 'כחול', 'סגול', 'ורוד',
  'ורוד', 'כתום', 'צהוב', 'ירוק', 'ירוק', 'טורקיז', 'תכלת', 'כחול', 'סגול', 'ורוד',
  'ורוד', 'כתום', 'צהוב', 'ירוק', 'ירוק', 'טורקיז', 'כחול', 'כחול', 'סגול', 'ורוד',
  'אדום', 'כתום', 'צהוב', 'ירוק', 'ירוק', 'טורקיז', 'תכלת', 'כחול', 'סגול', 'ורוד',
  'אדום', 'כתום', 'כתום', 'צהוב', 'ירוק', 'ירוק', 'ירוק', 'טורקיז', 'טורקיז', 'תכלת',
  'כחול', 'כחול', 'סגול', 'סגול', 'ורוד', 'ורוד', 'אדום', 'ורוד', 'כתום', 'צהוב',
  'ירוק', 'ירוק', 'טורקיז', 'טורקיז', 'תכלת', 'כחול', 'סגול', 'ורוד', 'ורוד', 'ורוד',
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
