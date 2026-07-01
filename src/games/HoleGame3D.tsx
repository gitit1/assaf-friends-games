import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import GameShell from '../components/GameShell'
import Confetti from '../components/Confetti'
import { playMunch, playPop, playWin, playSuccess, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { useT } from '../i18n'
import { useSettings } from '../settings'
import { buildLayout, friendNpc, TIER_SIZE, TIER_SCALE, LANDMARK_SIZE, LANDMARK_SCALE, BOSS_SIZE, BOSS_SCALE, type Target } from './hole/world'
import { markFriendMet, hasMetFriend } from '../friendsMet'
import { reachLevel, useMaxLevel } from '../holeProgress'
import HoleMap from './hole/HoleMap'
import Album from '../components/Album'
import type { GameProps } from './registry'

// "בולעים הכול" in REAL 3D (three.js). Drag a swallower across a DESIGNED, bounded
// themed world (Candy City → City) laid out along a winding breadcrumb path with
// stacks, zone clusters, a landmark, and the friends as 3D NPCs / billboards.
// Things tip and fall into the hole; it grows (a progress bar + a "גדלת!" pop tell
// you when), the camera zooms out. Collect the marked targets. No timer, no fail.

type SwId = 'hole' | 'frog' | 'monster' | 'cat'
const SWALLOWERS: { id: SwId; color: string }[] = [
  { id: 'hole', color: '#15151c' },
  { id: 'frog', color: '#46c552' },
  { id: 'monster', color: '#8b5cf6' },
  { id: 'cat', color: '#fb923c' },
]
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
// an object is edible once the hole's mouth is about as wide as it (Hole.io/agar rule)
const eatable = (size: number, R: number) => size <= R * 2 * 1.12

export default function HoleGame3D({ onExit }: GameProps) {
  const { t } = useT()
  const { reduceMotion, maxNumber } = useSettings()
  const [sw, setSw] = useState<SwId>('frog') // who swallows — picked on the same page as the map
  const [phase, setPhase] = useState<'home' | 'map' | 'play' | 'album'>('home') // launcher → map/album/play
  const [pickerOpen, setPickerOpen] = useState(false) // swallower-choose popup
  const maxLevel = useMaxLevel() // the last level the player reached — where "start" begins
  const [level, setLevel] = useState(1)
  const [prog, setProg] = useState(0) // 0..1 toward unlocking the next size
  const [eaten, setEaten] = useState(0) // total swallowed (a big counter, the "sweep")
  const [targets, setTargets] = useState<Target[]>([])
  const [nextIcon, setNextIcon] = useState('')
  const [grew, setGrew] = useState(false)
  const [met, setMet] = useState(false) // a friend popped out of a gift
  const [boss, setBoss] = useState(false) // swallowed the giant boss
  const [done, setDone] = useState(false)
  const [party, setParty] = useState(false)
  const [fs, setFs] = useState(false)
  const mountRef = useRef<HTMLDivElement>(null)
  const fsRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(false)

  // full screen — the small window is too cramped
  function toggleFs() {
    if (!document.fullscreenElement) fsRef.current?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }
  useEffect(() => {
    const h = () => { setFs(!!document.fullscreenElement); window.setTimeout(() => window.dispatchEvent(new Event('resize')), 60) }
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  useEffect(() => {
    if (!sw || phase !== 'play') return
    const mount = mountRef.current
    if (!mount) return
    const W = () => mount.clientWidth || 360
    const H = () => mount.clientHeight || 480
    const lvl = buildLayout(level, maxNumber)
    const swColor = SWALLOWERS.find((s) => s.id === sw)!.color
    doneRef.current = false
    setTargets(lvl.targets.map((x) => ({ ...x })))
    setProg(0); setEaten(0)
    setNextIcon(lvl.world.icons[1] ?? lvl.world.icons[0])
    setDone(false); setParty(false); setGrew(false); setMet(false); setBoss(false)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(lvl.world.sky)
    scene.fog = new THREE.Fog(lvl.world.sky, lvl.bound * 2.4, lvl.bound * 5) // far, so the water shore stays visible
    const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 600)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W(), H())
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.82))
    const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(20, 40, 18); scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.28); fill.position.set(-20, 14, -10); scene.add(fill)

    // WATER all around = the visible EDGE of the world (the child sees where it ends)
    const water = new THREE.Mesh(new THREE.PlaneGeometry(lvl.bound * 10, lvl.bound * 10), new THREE.MeshLambertMaterial({ color: 0x3a90d0 }))
    water.rotation.x = -Math.PI / 2; water.position.y = -0.4; scene.add(water)
    // the ground is a bounded ISLAND disc; past its shore is the sea (a hard boundary)
    const ground = new THREE.Mesh(new THREE.CircleGeometry(lvl.bound, 72), new THREE.MeshLambertMaterial({ color: lvl.world.ground }))
    ground.rotation.x = -Math.PI / 2; scene.add(ground)
    const shore = new THREE.Mesh(new THREE.RingGeometry(lvl.bound - 1.4, lvl.bound + 0.2, 72), new THREE.MeshLambertMaterial({ color: new THREE.Color(lvl.world.ground).lerp(new THREE.Color(0xe9dfae), 0.5) }))
    shore.rotation.x = -Math.PI / 2; shore.position.y = 0.02; scene.add(shore)

    // the visible ROAD the objects line — a darker ground-tone ribbon you follow
    const roadCol = new THREE.Color(lvl.world.ground).multiplyScalar(0.72)
    const roadMesh = new THREE.Mesh(new THREE.TubeGeometry(lvl.road, 120, 2.0, 6, false), new THREE.MeshLambertMaterial({ color: roadCol }))
    roadMesh.scale.y = 0.02; roadMesh.position.y = 0.04; scene.add(roadMesh)

    // NESTED RING FENCES = the barriers; each fades open once the hole is big enough
    const fences = lvl.gates.map((g) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(g.r, 0.42, 8, 72), new THREE.MeshLambertMaterial({ color: 0xcaa46a, transparent: true, opacity: 0.95 }))
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.45; scene.add(ring)
      return { ring, gate: g }
    })

    // the swallower — a flat dark disc (+ a face for creatures)
    const hole = new THREE.Group()
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: sw === 'hole' ? 0x0a0a10 : new THREE.Color(swColor).multiplyScalar(0.25).getHex() }))
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.05; hole.add(disc)
    if (sw !== 'hole') {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.16, 10, 36), new THREE.MeshLambertMaterial({ color: swColor }))
      rim.rotation.x = -Math.PI / 2; rim.position.y = 0.12; hole.add(rim)
      for (const sx of [-0.5, 0.5]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), new THREE.MeshLambertMaterial({ color: 0xffffff })); eye.position.set(sx, 0.7, -0.7); hole.add(eye)
        const pup = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshBasicMaterial({ color: 0x16210f })); pup.position.set(sx, 0.72, -0.95); hole.add(pup)
      }
      if (sw === 'cat' || sw === 'monster') for (const sx of [-0.6, 0.6]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.7, 4), new THREE.MeshLambertMaterial({ color: sw === 'monster' ? '#f4d35e' : swColor })); ear.position.set(sx, 1.0, -0.6); hole.add(ear)
      }
    }
    scene.add(hole)

    type Obj = { grp: THREE.Group; x: number; z: number; tier: number; size: number; baseY: number; captured: boolean; capT: number; grewF: boolean; dead: boolean; mover: boolean; vx: number; vz: number; wanderT: number; kind?: 'gift' | 'ice' | 'boss' | 'firework' | 'balloon' | 'linked'; thawed: boolean; warm: number; iceShell?: THREE.Mesh; friend?: number }
    const objs: Obj[] = lvl.specs.map((s) => {
      const grp = s.make()
      const scale = s.kind === 'boss' ? BOSS_SCALE : s.landmark ? LANDMARK_SCALE : TIER_SCALE[s.tier - 1]
      grp.scale.setScalar(scale)
      grp.position.set(s.x, s.baseY * scale, s.z)
      let iceShell: THREE.Mesh | undefined
      if (s.kind === 'ice') { // encase it in a frosty block you melt by lingering
        iceShell = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.0, 1.7), new THREE.MeshLambertMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.55 }))
        iceShell.position.y = 0.9; grp.add(iceShell)
      }
      scene.add(grp)
      const size = s.kind === 'boss' ? BOSS_SIZE : s.landmark ? LANDMARK_SIZE : TIER_SIZE[s.tier - 1]
      return { grp, x: s.x, z: s.z, tier: s.tier, size, baseY: s.baseY * scale, captured: false, capT: 0, grewF: false, dead: false, mover: !!s.mover, vx: 0, vz: 0, wanderT: 0, kind: s.kind, thawed: s.kind !== 'ice', warm: 0, iceShell, friend: s.friend }
    })
    const reveals: { grp: THREE.Group; t: number }[] = [] // friends popping out of swallowed gifts

    // a soft DUST POOF when something is swallowed (cheap THREE.Points pool)
    const PMAX = 96
    const pPos = new Float32Array(PMAX * 3).fill(-999)
    const pState = Array.from({ length: PMAX }, () => ({ life: 0, vx: 0, vy: 0, vz: 0 }))
    const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    // a soft round dust sprite (a radial-gradient dot) so puffs are fluffy, not square
    const pcv = document.createElement('canvas'); pcv.width = pcv.height = 32
    const pcx = pcv.getContext('2d')!; const pgrad = pcx.createRadialGradient(16, 16, 0, 16, 16, 16)
    pgrad.addColorStop(0, 'rgba(255,255,255,0.95)'); pgrad.addColorStop(1, 'rgba(255,255,255,0)')
    pcx.fillStyle = pgrad; pcx.beginPath(); pcx.arc(16, 16, 16, 0, 6.283); pcx.fill()
    const ptex = new THREE.CanvasTexture(pcv)
    const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xfff4fb, size: 0.5, map: ptex, transparent: true, opacity: 0.7, depthWrite: false }))
    points.frustumCulled = false; scene.add(points)
    let pHead = 0
    // up>1 + n high = a firework's upward shower; defaults = a small swallow dust poof
    const poof = (x: number, z: number, up = 1, n = 7) => { for (let k = 0; k < n; k++) { const i = pHead++ % PMAX, a = Math.random() * 6.28, s = (1 + Math.random() * 2.2) * (up > 1 ? 0.7 : 1); pState[i] = { life: up > 1 ? 0.85 : 0.5, vx: Math.cos(a) * s, vy: (1.4 + Math.random() * 2) * up, vz: Math.sin(a) * s }; pPos[i * 3] = x; pPos[i * 3 + 1] = 0.3; pPos[i * 3 + 2] = z } }

    const pos = { x: 0, z: 0 }
    const targetPos = { x: 0, z: 0 }
    let R = 0.8, eatTier = 0, totalEaten = 0, combo = 0, lastEat = -1, squash = 0
    const tg = lvl.targets.map((x) => ({ ...x }))

    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit = new THREE.Vector3()
    const el = renderer.domElement
    const onPointer = (e: PointerEvent) => {
      unlockAudio()
      const r = el.getBoundingClientRect()
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1
      ray.setFromCamera(ndc, camera)
      if (ray.ray.intersectPlane(plane, hit)) { targetPos.x = hit.x; targetPos.z = hit.z }
    }
    el.addEventListener('pointerdown', onPointer)
    el.addEventListener('pointermove', onPointer)
    el.style.touchAction = 'none'

    const clock = new THREE.Clock()
    let raf = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, clock.getDelta())

      const dx = targetPos.x - pos.x, dz = targetPos.z - pos.z
      const d = Math.hypot(dx, dz)
      const spd = (3.4 + R * 0.35) * dt // calm pace, only mildly faster when big
      if (d > 0.05) { const s = Math.min(d, spd); pos.x += (dx / d) * s; pos.z += (dz / d) * s }
      // PHYSICAL BOUNDARY: blocked at the first still-closed ring (grow to open it), and
      // never past the island's shore — the hole simply stops there ("this is the end")
      let maxDist = lvl.bound - 1.2
      for (const g of lvl.gates) { if (R < g.open) { maxDist = Math.max(2, g.r - R * 0.5); break } }
      const dc = Math.hypot(pos.x, pos.z)
      if (dc > maxDist) { pos.x *= maxDist / dc; pos.z *= maxDist / dc }
      for (const f of fences) { const closed = R < f.gate.open; f.ring.visible = closed; (f.ring.material as THREE.MeshLambertMaterial).opacity = closed ? 0.95 : 0 }
      squash = Math.max(0, squash - dt * 4) // gentle mouth "squash" pulse decays after each bite
      hole.position.set(pos.x, 0, pos.z); hole.scale.set(R * (1 + squash * 0.1), R, R * (1 + squash * 0.1))

      let changed = false, metGift = false, ateBoss = false, firedFw = false, poppedBalloon = false
      for (const o of objs) {
        if (o.dead) continue
        // a LIVING world: critters wander, and gently amble AWAY when the hole nears
        // (always slower than the hole, so the child always catches them — it's tag)
        if (o.mover && !o.captured) {
          o.wanderT -= dt
          if (o.wanderT <= 0) { const a = Math.random() * 6.283, sp = 0.55 + Math.random() * 0.5; o.vx = Math.cos(a) * sp; o.vz = Math.sin(a) * sp; o.wanderT = 1.6 + Math.random() * 2.2 }
          const hx = o.x - pos.x, hz = o.z - pos.z, hd = Math.hypot(hx, hz)
          let mvx = o.vx, mvz = o.vz
          if (hd < R + 4 && hd > 0.001) { const fl = 1.7; mvx = (hx / hd) * fl; mvz = (hz / hd) * fl } // startled amble away
          o.x += mvx * dt; o.z += mvz * dt
          if (Math.hypot(o.x, o.z) > lvl.bound) { o.x = Math.max(-lvl.bound, Math.min(lvl.bound, o.x)); o.z = Math.max(-lvl.bound, Math.min(lvl.bound, o.z)); o.vx = -o.vx; o.vz = -o.vz }
          o.grp.position.x = o.x; o.grp.position.z = o.z
          o.grp.rotation.y = Math.atan2(mvx, mvz)
          if (!reduceMotion) o.grp.position.y = o.baseY + Math.abs(Math.sin(clock.elapsedTime * 6 + o.x)) * 0.12 // a little hop
        }
        // MARK the surprises (gift / ice / friend): a gentle bob so the child spots them
        if (!reduceMotion && !o.captured && !o.mover && (o.kind != null && o.kind !== 'boss' || o.friend != null)) {
          o.grp.position.y = o.baseY + (Math.sin(clock.elapsedTime * 2.2 + o.x) * 0.5 + 0.5) * 0.22
          o.grp.rotation.y += dt * 0.6
        }
        if (o.captured) {
          o.capT += dt
          const delay = o.baseY * 0.12
          if (o.capT < delay) continue
          if (!o.grewF) {
            o.grewF = true; R = Math.cbrt(R * R * R + o.size * o.size * o.size * 0.5); totalEaten += 1 // VOLUME growth (Katamari square-cube: decelerates, no more ballooning)
            const x = tg.find((q) => q.tier === o.tier && q.got < q.need); if (x) x.got += 1
            if (o.kind === 'gift') { // a friend pops up — prefer one NOT yet collected
              const cap = Math.max(1, maxNumber)
              let fi = Math.floor(Math.random() * cap)
              for (let tr = 0; tr < 12 && hasMetFriend(fi); tr++) fi = Math.floor(Math.random() * cap)
              const fr = friendNpc(fi); fr.position.set(o.x, -1.6, o.z); scene.add(fr)
              reveals.push({ grp: fr, t: 0 }); metGift = true; markFriendMet(fi) // → the album
            }
            if (o.friend != null) markFriendMet(o.friend) // swallowed an in-world friend → album
            if (o.kind === 'linked') { // its partner (nearest other linked) slides in too
              let best: Obj | null = null, bd = Infinity
              for (const q of objs) { if (q === o || q.dead || q.captured || q.kind !== 'linked') continue; const dd = Math.hypot(q.x - o.x, q.z - o.z); if (dd < bd) { bd = dd; best = q } }
              if (best) { best.captured = true; best.capT = 0 }
            }
            if (o.kind === 'boss') ateBoss = true // swallowed the giant — a triumphant capstone
            if (o.kind === 'firework') firedFw = true // shoots a colourful burst up out of the hole
            if (o.kind === 'balloon') { // pops + sweeps a few nearby treats into the hole
              poppedBalloon = true; let pulled = 0
              for (const q of objs) { if (pulled >= 5) break; if (q === o || q.dead || q.captured || q.kind != null || q.friend != null || q.tier > 2) continue; if (Math.hypot(q.x - o.x, q.z - o.z) < 5.5) { q.captured = true; q.capT = 0; pulled++ } }
            }
            changed = true
          }
          const fall = o.capT - delay // tip toward the hole, then ACCELERATE down (gravity feel)
          o.grp.position.x = lerp(o.grp.position.x, pos.x, 0.16)
          o.grp.position.z = lerp(o.grp.position.z, pos.z, 0.16)
          o.grp.position.y -= dt * (4 + fall * 16)
          o.grp.rotation.x += dt * (3 + fall * 5); o.grp.rotation.z += dt * 3
          o.grp.scale.multiplyScalar(Math.max(0, 1 - dt * 2.1))
          if (o.grp.scale.x < 0.06 || o.grp.position.y < -3) { if (!reduceMotion) poof(pos.x, pos.z); scene.remove(o.grp); o.dead = true }
        } else if (eatable(o.size, R) && o.thawed) {
          if (Math.hypot(o.x - pos.x, o.z - pos.z) < R * 0.95) { o.captured = true; o.capT = 0 }
        } else if (o.kind === 'ice' && !o.thawed) {
          // melt the frosty block by lingering near the hole's warmth, then it's edible
          const nd = Math.hypot(o.x - pos.x, o.z - pos.z)
          if (nd < R + 2.2) {
            o.warm += dt
            if (o.iceShell) { const k = Math.max(0, 1 - o.warm / 1.3); o.iceShell.scale.setScalar(0.55 + 0.45 * k); (o.iceShell.material as THREE.MeshLambertMaterial).opacity = 0.55 * k }
            if (o.warm >= 1.3) { o.thawed = true; if (o.iceShell) { o.grp.remove(o.iceShell); o.iceShell.geometry.dispose(); (o.iceShell.material as THREE.Material).dispose(); o.iceShell = undefined } playSuccess() }
          }
        } else if (!reduceMotion && o.size < 3) {
          o.grp.rotation.y += dt * 0.15 // gentle idle life on small things you can't eat yet
        }
      }
      // friends popping out of swallowed gifts: rise, bob, then gently fade away
      for (let i = reveals.length - 1; i >= 0; i--) {
        const rv = reveals[i]; rv.t += dt
        rv.grp.position.y = rv.t < 0.5 ? lerp(-1.6, 0.2, rv.t / 0.5) : 0.2 + Math.sin(rv.t * 3) * 0.12
        rv.grp.rotation.y += dt * 1.2
        if (rv.t > 3) rv.grp.scale.setScalar(Math.max(0, 1 - (rv.t - 3)))
        if (rv.t > 4) { scene.remove(rv.grp); reveals.splice(i, 1) }
      }
      // dust poof particles: drift out + up, settle, fade
      for (let i = 0; i < PMAX; i++) { const p = pState[i]; if (p.life > 0) { p.life -= dt; pPos[i * 3] += p.vx * dt; pPos[i * 3 + 1] += p.vy * dt; pPos[i * 3 + 2] += p.vz * dt; p.vy -= dt * 4; if (p.life <= 0) pPos[i * 3 + 1] = -999 } }
      pGeo.attributes.position.needsUpdate = true
      if (changed) {
        const now = clock.elapsedTime; combo = now - lastEat < 0.5 ? combo + 1 : 0; lastEat = now; squash = 1
        playMunch(combo) // rising pitch on a fast sweep, soft reset otherwise
        setEaten(totalEaten)
        if (metGift) { setMet(true); playWin(); window.setTimeout(() => setMet(false), 1900) } // a friend appeared!
        if (ateBoss) { setBoss(true); playWin(); setParty(true); window.setTimeout(() => setBoss(false), 2400) } // swallowed the giant!
        if (firedFw) { poof(pos.x, pos.z, 4, 28); setParty(true); playSuccess(); window.setTimeout(() => { if (!doneRef.current) setParty(false) }, 1300) } // firework!
        if (poppedBalloon) { setParty(true); playPop(); window.setTimeout(() => { if (!doneRef.current) setParty(false) }, 1000) } // balloon pop
        setTargets(tg.map((x) => ({ ...x })))
        // current max edible tier (by size) + progress toward unlocking the next
        const diam = R * 2 * 1.12
        let et = 0; for (let i = 0; i < TIER_SIZE.length; i++) if (TIER_SIZE[i] <= diam) et = i + 1
        const nextT = Math.min(et + 1, TIER_SIZE.length)
        setProg(Math.min(1, diam / TIER_SIZE[nextT - 1]))
        setNextIcon(lvl.world.icons[Math.min(nextT - 1, lvl.world.icons.length - 1)])
        if (et > eatTier) {
          eatTier = et
          if (!reduceMotion) { setGrew(true); window.setTimeout(() => setGrew(false), 1100) }
          playSuccess(); speakNumber(et)
        }
        if (tg.every((x) => x.got >= x.need) && !doneRef.current) {
          doneRef.current = true; playWin(); setParty(true); setDone(true); reachLevel(level + 1) // unlock the next on the map
        }
      }

      const dist = 7 + R * 1.85, height = 7.5 + R * 2.0
      camera.position.set(pos.x, height, pos.z + dist); camera.lookAt(pos.x, 0, pos.z)

      // guide arrow → nearest still-needed target
      if (arrowRef.current) {
        let near: Obj | null = null, nd = Infinity
        for (const o of objs) {
          if (o.dead || !tg.some((q) => q.tier === o.tier && q.got < q.need)) continue
          const ddx = Math.hypot(o.x - pos.x, o.z - pos.z); if (ddx < nd) { nd = ddx; near = o }
        }
        const vw = el.clientWidth || 1, vh = el.clientHeight || 1
        if (near) {
          const v = new THREE.Vector3(near.x, near.baseY + 1, near.z).project(camera)
          const behind = v.z > 1, onScreen = !behind && v.x >= -1 && v.x <= 1 && v.y >= -1 && v.y <= 1
          if (onScreen) arrowRef.current.style.display = 'none'
          else {
            let ang = Math.atan2((-v.y * 0.5 + 0.5) * vh - vh / 2, (v.x * 0.5 + 0.5) * vw - vw / 2)
            if (behind) ang += Math.PI
            const mar = 26, ex = vw / 2 + Math.cos(ang) * (vw / 2 - mar), ey = vh / 2 + Math.sin(ang) * (vh / 2 - mar)
            arrowRef.current.style.display = 'flex'
            arrowRef.current.style.transform = `translate(${ex - 20}px, ${ey - 20}px) rotate(${ang}rad)`
          }
        } else arrowRef.current.style.display = 'none'
      }

      renderer.render(scene, camera)
    }
    frame()

    const onResize = () => { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()) }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('resize', onResize)
      el.removeEventListener('pointerdown', onPointer); el.removeEventListener('pointermove', onPointer)
      scene.traverse((o) => {
        const me = o as THREE.Mesh
        if (me.geometry) me.geometry.dispose()
        const mm = me.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mm)) mm.forEach((x) => x.dispose()); else if (mm) mm.dispose()
      })
      ptex.dispose(); renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [sw, phase, level, reduceMotion, maxNumber])

  const swFeatures = (id: SwId) => (
    <>
      {id === 'frog' && (<><span className="sw-eye l" /><span className="sw-eye r" /></>)}
      {id === 'monster' && (<><span className="sw-horn l" /><span className="sw-horn r" /><span className="sw-teeth" /></>)}
      {id === 'cat' && (<><span className="sw-ear l" /><span className="sw-ear r" /></>)}
    </>
  )
  const swColor = SWALLOWERS.find((s) => s.id === sw)!.color

  if (phase === 'album') {
    return <Album onExit={() => setPhase('home')} />
  }
  if (phase === 'map') {
    // the level map — opened only via "choose a level" (not shown on the home page)
    return (
      <GameShell title={t('game.hole')} emoji="🕳️" onExit={() => setPhase('home')}>
        <HoleMap onPick={(l) => { playPop(); setLevel(l); setPhase('play') }} />
      </GameShell>
    )
  }
  if (phase === 'home') {
    // launcher: small icon buttons — current swallower (→ popup), album, choose-a-level
    return (
      <GameShell title={t('game.hole')} emoji="🕳️" onExit={onExit}>
        <div className="hole-home">
          {/* big START — begins at the last level the player reached */}
          <button className="hole-start-big" onClick={() => { playPop(); setLevel(maxLevel); setPhase('play') }}>
            <span className="hole-start-icon">▶️</span>
            <span>{t('hole.start')}</span>
            <span className="hole-start-lvl">{t('hole.level')} {maxLevel}</span>
          </button>
          <div className="hole-home-row">
            <button className="hole-launch" onClick={() => { playPop(); setPickerOpen(true) }} aria-label={t('hole.pick')}>
              <span className="sw-holder pick"><span className={`sw sw-${sw}`} style={{ ['--c' as string]: swColor }}>{swFeatures(sw)}</span></span>
              <span className="hole-launch-lbl">{t(`hole.sw.${sw}`)}</span>
            </button>
            <button className="hole-launch" onClick={() => { playPop(); setPhase('album') }} aria-label={t('album.title')}>
              <span className="hole-launch-icon">📖</span>
              <span className="hole-launch-lbl">{t('album.title')}</span>
            </button>
            <button className="hole-launch" onClick={() => { playPop(); setPhase('map') }} aria-label={t('hole.map.title')}>
              <span className="hole-launch-icon">🗺️</span>
              <span className="hole-launch-lbl">{t('hole.map.title')}</span>
            </button>
          </div>
        </div>
        {pickerOpen && (
          <div className="hole-pick-modal" onClick={() => setPickerOpen(false)}>
            <div className="hole-pick-sheet" onClick={(e) => e.stopPropagation()}>
              <button className="album-detail-x" onClick={() => setPickerOpen(false)} aria-label="✕">✕</button>
              <p className="hole-pick-title">{t('hole.pick')}</p>
              <div className="hole-pick compact">
                {SWALLOWERS.map((s) => (
                  <button key={s.id} className={`hole-pick-btn ${sw === s.id ? 'sel' : ''}`} onClick={() => { playPop(); setSw(s.id); setPickerOpen(false) }}>
                    <span className="sw-holder pick"><span className={`sw sw-${s.id}`} style={{ ['--c' as string]: s.color }}>{swFeatures(s.id)}</span></span>
                    <span>{t(`hole.sw.${s.id}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </GameShell>
    )
  }

  return (
    <GameShell title={t('game.hole')} emoji="🕳️" onExit={() => setPhase('map')}>
      <Confetti active={party} />
      <div className="hole-fs" ref={fsRef}>
        <div className="hole-hud">
          <span className="hole-level">{t('hole.level')} {level}</span>
          <span className="hole-eaten">😋 {eaten}</span>
          <span className="hole-targets">
            {targets.map((tgt, i) => (
              <span key={i} className={`hole-tgt ${tgt.got >= tgt.need ? 'ok' : ''}`}>{tgt.icon}<b>{Math.max(0, tgt.need - tgt.got)}</b></span>
            ))}
          </span>
        </div>
        {/* growth indicator: fills with each bite, the next thing's icon at the end */}
        <div className={`hole-grow ${grew ? 'pop' : ''}`}>
          <span className="hg-bar"><span className="hg-fill" style={{ width: `${prog * 100}%` }} /></span>
          <span className="hg-next">{nextIcon}</span>
        </div>
        <div className="hole3d-wrap">
          <div className="hole3d-canvas" ref={mountRef} />
          <div className="hole-arrow" ref={arrowRef} aria-hidden="true"><span className="arr-tip" /></div>
          <button className="hole-fs-btn" onClick={toggleFs} aria-label={t('hole.fullscreen')}>{fs ? '✕' : '⛶'}</button>
          {grew && <div className="hole-grew">⬆️ {t('hole.grew')}</div>}
          {met && <div className="hole-met">🎁 {t('hole.met')}</div>}
          {boss && <div className="hole-met hole-boss">🏆 {t('hole.boss')}</div>}
          {done && (
            <div className="hole-done">
              <p>🎉 {t('hole.done')}</p>
              <button className="big-button" onClick={() => { playPop(); setParty(false); setLevel((n) => n + 1) }}>➡️ {t('hole.next')}</button>
              <button className="big-button hole-map-btn" onClick={() => { playPop(); setParty(false); setPhase('map') }}>🗺️ {t('hole.map')}</button>
            </div>
          )}
        </div>
      </div>
      <p className="sport-hint">{t('hole.hint')}</p>
    </GameShell>
  )
}
