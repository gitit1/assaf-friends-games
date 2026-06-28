import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import GameShell from '../components/GameShell'
import Confetti from '../components/Confetti'
import { playMunch, playPop, playWin, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { useT } from '../i18n'
import { useSettings } from '../settings'
import type { GameProps } from './registry'

// "בולעים הכול" in REAL 3D (three.js, same raw pipeline as Friend3D): a tilted
// camera that follows a flat dark hole across a big low-poly world; objects with
// real height arranged in STACKS topple and fall in as you pass under; the hole
// grows and the camera zooms out; collect the marked TARGETS to finish the level.
// No timer, no fail — faked, predictable capture physics.

type SwId = 'hole' | 'frog' | 'monster' | 'cat'
const SWALLOWERS: { id: SwId; color: string }[] = [
  { id: 'hole', color: '#15151c' },
  { id: 'frog', color: '#46c552' },
  { id: 'monster', color: '#8b5cf6' },
  { id: 'cat', color: '#fb923c' },
]

// each theme: sky, ground, and a 4-colour palette (one per size tier)
type Theme3D = { id: string; sky: string; ground: string; pal: string[]; icons: string[] }
const THEMES: Theme3D[] = [
  { id: 'park', sky: '#bfe9ff', ground: '#83cf86', pal: ['#ff6b8a', '#ffd23f', '#6ab0ff', '#7a5cff'], icons: ['🍎', '🎁', '🌳', '🏠'] },
  { id: 'city', sky: '#cfe0ee', ground: '#9aa7b6', pal: ['#4cc4d6', '#ffb14a', '#ff6f6f', '#9b8cff'], icons: ['🔵', '📦', '🚗', '🏢'] },
  { id: 'beach', sky: '#a9e7ff', ground: '#f1dca0', pal: ['#ff8fab', '#ffd23f', '#4cd0c0', '#5aa9ff'], icons: ['🐚', '🏐', '🐢', '⛵'] },
  { id: 'candy', sky: '#ffe1f0', ground: '#f6b8d8', pal: ['#ff7eb6', '#ffd23f', '#8ad6ff', '#b388ff'], icons: ['🍬', '🍪', '🍰', '🎂'] },
  { id: 'space', sky: '#241d3f', ground: '#33285c', pal: ['#ffe14d', '#5fd0ff', '#ff7ad1', '#9b8cff'], icons: ['⭐', '🛰️', '🚀', '🛸'] },
]

type Target = { tier: number; icon: string; need: number; got: number }

type Spec = { x: number; z: number; tier: number; col: number; idx: number; target: boolean }
type Level = { specs: Spec[]; targets: Target[]; theme: Theme3D; maxTier: number }

function buildLevel(n: number): Level {
  const theme = THEMES[(n - 1) % THEMES.length]
  const maxTier = Math.min(4, 2 + Math.floor((n - 1) / 4))
  const nTargets = Math.min(3, 1 + Math.floor((n - 1) / 3))
  const tierChoices: number[] = []
  for (let t = 1; t <= maxTier; t++) tierChoices.push(t)
  const targetTiers = [...tierChoices].sort(() => Math.random() - 0.5).slice(0, nTargets)
  const targets: Target[] = targetTiers.map((t) => ({ tier: t, icon: theme.icons[t - 1], need: 3 + Math.floor(n / 4) + t, got: 0 }))

  const specs: Spec[] = []
  let col = 0
  const R = 18 + n * 2 // world spread grows → more distance (camera zooms out to reveal it)
  const slots = 18 + n
  const need: Record<number, number> = {}
  for (const tg of targets) need[tg.tier] = tg.need
  for (let s = 0; s < slots; s++) {
    const ang = (s / slots) * Math.PI * 2 + Math.random() * 0.4
    const rad = 4 + Math.random() * R
    const cx = Math.cos(ang) * rad
    const cz = Math.sin(ang) * rad
    // is this a target cluster (a stack of a needed tier)?
    let tier = 1 + Math.floor(Math.random() * Math.max(1, maxTier - 1)) // mostly low (filler to grow on)
    let target = false
    const needyTier = targets.find((tg) => (need[tg.tier] ?? 0) > 0)
    if (needyTier && s % 2 === 0) { tier = needyTier.tier; target = true }
    const stack = tier <= 2 ? 2 + Math.floor(Math.random() * 4) : 1 + Math.floor(Math.random() * 2) // small = tall piles
    for (let i = 0; i < stack; i++) {
      specs.push({ x: cx + (Math.random() - 0.5) * 0.6, z: cz + (Math.random() - 0.5) * 0.6, tier, col, idx: i, target })
      if (target && need[tier] != null) need[tier] = Math.max(0, need[tier] - 1)
    }
    col++
  }
  return { specs, targets, theme, maxTier }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// a low-poly prop for a size tier, coloured from the theme
function makeProp(tier: number, color: string): THREE.Group {
  const g = new THREE.Group()
  const mat = (c: string) => new THREE.MeshLambertMaterial({ color: c })
  const dark = new THREE.Color(color).multiplyScalar(0.7).getStyle()
  if (tier === 1) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), mat(color))
    m.position.y = 0.55; g.add(m)
  } else if (tier === 2) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), mat(color))
    m.position.y = 0.55; g.add(m)
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 1.2), mat(dark))
    lid.position.y = 1.12; g.add(lid)
  } else if (tier === 3) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1, 8), mat('#9c6b3f'))
    trunk.position.y = 0.5; g.add(trunk)
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.7, 8), mat(color))
    top.position.y = 1.85; g.add(top)
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 2.2), mat(color))
    body.position.y = 1.6; g.add(body)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.1, 4), mat(dark))
    roof.position.y = 3.7; roof.rotation.y = Math.PI / 4; g.add(roof)
  }
  // a blob contact shadow under the prop
  const sh = new THREE.Mesh(
    new THREE.CircleGeometry(tier === 4 ? 1.7 : tier === 3 ? 1.0 : 0.7, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 }),
  )
  sh.rotation.x = -Math.PI / 2
  sh.position.y = 0.02
  g.add(sh)
  return g
}

