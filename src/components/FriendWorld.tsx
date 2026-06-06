import { useEffect, useRef, useState } from 'react'
import GameShell from './GameShell'
import Friend from './Friend'
import IconButton from './IconButton'
import { friendMaxDim } from './FriendArt'
import { friendGame, friendName, friendNumber, friendSay, friendSpecial, friendVoice } from '../friends'
import { playCount, playFriend, playSuccess, playTap, playWin, unlockAudio } from '../audio'
import { stopSpeech } from '../speech'
import { numberWord, randInt } from '../games/util'
import { playClip, stopClip } from '../voice'
import { setBuildPreset } from '../games/buildPreset'
import { rosterCount } from '../level'
import { getSettings } from '../settings'
import { useT } from '../i18n'
import { useViewport, screenScale } from '../useViewport'

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

// Visual number facts about a friend, shown in big digits (Assaf reads numbers,
// so this needs no voice). Each friend gets the handful that apply to its number;
// the ✨ button cycles through them. `big` is rendered LTR like a number line.
type Fact = { label: string; big: string }
function factsFor(n: number): Fact[] {
  const out: Fact[] = []
  if (n >= 10) {
    const tens = Math.floor(n / 10) * 10
    const ones = n % 10
    out.push(ones === 0 ? { label: 'עשרות', big: `${n} = ${n / 10} × 10` } : { label: 'עשרות ואחדות', big: `${n} = ${tens} + ${ones}` })
  }
  if (n % 2 === 0) out.push({ label: 'זוגי', big: `${n} = ${n / 2} + ${n / 2}` })
  else if (n >= 3) out.push({ label: 'אי-זוגי', big: `${n} = ${n - 1} + 1` })
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) {
      out.push({ label: 'כפל', big: `${n} = ${d} × ${n / d}` })
      break
    }
  }
  if (n === 1) out.push({ label: 'הראשון!', big: `1 → 2` })
  else if (n === 100) out.push({ label: 'מאה!', big: `99 → 100` })
  else if (n >= 2) out.push({ label: 'השכנים', big: `${n - 1} → ${n} → ${n + 1}` })
  return out
}

