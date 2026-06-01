// The shared, self-contained art for each friend (CSS in app.css under .gal-*).
// Both the design gallery and the real in-game Friend render through this, so
// there's a single source of truth for how each friend looks.

export type FriendKind =
  | 'lulu'
  | 'toki'
  | 'bobby'
  | 'gogo'
  | 'moki'
  | 'nuni'
  | 'piko'
  | 'dudi'
  | 'zuzu'
  | 'koko'
  // 11–20 — the bigger friends (built from rows of bumps)
  | 'toto'
  | 'lili'
  | 'momo'
  | 'riki'
  | 'shushu'
  | 'gili'
  | 'roni'
  | 'yoyo'
  | 'sofi'
  | 'kiki'

// Friend index (0-based) → kind. Friend #1 (לולו) is index 0.
export const FRIEND_KINDS: FriendKind[] = [
  'lulu',
  'toki',
  'bobby',
  'gogo',
  'moki',
  'nuni',
  'piko',
  'dudi',
  'zuzu',
  'koko',
  'toto',
  'lili',
  'momo',
  'riki',
  'shushu',
  'gili',
  'roni',
  'yoyo',
  'sofi',
  'kiki',
]

// ---- 11–20: the bigger friends ----
// Each is built from rows of bumps (the silhouette reveals the number), with a
// single identity colour, a face, and a persona accessory. The same FriendArt
// below renders them — it's just data-driven from here.
export const BIG_KINDS = [
  'toto', 'lili', 'momo', 'riki', 'shushu',
  'gili', 'roni', 'yoyo', 'sofi', 'kiki',
] as const
type BigKind = (typeof BIG_KINDS)[number]
export type BigAccessory =
  | 'cone' | 'bow' | 'glasses' | 'cap' | 'flower'
  | 'star' | 'earmuffs' | 'propeller' | 'tiara' | 'crown'

const BU = 46 // bump size (px) for big friends — keep in sync with .gal-big --u
const H_OVER = 0.16 // horizontal overlap of bumps within a row
const V_OVER = 0.26 // vertical overlap between rows

export const BIG: Record<BigKind, {
  rows: number[] // bumps per row, top → bottom (centred); the sum is the number
  bc: string // identity colour
  shoe: string
  acc: BigAccessory
  face: 'plain' | 'girl'
}> = {
  toto:   { rows: [3, 5, 3],       bc: '#e11d48', shoe: '#1e3a8a', acc: 'cone',      face: 'plain' }, // 11
  lili:   { rows: [2, 4, 4, 2],    bc: '#ea580c', shoe: '#1e3a8a', acc: 'bow',       face: 'girl' }, // 12
  momo:   { rows: [4, 5, 4],       bc: '#ca8a04', shoe: '#0e7490', acc: 'glasses',   face: 'plain' }, // 13
  riki:   { rows: [3, 4, 4, 3],    bc: '#65a30d', shoe: '#b91c1c', acc: 'cap',       face: 'plain' }, // 14
  shushu: { rows: [1, 2, 3, 4, 5], bc: '#0d9488', shoe: '#db2777', acc: 'flower',    face: 'girl' }, // 15 ▲
  gili:   { rows: [4, 4, 4, 4],    bc: '#0891b2', shoe: '#f59e0b', acc: 'star',      face: 'plain' }, // 16 ■
  roni:   { rows: [1, 4, 4, 4, 4], bc: '#2563eb', shoe: '#f43f5e', acc: 'earmuffs',  face: 'plain' }, // 17 house
  yoyo:   { rows: [3, 4, 4, 4, 3], bc: '#7c3aed', shoe: '#22c55e', acc: 'propeller', face: 'plain' }, // 18
  sofi:   { rows: [3, 4, 5, 4, 3], bc: '#c026d3', shoe: '#f59e0b', acc: 'tiara',     face: 'girl' }, // 19 ◆
  kiki:   { rows: [5, 5, 5, 5],    bc: '#be123c', shoe: '#1e3a8a', acc: 'crown',     face: 'girl' }, // 20
}

const bigNatural = Object.fromEntries(
  BIG_KINDS.map((k) => {
    const rows = BIG[k].rows
    const cols = Math.max(...rows)
    const w = Math.round(BU * (1 + (cols - 1) * (1 - H_OVER))) + 30
    const h = Math.round(BU * (1 + (rows.length - 1) * (1 - V_OVER))) + 26
    return [k, { w, h }]
  }),
) as Record<BigKind, { w: number; h: number }>

