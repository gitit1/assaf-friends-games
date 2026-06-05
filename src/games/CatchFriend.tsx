import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import { friendCount, randFriendIndex } from '../level'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playNudge, playPop, playSuccess, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendName, friendSay } from '../friends'
import { useSettings } from '../settings'
import { randInt, shuffle } from './util'
import { screenScale, useViewport } from '../useViewport'
import Confetti from '../components/Confetti'
import { useT } from '../i18n'

const BOARD = 9 // friends visible at once
const WANT_TARGETS = 3 // targets placed at the start and on each switch (≈ 1 : 2 vs decoys)
const FLOOR_TARGETS = 1 // never let the board run out of catchable friends
const LIFETIME = 6000 // each friend leaves the board 6s after it appears
const FADE = 400 // gentle fade-out before it's actually removed

type Card = { id: number; index: number; x: number; y: number; popping: boolean; leaving: boolean; born: number }

let nextId = 0

// `ageMs` lets the starting board be staggered so the friends don't all vanish
// at the same moment.
function makeCard(index: number, ageMs = 0): Card {
  return {
    id: nextId++,
    index,
    x: 4 + Math.random() * 72,
    y: 6 + Math.random() * 64,
    popping: false,
    leaving: false,
    born: Date.now() - ageMs,
  }
}

// Make sure at least `min` of the cards are the target (convert random others).
function ensureTargets(cards: Card[], target: number, min: number): Card[] {
  let have = cards.filter((c) => c.index === target).length
  if (have >= min) return cards
  const copy = cards.map((c) => ({ ...c }))
  for (const c of shuffle(copy)) {
    if (have >= min) break
    if (c.index !== target) {
      c.index = target
      have++
    }
  }
  return copy
}

// Show a target friend; tap matching friends on the board to pop them for a
// point. A mix of friends is always on the board (with at least a couple of
// catchable ones), and the target switches on an interval set in settings.
export default function CatchFriend({ onExit }: GameProps) {
  const { catchSeconds } = useSettings()
  const { t } = useT()
  const [party, setParty] = useState(false)
  const [target, setTarget] = useState(() => randFriendIndex())
  const [cards, setCards] = useState<Card[]>(() => {
    const arr = Array.from({ length: BOARD }, () => makeCard(randFriendIndex(), randInt(0, LIFETIME - 1000)))
    return ensureTargets(arr, target, WANT_TARGETS)
  })
  const [score, setScore] = useState(0)
  const [wrongId, setWrongId] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const targetRef = useRef(target)
  useEffect(() => {
    targetRef.current = target
  }, [target])

  useEffect(() => {
    const all = timers.current
    return () => all.forEach((t) => window.clearTimeout(t))
  }, [])

  // Switch the target friend every `catchSeconds`.
  useEffect(() => {
    const id = window.setInterval(() => {
      setTarget((prev) => {
        let next = randFriendIndex()
        if (next === prev) next = (next + 1) % friendCount()
        return next
      })
    }, catchSeconds * 1000)
    return () => window.clearInterval(id)
  }, [catchSeconds])

  // Announce the new target and make sure enough catchable ones are present.
  useEffect(() => {
    speak(`תפסו את ${friendSay(target)}`)
    setCards((cs) => ensureTargets(cs, target, WANT_TARGETS))
  }, [target])

  // Each friend leaves the board ~6s after it appears: it gently fades, then is
  // removed and a fresh friend takes its place so the board stays lively.
  useEffect(() => {
    const id = window.setInterval(() => {
      setCards((cs) => {
        const now = Date.now()
        let changed = false
        let next = cs.map((c) => {
          if (!c.leaving && !c.popping && now - c.born >= LIFETIME) {
            changed = true
            return { ...c, leaving: true }
          }
          return c
        })
        const survivors = next.filter((c) => !(c.leaving && now - c.born >= LIFETIME + FADE))
        const gone = next.length - survivors.length
        if (gone > 0) {
          changed = true
          const fresh = Array.from({ length: gone }, () => makeCard(randFriendIndex()))
          next = ensureTargets([...survivors, ...fresh], targetRef.current, FLOOR_TARGETS)
        }
        return changed ? next : cs
      })
    }, 250)
    return () => window.clearInterval(id)
  }, [])

  function tap(card: Card) {
    unlockAudio()
    if (card.popping || card.leaving) return
    if (card.index === target) {
      setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, popping: true } : c)))
      playPop()
      setScore((s) => {
        const ns = s + 1
        if (ns % 5 === 0) {
          playWin()
          setParty(true)
          window.setTimeout(() => setParty(false), 2500)
        } else playSuccess()
        return ns
      })
      const t = window.setTimeout(() => {
        setCards((cs) => {
          const remaining = cs.filter((c) => c.id !== card.id)
          // The friend that appears in the popped spot is a RANDOM one (usually
          // not the target) — that's the variety. Catchability is kept by
          // topping the board back up to MIN_TARGETS elsewhere if needed.
          const withNew = [...remaining, makeCard(randFriendIndex())]
          return ensureTargets(withNew, targetRef.current, FLOOR_TARGETS)
        })
      }, 430)
      timers.current.push(t)
    } else {
      // gentle, not silent: a soft nudge + a spoken reminder of who we're after
      setWrongId(card.id)
      playNudge()
      speak(`חפשו את ${friendSay(target)}`)
      const t = window.setTimeout(() => setWrongId(null), 360)
      timers.current.push(t)
    }
  }

  const vp = useViewport()
  const cardPx = 50 * screenScale(vp.w) // uniform card size, bigger on a desktop
  return (
    <GameShell title={t('game.catch')} emoji="🎯" onExit={onExit}>
      <Confetti active={party} />
      <div className="catch-target">
        <span className="catch-target-label">{t('catch.tap')}</span>
        <Friend index={target} scale={Math.min(74 * screenScale(vp.w), vp.w * 0.34) / friendMaxDim(target)} />
        <span className="catch-target-name">{friendName(target)}</span>
        <span className="catch-score" aria-label={t('bs.score', { n: score })}>
          ⭐ {score}
        </span>
      </div>

      <div className="catch-board">
        {cards.map((card) => (
          <button
            key={card.id}
            className={`catch-card ${card.popping ? 'is-pop' : ''} ${card.leaving ? 'is-leaving' : ''} ${
              wrongId === card.id ? 'is-wrong' : ''
            }`}
            style={{ left: `${card.x}%`, top: `${card.y}%` }}
            onClick={() => tap(card)}
            aria-label={friendName(card.index)}
          >
            <Friend index={card.index} scale={cardPx / friendMaxDim(card.index)} showNumber={false} bouncing={card.popping} />
          </button>
        ))}
      </div>
    </GameShell>
  )
}
