import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playPop, playSuccess, playNudge, playTap, unlockAudio } from '../audio'
import { randFriendIndex } from '../level'
import { randInt } from './util'
import { useT } from '../i18n'

// Shop till: a friend buys an item that costs a number of coins; Assaf drops that
// many coins in the till (a big running count) and rings it up. Numbers practice.
// No timer, no fail — a wrong amount just nudges gently.
const GOODS = ['🍎', '🍌', '🥛', '🍞', '🧀', '🍪', '🧃', '🍫', '🍓', '🥕']
const scaleFor = (idx: number, h: number) => h / FRIEND_NATURAL[friendKindForIndex(idx)].h

export default function ShopGame({ onExit, friend }: GameProps) {
  const { t } = useT()
  const [customer, setCustomer] = useState(() => friend ?? randFriendIndex())
  const [item, setItem] = useState(() => GOODS[randInt(0, GOODS.length - 1)])
  const [price, setPrice] = useState(() => randInt(1, 5))
  const [paid, setPaid] = useState(0)
  const [happy, setHappy] = useState(false)
  const [sold, setSold] = useState(0)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  function addCoin() {
    if (happy || paid >= 9) return
    unlockAudio()
    playPop()
    setPaid((p) => p + 1)
  }
  function undo() {
    if (happy || !paid) return
    playTap()
    setPaid((p) => p - 1)
  }
  function sell() {
    if (happy || !paid) return
    unlockAudio()
    if (paid !== price) {
      playNudge() // gentle — count the coins again
      return
    }
    playSuccess()
    setHappy(true)
    setSold((n) => n + 1)
    timers.current.push(
      window.setTimeout(() => {
        setHappy(false)
        setPaid(0)
        setCustomer(randFriendIndex())
        setItem(GOODS[randInt(0, GOODS.length - 1)])
        setPrice(randInt(1, 5))
      }, 1700),
    )
  }

  return (
    <GameShell title={t('game.shop')} emoji="🏪" onExit={onExit}>
      <div className="shop-screen">
        <span className="shop-score" aria-hidden="true">🛍️ {sold}</span>

        {/* the customer + the item they buy and its price */}
        <div className="shop-stage">
          <div className={`shop-customer ${happy ? 'happy' : ''}`}>
            <Friend index={customer} scale={scaleFor(customer, 92)} lively bouncing={happy} />
          </div>
          <div className="shop-item">
            {happy ? (
              <span className="shop-yum" aria-hidden="true">😍</span>
            ) : (
              <>
                <span className="shop-good" aria-hidden="true">{item}</span>
                <span className="shop-price" aria-hidden="true">
                  <b>{price}</b>
                  <span className="shop-price-coins">
                    {Array.from({ length: price }).map((_, i) => (
                      <span key={i}>🪙</span>
                    ))}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* the till — coins dropped in, with a running count */}
        <div className="shop-tillwrap">
          <div className="shop-till">
            {paid === 0 && <span className="shop-till-empty" aria-hidden="true">💰</span>}
            {Array.from({ length: paid }).map((_, i) => (
              <span key={i} className="shop-coin" aria-hidden="true">🪙</span>
            ))}
          </div>
          <span className="shop-count" aria-hidden="true">{paid}</span>
        </div>

        {/* tap to drop a coin in */}
        <button className="shop-add" onClick={addCoin} aria-label={t('shop.coin')}>
          <span className="shop-add-coin" aria-hidden="true">🪙</span>
          <span className="shop-add-plus" aria-hidden="true">＋</span>
        </button>

        <div className="shop-actions">
          <button className="dance-ctrl" onClick={undo} disabled={happy || !paid} aria-label={t('ice.undo')}>
            <span aria-hidden="true">↩️</span>
          </button>
          <button className="big-button shop-sell" onClick={sell} disabled={happy || !paid}>
            {t('shop.pay')} 🧾
          </button>
        </div>
      </div>
    </GameShell>
  )
}
