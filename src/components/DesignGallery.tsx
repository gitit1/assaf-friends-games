import { useState } from 'react'
import GameShell from './GameShell'
import FriendArt, { BIG_KINDS, type FriendKind } from './FriendArt'
import type { GameProps } from '../games/registry'

const PAGES: { kind: FriendKind; title: string }[] = [
  { kind: 'lulu', title: 'לולו · 1' },
  { kind: 'toki', title: 'טוקי · 2' },
  { kind: 'bobby', title: 'בובי · 3' },
  { kind: 'gogo', title: 'גוגו · 4' },
  { kind: 'moki', title: 'מוקי · 5' },
  { kind: 'nuni', title: 'נוני · 6' },
  { kind: 'piko', title: 'פיקו · 7' },
  { kind: 'dudi', title: 'דודי · 8' },
  { kind: 'zuzu', title: 'זוזו · 9' },
  { kind: 'koko', title: 'קוקו · 10' },
  { kind: 'toto', title: 'טוטו · 11' },
  { kind: 'lili', title: 'לילי · 12' },
  { kind: 'momo', title: 'מומו · 13' },
  { kind: 'riki', title: 'ריקי · 14' },
  { kind: 'shushu', title: 'שושו · 15' },
  { kind: 'gili', title: 'גילי · 16' },
  { kind: 'roni', title: 'רוני · 17' },
  { kind: 'yoyo', title: 'יויו · 18' },
  { kind: 'sofi', title: 'סופי · 19' },
  { kind: 'kiki', title: 'קיקי · 20' },
  { kind: 'romi', title: 'רומי · 21' },
  { kind: 'nini', title: 'ניני · 22' },
  { kind: 'pupi', title: 'פופי · 23' },
  { kind: 'tuti', title: 'תותי · 24' },
  { kind: 'mishi', title: 'מישי · 25' },
  { kind: 'buzi', title: 'בוזי · 26' },
  { kind: 'dagi', title: 'דגי · 27' },
  { kind: 'lala', title: 'לאלה · 28' },
  { kind: 'chumi', title: 'חומי · 29' },
  { kind: 'tsutsi', title: 'צוצי · 30' },
  { kind: 'tino', title: 'טינו · 31' },
  { kind: 'rozi', title: 'רוזי · 32' },
  { kind: 'leo', title: 'ליאו · 33' },
  { kind: 'mika', title: 'מיקה · 34' },
  { kind: 'guzi', title: 'גוזי · 35' },
  { kind: 'bino', title: 'בינו · 36' },
  { kind: 'tofi', title: 'טופי · 37' },
  { kind: 'kimi', title: 'קימי · 38' },
  { kind: 'shumi', title: 'שומי · 39' },
  { kind: 'dini', title: 'דיני · 40' },
]

