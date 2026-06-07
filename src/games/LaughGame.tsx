import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playGiggle, playRaspberry, playHonk, playTap, unlockAudio } from '../audio'
import { playClip, stopClip } from '../voice'
import { randFriendIndex, friendCount } from '../level'
import { randInt } from './util'
import { useViewport } from '../useViewport'
import { useT } from '../i18n'

// "Make Bobby laugh": tickle the friend with a feather, pull funny faces, make
// silly sounds, or hear a recorded knock-knock joke (Assaf's favourite). The
// friend giggles and wiggles, with 😂 bursts. No timer, no winning or losing.
const FACES = ['😝', '🤪', '😜', '😛', '🤓', '😬']
const JOKE_COUNT = 3

export default function LaughGame({ onExit, friend }: GameProps) {
  const { t } = useT()
  const vp = useViewport()
  const [who, setWho] = useState(() => friend ?? randFriendIndex())
  const [act, setAct] = useState<{ kind: string; n: number } | null>(null)
  const [faceEmoji, setFaceEmoji] = useState<string | null>(null)
  const [fx, setFx] = useState<{ id: number; emoji: string; x: number }[]>([])
  const actN = useRef(0)
  const fxId = useRef(0)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(
    () => () => {
      stopClip()
      clearTimers()
    },
    [],
  )

  function burst(emoji: string, count = 8) {
    const items = Array.from({ length: count }, () => ({
      id: fxId.current++,
      emoji,
      x: 28 + Math.floor(Math.random() * 44),
    }))
    setFx((f) => [...f, ...items])
    const ids = new Set(items.map((i) => i.id))
    timers.current.push(window.setTimeout(() => setFx((f) => f.filter((x) => !ids.has(x.id))), 1300))
  }
  function trigger(kind: string) {
    actN.current += 1
    setAct({ kind, n: actN.current })
    timers.current.push(window.setTimeout(() => setAct(null), 1000))
  }

  function tickle() {
    unlockAudio()
    trigger('tickle')
    playGiggle()
    burst('😆')
  }
  function makeFace() {
    unlockAudio()
    trigger('face')
    setFaceEmoji(FACES[randInt(0, FACES.length - 1)])
    timers.current.push(window.setTimeout(() => setFaceEmoji(null), 1100))
    playHonk()
    burst('😂', 6)
  }
  function sillySound() {
    unlockAudio()
    trigger('wiggle')
    playRaspberry()
    burst('💨', 5)
  }
  function tellJoke() {
    unlockAudio()
    stopClip()
    trigger('wiggle')
    playClip(`joke-${randInt(0, JOKE_COUNT - 1)}`, 'טוק טוק! חה חה חה!')
    burst('😂', 9)
  }

  function swap() {
    playTap()
    let n = randFriendIndex()
    if (friendCount() > 1) while (n === who) n = randFriendIndex()
    setWho(n)
  }

  const nat = FRIEND_NATURAL[friendKindForIndex(who)]
  const scale = Math.min((vp.h * 0.24) / nat.h, (vp.w * 0.5) / nat.w)

  return (
    <GameShell title={t('game.laugh')} emoji="😂" onExit={onExit}>
      <div className="laugh-screen">
        <div className="laugh-stage">
          <button className="dance-swap" onClick={swap} aria-label={t('dance.swap')}>
            🔀
          </button>
          <button
            className={`laugh-friend ${act ? `laugh-${act.kind}` : ''}`}
            key={act?.n ?? 0}
            onClick={tickle}
            aria-label={t('laugh.tickle')}
          >
            <Friend index={who} scale={scale} lively />
          </button>
          {faceEmoji && (
            <span className="laugh-face-pop" key={`face-${actN.current}`} aria-hidden="true">
              {faceEmoji}
            </span>
          )}
          <div className="world-fx-layer" aria-hidden="true">
            {fx.map((f) => (
              <span key={f.id} className="world-fx" style={{ left: `${f.x}%` }}>
                {f.emoji}
              </span>
            ))}
          </div>
        </div>

        <div className="laugh-buttons">
          <button className="laugh-btn" onClick={tickle}>
            <span className="laugh-btn-emoji" aria-hidden="true">
              🪶
            </span>
            <span>{t('laugh.tickle')}</span>
          </button>
          <button className="laugh-btn" onClick={makeFace}>
            <span className="laugh-btn-emoji" aria-hidden="true">
              😝
            </span>
            <span>{t('laugh.face')}</span>
          </button>
          <button className="laugh-btn" onClick={sillySound}>
            <span className="laugh-btn-emoji" aria-hidden="true">
              💨
            </span>
            <span>{t('laugh.sound')}</span>
          </button>
          <button className="laugh-btn laugh-joke" onClick={tellJoke}>
            <span className="laugh-btn-emoji" aria-hidden="true">
              🚪
            </span>
            <span>{t('laugh.joke')}</span>
          </button>
        </div>
      </div>
    </GameShell>
  )
}
