import { useState } from 'react'
import GameShell from './GameShell'
import FriendArt, { type FriendKind } from './FriendArt'
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
}

function SizeStrip() {
  return (
    <div className="gal-compare">
      {PAGES.map((p) => (
        <span className="gal-mini" key={p.kind}>
          <FriendArt kind={p.kind} />
        </span>
      ))}
    </div>
  )
}

export default function DesignGallery({ onExit }: GameProps) {
  const [page, setPage] = useState(PAGES.length - 1) // start on the newest
  const current = PAGES[page]

  return (
    <GameShell title="גלריית עיצובים" emoji="🎨" onExit={onExit}>
      <div className="gallery">
        <div className="gal-nav">
          <button className="pill" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            ← הקודם
          </button>
          <span className="gal-page-title">{current.title}</span>
          <button
            className="pill"
            onClick={() => setPage((p) => Math.min(PAGES.length - 1, p + 1))}
            disabled={page === PAGES.length - 1}
          >
            הבא →
          </button>
        </div>

        <div className="gal-big-stage">
          <FriendArt kind={current.kind} number={page + 1} showHalo />
        </div>

        <p className="gal-note">{NOTES[current.kind]}</p>

        <h3 className="gal-compare-title">הגדלים גדלים עם המספר</h3>
        <SizeStrip />
      </div>
    </GameShell>
  )
}