const NOTES: Partial<Record<FriendKind, string>> = {
  lulu: 'לולו (1) — הבסיס: בלוב עגול וחמוד, צבע אחד. הכי קטן מבין החברים.',
  toki: 'טוקי (2) — שתי כיפות מחוברות, שני צבעים, עם שקע רך טבעי. גדול מלולו.',
  bobby: 'בובי (3) — שלושה עיגולים במשולש, שלושה צבעים. גדול יותר מטוקי.',
  gogo: 'גוגו (4) — ארבעה עיגולים בריבוע 2×2 (אדום·כתום·צהוב·ירוק). בת! שפתיים אדומות, שרשרת ונעליים ורודות.',
  moki: 'מוקי (5) — ריבוע 2×2 + ראש תכלת למעלה (חמישה צבעים). בן! משקפיים, גבות ובלורית.',
  nuni: 'נוני (6) — שישה עיגולים בשתי שורות (3×2), מוסיף כחול. בת! ריסים, שפתיים, פרח בשיער ועגילים.',
  piko: 'פיקו (7) — פרח של שבעה: מרכז סגול + שש עלי-כותרת בצבעי הקשת. הקשת הושלמה! 🌈 עם כתר קטן.',
  dudi: 'דודי (8) — בלוק 4×2 (מוסיף ורוד, צבע שמיני). בן! עם אוזניות.',
  zuzu: 'זוזו (9) — ריבוע 3×3 (מוסיף צבע תשיעי). בת! עם צמות וריסים.',
  koko: 'קוקו (10) — בלוק 5×2, עשרה צבעים. בת! עם כתר-נסיכה (טיארה), ריסים ושפתיים. האחרונה! 🎉',
  toto: 'טוטו (11) — אחת-עשרה כיפות בשורות 3·5·3, אדום, עם כובע מסיבה. 🎉',
  lili: 'לילי (12) — שתים-עשרה בשורות 2·4·4·2, כתום, בת עם אוזני ארנב. 🐰',
  momo: 'מומו (13) — שלוש-עשרה בשורות 4·5·4, זהב, עם משקפי שמש. 😎',
  riki: 'ריקי (14) — ארבע-עשרה בשורות 3·4·4·3, ירוק, עם כובע מצחייה.',
  shushu: 'שושו (15) — חמש-עשרה במשולש מושלם 1·2·3·4·5, טורקיז, בת עם אוזני חתול. 🐱',
  gili: 'גילי (16) — שש-עשרה בריבוע מושלם 4×4, תכלת, עם כוכב על הראש. ⭐',
  roni: 'רוני (17) — שבע-עשרה כמו בית: ריבוע 4×4 + כיפה בגג, כחול, עם אוזניות.',
  yoyo: 'יויו (18) — שמונה-עשרה בשורות 3·4·4·4·3, סגול, עם כובע פרופלור.',
  sofi: 'סופי (19) — תשע-עשרה כיהלום 3·4·5·4·3, פוקסיה, בת עם ברט (כובע אמן). 🎨',
  kiki: 'קיקי (20) — עשרים בבלוק 5×4 (שתי עשרות!), אדום-עמוק, בת עם נוצה.',
  romi: 'רומי (21) — עשרים-ואחת בשורות 4·4·5·4·4, ורוד-פטל, עם סרט ראש.',
  nini: 'ניני (22) — עשרים-ושתיים בשורות 4·5·4·5·4, כתום-שרוף, בת עם מחושים. 🐞',
  pupi: 'פופי (23) — עשרים-ושלוש בשורות 4·5·5·5·4, חרדל, עם מוהוק. 🤘',
  tuti: 'תותי (24) — עשרים-וארבע ביהלום 4·5·6·5·4, ירוק-זית, בת עם נבט-עלה. 🌱',
  mishi: 'מישי (25) — עשרים-וחמש בריבוע מושלם 5×5, אזמרגד, עם כובע קוסם. 🧙',
  buzi: 'בוזי (26) — עשרים-ושש בשורות 5·5·6·5·5, טורקיז, עם קרניים. 😈',
  dagi: 'דגי (27) — עשרים-ושבע בשורות 5·6·5·6·5, כחול, עם כובע שף. 👨‍🍳',
  lala: 'לאלה (28) — עשרים-ושמונה בשורות 5·6·6·6·5, סגול, בת עם בנדנה.',
  chumi: 'חומי (29) — עשרים-ותשע בשורות 6·6·5·6·6, מגנטה, עם שפם. 🥸',
  tsutsi: 'צוצי (30) — שלושים בריבוע ענק 6×5 (שלוש עשרות!), אדום-עמוק, בת עם כובע סיום. 🎓',
  tino: 'טינו (31) — שלושים-ואחת ביהלום 5·7·7·7·5, אדום, עם כובע פז ופונפון. 🎩',
  rozi: 'רוזי (32) — שלושים-ושתיים בשורות 6·7·6·7·6, כתום, בת עם כובע קש לקיץ. 👒',
  leo: 'ליאו (33) — שלושים-ושלוש בשורות 6·7·7·7·6, צהוב, עם לב מרחף. ❤️',
  mika: 'מיקה (34) — שלושים-וארבע ביהלום 6·7·8·7·6, ירוק-ליים, בת עם הילה של מלאך. 😇',
  guzi: 'גוזי (35) — שלושים-וחמש בריבוע מושלם 7×5, ירוק, בת עם קוקו-גולה. 🍡',
  bino: 'בינו (36) — שלושים-ושש בריבוע ענק 6×6 (שלוש עשרות וחצי!), טורקיז, עם קשת בענן. 🌈',
  tofi: 'טופי (37) — שלושים-ושבע בשש שורות, תכלת, בת עם שתי פקעות שיער. 🎀',
  kimi: 'קימי (38) — שלושים-ושמונה בשש שורות, כחול, עם פעמון זהב. 🔔',
  shumi: 'שומי (39) — שלושים-ותשע בשש שורות, סגול, עם ירח-סהר. 🌙',
  dini: 'דיני (40) — ארבעים בשש שורות (ארבע עשרות!), ורוד-פוקסיה, בת עם כתר פרחים. 🌸',
}

