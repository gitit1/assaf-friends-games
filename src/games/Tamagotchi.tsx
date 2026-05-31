import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playFriend, playMunch, playSuccess, playTap, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendName, friendSay } from '../friends'

// foods in the fridge — tapping one says its name and the friend eats it
const FOODS: { name: string; emoji: string }[] = [
  { name: 'בננה', emoji: '🍌' },
  { name: 'תפוח', emoji: '🍎' },
  { name: 'דג', emoji: '🐟' },
  { name: 'נקניקייה', emoji: '🌭' },
  { name: 'המבורגר', emoji: '🍔' },
  { name: 'מלפפון', emoji: '🥒' },
  { name: 'עגבנייה', emoji: '🍅' },
  { name: 'קערת אורז', emoji: '🍚' },
  { name: 'עוף', emoji: '🍗' },
  { name: 'בשר', emoji: '🥩' },
  { name: 'פרוסה עם גבינה', emoji: '🧀' },
  { name: 'גזר', emoji: '🥕' },
  { name: 'חביתה', emoji: '🍳' },
  { name: 'טוסט', emoji: '🥪' },
  { name: 'במבה', emoji: '🥜' },
  { name: 'שוקולד', emoji: '🍫' },
]

// "My friend" — a gentle Tamagotchi-style virtual pet. Pick a number to raise,
// then feed / water / play / walk / potty + clean 💩 / dress up. Stats drop
// slowly but the friend NEVER dies — it just gets sad and you cheer it up. The
// pet (and its outfit) is saved so the child returns to the same friend.
const KEY = 'assaf-friends:pet:v1'

type Slot = 'hat' | 'face' | 'neck' | 'held'
type Outfit = Partial<Record<Slot, string>>
type Pet = {
  friend: number
  hunger: number
  thirst: number
  happy: number
  clean: number
  poop: boolean
  outfit: Outfit
  ts: number
}

const SLOTS: { key: Slot; label: string; items: string[] }[] = [
  { key: 'hat', label: 'כובע', items: ['🎩', '👑', '🎀', '🧢', '🎓', '👒', '🤠', '🍄', '⭐', '🎉', '🌸', '🪅'] },
  { key: 'face', label: 'משקפיים', items: ['🕶️', '👓', '🥽'] },
  { key: 'neck', label: 'צעיף', items: ['🧣', '🎀', '📿', '🎽'] },
  { key: 'held', label: 'חפץ', items: ['🎈', '🍭', '🧸', '🌷', '🪁', '⚽', '🍦', '📚', '🎸'] },
]

const clamp = (v: number) => Math.max(0, Math.min(100, v))

function freshPet(friend: number): Pet {
  return { friend, hunger: 80, thirst: 80, happy: 85, clean: 100, poop: false, outfit: {}, ts: Date.now() }
}

function load(): Pet | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Pet
    // it got a little hungrier/messier while away (gently, capped)
    const mins = Math.min(90, (Date.now() - p.ts) / 60000)
    const d = Math.round(mins)
    p.hunger = clamp(p.hunger - d)
    p.thirst = clamp(p.thirst - d)
    p.happy = clamp(p.happy - Math.round(d * 0.6))
    p.clean = clamp(p.clean - Math.round(d * 0.6))
    return p
  } catch {
    return null
  }
}

function FriendDressed({
  index,
  px,
  outfit,
  bouncing,
  eating,
}: {
  index: number
  px: number
  outfit: Outfit
  bouncing?: boolean
  eating?: boolean
}) {
  return (
    <span className={`pet-figure ${eating ? 'is-eating' : ''}`} style={{ fontSize: `${px}px` }}>
      <Friend index={index} scale={px / friendMaxDim(index)} showNumber={false} bouncing={bouncing} />
      {outfit.held && <span className="dress dress-held">{outfit.held}</span>}
      {outfit.neck && <span className="dress dress-neck">{outfit.neck}</span>}
      {outfit.face && <span className="dress dress-face">{outfit.face}</span>}
      {outfit.hat && <span className="dress dress-hat">{outfit.hat}</span>}
    </span>
  )
}

