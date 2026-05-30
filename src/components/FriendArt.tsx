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
]

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

type Props = {
  kind: FriendKind
  /** Number shown on the floating halo above the head. */
  number?: number
  showHalo?: boolean
  /** How many parts are lit (coloured). The rest are faint outlines. Default = all. */
  litUnits?: number
}

export default function FriendArt({ kind, number, showHalo = false, litUnits }: Props) {
  const order = PART_ORDER[kind]
  const lit = litUnits ?? order.length
  const parts = order.map((cls, i) => <span key={cls} className={`${cls} ${i < lit ? '' : 'is-off'}`} />)

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
  if (kind === 'lulu') {
    design = (
      <div className="gal-blob">
        {arms}
        {parts}
        {feet}
        {face}
        <span className="acc-bow">
          <span className="loop l" />
          <span className="loop r" />
          <span className="knot" />
        </span>
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
        <span className="acc-hat">
          <span className="brim" />
          <span className="dome" />
          <span className="pom" />
        </span>
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
        <span className="acc-tie">
          <span className="bow" />
          <span className="knot" />
        </span>
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
        <span className="necklace">
          <span className="pendant" />
        </span>
        {halo}
      </div>
    )
  } else if (kind === 'moki') {
    design = (
      <div className="gal-moki">
        {arms}
        {parts}
        {feet}
        <span className="cowlick" />
        {face}
        <span className="brow l" />
        <span className="brow r" />
        <span className="glasses">
          <span className="lens" />
          <span className="bridge" />
          <span className="lens" />
        </span>
        {halo}
      </div>
    )
  } else if (kind === 'nuni') {
    design = (
      <div className="gal-nuni">
        {arms}
        {parts}
        {feet}
        <span className="earring l" />
        <span className="earring r" />
        {eyes}
        {lips}
        <span className="flower">
          <i />
          <i />
          <i />
          <i />
          <i />
          <b />
        </span>
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
        <span className="crown">
          <i />
          <i />
          <i />
        </span>
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
        <span className="headphones">
          <span className="band" />
          <span className="cup l" />
          <span className="cup r" />
        </span>
        {halo}
      </div>
    )
  } else if (kind === 'zuzu') {
    design = (
      <div className="gal-zuzu">
        {arms}
        <span className="pigtail l" />
        <span className="pigtail r" />
        {parts}
        {feet}
        {face}
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
        <span className="tiara">
          <i />
          <i />
          <i />
        </span>
        {halo}
      </div>
    )
  }

  return <div className="friend-art">{design}</div>
}
