// Cute cartoon kids (boy / girl) for the potty-training game. Front-facing chibi,
// drawn as SVG. The bottom garments are SEPARATE, ANIMATABLE layers so the game
// can show them slide down and off, step by step:
//   • pants  (.kid-pants)  — worn over the diaper / on their own
//   • diaper (.kid-diaper) — under the pants
// `removing` adds a class that runs the slide-down-and-off keyframe on that layer,
// so a child sees the garment actually come off (not just blink away). Kept
// tasteful — no anatomy; the "pee" is a separate cartoon stream drawn by the game.
import type { ReactElement } from 'react'

export type KidGender = 'boy' | 'girl'
export type Removing = 'pants' | 'diaper' | null

function GlossyEye({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={6.5} ry={8} fill="#2e2330" />
      <circle cx={cx - 2.4} cy={cy - 3} r={2.6} fill="#fff" />
      <circle cx={cx + 2.2} cy={cy + 2.6} r={1.2} fill="#fff" opacity="0.85" />
    </g>
  )
}

export default function KidArt({
  gender,
  pantsOn = true,
  diaperOn = false,
  removing = null,
}: {
  gender: KidGender
  pantsOn?: boolean
  diaperOn?: boolean
  removing?: Removing
}): ReactElement {
  const skin = '#f6c79c'
  const skinD = '#e7ab7c'
  const hair = gender === 'boy' ? '#7a4a28' : '#8a5230'
  const shirt = gender === 'boy' ? '#4ec0a8' : '#f48fb1'
  const pants = gender === 'boy' ? '#3f72d8' : '#c850a0'
  return (
    <svg className="kid-svg" viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <filter id="kidSoft" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#6a4a2a" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter="url(#kidSoft)">
        {/* legs (always) */}
        <rect x="46" y="140" width="12" height="42" rx="6" fill={skin} />
        <rect x="62" y="140" width="12" height="42" rx="6" fill={skin} />
        <ellipse cx="52" cy="184" rx="9" ry="6" fill={skinD} />
        <ellipse cx="68" cy="184" rx="9" ry="6" fill={skinD} />

        {/* diaper layer (under the pants) */}
        {diaperOn && (
          <g className={`kid-diaper${removing === 'diaper' ? ' removing' : ''}`}>
            <path
              d="M37 122 H83 C 84 138 75 156 60 156 C 45 156 36 138 37 122 Z"
              fill="#fbfdff"
              stroke="#dfe6ee"
              strokeWidth="2"
            />
            <path d="M37 127 H83" stroke="#cfe0f0" strokeWidth="3" />
            <circle cx="48" cy="118" r="4" fill="#ffd5e6" />
            <circle cx="72" cy="118" r="4" fill="#cfe6ff" />
          </g>
        )}

        {/* pants layer (over the diaper, or on their own) */}
        {pantsOn && (
          <g className={`kid-pants${removing === 'pants' ? ' removing' : ''}`}>
            <path
              d="M36 120 H84 L 82 150 C 82 158 70 158 60 153 C 50 158 38 158 38 150 Z"
              fill={pants}
            />
            <path d="M36 124 H84" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
          </g>
        )}

        {/* body / shirt */}
        <path d="M42 100 C 42 92 78 92 78 100 L 80 130 C 80 138 40 138 40 130 Z" fill={shirt} />
        {/* arms */}
        <rect x="32" y="102" width="11" height="34" rx="5.5" fill={skin} />
        <rect x="77" y="102" width="11" height="34" rx="5.5" fill={skin} />
        {/* head */}
        <ellipse cx="60" cy="62" rx="38" ry="36" fill={skin} />
        {/* hair */}
        {gender === 'boy' ? (
          <path d="M24 58 C 22 26 98 26 96 58 C 90 44 78 38 60 38 C 42 38 30 44 24 58 Z" fill={hair} />
        ) : (
          <g>
            <path d="M24 60 C 22 24 98 24 96 60 C 90 42 78 34 60 34 C 42 34 30 42 24 60 Z" fill={hair} />
            <ellipse cx="22" cy="74" rx="11" ry="16" fill={hair} />
            <ellipse cx="98" cy="74" rx="11" ry="16" fill={hair} />
            <circle cx="30" cy="40" r="6" fill="#ff8fb3" />
          </g>
        )}
        {/* face */}
        <GlossyEye cx={48} cy={64} />
        <GlossyEye cx={72} cy={64} />
        <ellipse cx="60" cy="72" rx="2.6" ry="2" fill={skinD} />
        <path d="M54 78 C 57 82 63 82 66 78" fill="none" stroke="#9a5a3a" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="38" cy="74" rx="6" ry="4" fill="#f7a8b8" opacity="0.7" />
        <ellipse cx="82" cy="74" rx="6" ry="4" fill="#f7a8b8" opacity="0.7" />
      </g>
    </svg>
  )
}
