import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import AnimalArt, { ANIMAL_KINDS, ANIMAL_NATURAL, type AnimalKind } from '../components/AnimalArt'
import type { GameProps } from './registry'
import { playPop, playSuccess, playMunch, playNudge, playTap, unlockAudio } from '../audio'
import { randInt } from './util'
import { useT } from '../i18n'

// Feed the animals: an animal asks for a NUMBER of treats (its own food), Assaf
// taps to drop that many into the bowl, then feeds it. A running count is shown
// the whole time (numbers practice). No timer, no fail — a wrong count just gets a
// gentle nudge so he can fix it.
const FOOD: Record<AnimalKind, string> = { dog: '🦴', cat: '🐟', rabbit: '🥕', hamster: '🌰' }

function AnimalFig({ kind, eating, px }: { kind: AnimalKind; eating?: boolean; px: number }) {
  const nat = ANIMAL_NATURAL[kind]
  const scale = px / Math.max(nat.w, nat.h)
  return (
    <span className="feed-fig" style={{ width: nat.w * scale, height: nat.h * scale }}>
      <span style={{ display: 'inline-block', width: nat.w, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <AnimalArt kind={kind} eating={eating} />
      </span>
    </span>
  )
}

export default function FeedAnimals({ onExit }: GameProps) {
  const { t } = useT()
  const [kind, setKind] = useState<AnimalKind>(() => ANIMAL_KINDS[randInt(0, ANIMAL_KINDS.length - 1)])
  const [want, setWant] = useState(() => randInt(1, 5))
  const [bowl, setBowl] = useState(0)
  const [happy, setHappy] = useState(false)
  const [fed, setFed] = useState(0)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  function add() {
    if (happy || bowl >= 9) return
    unlockAudio()
    playPop()
    setBowl((b) => b + 1)
  }
  function undo() {
    if (happy || !bowl) return
    playTap()
    setBowl((b) => b - 1)
  }
  function feed() {
    if (happy || !bowl) return
    unlockAudio()
    if (bowl !== want) {
      playNudge() // gentle — count again
      return
    }
    playSuccess()
    setHappy(true)
    setFed((n) => n + 1)
    timers.current.push(window.setTimeout(() => playMunch(), 350))
    timers.current.push(
      window.setTimeout(() => {
        setHappy(false)
        setBowl(0)
        setKind(ANIMAL_KINDS[randInt(0, ANIMAL_KINDS.length - 1)])
        setWant(randInt(1, 5))
      }, 1700),
    )
  }

  return (
    <GameShell title={t('game.feedanimals')} emoji="🐾" onExit={onExit}>
      <div className="feed-screen">
        <span className="feed-score" aria-hidden="true">🍽️ {fed}</span>

        {/* the animal + what it wants */}
        <div className="feed-stage">
          <div className={`feed-animal ${happy ? 'happy' : ''}`}>
            <AnimalFig kind={kind} eating={happy} px={132} />
          </div>
          <div className="feed-bubble">
            {happy ? (
              <span className="feed-yum">😋</span>
            ) : (
              <span className="feed-want">
                <b className="feed-num">{want}</b>
                <span className="feed-wantfood">
                  {Array.from({ length: want }).map((_, i) => (
                    <span key={i}>{FOOD[kind]}</span>
                  ))}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* the bowl + the running count */}
        <div className="feed-bowlwrap">
          <div className="feed-bowl">
            {bowl === 0 && <span className="feed-bowl-empty" aria-hidden="true">🥣</span>}
            {Array.from({ length: bowl }).map((_, i) => (
              <span key={i} className="feed-item">{FOOD[kind]}</span>
            ))}
          </div>
          <span className="feed-count" aria-hidden="true">{bowl}</span>
        </div>

        {/* tap to drop one treat in */}
        <button className="feed-add" onClick={add} aria-label={t('feed.add')}>
          <span className="feed-add-food" aria-hidden="true">{FOOD[kind]}</span>
          <span className="feed-add-plus" aria-hidden="true">＋</span>
        </button>

        <div className="feed-actions">
          <button className="dance-ctrl" onClick={undo} disabled={happy || !bowl} aria-label={t('ice.undo')}>
            <span aria-hidden="true">↩️</span>
          </button>
          <button className="big-button feed-go" onClick={feed} disabled={happy || !bowl}>
            {t('feed.give')} 🍽️
          </button>
        </div>
      </div>
    </GameShell>
  )
}
