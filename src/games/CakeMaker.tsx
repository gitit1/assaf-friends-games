import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playPop, playSuccess, playMunch, playTap, unlockAudio } from '../audio'
import { randFriendIndex } from '../level'
import { useT } from '../i18n'

// Cake maker: a free, creative builder — stack cake layers, add frosting and
// decorations (candles, cherry, strawberry, sprinkles), then TAP THE FRIEND to
// give it (a little party). No timer, no fail — pure creating.
const LAYERS = [
  { key: 'vanilla', color: '#f6e7c1' },
  { key: 'choc', color: '#7a5234' },
  { key: 'straw', color: '#f3a7c0' },
  { key: 'lemon', color: '#f3e07a' },
]
const DECOR = ['frosting', 'cherry', 'candle', 'strawberry', 'sprinkles'] as const
type Decor = (typeof DECOR)[number]
const DECOR_EMOJI: Partial<Record<Decor, string>> = { cherry: '🍒', candle: '🕯️', strawberry: '🍓' }
const MAX_LAYERS = 5
const scaleFor = (idx: number, h: number) => h / FRIEND_NATURAL[friendKindForIndex(idx)].h

export default function CakeMaker({ onExit, friend }: GameProps) {
  const { t } = useT()
  const [layers, setLayers] = useState<number[]>([])
  const [decor, setDecor] = useState<Decor[]>([])
  const [customer, setCustomer] = useState(() => friend ?? randFriendIndex())
  const [happy, setHappy] = useState(false)
  const [made, setMade] = useState(0)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  function addLayer(i: number) {
    if (happy || layers.length >= MAX_LAYERS) return
    unlockAudio()
    playPop()
    setLayers((l) => [...l, i])
  }
  function toggleDecor(k: Decor) {
    if (happy || !layers.length) return
    unlockAudio()
    playPop()
    setDecor((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]))
  }
  function undo() {
    if (happy) return
    playTap()
    if (decor.length) setDecor((d) => d.slice(0, -1))
    else if (layers.length) setLayers((l) => l.slice(0, -1))
  }
  function give() {
    if (happy || !layers.length) return
    unlockAudio()
    playSuccess()
    setHappy(true)
    setMade((n) => n + 1)
    timers.current.push(window.setTimeout(() => playMunch(), 400))
    timers.current.push(
      window.setTimeout(() => {
        setHappy(false)
        setLayers([])
        setDecor([])
        setCustomer(randFriendIndex())
      }, 1800),
    )
  }
  const has = (k: Decor) => decor.includes(k)

  return (
    <GameShell title={t('game.cake')} emoji="🎂" onExit={onExit}>
      <div className="cake-screen">
        <span className="cake-score" aria-hidden="true">🎂 {made}</span>

        <div className="cake-stage">
          {/* tap the friend to give the cake */}
          <button className={`cake-friend ${happy ? 'happy' : ''}`} onClick={give} aria-label={t('cake.give')}>
            <Friend index={customer} scale={scaleFor(customer, 92)} lively bouncing={happy} />
          </button>

          {/* the cake being built */}
          <div className="cake">
            {happy && <span className="cake-party" aria-hidden="true">🎉</span>}
            <div className="cake-decor">
              {has('cherry') && <span className="cake-d cake-cherry" aria-hidden="true">🍒</span>}
              {has('candle') && (
                <span className="cake-candles" aria-hidden="true">
                  <i /><i /><i />
                </span>
              )}
              {has('strawberry') && <span className="cake-d cake-straw" aria-hidden="true">🍓</span>}
            </div>
            {has('frosting') && <span className="cake-frost" aria-hidden="true" />}
            {has('sprinkles') && (
              <span className="cake-sprinkles" aria-hidden="true">
                {Array.from({ length: 11 }).map((_, i) => (
                  <i key={i} style={{ background: LAYERS[i % LAYERS.length].color }} />
                ))}
              </span>
            )}
            <div className="cake-layers">
              {layers
                .map((f, i) => ({ f, i }))
                .reverse()
                .map(({ f, i }) => (
                  <span key={i} className="cake-layer" style={{ background: LAYERS[f].color }} />
                ))}
              {layers.length === 0 && <span className="cake-empty" aria-hidden="true">🍽️</span>}
            </div>
            <span className="cake-plate" aria-hidden="true" />
          </div>
        </div>

        {/* the cake-layer flavours */}
        <div className="cake-row">
          {LAYERS.map((l, i) => (
            <button key={l.key} className="cake-tub" onClick={() => addLayer(i)} aria-label={l.key}>
              <span className="cake-tub-layer" style={{ background: l.color }} />
            </button>
          ))}
        </div>

        {/* decorations */}
        <div className="cake-decor-bar">
          {DECOR.map((k) => (
            <button
              key={k}
              className={`cake-decor-btn ${has(k) ? 'on' : ''}`}
              onClick={() => toggleDecor(k)}
              disabled={!layers.length}
              aria-label={t(`cake.${k}`)}
            >
              <span className={`cake-decor-ic ic-${k}`} aria-hidden="true">
                {DECOR_EMOJI[k] ?? ''}
              </span>
              <span className="cake-decor-name">{t(`cake.${k}`)}</span>
            </button>
          ))}
        </div>

        <div className="cake-actions">
          <button className="dance-ctrl" onClick={undo} disabled={happy || (!layers.length && !decor.length)} aria-label={t('ice.undo')}>
            <span aria-hidden="true">↩️</span>
          </button>
          <span className="cake-hint">{layers.length ? `👆 ${t('cake.give')}` : t('cake.hint')}</span>
        </div>
      </div>
    </GameShell>
  )
}
