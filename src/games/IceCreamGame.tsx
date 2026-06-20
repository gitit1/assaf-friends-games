import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playPop, playSuccess, playMunch, playNudge, playTap, unlockAudio } from '../audio'
import { randFriendIndex, friendCount } from '../level'
import { randInt } from './util'
import { useT } from '../i18n'

// Ice-cream PARLOUR: Assaf scoops "flavours" (colours) onto a cone and decorates
// it with toppings — chocolate sauce, whipped cream, sprinkles, a cherry. Two
// modes:
//   FREE  — build whatever you like; tap the friend to hand it over (no button)
//   ORDER — a friend orders some scoops, build the matching cone and serve.
// No harsh fail: a wrong order just gets a gentle nudge so he can fix it.
const FLAVORS = [
  { key: 'vanilla', color: '#f3e4ba' },
  { key: 'choc', color: '#7a5234' },
  { key: 'straw', color: '#f7a8c4' },
  { key: 'mint', color: '#9ee8b6' },
  { key: 'blue', color: '#8fc2f0' },
  { key: 'lemon', color: '#f6df5e' },
]
// toppings sit on top of the scoops (order = how they layer, top of cone down)
const TOPPINGS = ['cherry', 'cream', 'choc', 'sprinkles'] as const
type Topping = (typeof TOPPINGS)[number]
const MAX_SCOOPS = 5

function makeOrder() {
  return Array.from({ length: randInt(2, 4) }, () => randInt(0, FLAVORS.length - 1))
}
function nextFriend(prev: number) {
  let n = randFriendIndex()
  if (friendCount() > 1) while (n === prev) n = randFriendIndex()
  return n
}
function sameMulti(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.every((v, i) => v === sb[i])
}
const scaleFor = (idx: number, h: number) => h / FRIEND_NATURAL[friendKindForIndex(idx)].h

