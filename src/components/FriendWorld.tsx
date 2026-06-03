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
//
// Each friend ALSO gets its own "special" button, themed to what that number
// loves (ice cream, a ball, a dance…): the emoji, label and motion all change
// per friend. The `like` is derived from the number (index % 12). `verb` (niqqud
// infinitive) is only the fallback TTS; the order matches scripts/gen-voice.mjs
// (intro clips + like-<n> clips), so keep the two in sync.
type Like = { verb: string; emoji: string; label: string; burst: string; motion: 'jump' | 'wiggle' | 'float' }
const LIKES: Like[] = [
  { verb: 'לִקְפּוֹץ', emoji: '🦘', label: 'קפיצה', burst: '💫', motion: 'jump' },
  { verb: 'לִרְקוֹד', emoji: '💃', label: 'ריקוד', burst: '🎵', motion: 'wiggle' },
  { verb: 'לִצְחוֹק', emoji: '😂', label: 'צחוק', burst: '😄', motion: 'wiggle' },
  { verb: 'לְהִתְחַבֵּק', emoji: '🧸', label: 'חיבוק', burst: '❤️', motion: 'jump' },
  { verb: 'לָשִׁיר', emoji: '🎤', label: 'שיר', burst: '🎶', motion: 'wiggle' },
  { verb: 'לִסְפּוֹר', emoji: '🧮', label: 'ספירה', burst: '✨', motion: 'jump' },
  { verb: 'לְשַׂחֵק מַחֲבוֹאִים', emoji: '🙈', label: 'מחבואים', burst: '✨', motion: 'float' },
  { verb: 'לֶאֱכוֹל גְּלִידָה', emoji: '🍦', label: 'גלידה', burst: '🍦', motion: 'jump' },
  { verb: 'לְצַיֵּיר', emoji: '🎨', label: 'ציור', burst: '🖍️', motion: 'wiggle' },
  { verb: 'לַעֲשׂוֹת בּוּעוֹת', emoji: '🫧', label: 'בועות', burst: '🫧', motion: 'float' },
  { verb: 'לְשַׂחֵק בְּכַדּוּר', emoji: '⚽', label: 'כדור', burst: '⚽', motion: 'jump' },
  { verb: 'לְחַלֵּק נְשִׁיקוֹת', emoji: '😘', label: 'נשיקות', burst: '💋', motion: 'jump' },
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
  const [motion, setMotion] = useState<string | null>(null)
  const [lit, setLit] = useState<number | undefined>(undefined)
  const like = LIKES[index % LIKES.length]
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
    const about = `שָׁלוֹם!! אֲנִי ${friendSay(index)}, הַמִּסְפָּר ${numberWord(n)}! אֲנִי מַמָּשׁ אוֹהֵב ${like.verb}! בּוֹאוּ נְשַׂחֵק יַחַד!`
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
  // the friend's OWN button: it does its favourite thing (themed emoji + motion)
  function special() {
    unlockAudio()
    setMotion(like.motion)
    later(() => setMotion(null), 1000)
    burst(like.burst, 9)
    playSuccess()
    playFriend(index)
    playClip(`like-${index % LIKES.length}`, like.label)
  }
  function count() {
    unlockAudio()
    clearTimers()
    stopClip()
    setLit(0)
    // a calm pace so each number is heard clearly before the next (was too fast)
    const STEP = 900
    for (let i = 1; i <= n; i++) {
      later(() => {
        setLit(i)
        playCount(i)
        playClip(`num-${i}`, numberWord(i))
      }, i * STEP)
    }
    later(() => {
      setLit(undefined)
      playWin()
      playClip(`num-${n}`, numberWord(n))
    }, n * STEP + 500)
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
          <div className={`world-friend ${motion ? `motion-${motion}` : ''}`}>
            <Friend index={index} scale={scale} showNumber bouncing={bounce} litUnits={lit} />
          </div>
          <div className="world-fx-layer" aria-hidden="true">
            {fx.map((f) => (
              <span key={f.id} className="world-fx" style={{ left: `${f.x}%` }}>
                {f.emoji}
              </span>
            ))}
          </div>
        </div>

        <div className="world-actions">
          <button className="world-btn world-btn-special" onClick={special}>
            <span className="world-btn-emoji" aria-hidden="true">{like.emoji}</span>
            <span>{like.label}</span>
          </button>
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
