import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import { friendCount, randFriendIndex } from '../level'
import Friend from '../components/Friend'
import Stepper from '../components/Stepper'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playFriend, playMunch, playPop, playSuccess, playTap, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendName, friendSay } from '../friends'
import { numberWordNiqqud } from './util'
import { screenScale, useViewport } from '../useViewport'
import { useT } from '../i18n'

// foods in the fridge — tapping one says its (Hebrew) name and the friend eats it.
// `key` drives the i18n label shown on screen; `name` is the spoken Hebrew.
const FOODS: { key: string; name: string; emoji: string }[] = [
  { key: 'banana', name: 'בננה', emoji: '🍌' },
  { key: 'apple', name: 'תפוח', emoji: '🍎' },
  { key: 'fish', name: 'דג', emoji: '🐟' },
  { key: 'hotdog', name: 'נקניקייה', emoji: '🌭' },
  { key: 'burger', name: 'המבורגר', emoji: '🍔' },
  { key: 'cucumber', name: 'מלפפון', emoji: '🥒' },
  { key: 'tomato', name: 'עגבנייה', emoji: '🍅' },
  { key: 'rice', name: 'קערת אורז', emoji: '🍚' },
  { key: 'chicken', name: 'עוף', emoji: '🍗' },
  { key: 'meat', name: 'בשר', emoji: '🥩' },
  { key: 'cheese', name: 'פרוסה עם גבינה', emoji: '🧀' },
  { key: 'carrot', name: 'גזר', emoji: '🥕' },
  { key: 'omelette', name: 'חביתה', emoji: '🍳' },
  { key: 'toast', name: 'טוסט', emoji: '🥪' },
  { key: 'bamba', name: 'במבה', emoji: '🥜' },
  { key: 'chocolate', name: 'שוקולד', emoji: '🍫' },
]

// crumb fly-out directions + little reaction emojis for the eating "movie"
const CRUMBS = [
  { x: '-36px', y: '-24px' },
  { x: '32px', y: '-30px' },
  { x: '-42px', y: '12px' },
  { x: '40px', y: '8px' },
  { x: '-6px', y: '-46px' },
  { x: '16px', y: '34px' },
]
const HEARTS = ['❤️', '⭐', '😋']

// drinks in the fridge
const DRINKS: { key: string; name: string; emoji: string }[] = [
  { key: 'water', name: 'מים', emoji: '💧' },
  { key: 'wine', name: 'יין', emoji: '🍷' },
  { key: 'soda', name: 'שתייה מוגזת', emoji: '🥤' },
  { key: 'juice', name: 'מיץ', emoji: '🧃' },
]
// spilled-drop directions (fall down and out)
const DROPS = [
  { x: '-16px', y: '42px' },
  { x: '12px', y: '48px' },
  { x: '-2px', y: '54px' },
  { x: '20px', y: '34px' },
]

// "play" picks one of these at random — each is its own little scene
const PLAYS: { kind: string; label: string }[] = [
  { kind: 'ball', label: 'משחק בכדור' },
  { kind: 'tv', label: 'רואה טלוויזיה' },
  { kind: 'computer', label: 'משחק במחשב' },
  { kind: 'book', label: 'קורא ספר' },
  { kind: 'lego', label: 'בונה לגו' },
]

// "My friend" — a gentle Tamagotchi-style virtual pet. Pick a number to raise,
// then feed / water / play / walk / potty + clean 💩 / dress up. Stats drop
// slowly but the friend NEVER dies — it just gets sad and you cheer it up. The
// pet (and its outfit) is saved so the child returns to the same friend.
const KEY = 'assaf-friends:pet:v1'

type Slot = 'hat' | 'face' | 'body' | 'held'
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
  { key: 'body', label: 'בגד', items: ['👕', '👗', '🦺', '🧥', '👔', '🎽', '🩱', '🥋'] },
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
      <Friend
        index={index}
        scale={px / friendMaxDim(index)}
        showNumber={false}
        bouncing={bouncing}
        eating={eating}
        outfit={outfit}
      />
    </span>
  )
}