export default function Tamagotchi({ onExit }: GameProps) {
  const [pet, setPet] = useState<Pet | null>(load)
  const [choosing, setChoosing] = useState(() => pet === null)
  const [pick, setPick] = useState(0)
  const [wardrobe, setWardrobe] = useState(false)
  const [fridge, setFridge] = useState(false)
  const [eatFood, setEatFood] = useState<string | null>(null)
  const [bite, setBite] = useState(0)
  const [scene, setScene] = useState<'home' | 'walk'>('home')
  const [fx, setFx] = useState<{ emoji: string; id: number } | null>(null)
  const [bounce, setBounce] = useState(false)
  const eatTimers = useRef<number[]>([])
  useEffect(() => () => eatTimers.current.forEach((t) => window.clearTimeout(t)), [])

  // save whenever the pet changes
  useEffect(() => {
    if (pet) localStorage.setItem(KEY, JSON.stringify({ ...pet, ts: Date.now() }))
  }, [pet])

  // gentle decay (never below 0; the friend never dies)
  useEffect(() => {
    const id = window.setInterval(() => {
      setPet((p) =>
        p
          ? {
              ...p,
              hunger: clamp(p.hunger - 2),
              thirst: clamp(p.thirst - 2),
              happy: clamp(p.happy - (p.poop ? 4 : 1)),
              clean: clamp(p.clean - (p.poop ? 5 : 1)),
              poop: p.poop || Math.random() < 0.08,
            }
          : p,
      )
    }, 15000)
    return () => window.clearInterval(id)
  }, [])

  function showFx(emoji: string) {
    setFx({ emoji, id: (fx?.id ?? 0) + 1 })
    window.setTimeout(() => setFx((f) => (f && f.emoji === emoji ? null : f)), 900)
  }

  function choose(friend: number) {
    unlockAudio()
    playSuccess()
    setPet(freshPet(friend))
    setChoosing(false)
    speak(`${friendSay(friend)}! החבר שלי`)
  }

  function pokePet() {
    if (!pet) return
    unlockAudio()
    playFriend(pet.friend)
    speak(friendSay(pet.friend))
    setBounce(true)
    window.setTimeout(() => setBounce(false), 550)
  }

  function act(type: 'feed' | 'water' | 'play' | 'walk' | 'potty' | 'clean') {
    if (!pet) return
    unlockAudio()
    playTap()
    setPet((p) => {
      if (!p) return p
      const n = { ...p }
      if (type === 'feed') n.hunger = clamp(p.hunger + 34)
      else if (type === 'water') n.thirst = clamp(p.thirst + 34)
      else if (type === 'play') n.happy = clamp(p.happy + 28)
      else if (type === 'walk') {
        n.happy = clamp(p.happy + 20)
        n.thirst = clamp(p.thirst - 6)
      } else if (type === 'potty') n.poop = true
      else if (type === 'clean') {
        n.poop = false
        n.clean = 100
        n.happy = clamp(p.happy + 6)
      }
      return n
    })
    if (type === 'clean' || type === 'play') playSuccess()
    showFx({ feed: '🍎', water: '💧', play: '❤️', walk: '🌳', potty: '🚽', clean: '✨' }[type])
    if (type === 'walk') {
      setScene('walk')
      window.setTimeout(() => setScene('home'), 2600)
    }
  }

  function setItem(slot: Slot, item: string) {
    unlockAudio()
    playTap()
    setPet((p) => (p ? { ...p, outfit: { ...p.outfit, [slot]: p.outfit[slot] === item ? undefined : item } } : p))
  }

  // pick a food from the fridge → say its name, then the friend hops 3× eating
  // it ("נם נם נם") while the food shrinks bite by bite
  function eat(food: { name: string; emoji: string }) {
    unlockAudio()
    playTap()
    setFridge(false)
    speak(food.name)
    setPet((p) => (p ? { ...p, hunger: clamp(p.hunger + 34) } : p))
    eatTimers.current.forEach((t) => window.clearTimeout(t))
    eatTimers.current = []
    setEatFood(food.emoji)
    setBite(0)
    for (let k = 0; k < 3; k++) {
      eatTimers.current.push(window.setTimeout(() => { playMunch(); setBite(k + 1) }, 350 + k * 520))
    }
    eatTimers.current.push(window.setTimeout(() => speak('נם נם נם'), 720))
    eatTimers.current.push(window.setTimeout(() => { setEatFood(null); setBite(0) }, 350 + 3 * 520 + 250))
  }

  // ---- pick-a-friend screen ----
  if (choosing || !pet) {
    return (
      <GameShell title="החבר שלי" emoji="🐣" onExit={onExit}>
        <p className="pet-pick-title">איזה חבר תרצו לגדל?</p>
        <div className="pet-picker">
          <button className="pill pet-arrow" onClick={() => setPick((p) => (p + FRIENDS.length - 1) % FRIENDS.length)} aria-label="הקודם">
            ◀
          </button>
          <span className="pet-pick-figure">
            <Friend index={pick} scale={150 / friendMaxDim(pick)} showNumber={false} />
          </span>
          <button className="pill pet-arrow" onClick={() => setPick((p) => (p + 1) % FRIENDS.length)} aria-label="הבא">
            ▶
          </button>
        </div>
        <p className="pet-pick-name">
          {friendName(pick)} · {pick + 1}
        </p>
        <div className="counting-next">
          <button className="big-button" onClick={() => choose(pick)}>
            🎉 זה החבר שלי!
          </button>
        </div>
      </GameShell>
    )
  }

  const meters = [
    { key: 'hunger', emoji: '🍎', label: 'רעב', value: pet.hunger },
    { key: 'thirst', emoji: '💧', label: 'צמא', value: pet.thirst },
    { key: 'happy', emoji: '😊', label: 'שמח', value: pet.happy },
    { key: 'clean', emoji: '🧼', label: 'נקי', value: pet.clean },
  ]
  const sad = pet.poop || meters.some((m) => m.value < 25)

  const actions: { type: 'feed' | 'water' | 'play' | 'walk' | 'potty' | 'clean' | 'dress'; emoji: string; label: string }[] = [
    { type: 'feed', emoji: '🍎', label: 'אוכל' },
    { type: 'water', emoji: '🍼', label: 'מים' },
    { type: 'play', emoji: '🎾', label: 'משחק' },
    { type: 'walk', emoji: '🚶', label: 'טיול' },
    { type: 'potty', emoji: '🚽', label: 'שירותים' },
    { type: 'clean', emoji: '🧽', label: 'ניקיון' },
    { type: 'dress', emoji: '👕', label: 'הלבשה' },
  ]

  return (
    <GameShell title="החבר שלי" emoji="🐣" onExit={onExit}>
      <div className="pet-meters">
        {meters.map((m) => (
          <span className="pet-meter" key={m.key}>
            <span className="pet-meter-emoji" aria-hidden="true">
              {m.emoji}
            </span>
            <span className="pet-bar">
              <span
                className="pet-bar-fill"
                style={{ width: `${m.value}%`, background: m.value < 30 ? '#f87171' : m.value < 60 ? '#fbbf24' : '#4ade80' }}
              />
            </span>
          </span>
        ))}
      </div>

      <div className={`pet-room ${scene === 'walk' ? 'is-walk' : ''} ${sad ? 'is-sad' : ''}`}>
        <button className="pet-tap" onClick={pokePet} aria-label={friendName(pet.friend)}>
          <FriendDressed index={pet.friend} px={150} outfit={pet.outfit} bouncing={bounce} eating={!!eatFood} />
        </button>
        {eatFood && (
          <span
            className="pet-eat-food"
            style={{ transform: `translate(-50%,-50%) scale(${Math.max(0, 1 - bite / 3)})`, opacity: bite >= 3 ? 0 : 1 }}
            aria-hidden="true"
          >
            {eatFood}
          </span>
        )}
        {pet.poop && (
          <span className="pet-poop" aria-hidden="true">
            💩
          </span>
        )}
        {sad && !pet.poop && (
          <span className="pet-mood" aria-hidden="true">
            😢
          </span>
        )}
        {fx && (
          <span className="pet-fx" key={fx.id} aria-hidden="true">
            {fx.emoji}
          </span>
        )}
      </div>

      <div className="pet-actions">
        {actions.map((a) => (
          <button
            key={a.type}
            className="pet-action"
            onClick={() =>
              a.type === 'dress'
                ? (unlockAudio(), playTap(), setWardrobe(true))
                : a.type === 'feed'
                  ? (unlockAudio(), playTap(), setFridge(true))
                  : act(a.type)
            }
          >
            <span className="pet-action-emoji" aria-hidden="true">
              {a.emoji}
            </span>
            <span className="pet-action-label">{a.label}</span>
          </button>
        ))}
        <button className="pet-action pet-action-new" onClick={() => setChoosing(true)}>
          <span className="pet-action-emoji" aria-hidden="true">
            🔄
          </span>
          <span className="pet-action-label">חבר חדש</span>
        </button>
      </div>

      {wardrobe && (
        <div className="ward-overlay" onClick={() => setWardrobe(false)}>
          <div className="ward-card" onClick={(e) => e.stopPropagation()}>
            <button className="hint-close" onClick={() => setWardrobe(false)} aria-label="סגור">
              ✕
            </button>
            <h3 className="ward-title">ארון הבגדים 👕</h3>
            <div className="ward-preview">
              <FriendDressed index={pet.friend} px={130} outfit={pet.outfit} />
            </div>
            <div className="ward-slots">
              {SLOTS.map((s) => (
                <div className="ward-slot" key={s.key}>
                  <span className="ward-slot-label">{s.label}</span>
                  <div className="ward-items">
                    <button
                      className={`ward-item ${!pet.outfit[s.key] ? 'is-on' : ''}`}
                      onClick={() => setPet((p) => (p ? { ...p, outfit: { ...p.outfit, [s.key]: undefined } } : p))}
                      aria-label="בלי"
                    >
                      ✖
                    </button>
                    {s.items.map((item) => (
                      <button
                        key={item}
                        className={`ward-item ${pet.outfit[s.key] === item ? 'is-on' : ''}`}
                        onClick={() => setItem(s.key, item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {fridge && (
        <div className="fridge-overlay" onClick={() => setFridge(false)}>
          <div className="fridge-card" onClick={(e) => e.stopPropagation()}>
            <button className="hint-close" onClick={() => setFridge(false)} aria-label="סגור">
              ✕
            </button>
            <h3 className="fridge-title">מה בא לך לאכול? 🍽️</h3>
            <div className="fridge-grid">
              {FOODS.map((f) => (
                <button key={f.name} className="fridge-item" onClick={() => eat(f)} aria-label={f.name}>
                  <span className="fridge-emoji" aria-hidden="true">
                    {f.emoji}
                  </span>
                  <span className="fridge-name">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </GameShell>
  )
}