const GROUP_SIZE = 10
const BIG_SET = new Set<string>(BIG_KINDS)

type Page = { kind: FriendKind; title: string }

function SizeStrip({
  pages,
  activeIndex,
  onSelect,
}: {
  pages: Page[]
  activeIndex: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="gal-compare">
      {pages.map((p, i) => (
        <button
          type="button"
          className={`gal-mini ${i === activeIndex ? 'is-active' : ''}`}
          key={p.kind}
          onClick={() => onSelect(i)}
          aria-label={p.title}
        >
          <FriendArt kind={p.kind} />
        </button>
      ))}
    </div>
  )
}

export default function DesignGallery({ onExit }: GameProps) {
  const groupCount = Math.ceil(PAGES.length / GROUP_SIZE)
  const [group, setGroup] = useState(0) // which decade (0 = 1–10, 1 = 11–20, …)
  const [slot, setSlot] = useState(0) // position within the decade (0–9)

  const groupStart = group * GROUP_SIZE
  const groupPages = PAGES.slice(groupStart, groupStart + GROUP_SIZE)
  const safeSlot = Math.min(slot, groupPages.length - 1)
  const current = groupPages[safeSlot]
  const number = groupStart + safeSlot + 1
  // 1–10 are drawn with bigger bumps than the newer friends, so shrink them a
  // touch in the stage to keep the gallery scale consistent up toward 100.
  const small = !BIG_SET.has(current.kind)

  return (
    <GameShell title="גלריית עיצובים" emoji="🎨" onExit={onExit}>
      <div className="gallery">
        <div className="gal-groups">
          {Array.from({ length: groupCount }).map((_, g) => (
            <button
              key={g}
              className={`pill ${g === group ? 'is-active' : ''}`}
              onClick={() => {
                setGroup(g)
                setSlot(0)
              }}
            >
              {g * GROUP_SIZE + 1}–{g * GROUP_SIZE + GROUP_SIZE}
            </button>
          ))}
        </div>

        <div className="gal-nav">
          <button className="pill" onClick={() => setSlot((s) => Math.max(0, s - 1))} disabled={safeSlot === 0}>
            ← הקודם
          </button>
          <span className="gal-page-title">{current.title}</span>
          <button
            className="pill"
            onClick={() => setSlot((s) => Math.min(groupPages.length - 1, s + 1))}
            disabled={safeSlot === groupPages.length - 1}
          >
            הבא →
          </button>
        </div>

        <div className="gal-big-stage">
          <span className="gal-stage-fit" style={{ transform: `scale(${small ? 0.8 : 1})` }}>
            <FriendArt kind={current.kind} number={number} showHalo />
          </span>
        </div>

        <p className="gal-note">{NOTES[current.kind] ?? ''}</p>

        <h3 className="gal-compare-title">הגדלים גדלים עם המספר</h3>
        <SizeStrip pages={groupPages} activeIndex={safeSlot} onSelect={setSlot} />
      </div>
    </GameShell>
  )
}
