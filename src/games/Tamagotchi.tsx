import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import { friendCount, randFriendIndex } from '../level'
import Friend from '../components/Friend'
import Stepper from '../components/Stepper'
import { friendMaxDim, FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playFriend, playMunch, playNudge, playPop, playSuccess, playTap, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendName, friendSay } from '../friends'
import { useViewport } from '../useViewport'
import { useT } from '../i18n'
import { getSettings } from '../settings'
import { getPetReaction, getIdleReaction } from './pet/reactions/petReactionEngine'
import { pickMessage } from './pet/reactions/reactionMessages'
import { emptyHistory, recordAction } from './pet/reactions/reactionHistory'
import { getPersonality } from './pet/reactions/personality'
import type { PetAction, PetInteractionHistory, PetReaction } from './pet/reactions/reactionTypes'

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

// reaction visual effects → little emoji bursts that float off the pet
const EFFECT_EMOJI: Record<string, string[]> = {
  hearts: ['❤️', '💖', '💗'],
  sparkles: ['✨', '⭐', '🌟'],
  bubbles: ['🫧', '🫧', '✨'],
  sleepy_z: ['💤', '😴', '💤'],
  crumbs: ['🍪', '✨', '🍪'],
  water_droplets: ['💧', '💦', '💧'],
  tiny_confetti: ['🎉', '🎊', '⭐'],
  sad_cloud: ['☁️', '💧'],
  dirt_smudge: ['💨', '🟤'],
  glow: ['✨', '🌟'],
}
// current emotion → a face badge on the pet (only the "notable" feelings show)
const EXPR_FACE: Record<string, string> = {
  very_happy: '😄', happy: '😊', relieved: '😌', playful: '😜', surprised: '😮',
  sad: '😢', soft_sad: '🥺', tired: '😪', sleepy: '😴', hungry: '😋', thirsty: '😛',
  annoyed: '😒', shy: '☺️',
}
const QUIET_FACES = new Set(['happy', 'very_happy', 'neutral']) // don't badge when content
// reaction sound key → an existing audio cue (kept gentle for the child)
const SOUND_FN: Record<string, () => void> = {
  happy_chime: playSuccess,
  eat_crunch: playMunch,
  drink_sip: playMunch,
  bath_bubbles: playPop,
  sleepy_yawn: playNudge,
  sad_tiny: playNudge,
  refuse_soft: playNudge,
  success_pop: playPop,
}

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
  energy: number // physical tiredness (0 = exhausted)
  loneliness: number // emotional: rises when ignored
  boredom: number // emotional: rises without play
  trust: number // grows with consistent care
  poop: boolean
  outfit: Outfit
  history: PetInteractionHistory
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
  return {
    friend, hunger: 80, thirst: 80, happy: 85, clean: 100, energy: 80,
    loneliness: 10, boredom: 15, trust: 50, poop: false, outfit: {}, history: emptyHistory(), ts: Date.now(),
  }
}