const bigOrder = Object.fromEntries(
  BIG_KINDS.map((k) => [k, BIG[k].rows.flatMap((c) => Array.from({ length: c }, () => 'bump'))]),
) as Record<BigKind, string[]>

// Natural design box (matches the px sizes in app.css), used for scaling.
export const FRIEND_NATURAL: Record<FriendKind, { w: number; h: number }> = {
  lulu: { w: 104, h: 104 },
  toki: { w: 176, h: 106 },
  bobby: { w: 168, h: 166 },
  gogo: { w: 180, h: 178 },
  moki: { w: 168, h: 210 },
  nuni: { w: 216, h: 150 },
  piko: { w: 214, h: 224 },
  dudi: { w: 242, h: 138 },
  zuzu: { w: 208, h: 206 },
  koko: { w: 278, h: 130 },
  ...bigNatural,
}

// Each friend's coloured parts, listed in COUNT ORDER (bottom-up, left→right),
// so lighting them up 1..N feels natural. Each entry is the part's CSS classes.
const PART_ORDER: Record<FriendKind, string[]> = {
  lulu: ['bump solo'],
  toki: ['lobe left', 'lobe right'],
  bobby: ['bump bl', 'bump br', 'bump top'],
  gogo: ['bump bl', 'bump br', 'bump tl', 'bump tr'],
  moki: ['bump bl', 'bump br', 'bump tl', 'bump tr', 'bump top'],
  nuni: ['bump c4', 'bump c5', 'bump c6', 'bump c1', 'bump c2', 'bump c3'],
  piko: ['bump p4', 'bump p3', 'bump p5', 'bump p2', 'bump p6', 'bump p1', 'bump cn'],
  dudi: ['bump b5', 'bump b6', 'bump b7', 'bump b8', 'bump b1', 'bump b2', 'bump b3', 'bump b4'],
  zuzu: ['bump m7', 'bump m8', 'bump m9', 'bump m4', 'bump m5', 'bump m6', 'bump m1', 'bump m2', 'bump m3'],
  koko: [
    'bump m6',
    'bump m7',
    'bump m8',
    'bump m9',
    'bump m10',
    'bump m1',
    'bump m2',
    'bump m3',
    'bump m4',
    'bump m5',
  ],
  ...bigOrder,
}

export function friendKindForIndex(index: number) {
  return FRIEND_KINDS[index % FRIEND_KINDS.length]
}
export function friendMaxDim(index: number) {
  const n = FRIEND_NATURAL[friendKindForIndex(index)]
  return Math.max(n.w, n.h)
}
export function friendPartCount(kind: FriendKind) {
  return PART_ORDER[kind].length
}

// What a dressed-up friend can wear.
export type Outfit = { hat?: string; face?: string; body?: string; held?: string }

// Where worn items sit on each friend, in the friend's OWN design coordinates:
// x is always centred (50% — every face is symmetric), so we only need the
// vertical anchor (% of the design box) per slot, plus a head width (natural px)
// that drives the item size. Items render inside the design box, so they scale
// with the friend automatically. hat = on top of the head, eye = over the eyes,
// body = on the torso, held = beside the friend.
type DressAnchor = { hat: number; eye: number; body: number; heldTop: number; heldLeft: number; hw: number }
const DRESS: Record<string, DressAnchor> = {
  lulu: { hat: 8, eye: 39, body: 66, heldTop: 70, heldLeft: 90, hw: 66 },
  toki: { hat: 2, eye: 35, body: 62, heldTop: 68, heldLeft: 86, hw: 64 },
  bobby: { hat: 2, eye: 19, body: 60, heldTop: 70, heldLeft: 86, hw: 84 },
  gogo: { hat: 4, eye: 31, body: 60, heldTop: 72, heldLeft: 86, hw: 90 },
  moki: { hat: -2, eye: 14, body: 62, heldTop: 76, heldLeft: 86, hw: 80 },
  nuni: { hat: 2, eye: 27, body: 58, heldTop: 70, heldLeft: 88, hw: 78 },
  piko: { hat: 6, eye: 47, body: 74, heldTop: 82, heldLeft: 86, hw: 80 },
  dudi: { hat: 2, eye: 28, body: 60, heldTop: 70, heldLeft: 88, hw: 88 },
  zuzu: { hat: 4, eye: 46, body: 72, heldTop: 82, heldLeft: 86, hw: 86 },
  koko: { hat: 2, eye: 25, body: 54, heldTop: 62, heldLeft: 88, hw: 64 },
  big: { hat: -6, eye: 40, body: 72, heldTop: 80, heldLeft: 84, hw: 54 },
}

