import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import GameShell from './GameShell'
import { playFriend, playSuccess, unlockAudio } from '../audio'
import { playClip } from '../voice'

// A first experiment in 3D: friend #1 (לולו) built from Three.js primitives — a
// round red blob with a face, a bow, arms, hands and feet. It idles with a gentle
// breathing bob (you can also drag to spin it), and the buttons play *real*
// animations: a squash-and-stretch jump, a raised-hand high-five (כיף), and a
// lean-in arms-wrap hug (חיבוק). No timer, calm motion, sound can be muted.
type ActionName = 'idle' | 'jump' | 'five' | 'hug'

export default function Friend3D({ onExit }: { onExit: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const actionRef = useRef<{ name: ActionName; until: number }>({ name: 'idle', until: 0 })

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const W = () => mount.clientWidth || 320
    const H = () => mount.clientHeight || 360

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#eaf2fb')
    const camera = new THREE.PerspectiveCamera(45, W() / H(), 0.1, 100)
    camera.position.set(0, 0.2, 5.4)
    camera.lookAt(0, 0.05, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W(), H())
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.85))
    const key = new THREE.DirectionalLight(0xffffff, 0.95)
    key.position.set(3, 5, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.3)
    fill.position.set(-3, 1, 3)
    scene.add(fill)

    const RED = 0xef4444
    const mat = (c: number, roughness = 0.55) =>
      new THREE.MeshStandardMaterial({ color: c, roughness, metalness: 0 })

    const lulu = new THREE.Group()
    scene.add(lulu)

    // body
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 48), mat(RED))
    body.scale.set(1, 0.92, 1)
    lulu.add(body)

    // eyes (white domes + pupils), poking out the front
    const whiteMat = mat(0xffffff, 0.3)
    const blackMat = mat(0x141414, 0.3)
    const makeEye = (x: number) => {
      const g = new THREE.Group()
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), whiteMat)
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 18), blackMat)
      p.position.set(0, 0, 0.15)
      g.add(w, p)
      g.position.set(x, 0.2, 1.0)
      return g
    }
    lulu.add(makeEye(-0.33), makeEye(0.33))

    // smile (half torus, flipped to open upward)
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 12, 28, Math.PI), mat(0x7a1020, 0.5))
    mouth.position.set(0, -0.2, 1.0)
    mouth.rotation.z = Math.PI
    lulu.add(mouth)

    // cheeks
    const cheekMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, transparent: true, opacity: 0.55, roughness: 0.7 })
    const makeCheek = (x: number) => {
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), cheekMat)
      c.position.set(x, -0.05, 1.0)
      c.scale.set(1, 0.7, 0.4)
      return c
    }
    lulu.add(makeCheek(-0.6), makeCheek(0.6))

    // bow on top (pink loops + knot)
    const bow = new THREE.Group()
    const bowMat = mat(0xfb7185, 0.45)
    const loopGeo = new THREE.SphereGeometry(0.26, 20, 20)
    const loopL = new THREE.Mesh(loopGeo, bowMat)
    loopL.scale.set(1, 0.72, 0.42)
    loopL.position.set(-0.27, 0, 0)
    const loopR = loopL.clone()
    loopR.position.set(0.27, 0, 0)
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), mat(0xf43f5e, 0.45))
    bow.add(loopL, loopR, knot)
    bow.position.set(0, 1.06, 0.12)
    lulu.add(bow)

    // arms — a Group pivoting at the shoulder, the limb hanging down from it
    const handMat = mat(RED)
    const makeArm = (side: number) => {
      const shoulder = new THREE.Group()
      const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.66, 8, 16), mat(RED))
      limb.position.y = -0.45
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), handMat)
      hand.position.y = -0.86
      shoulder.add(limb, hand)
      shoulder.position.set(side * 0.95, 0.2, 0.12)
      return shoulder
    }
    const armL = makeArm(-1)
    const armR = makeArm(1)
    lulu.add(armL, armR)

    // feet
    const footMat = mat(0xb91c1c)
    const makeFoot = (x: number) => {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), footMat)
      f.scale.set(1, 0.6, 1.35)
      f.position.set(x, -1.04, 0.28)
      return f
    }
    lulu.add(makeFoot(-0.45), makeFoot(0.45))

    // rest pose: arms hang slightly outward
    const REST = { lx: 0, lz: 0.38, rx: 0, rz: -0.38 }
    armL.rotation.set(REST.lx, 0, REST.lz)
    armR.rotation.set(REST.rx, 0, REST.rz)

    // drag-to-spin
    const userRot = { y: 0 }
    const dragState = { active: false, lastX: 0 }
    const el = renderer.domElement
    const onDown = (e: PointerEvent) => {
      dragState.active = true
      dragState.lastX = e.clientX
      el.setPointerCapture?.(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragState.active) return
      userRot.y += (e.clientX - dragState.lastX) * 0.01
      dragState.lastX = e.clientX
    }
    const onUp = () => {
      dragState.active = false
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)

    const clock = new THREE.Clock()
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    let raf = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      const t = clock.getElapsedTime()
      const now = performance.now()
      let act = actionRef.current
      if (act.name !== 'idle' && now > act.until) {
        act = { name: 'idle', until: 0 }
        actionRef.current = act
      }

      // base idle: breathing bob + slow look-around sway (off if reduced motion)
      const sway = reduced ? 0 : Math.sin(t * 0.6) * 0.16
      const bob = reduced ? 0 : Math.sin(t * 2) * 0.05
      lulu.rotation.y = userRot.y + sway
      lulu.rotation.x = 0
      lulu.position.y = bob
      lulu.scale.set(1, 1, 1)
      const breathe = reduced ? 0 : Math.sin(t * 2) * 0.025
      body.scale.set(1 + breathe, 0.92 + breathe, 1 + breathe)

      let tLx = REST.lx
      let tLz = REST.lz
      let tRx = REST.rx
      let tRz = REST.rz

      if (act.name === 'hug') {
        // both arms swing forward + inward, body leans in and squishes warmly
        tLx = -1.2
        tLz = -0.55
        tRx = -1.2
        tRz = 0.55
        const p = Math.min(1, Math.max(0, 1 - (act.until - now) / 1600))
        const squeeze = Math.sin(p * Math.PI)
        lulu.rotation.x = 0.18 * squeeze
        lulu.scale.set(1 + 0.06 * squeeze, 1 - 0.05 * squeeze, 1 + 0.06 * squeeze)
      } else if (act.name === 'five') {
        // raise the right hand high with a little eager bounce
        const bounce = reduced ? 0 : Math.sin(t * 18) * 0.12
        tRx = -0.55
        tRz = -2.5 + bounce
      } else if (act.name === 'jump') {
        const p = Math.min(1, Math.max(0, 1 - (act.until - now) / 800))
        const h = Math.sin(p * Math.PI) // up-and-down arc
        lulu.position.y = bob + h * 1.15
        const s = 1 + h * 0.12
        lulu.scale.set(1 - h * 0.08, s, 1 - h * 0.08)
        tLz = 0.95
        tRz = -0.95
      }

      armL.rotation.x = lerp(armL.rotation.x, tLx, 0.2)
      armL.rotation.z = lerp(armL.rotation.z, tLz, 0.2)
      armR.rotation.x = lerp(armR.rotation.x, tRx, 0.2)
      armR.rotation.z = lerp(armR.rotation.z, tRz, 0.2)

      renderer.render(scene, camera)
    }
    frame()

    const onResize = () => {
      camera.aspect = W() / H()
      camera.updateProjectionMatrix()
      renderer.setSize(W(), H())
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
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
  }, [])

  const run = (name: ActionName, dur: number) => {
    unlockAudio()
    actionRef.current = { name, until: performance.now() + dur }
  }
  const jump = () => {
    run('jump', 800)
    playFriend(0)
  }
  const five = () => {
    run('five', 1200)
    playSuccess()
    playClip('fx-five', 'כיף!')
  }
  const hug = () => {
    run('hug', 1600)
    playFriend(0)
    playClip('fx-hug', 'חיבוק גדול!')
  }
  const hi = () => {
    unlockAudio()
    playClip('intro-0', 'שלום! אני לולו, אני המספר אחת!')
  }

  return (
    <GameShell title="לולו · תלת מימד" emoji="🧊" onExit={onExit}>
      <div className="three-screen">
        <div className="three-canvas" ref={mountRef} />
        <div className="world-actions">
          <button className="world-btn" onClick={hi}>
            <span className="world-btn-emoji" aria-hidden="true">🔊</span>
            <span>שלום</span>
          </button>
          <button className="world-btn" onClick={jump}>
            <span className="world-btn-emoji" aria-hidden="true">⬆️</span>
            <span>קפיצה</span>
          </button>
          <button className="world-btn" onClick={five}>
            <span className="world-btn-emoji" aria-hidden="true">✋</span>
            <span>כיף</span>
          </button>
          <button className="world-btn" onClick={hug}>
            <span className="world-btn-emoji" aria-hidden="true">🤗</span>
            <span>חיבוק</span>
          </button>
        </div>
      </div>
    </GameShell>
  )
}