export default function IceCreamGame({ onExit, friend }: GameProps) {
  const { t } = useT()
  const [mode, setMode] = useState<'open' | 'closed'>('open')
  const [scoops, setScoops] = useState<number[]>([])
  const [toppings, setToppings] = useState<Topping[]>([])
  const [customer, setCustomer] = useState(() => friend ?? randFriendIndex())
  const [order, setOrder] = useState<number[]>(() => makeOrder())
  const [queue, setQueue] = useState<number[]>([])
  const [happy, setHappy] = useState(false)
  const [served, setServed] = useState(0)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(() => {
    const q: number[] = []
    let last = customer
    for (let i = 0; i < 3; i++) {
      last = nextFriend(last)
      q.push(last)
    }
    setQueue(q)
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addScoop(i: number) {
    if (happy || scoops.length >= MAX_SCOOPS) return
    unlockAudio()
    playPop()
    setScoops((s) => [...s, i])
  }
  function toggleTopping(kind: Topping) {
    if (happy || !scoops.length) return // need ice cream before toppings
    unlockAudio()
    playPop()
    setToppings((tp) => (tp.includes(kind) ? tp.filter((k) => k !== kind) : [...tp, kind]))
  }
  function undo() {
    if (happy) return
    playTap()
    if (toppings.length) setToppings((tp) => tp.slice(0, -1))
    else if (scoops.length) setScoops((s) => s.slice(0, -1))
  }

  function nextCustomer() {
    setQueue((q) => {
      const [next, ...rest] = q
      const nc = next ?? nextFriend(customer)
      setCustomer(nc)
      setOrder(makeOrder())
      const tailFrom = rest.length ? rest[rest.length - 1] : nc
      return [...rest, nextFriend(tailFrom)]
    })
  }

  // hand the cone to the friend (free mode = tap the friend; order mode = serve)
  function give(checkOrder: boolean) {
    if (happy || !scoops.length) return
    unlockAudio()
    if (checkOrder && !sameMulti(scoops, order)) {
      playNudge() // gentle — let him fix the cone
      return
    }
    playSuccess()
    setHappy(true)
    setServed((n) => n + 1)
    timers.current.push(window.setTimeout(() => playMunch(), 350))
    timers.current.push(
      window.setTimeout(() => {
        setHappy(false)
        setScoops([])
        setToppings([])
        if (mode === 'closed') nextCustomer()
        else setCustomer((c) => nextFriend(c))
      }, 1600),
    )
  }

  function switchMode(m: 'open' | 'closed') {
    if (m === mode) return
    playTap()
    clearTimers()
    setMode(m)
    setScoops([])
    setToppings([])
    setHappy(false)
    if (m === 'closed') setOrder(makeOrder())
  }

  const has = (k: Topping) => toppings.includes(k)

  return (
    <GameShell title={t('game.icecream')} emoji="🍦" onExit={onExit}>
      <div className="ice-screen">
        {/* the parlour: striped awning + sign */}
        <div className="ice-awning" aria-hidden="true">
          <span className="ice-sign">🍨 {t('ice.parlor')} 🍦</span>
        </div>

        {/* mode toggle */}
        <div className="ice-modes">
          <button className={`ice-mode-btn ${mode === 'open' ? 'on' : ''}`} onClick={() => switchMode('open')}>
            🍨 {t('ice.open')}
          </button>
          <button className={`ice-mode-btn ${mode === 'closed' ? 'on' : ''}`} onClick={() => switchMode('closed')}>
            📋 {t('ice.closed')}
          </button>
          <span className="ice-score" aria-hidden="true">
            🍦 {served}
          </span>
        </div>

        {/* the customer + their order (closed) or a free-play prompt (open) */}
        <div className="ice-top">
          {mode === 'closed' && (
            <div className="ice-queue" aria-hidden="true">
              {queue.map((q, i) => (
                <span key={`${q}-${i}`} className="ice-q">
                  <Friend index={q} scale={scaleFor(q, 46)} />
                </span>
              ))}
            </div>
          )}
          <div className="ice-counter-row">
            {/* in FREE mode the friend itself is the "give" button — tap to hand it over */}
            {mode === 'open' ? (
              <button
                className={`ice-customer as-btn ${happy ? 'happy' : ''}`}
                onClick={() => give(false)}
                aria-label={t('ice.give')}
              >
                <Friend index={customer} scale={scaleFor(customer, 96)} lively bouncing={happy} />
              </button>
            ) : (
              <div className={`ice-customer ${happy ? 'happy' : ''}`}>
                <Friend index={customer} scale={scaleFor(customer, 96)} lively bouncing={happy} />
              </div>
            )}
            <div className="ice-bubble">
              {happy ? (
                <span className="ice-yum">😋</span>
              ) : mode === 'closed' ? (
                <span className="ice-order">
                  {order.map((f, i) => (
                    <span key={i} className="ice-dot" style={{ background: FLAVORS[f].color }} />
                  ))}
                </span>
              ) : (
                <span className="ice-free">{scoops.length ? t('ice.give') : t('ice.free')}</span>
              )}
            </div>
          </div>
        </div>

        {/* the cone being built: toppings on top, then the scoops, then the cone */}
        <div className="ice-cone">
          <div className="ice-scoops">
            {has('cherry') && <span className="ice-top-cherry" aria-hidden="true">🍒</span>}
            {has('cream') && <span className="ice-top-cream" aria-hidden="true" />}
            {has('choc') && <span className="ice-top-choc" aria-hidden="true" />}
            {has('sprinkles') && (
              <span className="ice-top-sprinkles" aria-hidden="true">
                {Array.from({ length: 11 }).map((_, i) => (
                  <i key={i} style={{ background: FLAVORS[i % FLAVORS.length].color }} />
                ))}
              </span>
            )}
            {scoops
              .map((f, i) => ({ f, i }))
              .reverse()
              .map(({ f, i }) => (
                <span key={i} className="ice-scoop" style={{ background: FLAVORS[f].color }} />
              ))}
          </div>
          <span className="ice-cone-base" aria-hidden="true" />
        </div>

        {/* the flavour tubs — tap to scoop that flavour */}
        <div className="ice-stand">
          {FLAVORS.map((fl, i) => (
            <button key={fl.key} className="ice-tub" onClick={() => addScoop(i)} aria-label={fl.key}>
              <span className="ice-tub-scoop" style={{ background: fl.color }} />
            </button>
          ))}
        </div>

        {/* the toppings bar */}
        <div className="ice-toppings-bar">
          {TOPPINGS.map((k) => (
            <button
              key={k}
              className={`ice-top-btn ${has(k) ? 'on' : ''}`}
              onClick={() => toggleTopping(k)}
              disabled={!scoops.length}
              aria-label={t(`ice.top.${k}`)}
            >
              <span className={`ice-top-ic ic-${k}`} aria-hidden="true">
                {k === 'cherry' ? '🍒' : ''}
              </span>
              <span className="ice-top-name">{t(`ice.top.${k}`)}</span>
            </button>
          ))}
        </div>

        {/* actions */}
        <div className="ice-actions">
          <button className="dance-ctrl" onClick={undo} disabled={happy || (!scoops.length && !toppings.length)} aria-label={t('ice.undo')}>
            <span aria-hidden="true">↩️</span>
          </button>
          {mode === 'closed' ? (
            <button className="big-button ice-serve" onClick={() => give(true)} disabled={happy || !scoops.length}>
              {t('ice.serve')} 🍦
            </button>
          ) : (
            <span className="ice-hint">{scoops.length ? `👆 ${t('ice.give')}` : t('ice.buildHint')}</span>
          )}
        </div>
      </div>
    </GameShell>
  )
}