type Props = {
  kind: FriendKind
  /** Number shown on the floating halo above the head. */
  number?: number
  showHalo?: boolean
  /** How many parts are lit (coloured). The rest are faint outlines. Default = all. */
  litUnits?: number
  /** Open + chew the mouth (eating animation). */
  eating?: boolean
  /** Dress-up items worn on the friend. A filled slot replaces the matching
   *  built-in accessory; clearing it brings the built-in one back. */
  outfit?: Outfit
}

// The persona accessory worn by each big friend (11–20). Anchored at the top
// of the head (or, for glasses, on the face) by the .acc2 rules in app.css.
function bigAccessory(acc: BigAccessory) {
  switch (acc) {
    case 'cone':
      return (
        <span className="acc2 acc2-cone">
          <i className="pom" />
        </span>
      )
    case 'bow':
      return (
        <span className="acc2 acc2-bow">
          <i className="l" />
          <i className="r" />
          <i className="k" />
        </span>
      )
    case 'glasses':
      return (
        <span className="acc2 acc2-glasses">
          <i className="l" />
          <i className="b" />
          <i className="r" />
        </span>
      )
    case 'cap':
      return (
        <span className="acc2 acc2-cap">
          <i className="brim" />
        </span>
      )
    case 'flower':
      return (
        <span className="acc2 acc2-flower">
          <i />
          <i />
          <i />
          <i />
          <i />
          <b />
        </span>
      )
    case 'star':
      return <span className="acc2 acc2-star" />
    case 'earmuffs':
      return (
        <span className="acc2 acc2-earmuffs">
          <i className="l" />
          <i className="r" />
        </span>
      )
    case 'propeller':
      return (
        <span className="acc2 acc2-propeller">
          <i className="l" />
          <i className="r" />
          <b />
        </span>
      )
    case 'tiara':
      return (
        <span className="acc2 acc2-tiara">
          <i />
          <i />
          <i />
        </span>
      )
    case 'crown':
      return (
        <span className="acc2 acc2-crown">
          <i />
          <i />
          <i />
        </span>
      )
    default:
      return null
  }
}