export default function FriendWorld({
  index,
  quiet,
  onExit,
  onNavigate,
  onPlayGame,
}: {
  index: number
  quiet?: boolean // true when paging ◀▶ or returning from a game → don't replay the intro
  onExit: () => void
  onNavigate: (index: number) => void
  onPlayGame: (gameId: string) => void
}) {
  const { t } = useT()
  const vp = useViewport()
  const n = friendNumber(index)
  const total = rosterCount()
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
  const [action, setAction] = useState<'five' | 'hug' | 'kiss' | null>(null)
  const [kissFx, setKissFx] = useState(false)
  const [motion, setMotion] = useState<string | null>(null)
  const [lit, setLit] = useState<number | undefined>(undefined)
  // "who am I made of": the friend splits into two SMALLER friends that add up
  // to it (c → a + b). This is the friend's identity (passive, friend-faced),
  // distinct from the "Build a Number" GAME which composes (a + b → c).
  const [split, setSplit] = useState<{ a: number; b: number } | null>(null)
  // "what's special about me": cycles through visual number facts (index, or null)
  const facts = factsFor(n)
  const [fact, setFact] = useState<number | null>(null)
  // after the special button is tapped, a "go to the matching game" CTA appears
  const [gameLink, setGameLink] = useState(false)
  const [stageH, setStageH] = useState(0) // measured stage height → fit the friend inside it
  const like = LIKES[friendSpecial(index)]
  const voice = friendVoice(index) // the recorded voice for this friend (shared buttons use it)
  const [fx, setFx] = useState<Fx[]>([])
  const timers = useRef<number[]>([])
  const fxId = useRef(0)

  // "living face": the pupils follow the finger/cursor. We set --gaze-x/y straight
  // on the stage DOM (no re-render per move); the friends inside inherit it, and a
  // CSS transition on the pupil makes the look smooth. Eyes re-centre when idle.
  const stageRef = useRef<HTMLDivElement>(null)
  function aimGaze(e: { clientX: number; clientY: number }) {
    const el = stageRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)))
    const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.42)) / (r.height / 2)))
    el.style.setProperty('--gaze-x', `${nx * 38}%`)
    el.style.setProperty('--gaze-y', `${ny * 32}%`)
  }
  function centerGaze() {
    stageRef.current?.style.setProperty('--gaze-x', '0%')
    stageRef.current?.style.setProperty('--gaze-y', '0%')
  }

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  function describe() {
    setSplit(null) // "say it again" re-assembles a split / fact friend
    setFact(null)
    // Short, exclamatory sentences = energy. No colour (many friends are multi-coloured).
    const about = `שָׁלוֹם!! אֲנִי ${friendSay(index)}, הַמִּסְפָּר ${numberWord(n)}! אֲנִי מַמָּשׁ אוֹהֵב ${like.verb}! בּוֹאוּ לְשַׂחֵק יַחַד!`
    playClip(`intro-${index}`, about)
    setBounce(true)
    later(() => setBounce(false), 600)
  }

  // narrate on entry (and whenever you switch friend); when the friend changes
  // we also cut off the previous one's narration so they don't talk over it
  useEffect(() => {
    unlockAudio()
    setSplit(null) // a fresh friend starts whole
    setFact(null)
    setGameLink(false)
    centerGaze()
    // narrate the intro only on a fresh entry FROM the friends list — not when
    // paging ◀▶ between friends, nor when returning from a game (quiet)
    if (!quiet) {
      const id = window.setTimeout(describe, 350)
      timers.current.push(id)
    }
    return () => {
      clearTimers()
      stopClip()
      stopSpeech()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // measure the stage so the friend is sized to fit INSIDE it (never overflowing
  // up onto the ◀ number ▶ pager) — sizing off the real frame, not a % of screen
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => setStageH(el.clientHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function burst(emoji: string, count = 7) {
    // cluster around the centre (the friend) so hearts/sparkles feel like they
    // come FROM the friend, not scattered across the whole width
    const items: Fx[] = Array.from({ length: count }, () => ({
      id: fxId.current++,
      emoji,
      x: 38 + Math.floor(Math.random() * 24),
    }))
    setFx((f) => [...f, ...items])
    const ids = new Set(items.map((i) => i.id))
    later(() => setFx((f) => f.filter((x) => !ids.has(x.id))), 1300)
  }

  // trigger a one-shot gesture (arms + pseudo-3D lean) on the friend
  function doAction(a: 'five' | 'hug' | 'kiss') {
    setSplit(null) // gestures act on the whole friend, so re-assemble first
    setFact(null)
    setAction(a)
    later(() => setAction(null), 1000)
  }
  function five() {
    unlockAudio()
    doAction('five')
    burst('🙌')
    playSuccess()
    playClip(`fx-five-${voice}`, 'כיף!')
  }
  function hug() {
    unlockAudio()
    doAction('hug')
    burst('❤️')
    playFriend(index)
    playClip(`fx-hug-${voice}`, 'חיבוק גדול!')
  }
  function kiss() {
    unlockAudio()
    doAction('kiss')
    setKissFx(true)
    later(() => setKissFx(false), 950)
    playFriend(index)
    playClip(`fx-kiss-${voice}`, 'מְמְמוּאָה! נשיקה!')
  }
  // the friend's OWN button: it does its favourite thing (themed emoji + motion)
  function special() {
    unlockAudio()
    setSplit(null)
    setFact(null)
    setMotion(like.motion)
    later(() => setMotion(null), 1000)
    burst(like.burst, 9)
    playSuccess()
    playFriend(index)
    // one of the friend's 3 recorded "special" lines, at random, in its own voice
    playClip(`special-${index}-${randInt(0, 2)}`, like.label)
    setGameLink(true) // reveal the "go to the matching game" button (if it has one)
  }
  function count() {
    unlockAudio()
    clearTimers()
    stopClip()
    setSplit(null)
    setFact(null)
    setLit(0)
    // Accelerate by size: small numbers stay calm (~900ms/block); bigger numbers
    // speed up so the whole count finishes in ~16s no matter how big (friend 100
    // was 90s!). Each block still lights up + chimes; once the pace gets quick we
    // drop the spoken per-block number (it would just stutter) and keep the tone.
    // The total is always announced at the end.
    const STEP = Math.max(150, Math.min(900, Math.round(16000 / n)))
    const speakEach = STEP >= 500
    for (let i = 1; i <= n; i++) {
      later(() => {
        setLit(i)
        playCount(i)
        if (speakEach) playClip(`num-${i}`, numberWord(i))
      }, i * STEP)
    }
    later(() => {
      setLit(undefined)
      playWin()
      // n===1 was already said once in the loop — don't repeat it for לולו
      if (n > 1) playClip(`num-${n}`, numberWord(n))
    }, n * STEP + 500)
  }

  // "what am I made of?" — split into two friends a + b = n (a fresh split each
  // tap). 1 is indivisible, so it just gives a happy wiggle instead.
  function decompose() {
    unlockAudio()
    clearTimers()
    stopClip()
    setLit(undefined)
    setMotion(null)
    setFact(null)
    if (n < 2) {
      setBounce(true)
      later(() => setBounce(false), 600)
      playFriend(index)
      return
    }
    let a = randInt(1, n - 1)
    if (split && a === split.a && n > 2) a = (a % (n - 1)) + 1 // avoid repeating
    setSplit({ a, b: n - a })
    playSuccess()
  }
  // tap the friend itself — it gives a happy little jump + sparkles + says its
  // own number (in the recorded voice). Direct, immediate, no button needed.
  const PATS = ['jump', 'wiggle', 'float']
  function pat() {
    unlockAudio()
    clearTimers()
    stopClip()
    setSplit(null)
    setFact(null)
    setLit(undefined)
    setMotion(PATS[Math.floor(Math.random() * PATS.length)])
    later(() => setMotion(null), 900)
    burst('✨', 5)
    playFriend(index)
    playClip(`num-${n}`, numberWord(n))
  }
  // "what's special about me": show a visual fact, cycling to the next on each tap
  function showFact() {
    unlockAudio()
    clearTimers()
    stopClip()
    setSplit(null)
    setLit(undefined)
    setMotion(null)
    const opening = fact === null
    setFact((f) => (f === null ? 0 : (f + 1) % facts.length))
    playSuccess()
    // on opening, also SAY a fact in the friend's voice — random among the levels
    // UP TO the child's difficulty (קל hears only the simplest; אלוף hears any of
    // the 4). Missing clip → silent fallback, so only recorded friends speak.
    if (opening) playClip(`fact-${index}-${randInt(0, getSettings().difficulty)}`, '')
  }
  // bridge to the "Build a Number" game. If the current split is buildable there
  // (both parts ≤ 10), pre-load it so "build me!" literally rebuilds this friend.
  function goBuild() {
    playTap()
    if (split && split.a <= 10 && split.b <= 10) setBuildPreset({ a: split.a, b: split.b })
    onPlayGame('build')
  }

  // size the friend off the MEASURED stage: ~70% of its height leaves room above
  // for the floating number so it never rides up onto the ◀ number ▶ pager, and
  // keeps the action buttons below on screen. Falls back to a screen fraction
  // until the stage is measured.
  const stageCap = stageH > 0 ? stageH * 0.7 : vp.h * 0.24
  const scale = Math.min((210 / friendMaxDim(index)) * screenScale(vp.w, 1.7), stageCap / friendMaxDim(index))
  // the two split friends share one scale (so 3 still looks smaller than 4),
  // sized so the larger one fits with both side by side AND the equation + button
  // still leave the action buttons visible
  const splitMaxDim = split ? Math.max(friendMaxDim(split.a - 1), friendMaxDim(split.b - 1)) : 1
  const splitScale = Math.min((vp.w * 0.3) / splitMaxDim, (vp.h * 0.22) / splitMaxDim, 1.3)

  return (
    <GameShell title={friendName(index)} emoji="⭐" onExit={onExit}>
      <div className="world-screen">
        {/* a number-line pager: ◀ (lower number) · the number we're on · ▶ (higher).
            direction:ltr (in CSS) keeps ◀ on the left and ▶ on the right so it
            reads like the number line, in both languages. */}
        <div className="world-nav">
          <IconButton icon="◀" label={t('nav.prev')} onClick={goPrev} />
          <span className="world-nav-num" aria-hidden="true">{n}</span>
          <IconButton icon="▶" label={t('nav.next')} onClick={goNext} />
        </div>

        <div
          className="world-stage"
          ref={stageRef}
          onPointerMove={aimGaze}
          onPointerLeave={centerGaze}
          onPointerUp={centerGaze}
          onPointerCancel={centerGaze}
        >
          {split ? (
            // "who am I made of": equation in big digits (he reads numbers!) + the
            // two real friends it's built from, with a bridge to build it for real
            <div className="world-split" key={`${split.a}-${split.b}`}>
              <div className="world-split-eq" aria-live="polite">
                <span className="wse-whole">{n}</span>
                <span className="wse-sym">=</span>
                <span>{split.a}</span>
                <span className="wse-sym">+</span>
                <span>{split.b}</span>
              </div>
              <div className="world-split-friends">
                <Friend index={split.a - 1} scale={splitScale} showNumber lively />
                <span className="world-split-plus" aria-hidden="true">＋</span>
                <Friend index={split.b - 1} scale={splitScale} showNumber lively />
              </div>
              <button className="pill world-build-link" onClick={goBuild}>
                🧮 {t('world.build')}
              </button>
            </div>
          ) : fact !== null ? (
            // a visual number fact in big digits, with the friend beneath it
            <div className="world-fact" key={fact}>
              <span className="wf-label">{facts[fact].label}</span>
              <span className="wf-big" dir="ltr">{facts[fact].big}</span>
              <div className="wf-friend">
                <Friend index={index} scale={scale * 0.42} showNumber lively />
              </div>
            </div>
          ) : (
            <button
              className={`world-friend ${motion ? `motion-${motion}` : ''}`}
              onClick={pat}
              aria-label={friendName(index)}
            >
              <Friend index={index} scale={scale} showNumber bouncing={bounce} litUnits={lit} lively action={action} />
            </button>
          )}
          {kissFx && (
            <span className="world-kiss" aria-hidden="true">
              💋
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

        <div className="world-actions">
          <button className="world-btn world-btn-special" onClick={special}>
            <span className="world-btn-emoji" aria-hidden="true">{like.emoji}</span>
            <span>{t(`world.like.${friendSpecial(index)}`)}</span>
          </button>
          <button className="world-btn" onClick={five}>
            <span className="world-btn-emoji" aria-hidden="true">✋</span>
            <span>{t('world.five')}</span>
          </button>
          <button className="world-btn" onClick={hug}>
            <span className="world-btn-emoji" aria-hidden="true">🤗</span>
            <span>{t('world.hug')}</span>
          </button>
          <button className="world-btn" onClick={kiss}>
            <span className="world-btn-emoji" aria-hidden="true">😘</span>
            <span>{t('world.kiss')}</span>
          </button>
          <button className="world-btn" onClick={count}>
            <span className="world-btn-emoji" aria-hidden="true">🔢</span>
            <span>{t('world.count')}</span>
          </button>
          {n >= 2 && (
            <button className={`world-btn ${split ? 'world-btn-on' : ''}`} onClick={decompose}>
              <span className="world-btn-emoji" aria-hidden="true">🧩</span>
              <span>{t('world.split')}</span>
            </button>
          )}
          <button className={`world-btn ${fact !== null ? 'world-btn-on' : ''}`} onClick={showFact}>
            <span className="world-btn-emoji" aria-hidden="true">✨</span>
            <span>{t('world.fact')}</span>
          </button>
          <button className="world-btn" onClick={describe}>
            <span className="world-btn-emoji" aria-hidden="true">🔊</span>
            <span>{t('world.again')}</span>
          </button>
        </div>

        {gameLink && friendGame(index) && (
          <button className="world-cta" onClick={() => { playTap(); onPlayGame(friendGame(index)!) }}>
            <span className="world-cta-emoji" aria-hidden="true">{like.emoji}</span>
            <span>{t('world.toGame')}</span>
          </button>
        )}
      </div>
    </GameShell>
  )
}