function load(): Pet | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    // older saves may lack the new fields → fill sensible defaults (migration)
    const p = JSON.parse(raw) as Partial<Pet> & { friend: number; ts?: number }
    const mins = Math.min(90, (Date.now() - (p.ts ?? Date.now())) / 60000)
    const d = Math.round(mins)
    return {
      friend: p.friend,
      hunger: clamp((p.hunger ?? 80) - d),
      thirst: clamp((p.thirst ?? 80) - d),
      happy: clamp((p.happy ?? 85) - Math.round(d * 0.6)),
      clean: clamp((p.clean ?? 100) - Math.round(d * 0.6)),
      energy: clamp((p.energy ?? 80) - Math.round(d * 0.5)),
      loneliness: clamp((p.loneliness ?? 10) + d), // missed you while away
      boredom: clamp((p.boredom ?? 15) + Math.round(d * 0.7)),
      trust: clamp(p.trust ?? 50),
      poop: p.poop ?? false,
      outfit: p.outfit ?? {},
      history: p.history ?? emptyHistory(),
      ts: Date.now(),
    }
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
  // size the pet to FIT the room by BOTH width and height, so tall friends (1–10
  // like piko/moki) aren't cut off and every friend sits at a proportional size
  const roomH = Math.max(vp.h * 0.38, 240)
  const fitPet = (i: number) => {
    const nat = FRIEND_NATURAL[friendKindForIndex(i)]
    return Math.min((Math.min(vp.w, 470) * 0.78) / nat.w, (roomH * 0.6) / nat.h, 2.6)
  }
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
  const [burst, setBurst] = useState<{ id: number; bits: { e: string; x: number; y: number; d: number }[] } | null>(null)
  const [bounce, setBounce] = useState(false)
  // ── reaction-engine driven UI state ──
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null)
  const [posture, setPosture] = useState('neutral')
  const [expression, setExpression] = useState('happy')
  const [highlight, setHighlight] = useState<PetAction | null>(null)
  const eatTimers = useRef<number[]>([])
  const bubbleTimer = useRef<number | undefined>(undefined)
  const hiTimer = useRef<number | undefined>(undefined)
  const lastBubbleAt = useRef(0)
  useEffect(() => () => eatTimers.current.forEach((t) => window.clearTimeout(t)), [])

  // show a short speech bubble near the pet (and say it aloud); auto-hides
  function showBubble(text: string, speakIt = true) {
    if (!text) return
    window.clearTimeout(bubbleTimer.current)
    setBubble({ text, id: Date.now() })
    lastBubbleAt.current = Date.now()
    if (speakIt) speak(text)
    bubbleTimer.current = window.setTimeout(() => setBubble(null), 3600)
  }
  // briefly glow a suggested next action button
  function suggest(action: PetAction | null) {
    window.clearTimeout(hiTimer.current)
    setHighlight(action)
    if (action) hiTimer.current = window.setTimeout(() => setHighlight(null), 5000)
  }

  // THE central dispatcher: ask the engine for a context-aware reaction, apply
  // its stat/mood/poop changes, record history, and drive bubble/posture/glow.
  function react(action: PetAction, food?: string, opts?: { silent?: boolean }): PetReaction | null {
    if (!pet) return null
    const now = Date.now()
    const reaction = getPetReaction({
      action,
      stats: { hunger: pet.hunger, thirst: pet.thirst, happy: pet.happy, clean: pet.clean, energy: pet.energy },
      mood: { happiness: pet.happy, loneliness: pet.loneliness, boredom: pet.boredom, excitement: 50, trust: pet.trust },
      personality: getPersonality(pet.friend),
      history: pet.history,
      now,
      poop: pet.poop,
      food,
    })
    setPet((p) => {
      if (!p) return p
      const n = { ...p }
      const s = reaction.statChanges ?? {}
      if (s.hunger) n.hunger = clamp(p.hunger + s.hunger)
      if (s.thirst) n.thirst = clamp(p.thirst + s.thirst)
      if (s.happy) n.happy = clamp(p.happy + s.happy)
      if (s.clean) n.clean = clamp(p.clean + s.clean)
      if (s.energy) n.energy = clamp(p.energy + s.energy)
      const m = reaction.moodChange ?? {} // happiness lives in `happy`; skip it here
      if (m.loneliness) n.loneliness = clamp(p.loneliness + m.loneliness)
      if (m.boredom) n.boredom = clamp(p.boredom + m.boredom)
      if (m.trust) n.trust = clamp(p.trust + m.trust)
      if (reaction.setPoop !== undefined) n.poop = reaction.setPoop
      n.history = recordAction(p.history, action, reaction.outcome, now)
      return n
    })
    setPosture(reaction.posture ?? 'neutral')
    setExpression(reaction.expression ?? 'happy')
    showBurst(reaction.visualEffects)
    if (!opts?.silent && reaction.sound) SOUND_FN[reaction.sound]?.()
    showBubble(pickMessage(reaction.speechKey, getSettings().lang as 'he' | 'en'))
    suggest(reaction.highlightAction ?? reaction.followUpSuggestion ?? null)
    return reaction
  }

  // save whenever the pet changes
  useEffect(() => {
    if (pet) localStorage.setItem(KEY, JSON.stringify({ ...pet, ts: Date.now() }))
  }, [pet])

  // gentle decay (never below 0; the friend never dies — it just needs you)
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
              energy: clamp(p.energy - 1),
              loneliness: clamp(p.loneliness + 2),
              boredom: clamp(p.boredom + 2),
              poop: p.poop || Math.random() < 0.08,
            }
          : p,
      )
    }, 15000)
    return () => window.clearInterval(id)
  }, [])

  // ── idle behaviour: "alive even when you do nothing" ──
  // refs so the single idle interval always sees the latest state without
  // resetting itself on every change.
  const petRef = useRef(pet)
  petRef.current = pet
  const busyRef = useRef(false)
  busyRef.current = !!(playing || eatFood || fridge || bar || wardrobe || choosing)
  useEffect(() => {
    const id = window.setInterval(() => {
      const p = petRef.current
      if (!p || busyRef.current) return
      const canSpeak = Date.now() - lastBubbleAt.current > 28000
      const idle = getIdleReaction({
        stats: { hunger: p.hunger, thirst: p.thirst, happy: p.happy, clean: p.clean, energy: p.energy },
        mood: { happiness: p.happy, loneliness: p.loneliness, boredom: p.boredom, excitement: 50, trust: p.trust },
        poop: p.poop,
        canSpeak,
      })
      setPosture(idle.posture)
      setExpression(idle.expression)
      if (idle.visualEffects) showBurst(idle.visualEffects)
      if (idle.highlightAction) suggest(idle.highlightAction)
      if (idle.speechKey) showBubble(pickMessage(idle.speechKey, getSettings().lang as 'he' | 'en'))
    }, 6500)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function showFx(emoji: string) {
    setFx({ emoji, id: (fx?.id ?? 0) + 1 })
    window.setTimeout(() => setFx((f) => (f && f.emoji === emoji ? null : f)), 900)
  }

  // little emoji burst floating off the pet, driven by a reaction's visualEffects
  function showBurst(keys?: string[]) {
    if (!keys || !keys.length) return
    const bits: { e: string; x: number; y: number; d: number }[] = []
    let i = 0
    for (const k of keys) {
      const set = EFFECT_EMOJI[k]
      if (!set) continue
      for (let j = 0; j < 3; j++) {
        bits.push({ e: set[j % set.length], x: 18 + ((i * 23 + j * 13) % 64), y: 22 + ((i * 17 + j * 29) % 48), d: ((i + j) % 4) * 90 })
        i++
      }
    }
    if (!bits.length) return
    setBurst((b) => ({ id: (b?.id ?? 0) + 1, bits }))
    window.setTimeout(() => setBurst((b) => (b ? null : b)), 1150)
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

  // walk / clean / sleep / hug all go through the reaction engine
  function act(type: 'walk' | 'clean' | 'sleep' | 'hug') {
    if (!pet) return
    unlockAudio()
    playTap()
    const r = react(type) // the engine plays the right sound for the outcome
    showFx({ walk: '🌳', clean: '✨', sleep: '😴', hug: '🤗' }[type])
    if (type === 'walk' && r && r.outcome !== 'request' && r.outcome !== 'refusal') {
      setScene('walk')
      window.setTimeout(() => setScene('home'), 2600)
    }
  }

  // potty keeps its existing meaning (a little mess appears, then you clean it)
  function potty() {
    if (!pet) return
    unlockAudio()
    playTap()
    setPet((p) => (p ? { ...p, poop: true } : p))
    showFx('🚽')
  }

  function setItem(slot: Slot, item: string) {
    unlockAudio()
    playTap()
    setPet((p) => (p ? { ...p, outfit: { ...p.outfit, [slot]: p.outfit[slot] === item ? undefined : item } } : p))
  }

  // pick a food from the fridge → say its name, then the friend hops 3× eating
  // it ("נם נם נם") while the food shrinks bite by bite
  function eat(food: { key: string; name: string; emoji: string }) {
    unlockAudio()
    playTap()
    setFridge(false)
    setMode('eat')
    setPlaying(null)
    speak(getSettings().lang === 'en' ? t(`pet.food.${food.key}`) : food.name)
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
    // then clear and let the engine react (context-aware line + stat/mood change)
    eatTimers.current.push(
      window.setTimeout(() => {
        setEatFood(null)
        setPoof(false)
        setBite(0)
        react('feed', food.key, { silent: true })
      }, 350 + 3 * 600 + 500),
    )
  }

  // pick a drink → say its name, then the friend gulps it (drops spill), then a
  // happy line ("אין על מים!" only for water)
  function drink(d: { key: string; name: string; emoji: string }) {
    unlockAudio()
    playTap()
    setBar(false)
    setMode('drink')
    setPlaying(null)
    speak(getSettings().lang === 'en' ? t(`pet.drink.${d.key}`) : d.name)
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
        react('water', d.key, { silent: true })
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
    playSuccess()
    speak(`${a.label}!`)
    eatTimers.current.push(
      window.setTimeout(() => {
        setPlaying(null)
        react('play') // context-aware reaction (excited / tired / "thirsty now"…)
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
              <Friend index={pick} scale={fitPet(pick)} showNumber={false} />
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
    { key: 'energy', emoji: '⚡', label: 'אנרגיה', value: pet.energy },
    { key: 'clean', emoji: '🧼', label: 'נקי', value: pet.clean },
  ]
  const sad = pet.poop || meters.some((m) => m.value < 25)
  // time of day → the room's window sky + wall mood (a modern-pet-game touch)
  const hour = new Date().getHours()
  const timeOfDay = hour >= 20 || hour < 6 ? 'night' : hour >= 17 ? 'sunset' : 'day'

  type ActType = 'feed' | 'water' | 'play' | 'walk' | 'sleep' | 'hug' | 'potty' | 'clean' | 'dress'
  const actions: { type: ActType; emoji: string }[] = [
    { type: 'feed', emoji: '🍎' },
    { type: 'water', emoji: '🍼' },
    { type: 'play', emoji: '🎾' },
    { type: 'walk', emoji: '🚶' },
    { type: 'sleep', emoji: '😴' },
    { type: 'hug', emoji: '🤗' },
    { type: 'potty', emoji: '🚽' },
    { type: 'clean', emoji: '🧽' },
    { type: 'dress', emoji: '👕' },
  ]

  return (
    <GameShell title={t('game.pet')} emoji="🐣" onExit={onExit}>
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

      <div className={`pet-room tod-${timeOfDay} pose-${posture} expr-${expression} ${scene === 'walk' ? 'is-walk' : ''} ${sad ? 'is-sad' : ''}`}>
        {/* illustrated 2D room behind the pet */}
        <div className="pet-scene" aria-hidden="true">
          <span className="ps-window">
            <span className="ps-celestial" />
            <span className="ps-cloud a" />
            <span className="ps-cloud b" />
            <span className="ps-stars" />
          </span>
          <span className="ps-frame">
            <span className="ps-pic">🌈</span>
          </span>
          <span className="ps-shelf" />
          <span className="ps-floor" />
          <span className="ps-rug" />
          <span className="ps-plant">🪴</span>
          <span className="ps-shadow" />
        </div>
        {playing ? (
          <PlayScene kind={playing.kind} friend={pet.friend} outfit={pet.outfit} buddy={buddy} />
        ) : (
        <button className="pet-tap" onClick={pokePet} aria-label={friendName(pet.friend)}>
          <FriendDressed index={pet.friend} px={Math.round(fitPet(pet.friend) * friendMaxDim(pet.friend))} outfit={pet.outfit} bouncing={bounce} eating={!!eatFood} />
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
        {!playing && !eatFood && (!QUIET_FACES.has(expression) || (sad && !pet.poop)) && (
          <span className="pet-mood" key={expression} aria-hidden="true">
            {!QUIET_FACES.has(expression) ? EXPR_FACE[expression] : '😢'}
          </span>
        )}
        {fx && (
          <span className="pet-fx" key={fx.id} aria-hidden="true">
            {fx.emoji}
          </span>
        )}
        {burst && !playing && (
          <span className="pet-burst" key={burst.id} aria-hidden="true">
            {burst.bits.map((b, i) => (
              <span
                className="pet-burst-bit"
                key={i}
                style={{ left: `${b.x}%`, top: `${b.y}%`, animationDelay: `${b.d}ms` }}
              >
                {b.e}
              </span>
            ))}
          </span>
        )}
        {bubble && !playing && (
          <span className="pet-bubble" key={bubble.id} dir="auto">
            {bubble.text}
          </span>
        )}
      </div>

      <div className="pet-actions">
        {actions.map((a) => (
          <button
            key={a.type}
            className={`pet-action ${highlight === a.type ? 'is-suggested' : ''}`}
            onClick={() =>
              a.type === 'dress'
                ? (unlockAudio(), playTap(), setWardrobe(true))
                : a.type === 'feed'
                  ? (unlockAudio(), playTap(), setFridge(true))
                  : a.type === 'water'
                    ? (unlockAudio(), playTap(), setBar(true))
                    : a.type === 'play'
                      ? play()
                      : a.type === 'potty'
                        ? potty()
                        : act(a.type as 'walk' | 'clean' | 'sleep' | 'hug')
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