export default function FriendArt({ kind, number, showHalo = false, litUnits, eating = false, outfit }: Props) {
  const order = PART_ORDER[kind]
  const lit = litUnits ?? order.length
  const parts = order.map((cls, i) => <span key={cls} className={`${cls} ${i < lit ? '' : 'is-off'}`} />)

  const isBig = (BIG_KINDS as readonly string[]).includes(kind)
  // which slots are dressed → hide the matching built-in accessory
  const wHat = !!outfit?.hat
  const wFace = !!outfit?.face
  const wBody = !!outfit?.body
  // the worn items, rendered inside the design box so they sit on the friend
  const A = DRESS[isBig ? 'big' : kind] ?? DRESS.big
  const dress = outfit ? (
    <>
      {outfit.held && (
        <span
          className="don"
          style={{ top: `${A.heldTop}%`, left: `${A.heldLeft}%`, fontSize: `${Math.round(A.hw * 0.6)}px` }}
        >
          {outfit.held}
        </span>
      )}
      {outfit.body && (
        <span className="don" style={{ top: `${A.body}%`, left: '50%', fontSize: `${A.hw}px` }}>
          {outfit.body}
        </span>
      )}
      {outfit.face && (
        <span className="don" style={{ top: `${A.eye}%`, left: '50%', fontSize: `${Math.round(A.hw * 0.82)}px` }}>
          {outfit.face}
        </span>
      )}
      {outfit.hat && (
        <span className="don" style={{ top: `${A.hat}%`, left: '50%', fontSize: `${A.hw}px` }}>
          {outfit.hat}
        </span>
      )}
    </>
  ) : null

  const halo = showHalo && number ? <span className="gal-halo">{number}</span> : null
  const face = (
    <>
      <span className="gf-eye l" />
      <span className="gf-eye r" />
      <span className="gf-mouth" />
    </>
  )
  const eyes = (
    <>
      <span className="gf-eye l" />
      <span className="gf-eye r" />
    </>
  )
  const arms = (
    <>
      <span className="gal-arm l">
        <span className="hand" />
      </span>
      <span className="gal-arm r">
        <span className="hand" />
      </span>
    </>
  )
  const feet = (
    <>
      <span className="gal-foot l" />
      <span className="gal-foot r" />
    </>
  )
  const lips = (
    <span className="lips">
      <span className="lips-line" />
    </span>
  )

  let design: React.ReactElement
  if (isBig) {
    const spec = BIG[kind as BigKind]
    let n = 0
    const rows = spec.rows.map((count, r) => (
      <span className="gal-big-row" key={r}>
        {Array.from({ length: count }).map((_, c) => {
          const on = n < lit
          n++
          return <span key={c} className={`bump ${on ? '' : 'is-off'}`} />
        })}
      </span>
    ))
    // the persona accessory is glasses for momo (a face item); the rest are
    // worn on the head — hide whichever slot the child has dressed.
    const showAcc = spec.acc === 'glasses' ? !wFace : !wHat
    design = (
      <div
        className={`gal-big big-${kind}`}
        style={{ '--bc': spec.bc, '--shoe': spec.shoe } as React.CSSProperties}
      >
        {arms}
        <span className="gal-big-rows">{rows}</span>
        {feet}
        {spec.face === 'girl' ? (
          <>
            {eyes}
            {lips}
          </>
        ) : (
          face
        )}
        {showAcc && bigAccessory(spec.acc)}
        {dress}
        {halo}
      </div>
    )
  } else if (kind === 'lulu') {
    design = (
      <div className="gal-blob">
        {arms}
        {parts}
        {feet}
        {face}
        {!wHat && (
          <span className="acc-bow">
            <span className="loop l" />
            <span className="loop r" />
            <span className="knot" />
          </span>
        )}
        {dress}
        {halo}
      </div>
    )
  } else if (kind === 'toki') {
    design = (
      <div className="gal-toki">
        {arms}
        {parts}
        {feet}
        {face}
        {!wHat && (
          <span className="acc-hat">
            <span className="brim" />
            <span className="dome" />
            <span className="pom" />
          </span>
        )}
        {dress}
        {halo}
      </div>
    )
  } else if (kind === 'bobby') {
    design = (
      <div className="gal-bobby">
        {arms}
        {parts}
        {feet}
        {face}
        {!wBody && (
          <span className="acc-tie">
            <span className="bow" />
            <span className="knot" />
          </span>
        )}
        {dress}
        {halo}
      </div>
    )
  } else if (kind === 'gogo') {
    design = (
      <div className="gal-gogo">
        {arms}
        {parts}
        {feet}
        {eyes}
        {lips}
        {!wBody && (
          <span className="necklace">
            <span className="pendant" />
          </span>
        )}
        {dress}
        {halo}
      </div>
    )
  } else if (kind === 'moki') {
    design = (
      <div className="gal-moki">
        {arms}
        {parts}
        {feet}
        {!wHat && <span className="cowlick" />}
        {face}
        <span className="brow l" />
        <span className="brow r" />
        {!wFace && (
          <span className="glasses">
            <span className="lens" />
            <span className="bridge" />
            <span className="lens" />
          </span>
        )}
        {dress}
        {halo}
      </div>
    )
  } else if (kind === 'nuni') {
    design = (
      <div className="gal-nuni">
        {arms}
        {parts}
        {feet}
        {!wHat && <span className="earring l" />}
        {!wHat && <span className="earring r" />}
        {eyes}
        {lips}
        {!wHat && (
          <span className="flower">
            <i />
            <i />
            <i />
            <i />
            <i />
            <b />
          </span>
        )}
        {dress}
        {halo}
      </div>
    )
  } else if (kind === 'piko') {
    design = (
      <div className="gal-piko">
        {arms}
        {parts}
        {feet}
        {face}
        {!wHat && (
          <span className="crown">
            <i />
            <i />
            <i />
          </span>
        )}
        {dress}
        {halo}
      </div>
    )
  } else if (kind === 'dudi') {
    design = (
      <div className="gal-dudi">
        {arms}
        {parts}
        {feet}
        {face}
        {!wHat && (
          <span className="headphones">
            <span className="band" />
            <span className="cup l" />
            <span className="cup r" />
          </span>
        )}
        {dress}
        {halo}
      </div>
    )
  } else if (kind === 'zuzu') {
    design = (
      <div className="gal-zuzu">
        {arms}
        {!wHat && <span className="pigtail l" />}
        {!wHat && <span className="pigtail r" />}
        {parts}
        {feet}
        {face}
        {dress}
        {halo}
      </div>
    )
  } else {
    design = (
      <div className="gal-koko">
        {arms}
        {parts}
        {feet}
        {eyes}
        {lips}
        {!wHat && (
          <span className="tiara">
            <i />
            <i />
            <i />
          </span>
        )}
        {dress}
        {halo}
      </div>
    )
  }

  return <div className={`friend-art ${eating ? 'is-eating' : ''}`}>{design}</div>
}
