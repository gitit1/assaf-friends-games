import { useEffect, useRef, useState } from 'react'
import GameShell from './GameShell'
import Friend from './Friend'
import IconButton from './IconButton'
import { friendMaxDim } from './FriendArt'
import { FRIENDS, friendName, friendNumber, friendSay } from '../friends'
import { playCount, playFriend, playSuccess, playTap, playWin, unlockAudio } from '../audio'
import { stopSpeech } from '../speech'
import { numberWord } from '../games/util'
import { playClip, stopClip } from '../voice'

// A friend's own little "world": tap into it from "החברים שלי" and the friend
// introduces itself (spoken description + animation, like a tiny narrated clip),
// and you can give it a high-five / hug / kiss, or hear it count its blocks.
// Niqqud so the fallback TTS (when a clip is missing) is pronounced right;
// order matches scripts/gen-voice.mjs so each friend's "like" stays consistent.
const LIKES = [
  'לִקְפּוֹץ',
  'לִרְקוֹד',
  'לִצְחוֹק',
  'לְהִתְחַבֵּק',
  'לָשִׁיר',
  'לִסְפּוֹר',
  'לְשַׂחֵק מַחֲבוֹאִים',
  'לֶאֱכוֹל גְּלִידָה',
  'לְצַיֵּיר',
  'לַעֲשׂוֹת בּוּעוֹת',
  'לְשַׂחֵק בְּכַדּוּר',
  'לְחַלֵּק נְשִׁיקוֹת',
]

type Fx = { id: number; emoji: string; x: number }

export default function FriendWorld({
  index,
  onExit,
  onNavigate,
}: {
  index: number
  onExit: () => void
  onNavigate: (index: number) => void
}) {
  const n = friendNumber(index)
  const total = FRIENDS.length
  // browse to the friend before / after this one, wrapping around the whole
  // cast so there's never a dead-end (no disabled buttons to puzzle a child)
  const goPrev = () => {
    playTap()
    onNavigate((index - 1 + total) % total)
  }
  const goNext = () => {
    playTap()
    onNavigate((index + 1) % total)
  }
  const [bounce, setBounce] = useState(false)
  const [lit, setLit] = useState<number | undefined>(undefined)
  const [fx, setFx] = useState<Fx[]>([])
  const timers = useRef<number[]>([])
  const fxId = useRef(0)

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  function describe() {
    // Short, exclamatory sentences = energy. No colour (many friends are multi-coloured).
    const about = `שָׁלוֹם!! אֲנִי ${friendSay(index)}! אֲנִי הַמִּסְפָּר ${numberWord(n)}! הֲכִי כֵּיף לִי ${LIKES[index % LIKES.length]}!! בּוֹאוּ אִיתִּי וּנְשַׂחֵק בְּיַחַד!`
    playClip(`intro-${index}`, about)
    setBounce(true)
    later(() => setBounce(false), 600)
  }

  // narrate on entry (and whenever you switch friend); when the friend changes
  // we also cut off the previous one's narration so they don't talk over it
  useEffect(() => {
    unlockAudio()
    const id = window.setTimeout(describe, 350)
    timers.current.push(id)
    return () => {
      clearTimers()
      stopClip()
      stopSpeech()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  function burst(emoji: string, count = 7) {
    const items: Fx[] = Array.from({ length: count }, () => ({
      id: fxId.current++,
      emoji,
      x: 12 + Math.floor(Math.random() * 76),
    }))
    setFx((f) => [...f, ...items])
    const ids = new Set(items.map((i) => i.id))
    later(() => setFx((f) => f.filter((x) => !ids.has(x.id))), 1300)
  }

  function hop() {
    setBounce(true)
    later(() => setBounce(false), 600)
  }

  function five() {
    unlockAudio()
    hop()
    burst('🙌')
    playSuccess()
    playClip('fx-five', 'כיף!')
  }
  function hug() {
    unlockAudio()
    hop()
    burst('❤️')
    playFriend(index)
    playClip('fx-hug', 'חיבוק גדול!')
  }
  function kiss() {
    unlockAudio()
    hop()
    burst('💋')
    playFriend(index)
    playClip('fx-kiss', 'מְמְמוּאָה! נשיקה!')
  }
  function count() {
    unlockAudio()
    clearTimers()
    stopClip()
    setLit(0)
    for (let i = 1; i <= n; i++) {
      later(() => {
        setLit(i)
        playCount(i)
        playClip(`num-${i}`, numberWord(i))
      }, i * 600)
    }
    later(() => {
      setLit(undefined)
      playWin()
      playClip(`num-${n}`, numberWord(n))
    }, n * 600 + 500)
  }

  const scale = 210 / friendMaxDim(index)

  return (
    <GameShell title={friendName(index)} emoji="⭐" onExit={onExit}>
      <div className="world-screen">
        {/* prev-friend / home / next-friend. direction:ltr (in CSS) keeps the
            arrows on the right side for RTL: ◀ goes to the lower number, ▶ to
            the higher, matching the number-line order. */}
        <div className="world-nav">
          <IconButton icon="◀" label="החבר הקודם" onClick={goPrev} />
          <IconButton icon="🏠" label="חזרה לחברים" onClick={onExit} />
          <IconButton icon="▶" label="החבר הבא" onClick={goNext} />
        </div>

        <div className="world-stage">
          <Friend index={index} scale={scale} showNumber bouncing={bounce} litUnits={lit} />
          <div className="world-fx-layer" aria-hidden="true">
            {fx.map((f) => (
              <span key={f.id} className="world-fx" style={{ left: `${f.x}%` }}>
                {f.emoji}
              </span>
            ))}
          </div>
        </div>

        <div className="world-actions">
          <button className="world-btn" onClick={five}>
            <span className="world-btn-emoji" aria-hidden="true">✋</span>
            <span>כיף</span>
          </button>
          <button className="world-btn" onClick={hug}>
            <span className="world-btn-emoji" aria-hidden="true">🤗</span>
            <span>חיבוק</span>
          </button>
          <button className="world-btn" onClick={kiss}>
            <span className="world-btn-emoji" aria-hidden="true">😘</span>
            <span>נשיקה</span>
          </button>
          <button className="world-btn" onClick={count}>
            <span className="world-btn-emoji" aria-hidden="true">🔢</span>
            <span>ספירה</span>
          </button>
          <button className="world-btn" onClick={describe}>
            <span className="world-btn-emoji" aria-hidden="true">🔊</span>
            <span>שוב</span>
          </button>
        </div>
      </div>
    </GameShell>
  )
}
