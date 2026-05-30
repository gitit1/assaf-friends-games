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
]

const NOTES: Record<FriendKind, string> = {
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
  lili: 'לילי (12) — שתים-עשרה בשורות 2·4·4·2, כתום, בת עם פפיון בשיער.',
  momo: 'מומו (13) — שלוש-עשרה בשורות 4·5·4, זהב, עם משקפיים עגולים.',
  riki: 'ריקי (14) — ארבע-עשרה בשורות 3·4·4·3, ירוק, עם כובע מצחייה.',
  shushu: 'שושו (15) — חמש-עשרה במשולש מושלם 1·2·3·4·5, טורקיז, בת עם פרח. 🔺',
  gili: 'גילי (16) — שש-עשרה בריבוע מושלם 4×4, תכלת, עם כוכב על הראש. ⭐',
  roni: 'רוני (17) — שבע-עשרה כמו בית: ריבוע 4×4 + כיפה בגג, כחול, עם אוזניות.',
  yoyo: 'יויו (18) — שמונה-עשרה בשורות 3·4·4·4·3, סגול, עם כובע פרופלור.',
  sofi: 'סופי (19) — תשע-עשרה כיהלום 3·4·5·4·3, פוקסיה, בת עם נזר. 💎',
  kiki: 'קיקי (20) — עשרים בבלוק 5×4 (שתי עשרות!), אדום-עמוק, בת עם כתר. הכי גדולה! 🎉',
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

        <p className="gal-note">{NOTES[current.kind]}</p>

        <h3 className="gal-compare-title">הגדלים גדלים עם המספר</h3>
        <SizeStrip pages={groupPages} activeIndex={safeSlot} onSelect={setSlot} />
      </div>
    </GameShell>
  )
}