// the little "play" scenes — each activity is its own set
function PlayScene({ kind, friend, outfit, buddy }: { kind: string; friend: number; outfit: Outfit; buddy: number }) {
  if (kind === 'ball') {
    return (
      <div className="scene scene-ball">
        <span className="scene-fig">
          <FriendDressed index={friend} px={88} outfit={outfit} />
        </span>
        <span className="play-ball" aria-hidden="true">
          ⚽
        </span>
        <span className="scene-fig">
          <FriendDressed index={buddy} px={88} outfit={{}} />
        </span>
      </div>
    )
  }
  if (kind === 'tv') {
    return (
      <div className="scene scene-room">
        <span className="seat-side">
          <span className="couch" aria-hidden="true" />
          <span className="scene-fig seated">
            <FriendDressed index={friend} px={68} outfit={outfit} />
          </span>
        </span>
        <span className="tv-set" aria-hidden="true">
          <span className="tv-screen">
            <span className="tv-star">⭐</span>
          </span>
          <span className="tv-stand" />
        </span>
      </div>
    )
  }
  if (kind === 'computer') {
    return (
      <div className="scene scene-room">
        <span className="seat-side">
          <span className="chair" aria-hidden="true" />
          <span className="scene-fig seated">
            <FriendDressed index={friend} px={62} outfit={outfit} />
          </span>
        </span>
        <span className="deskset" aria-hidden="true">
          <span className="monitor">
            <span className="tv-star">✨</span>
          </span>
          <span className="desktop" />
        </span>
      </div>
    )
  }
  if (kind === 'book') {
    return (
      <div className="scene">
        <span className="seat-side wide">
          <span className="couch" aria-hidden="true" />
          <span className="scene-fig seated mid">
            <FriendDressed index={friend} px={72} outfit={outfit} />
          </span>
          <span className="book" aria-hidden="true">
            📖
          </span>
        </span>
      </div>
    )
  }
  // lego — a tower builds up on a rug
  return (
    <div className="scene scene-lego">
      <span className="scene-fig">
        <FriendDressed index={friend} px={80} outfit={outfit} />
      </span>
      <span className="tower" aria-hidden="true">
        <span className="brick b1" />
        <span className="brick b2" />
        <span className="brick b3" />
        <span className="brick b4" />
        <span className="rug" />
      </span>
    </div>
  )
}

