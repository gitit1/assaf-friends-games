import { worldForLevel } from './world'
import { useMaxLevel } from '../../holeProgress'
import { useT } from '../../i18n'
import { playTap } from '../../audio'

// The swallow game's WORLD MAP — the journey. Levels are grouped into themed
// worlds (candy → city → …); each is a row of numbered nodes. Reached levels are
// bright and playable, finished ones wear a ⭐, and the rest wait quietly behind a
// 🔒 (no pressure — they open as you go). Tap a node to drop into that level.
const LEVELS = 50
const META: Record<string, { emoji: string; key: string }> = {
  candy: { emoji: '🍭', key: 'hole.world.candy' },
  city: { emoji: '🏙️', key: 'hole.world.city' },
}

export default function HoleMap({ onPick }: { onPick: (level: number) => void }) {
  const { t } = useT()
  const maxLevel = useMaxLevel()
  const decades = Array.from({ length: LEVELS / 10 }, (_, s) => s * 10 + 1)

  return (
    <div className="hm-map">
      <p className="pet-pick-title">{t('hole.map.title')}</p>
      {decades.map((startL) => {
        const w = worldForLevel(startL)
        const m = META[w.id] ?? { emoji: '🗺️', key: '' }
        return (
          <div className="hm-world" key={startL}>
            <h3 className="hm-world-name">{m.emoji} {m.key ? t(m.key) : ''}</h3>
            <div className="hm-levels" dir="ltr">
              {Array.from({ length: 10 }, (_, i) => {
                const lvl = startL + i
                const locked = lvl > maxLevel
                const done = lvl < maxLevel
                const current = lvl === maxLevel
                return (
                  <button
                    key={lvl}
                    className={`hm-node ${locked ? 'locked' : ''} ${done ? 'done' : ''} ${current ? 'current' : ''}`}
                    disabled={locked}
                    onClick={() => { playTap(); onPick(lvl) }}
                    aria-label={`${t('hole.level')} ${lvl}`}
                  >
                    {locked ? '🔒' : lvl}
                    {done && <span className="hm-node-star">⭐</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
