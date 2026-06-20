import { useState } from 'react'
import GameShell from '../components/GameShell'
import type { GameProps } from './registry'
import { playPop, playSuccess, playTap, unlockAudio } from '../audio'
import { randInt } from './util'
import { useT } from '../i18n'

// Garden: a calm, no-goal toy. Tap a patch of soil to plant a seed, then tap it
// again (or use the watering can) to water it — it grows seed → sprout → bud →
// flower. A counter shows how many flowers have bloomed. No timer, no fail.
const FLOWERS = ['🌸', '🌻', '🌷', '🌹', '🌼', '🌺']
const PLOTS = 6
type Plot = { stage: number; type: string } // stage 0 = empty soil, 4 = flower

export default function Garden({ onExit }: GameProps) {
  const { t } = useT()
  const [plots, setPlots] = useState<Plot[]>(() => Array.from({ length: PLOTS }, () => ({ stage: 0, type: '🌸' })))

  const bloomed = plots.filter((p) => p.stage === 4).length

  function grow(p: Plot): Plot {
    if (p.stage === 0) return { stage: 1, type: FLOWERS[randInt(0, FLOWERS.length - 1)] } // plant a seed
    if (p.stage < 4) return { ...p, stage: p.stage + 1 } // water → grow
    return p // already a flower
  }

  function tap(i: number) {
    unlockAudio()
    setPlots((ps) => {
      const next = ps.map((p, j) => (j === i ? grow(p) : p))
      if (ps[i].stage === 3) playSuccess() // just bloomed
      else playPop()
      return next
    })
  }

  function waterAll() {
    unlockAudio()
    playTap()
    setPlots((ps) => ps.map((p) => (p.stage >= 1 && p.stage < 4 ? { ...p, stage: p.stage + 1 } : p)))
  }

  function plantRow() {
    unlockAudio()
    playPop()
    setPlots((ps) => ps.map((p) => (p.stage === 0 ? { stage: 1, type: FLOWERS[randInt(0, FLOWERS.length - 1)] } : p)))
  }

  return (
    <GameShell title={t('game.garden')} emoji="🌱" onExit={onExit}>
      <div className="garden-screen">
        <div className="garden-scene">
          <span className="garden-sun" aria-hidden="true" />
          <span className="garden-cloud a" aria-hidden="true" />
          <span className="garden-cloud b" aria-hidden="true" />
          <span className="garden-count" aria-hidden="true">🌸 {bloomed}</span>
          <div className="garden-row">
            {plots.map((p, i) => (
              <button key={i} className={`garden-plot s${p.stage}`} onClick={() => tap(i)} aria-label={t('garden.plot')}>
                {p.stage >= 1 && (
                  <span className="garden-plant">
                    {p.stage >= 2 && <span className="garden-stem" />}
                    {p.stage >= 2 && <span className="garden-leaf l" />}
                    {p.stage >= 3 && <span className="garden-leaf r" />}
                    {p.stage === 1 && <span className="garden-seed" aria-hidden="true">🌱</span>}
                    {p.stage === 3 && <span className="garden-bud" />}
                    {p.stage === 4 && <span className="garden-flower">{p.type}</span>}
                  </span>
                )}
                <span className="garden-soil" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <div className="garden-actions">
          <button className="big-button garden-plant-btn" onClick={plantRow}>
            🌱 {t('garden.plant')}
          </button>
          <button className="big-button garden-water-btn" onClick={waterAll}>
            💧 {t('garden.water')}
          </button>
        </div>
      </div>
    </GameShell>
  )
}