export default function Tamagotchi({ onExit }: GameProps) {
  const { t } = useT()
  const [pet, setPet] = useState<Pet | null>(load)
  const vp = useViewport()
  const petPx = Math.round(150 * screenScale(vp.w)) // main pet grows on a desktop
  const [choosing, setChoosing] = useState(() => pet === null)
  const [pick, setPick] = useState(0)
  const [wardrobe, setWardrobe] = useState(false)
  const [fridge, setFridge] = useState(false)
  const [bar, setBar] = useState(false)
  const [eatFood, setEatFood] = useState<string | null>(null)
  const [mode, setMode] = useState<'eat' | 'drink'>('eat')
  const [bite, setBite] = useState(0)
  const [poof, setPoof] = useState(false)
  const [playing, setPlaying] = useState<{ kind: string; label: string } | null>(null)
  const [buddy, setBuddy] = useState(0)
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
    setMode('eat')
    setPlaying(null)
    speak(food.name)
    setPet((p) => (p ? { ...p, hunger: clamp(p.hunger + 34) } : p))
    eatTimers.current.forEach((t) => window.clearTimeout(t))
    eatTimers.current = []
    setEatFood(food.emoji)
    setBite(0)
    setPoof(false)
    // three bites: each hop munches and a chunk is cut out of the food
    for (let k = 0; k < 3; k++) {
      eatTimers.current.push(window.setTimeout(() => { playMunch(); setBite(k + 1) }, 350 + k * 600))
    }
    eatTimers.current.push(window.setTimeout(() => speak('נם נם נם'), 450))
    // after the last bite the little leftover disappears with a "poof"
    eatTimers.current.push(window.setTimeout(() => { setPoof(true); playPop() }, 350 + 3 * 600))
    // then clear and a happy random line
    eatTimers.current.push(
      window.setTimeout(() => {
        setEatFood(null)
        setPoof(false)
        setBite(0)
        const lines = ['ים ים!', 'מ-מ-מ, טעים!', `אני אוהב ${food.name}!`]
        speak(lines[Math.floor(Math.random() * lines.length)])
      }, 350 + 3 * 600 + 500),
    )
  }

  // pick a drink → say its name, then the friend gulps it (drops spill), then a
  // happy line ("אין על מים!" only for water)
  function drink(d: { name: string; emoji: string }) {
    unlockAudio()
    playTap()
    setBar(false)
    setMode('drink')
    setPlaying(null)
    speak(d.name)
    setPet((p) => (p ? { ...p, thirst: clamp(p.thirst + 34) } : p))
    eatTimers.current.forEach((t) => window.clearTimeout(t))
    eatTimers.current = []
    setEatFood(d.emoji)
    setBite(0)
    setPoof(false)
    for (let k = 0; k < 3; k++) {
      eatTimers.current.push(window.setTimeout(() => { playMunch(); setBite(k + 1) }, 350 + k * 600))
    }
    eatTimers.current.push(window.setTimeout(() => { setPoof(true); playPop() }, 350 + 3 * 600))
    eatTimers.current.push(
      window.setTimeout(() => {
        setEatFood(null)
        setPoof(false)
        setBite(0)
        const lines = ['וואי, איך הייתי צמא!', 'זה היה טוֹב-ב-ב!', 'לרוויה!']
        if (d.name === 'מים') lines.push('אין על מים!')
        speak(lines[Math.floor(Math.random() * lines.length)])
      }, 350 + 3 * 600 + 500),
    )
  }

  // play = a random one of 5 little activities (ball / computer / book / TV / lego)
  function play() {
    if (!pet) return
    unlockAudio()
    playTap()
    const a = PLAYS[Math.floor(Math.random() * PLAYS.length)]
    eatTimers.current.forEach((t) => window.clearTimeout(t))
    eatTimers.current = []
    setEatFood(null)
    setPoof(false)
    if (a.kind === 'ball') {
      let b = randFriendIndex()
      if (b === pet.friend) b = (b + 1) % friendCount()
      setBuddy(b)
    }
    setPlaying(a)
    const newHappy = clamp(pet.happy + 30)
    setPet((p) => (p ? { ...p, happy: newHappy } : p))
    playSuccess()
    speak(`${a.label}!`)
    eatTimers.current.push(
      window.setTimeout(() => {
        setPlaying(null)
        // spoken recap: what we did + the new happiness number
        speak(`${a.label} עם ${friendSay(pet.friend)} היה כיף! השמחה ${numberWordNiqqud(newHappy)}`)
      }, 4000),
    )
  }

  // ---- pick-a-friend screen ----
  if (choosing || !pet) {
    return (
      <GameShell title={t('game.pet')} emoji="🐣" onExit={onExit}>
        <p className="pet-pick-title">{t('pet.pickTitle')}</p>
        <Stepper
          label={
            <span className="pet-pick-figure">
              <Friend index={pick} scale={petPx / friendMaxDim(pick)} showNumber={false} />
            </span>
          }
          onPrev={() => setPick((p) => (p + friendCount() - 1) % friendCount())}
          onNext={() => setPick((p) => (p + 1) % friendCount())}
        />
        <p className="pet-pick-name">
          {friendName(pick)} · {pick + 1}
        </p>
        <div className="counting-next">
          <button className="big-button" onClick={() => choose(pick)}>
            🎉 {t('pet.pickBtn')}
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
            <span className="pet-meter-num">{m.value}</span>
          </span>
        ))}
      </div>

      <div className={`pet-room ${scene === 'walk' ? 'is-walk' : ''} ${sad ? 'is-sad' : ''}`}>
        {playing ? (
          <PlayScene kind={playing.kind} friend={pet.friend} outfit={pet.outfit} buddy={buddy} />
        ) : (
        <button className="pet-tap" onClick={pokePet} aria-label={friendName(pet.friend)}>
          <FriendDressed index={pet.friend} px={petPx} outfit={pet.outfit} bouncing={bounce} eating={!!eatFood} />
          {eatFood && (
          <>
            <span
              key={poof ? 'poof' : `s-${bite}`}
              className={
                poof
                  ? `pet-eat-food is-poof ${mode === 'eat' ? 'b3' : ''}`
                  : mode === 'eat'
                    ? `pet-eat-food chomp ${bite > 0 ? `b${bite}` : ''}`
                    : 'pet-eat-food gulp'
              }
              aria-hidden="true"
            >
              {eatFood}
            </span>
            {!poof && bite > 0 && (
              <span className="eat-burst" key={`burst-${bite}`} aria-hidden="true">
                {(mode === 'eat' ? CRUMBS : DROPS).map((c, i) => (
                  <span
                    className={mode === 'eat' ? 'crumb' : 'drop'}
                    key={i}
                    style={{ '--tx': c.x, '--ty': c.y } as React.CSSProperties}
                  >
                    {mode === 'eat' ? eatFood : '💧'}
                  </span>
                ))}
              </span>
            )}
            {!poof && bite > 0 && (
              <span className="eat-heart" key={`heart-${bite}`} aria-hidden="true">
                {HEARTS[(bite - 1) % HEARTS.length]}
              </span>
            )}
            {poof && (
              <span className="pet-poof" aria-hidden="true">
                💨
              </span>
            )}
          </>
          )}
        </button>
        )}
        {!playing && pet.poop && (
          <span className="pet-poop" aria-hidden="true">
            💩
          </span>
        )}
        {!playing && sad && !pet.poop && (
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
                  : a.type === 'water'
                    ? (unlockAudio(), playTap(), setBar(true))
                    : a.type === 'play'
                      ? play()
                      : act(a.type)
            }
          >
            <span className="pet-action-emoji" aria-hidden="true">
              {a.emoji}
            </span>
            <span className="pet-action-label">{t(`pet.act.${a.type}`)}</span>
          </button>
        ))}
        <button className="pet-action pet-action-new" onClick={() => setChoosing(true)}>
          <span className="pet-action-emoji" aria-hidden="true">
            🔄
          </span>
          <span className="pet-action-label">{t('pet.newFriend')}</span>
        </button>
      </div>

      {wardrobe && (
        <div className="ward-overlay" onClick={() => setWardrobe(false)}>
          <div className="ward-card" onClick={(e) => e.stopPropagation()}>
            <button className="hint-close" onClick={() => setWardrobe(false)} aria-label={t('seq.close')}>
              ✕
            </button>
            <h3 className="ward-title">👗 {t('pet.wardrobe')}</h3>
            <div className="ward-rail" aria-hidden="true" />
            <div className="ward-preview">
              <FriendDressed index={pet.friend} px={130} outfit={pet.outfit} />
            </div>
            <div className="ward-slots">
              {SLOTS.map((s) => (
                <div className="ward-slot" key={s.key}>
                  <span className="ward-slot-label">{t(`pet.slot.${s.key}`)}</span>
                  <div className="ward-items">
                    <button
                      className={`ward-item ${!pet.outfit[s.key] ? 'is-on' : ''}`}
                      onClick={() => setPet((p) => (p ? { ...p, outfit: { ...p.outfit, [s.key]: undefined } } : p))}
                      aria-label={t('pet.none')}
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
            <button className="hint-close" onClick={() => setFridge(false)} aria-label={t('seq.close')}>
              ✕
            </button>
            <h3 className="fridge-title">{t('pet.fridgeTitle')}</h3>
            <div className="fridge-grid">
              {FOODS.map((f) => (
                <button key={f.key} className="fridge-item" onClick={() => eat(f)} aria-label={t(`pet.food.${f.key}`)}>
                  <span className="fridge-emoji" aria-hidden="true">
                    {f.emoji}
                  </span>
                  <span className="fridge-name">{t(`pet.food.${f.key}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {bar && (
        <div className="fridge-overlay" onClick={() => setBar(false)}>
          <div className="fridge-card" onClick={(e) => e.stopPropagation()}>
            <button className="hint-close" onClick={() => setBar(false)} aria-label={t('seq.close')}>
              ✕
            </button>
            <h3 className="fridge-title">{t('pet.barTitle')}</h3>
            <div className="fridge-grid">
              {DRINKS.map((d) => (
                <button key={d.key} className="fridge-item" onClick={() => drink(d)} aria-label={t(`pet.drink.${d.key}`)}>
                  <span className="fridge-emoji" aria-hidden="true">
                    {d.emoji}
                  </span>
                  <span className="fridge-name">{t(`pet.drink.${d.key}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </GameShell>
  )
}