export default function HoleGame3D({ onExit }: GameProps) {
  const { t } = useT()
  const { reduceMotion } = useSettings()
  const [sw, setSw] = useState<SwId | null>(null)
  const [level, setLevel] = useState(1)
  const [hud, setHud] = useState({ size: 0, count: 0, tier: 1 })
  const [targets, setTargets] = useState<Target[]>([])
  const [done, setDone] = useState(false)
  const [party, setParty] = useState(false)
  const mountRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    if (!sw) return
    const mount = mountRef.current
    if (!mount) return
    const W = () => mount.clientWidth || 360
    const H = () => mount.clientHeight || 480
    const lvl = buildLevel(level)
    const swColor = SWALLOWERS.find((s) => s.id === sw)!.color
    doneRef.current = false
    setTargets(lvl.targets.map((x) => ({ ...x })))
    setHud({ size: 0, count: 0, tier: 1 })
    setDone(false)
    setParty(false)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(lvl.theme.sky)
    scene.fog = new THREE.Fog(lvl.theme.sky, 60, 130)
    const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 400)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W(), H())
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.82))
    const key = new THREE.DirectionalLight(0xffffff, 0.9)
    key.position.set(20, 40, 18)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.28)
    fill.position.set(-20, 14, -10)
    scene.add(fill)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshLambertMaterial({ color: lvl.theme.ground }),
    )
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    // the hole — a flat dark disc on the ground
    const hole = new THREE.Group()
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      new THREE.MeshBasicMaterial({ color: sw === 'hole' ? 0x0a0a10 : new THREE.Color(swColor).multiplyScalar(0.25).getHex() }),
    )
    disc.rotation.x = -Math.PI / 2
    disc.position.y = 0.04
    hole.add(disc)
    if (sw !== 'hole') {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.16, 10, 36), new THREE.MeshLambertMaterial({ color: swColor }))
      rim.rotation.x = -Math.PI / 2
      rim.position.y = 0.12
      hole.add(rim)
      const eyeMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
      const pupMat = new THREE.MeshBasicMaterial({ color: 0x16210f })
      for (const sx of [-0.5, 0.5]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), eyeMat)
        eye.position.set(sx, 0.7, -0.7); hole.add(eye)
        const pup = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), pupMat)
        pup.position.set(sx, 0.72, -0.95); hole.add(pup)
      }
      if (sw === 'cat' || sw === 'monster') {
        const earMat = new THREE.MeshLambertMaterial({ color: sw === 'monster' ? '#f4d35e' : swColor })
        for (const sx of [-0.6, 0.6]) {
          const ear = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.7, 4), earMat)
          ear.position.set(sx, 1.0, -0.6); hole.add(ear)
        }
      }
    }
    scene.add(hole)

    // build the world objects from specs
    type Obj = { grp: THREE.Group; x: number; z: number; tier: number; col: number; idx: number; target: boolean; captured: boolean; capT: number; grew: boolean; baseY: number; dead: boolean }
    const objs: Obj[] = lvl.specs.map((s) => {
      const grp = makeProp(s.tier, lvl.theme.pal[s.tier - 1])
      const baseY = s.idx * (s.tier <= 1 ? 1.0 : s.tier === 2 ? 1.2 : 0) // small props stack vertically
      grp.position.set(s.x, baseY, s.z)
      grp.rotation.y = Math.random() * Math.PI
      scene.add(grp)
      return { grp, x: s.x, z: s.z, tier: s.tier, col: s.col, idx: s.idx, target: s.target, captured: false, capT: 0, grew: false, baseY, dead: false }
    })

    // game state
    const pos = { x: 0, z: 0 }
    const targetPos = { x: 0, z: 0 }
    let R = 1.4
    let tier = 1
    let count = 0
    let sizeNum = 0
    const tg = lvl.targets.map((x) => ({ ...x }))

    // pointer → ground raycast
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
    let shake = 0
    const colCaptured: Record<number, number> = {}

    const frame = () => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, clock.getDelta())

      // move hole toward the finger (slow, deliberate, a bit faster as it grows)
      const dx = targetPos.x - pos.x, dz = targetPos.z - pos.z
      const d = Math.hypot(dx, dz)
      const spd = (8 + R * 1.4) * dt
      if (d > 0.05) { const s = Math.min(d, spd); pos.x += (dx / d) * s; pos.z += (dz / d) * s }
      hole.position.set(pos.x, 0, pos.z)
      hole.scale.setScalar(R)

      // capture
      let changed = false
      for (const o of objs) {
        if (o.dead) continue
        if (o.captured) {
          o.capT += dt
          const delay = o.idx * 0.16
          if (o.capT < delay) continue // wait for the piece below to start falling (cascade)
          if (!o.grew) {
            o.grew = true
            R += o.tier * 0.05
            count += 1
            sizeNum += o.tier
            if (count % 3 === 0 && tier < 4) tier += 1
            const x = tg.find((q) => q.tier === o.tier && q.got < q.need); if (x) x.got += 1
            shake = Math.min(0.5, 0.12 + o.tier * 0.08)
            changed = true
          }
          o.grp.position.x = lerp(o.grp.position.x, pos.x, 0.14)
          o.grp.position.z = lerp(o.grp.position.z, pos.z, 0.14)
          o.grp.position.y -= dt * 7
          o.grp.rotation.x += dt * 5
          o.grp.rotation.z += dt * 4
          o.grp.scale.multiplyScalar(Math.max(0, 1 - dt * 2.4))
          if (o.grp.scale.x < 0.06 || o.grp.position.y < -3) { scene.remove(o.grp); o.dead = true }
        } else if (o.tier <= tier) {
          const dd = Math.hypot(o.x - pos.x, o.z - pos.z)
          // capture bottom-up within a stack column
          const ready = o.idx <= (colCaptured[o.col] ?? 0)
          if (dd < R * 0.92 && ready) {
            o.captured = true
            o.capT = 0
            colCaptured[o.col] = Math.max(colCaptured[o.col] ?? 0, o.idx + 1)
          }
        } else if (!reduceMotion) {
          o.grp.rotation.y += dt * 0.2 // gentle idle life
        }
      }
      if (changed) {
        playMunch()
        setHud({ size: sizeNum, count, tier })
        setTargets(tg.map((x) => ({ ...x })))
        if (count % 3 === 0) speakNumber(sizeNum)
        if (tg.every((x) => x.got >= x.need) && !doneRef.current) {
          doneRef.current = true
          playWin(); speakNumber(level); setParty(true); setDone(true)
        }
      }

      // camera follows + zooms out as the hole grows
      const dist = 9 + R * 2.1
      const height = 10 + R * 2.4
      const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0
      shake = Math.max(0, shake - dt * 2)
      camera.position.set(pos.x + sx, height, pos.z + dist)
      camera.lookAt(pos.x, 0, pos.z)

      // guide arrow → nearest uncollected target (projected to screen)
      if (arrowRef.current) {
        let near: Obj | null = null
        let nd = Infinity
        for (const o of objs) {
          if (o.dead) continue
          if (!tg.some((q) => q.tier === o.tier && q.got < q.need)) continue // only point at still-needed types
          const ddx = Math.hypot(o.x - pos.x, o.z - pos.z)
          if (ddx < nd) { nd = ddx; near = o }
        }
        const vw = el.clientWidth || 1
        const vh = el.clientHeight || 1
        if (near) {
          const v = new THREE.Vector3(near.x, near.baseY + 1, near.z).project(camera)
          const behind = v.z > 1
          const onScreen = !behind && v.x >= -1 && v.x <= 1 && v.y >= -1 && v.y <= 1
          if (onScreen) {
            arrowRef.current.style.display = 'none'
          } else {
            const px = (v.x * 0.5 + 0.5) * vw
            const py = (-v.y * 0.5 + 0.5) * vh
            let ang = Math.atan2(py - vh / 2, px - vw / 2)
            if (behind) ang += Math.PI
            const m = 26
            const ex = vw / 2 + Math.cos(ang) * (vw / 2 - m)
            const ey = vh / 2 + Math.sin(ang) * (vh / 2 - m)
            arrowRef.current.style.display = 'flex'
            arrowRef.current.style.transform = `translate(${ex - 20}px, ${ey - 20}px) rotate(${ang}rad)`
          }
        } else {
          arrowRef.current.style.display = 'none'
        }
      }

      renderer.render(scene, camera)
    }
    frame()

    const onResize = () => { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()) }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      el.removeEventListener('pointerdown', onPointer)
      el.removeEventListener('pointermove', onPointer)
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
        const mm = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mm)) mm.forEach((x) => x.dispose())
        else if (mm) mm.dispose()
      })
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [sw, level, reduceMotion])

  if (!sw) {
    return (
      <GameShell title={t('game.hole')} emoji="🕳️" onExit={onExit}>
        <p className="pet-pick-title">{t('hole.pick')}</p>
        <div className="hole-pick">
          {SWALLOWERS.map((s) => (
            <button key={s.id} className="hole-pick-btn" onClick={() => { playPop(); setSw(s.id) }}>
              <span className="sw-holder pick">
                <span className={`sw sw-${s.id}`} style={{ ['--c' as string]: s.color }}>
                  {s.id === 'frog' && (<><span className="sw-eye l" /><span className="sw-eye r" /></>)}
                  {s.id === 'monster' && (<><span className="sw-horn l" /><span className="sw-horn r" /><span className="sw-teeth" /></>)}
                  {s.id === 'cat' && (<><span className="sw-ear l" /><span className="sw-ear r" /></>)}
                </span>
              </span>
              <span>{t(`hole.sw.${s.id}`)}</span>
            </button>
          ))}
        </div>
      </GameShell>
    )
  }

  return (
    <GameShell title={t('game.hole')} emoji="🕳️" onExit={onExit}>
      <Confetti active={party} />
      <div className="hole-hud">
        <span className="hole-level">{t('hole.level')} {level}</span>
        <span className="hole-size">📏 {hud.size}</span>
        <span className="hole-targets">
          {targets.map((tgt, i) => (
            <span key={i} className={`hole-tgt ${tgt.got >= tgt.need ? 'ok' : ''}`}>
              {tgt.icon}<b>{Math.max(0, tgt.need - tgt.got)}</b>
            </span>
          ))}
        </span>
      </div>
      <div className="hole3d-wrap">
        <div className="hole3d-canvas" ref={mountRef} />
        <div className="hole-arrow" ref={arrowRef} aria-hidden="true"><span className="arr-tip" /></div>
        {done && (
          <div className="hole-done">
            <p>🎉 {t('hole.done')}</p>
            <button className="big-button" onClick={() => { playPop(); setParty(false); setLevel((n) => n + 1) }}>
              ➡️ {t('hole.next')}
            </button>
          </div>
        )}
      </div>
      <p className="sport-hint">{t('hole.hint')}</p>
    </GameShell>
  )
}
