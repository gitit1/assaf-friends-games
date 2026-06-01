import { useEffect, useRef, useState } from 'react'
import GameShell from './GameShell'
import Friend from './Friend'
import { friendMaxDim } from './FriendArt'
import { friendColorName, friendName, friendNumber, friendSay } from '../friends'
import { playCount, playFriend, playSuccess, playWin, unlockAudio } from '../audio'
import { speak, stopSpeech } from '../speech'
import { numberWord } from '../games/util'

// A friend's own little "world": tap into it from "החברים שלי" and the friend
// introduces itself (spoken description + animation, like a tiny narrated clip),
// and you can give it a high-five / hug / kiss, or hear it count its blocks.
const LIKES = [
  'לקפוץ',
  'לרקוד',
  'לצחוק',
  'להתחבק',
  'לשיר',
  'לספור',
  'לשחק מחבואים',
  'לאכול גלידה',
  'לצייר',
  'לעשות בועות',
  'לשחק בכדור',
  'לחלק נשיקות',
]

type Fx = { id: number; emoji: string; x: number }

export default function FriendWorld({ index, onExit }: { index: number; onExit: () => void }) {
  const n = friendNumber(index)
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
    const about = `שלום! אני ${friendSay(index)}, אני המספר ${numberWord(n)}! הצבע שלי ${friendColorName(
      index,
    )}. הכי כיף לי ${LIKES[index % LIKES.length]}. בואו נשחק!`
    stopSpeech()
    speak(about)
    setBounce(true)
    later(() => setBounce(false), 600)
  }

  // narrate on entry (and whenever you switch friend)
  useEffect(() => {
    unlockAudio()
    const id = window.setTimeout(describe, 350)
    timers.current.push(id)
    return clearTimers
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
    speak('כיף!')
  }
  function hug() {
    unlockAudio()
    hop()
    burst('❤️')
    playFriend(index)
    speak('חיבוק גדול!')
  }
  function kiss() {
    unlockAudio()
    hop()
    burst('💋')
    playFriend(index)
    speak('מְמְמוּאָה! נשיקה!')
  }
  function count() {
    unlockAudio()
    clearTimers()
    stopSpeech()
    setLit(0)
    for (let i = 1; i <= n; i++) {
      later(() => {
        setLit(i)
        playCount(i)
        speak(numberWord(i))
      }, i * 600)
    }
    later(() => {
      setLit(undefined)
      playWin()
      speak(`${numberWord(n)}! ${friendSay(index)}`)
    }, n * 600 + 500)
  }

  const scale = 210 / friendMaxDim(index)

  return (
    <GameShell title={friendName(index)} emoji="⭐" onExit={onExit}>
      <div className="world-screen">
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
