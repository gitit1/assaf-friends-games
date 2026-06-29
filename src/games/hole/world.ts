import * as THREE from 'three'
import { buildFriend3D } from '../../components/buildFriend3D'
import { friendColor, friendNumber } from '../../friends'

// Themed WORLDS for the swallow game. Every prop is MODELLED to be recognisable
// (real cupcakes/donuts/lollipops/cars/people — colour-blocked, distinctive
// geometry, not generic blobs), laid out as a DESIGNED bounded place: a winding
// breadcrumb PATH (objects grow in size along it) + zone clusters + a landmark.
// Candy City for the early levels, a real City after. Friends appear in-world as
// 3D characters and billboard signs, swallowable by size.

export type PropMaker = () => THREE.Group
export type World = { id: string; sky: string; ground: string; tiers: PropMaker[][]; icons: string[]; landmark: PropMaker; movers: PropMaker[] }

const lam = (c: THREE.ColorRepresentation) => new THREE.MeshLambertMaterial({ color: c })
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
// primitive helpers (geometry + colour + position) — the building blocks
const box = (w: number, h: number, d: number, c: THREE.ColorRepresentation, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c)); o.position.set(x, y, z); return o }
const cyl = (rt: number, rb: number, h: number, c: THREE.ColorRepresentation, x = 0, y = 0, z = 0, s = 14) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), lam(c)); o.position.set(x, y, z); return o }
const sph = (r: number, c: THREE.ColorRepresentation, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), lam(c)); o.position.set(x, y, z); return o }
const con = (r: number, h: number, c: THREE.ColorRepresentation, x = 0, y = 0, z = 0, s = 14) => { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, s), lam(c)); o.position.set(x, y, z); return o }
const tor = (r: number, t: number, c: THREE.ColorRepresentation, s = 18) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, s), lam(c))
function shadow(r: number) { const s = new THREE.Mesh(new THREE.CircleGeometry(r, 18), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.22 })); s.rotation.x = -Math.PI / 2; s.position.y = 0.02; return s }
function grp(r: number, spin: boolean, ...parts: THREE.Object3D[]) { const g = new THREE.Group(); g.add(shadow(r)); parts.forEach((p) => g.add(p)); if (spin) g.rotation.y = Math.random() * Math.PI * 2; return g }

// ---------- CANDY world ----------
const CANDY = ['#ff5d8f', '#ffcf3f', '#5ec8ff', '#a07bff', '#5fd98a', '#ff944d', '#ff6b6b']
const gummybear = () => { const c = pick(CANDY); const body = sph(0.34, c, 0, 0.46); body.scale.set(0.9, 1.1, 0.7); const head = sph(0.24, c, 0, 0.92); const g = grp(0.4, true, body, head); for (const x of [-0.16, 0.16]) g.add(sph(0.09, c, x, 1.12)); for (const x of [-0.34, 0.34]) g.add(sph(0.13, c, x, 0.55)); for (const x of [-0.18, 0.18]) g.add(sph(0.14, c, x, 0.18)); for (const x of [-0.08, 0.08]) g.add(sph(0.035, '#2a1020', x, 0.95, 0.2)); return g }
const cookie = () => { const base = cyl(0.5, 0.5, 0.18, '#d6a464', 0, 0.32, 0, 18); const g = grp(0.5, true, base); for (let i = 0; i < 6; i++) g.add(sph(0.07, '#4a2a10', (Math.random() - 0.5) * 0.72, 0.42, (Math.random() - 0.5) * 0.72)); return g }
const wrapped = () => { const c = pick(CANDY); const body = cyl(0.24, 0.24, 0.42, c, 0, 0.3, 0, 12); body.rotation.z = Math.PI / 2; const l = con(0.22, 0.3, c, -0.4, 0.3, 0); l.rotation.z = Math.PI / 2; const r = con(0.22, 0.3, c, 0.4, 0.3, 0); r.rotation.z = -Math.PI / 2; return grp(0.45, true, body, l, r) }
const lollipop = () => { const c = pick(CANDY); const stick = cyl(0.05, 0.05, 1.15, '#fff', 0, 0.57, 0, 6); const head = cyl(0.44, 0.44, 0.14, c, 0, 1.25, 0, 22); head.rotation.x = Math.PI / 2; const swirl = tor(0.27, 0.05, '#fff', 18); swirl.position.set(0, 1.25, 0.09); const swirl2 = tor(0.14, 0.05, c, 14); swirl2.position.set(0, 1.25, 0.1); return grp(0.42, false, stick, head, swirl, swirl2) }
const cupcake = () => { const c = pick(CANDY); const wrap = cyl(0.42, 0.3, 0.52, '#caa05a', 0, 0.26); const g = grp(0.45, true, wrap); for (let i = 0; i < 5; i++) g.add(box(0.05, 0.5, 0.05, '#b07f3a', Math.cos((i / 5) * 6.28) * 0.34, 0.26, Math.sin((i / 5) * 6.28) * 0.34)); g.add(sph(0.42, c, 0, 0.64)); g.add(sph(0.32, c, 0, 0.9)); g.add(sph(0.22, c, 0, 1.12)); g.add(sph(0.11, '#e22', 0, 1.3)); return g }
const donut = () => { const c = pick(CANDY); const base = tor(0.42, 0.2, '#e0b070'); base.rotation.x = -Math.PI / 2; base.position.y = 0.32; const ice = tor(0.42, 0.21, c); ice.rotation.x = -Math.PI / 2; ice.position.y = 0.4; const g = grp(0.55, true, base, ice); for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28; g.add(box(0.05, 0.13, 0.05, pick(CANDY), Math.cos(a) * 0.42, 0.5, Math.sin(a) * 0.42)) } return g }
const candycane = () => { const g = grp(0.25, false); for (let i = 0; i < 6; i++) g.add(cyl(0.14, 0.14, 0.32, i % 2 ? '#fff' : '#e22', 0, 0.18 + i * 0.31, 0, 10)); const hook = tor(0.27, 0.14, '#e22', 12); hook.rotation.set(Math.PI / 2, 0, 0); hook.position.set(0.27, 1.86, 0); const hook2 = tor(0.27, 0.141, '#fff', 12); hook2.rotation.set(Math.PI / 2, 0.5, 0); hook2.position.set(0.27, 1.86, 0); g.add(hook, hook2); return g }
const icecream = () => { const cone = con(0.34, 0.85, '#e0a866', 0, 0.42, 0, 14); cone.rotation.x = Math.PI; const s1 = sph(0.37, pick(CANDY), 0, 0.95); const s2 = sph(0.29, pick(CANDY), 0, 1.32); const cherry = sph(0.1, '#e22', 0, 1.6); return grp(0.4, true, cone, s1, s2, cherry) }
const cakeSlice = () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1.1, 0); s.lineTo(0, 1.1); s.lineTo(0, 0); const geo = new THREE.ExtrudeGeometry(s, { depth: 0.7, bevelEnabled: false }); const cake = new THREE.Mesh(geo, lam('#ffe6b0')); cake.rotation.x = -Math.PI / 2; cake.position.set(-0.4, 0.05, 0.35); const top = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false }), lam(pick(CANDY))); top.rotation.x = -Math.PI / 2; top.position.set(-0.4, 0.75, 0.35); return grp(0.7, true, cake, top, sph(0.1, '#e22', -0.15, 0.95, 0.15)) }
const bigCake = () => { const g = grp(1.2, true, cyl(1.15, 1.25, 0.7, '#fff0c8', 0, 0.35), cyl(0.75, 0.85, 0.6, pick(CANDY), 0, 0.95)); g.add(tor(1.1, 0.12, pick(CANDY))).children.at(-1)!.position.y = 0.7; for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28; g.add(cyl(0.05, 0.05, 0.4, '#fffae0', Math.cos(a) * 0.5, 1.45, Math.sin(a) * 0.5, 6)); g.add(sph(0.06, '#ff9', Math.cos(a) * 0.5, 1.7, Math.sin(a) * 0.5)) } return g }
const gingerbreadHouse = () => { const g = grp(2.0, false, box(2.4, 2, 2.4, '#b5743a', 0, 1)); const roof = con(1.95, 1.3, '#fff7e8', 0, 2.7, 0, 4); roof.rotation.y = Math.PI / 4; g.add(roof); g.add(box(0.7, 1.1, 0.12, '#7a4a22', 0, 0.55, 1.21)); for (const x of [-0.7, 0.7]) g.add(box(0.5, 0.5, 0.08, '#bfe3ff', x, 1.3, 1.21)); for (let i = 0; i < 8; i++) g.add(sph(0.12, pick(CANDY), (Math.random() - 0.5) * 2.2, 0.5 + Math.random() * 1.6, 1.23)); return g }

// ---------- CITY world ----------
const ROOF = ['#e05a5a', '#5aa0e0', '#67c07a', '#e0a94a', '#a07bd0']
const SHIRT = ['#e0524a', '#4a90e0', '#67b07a', '#e0b24a', '#9b6ad0', '#e07ab0']
const cone = () => { const c = con(0.3, 0.72, '#ff7a1a', 0, 0.4, 0, 12); const st = tor(0.22, 0.05, '#fff', 12); st.rotation.x = -Math.PI / 2; st.position.y = 0.45; return grp(0.35, false, box(0.6, 0.08, 0.6, '#ff7a1a', 0, 0.04), c, st) }
const hydrant = () => grp(0.3, true, cyl(0.2, 0.22, 0.5, '#e22', 0, 0.3), sph(0.2, '#e22', 0, 0.6), cyl(0.08, 0.08, 0.34, '#c11', 0.22, 0.42, 0, 8), box(0.5, 0.07, 0.5, '#888', 0, 0.04))
const trashcan = () => grp(0.28, true, cyl(0.24, 0.2, 0.6, '#5a7a64', 0, 0.32), cyl(0.27, 0.27, 0.08, '#3a5a4a', 0, 0.64), box(0.18, 0.07, 0.05, '#3a5a4a', 0, 0.72))
const person = () => { const sh = pick(SHIRT); const g = grp(0.32, true); for (const x of [-0.11, 0.11]) g.add(cyl(0.1, 0.1, 0.5, '#3a4a66', x, 0.27)); g.add(cyl(0.21, 0.17, 0.52, sh, 0, 0.79)); for (const x of [-0.27, 0.27]) g.add(cyl(0.07, 0.07, 0.44, sh, x, 0.82)); g.add(sph(0.2, '#f6c79c', 0, 1.2)); g.add(sph(0.22, pick(['#5a3a22', '#2a2a2a', '#8a5a30']), 0, 1.3)); return g }
const dog = () => { const c = pick(['#9c6b3f', '#caa06a', '#5a4a3a', '#222']); const body = cyl(0.18, 0.18, 0.6, c, 0, 0.4); body.rotation.z = Math.PI / 2; const head = sph(0.2, c, 0.42, 0.5); const snout = box(0.18, 0.14, 0.16, c, 0.58, 0.46); const g = grp(0.4, true, body, head, snout); for (const [x, z] of [[-0.2, 0.13], [-0.2, -0.13], [0.2, 0.13], [0.2, -0.13]] as const) g.add(cyl(0.06, 0.06, 0.3, c, x, 0.16, z, 6)); g.add(cyl(0.05, 0.04, 0.3, c, -0.4, 0.5, 0, 6)); return g }
const bench = () => { const g = grp(0.7, true, box(1.3, 0.12, 0.42, '#9c6b3f', 0, 0.46), box(1.3, 0.42, 0.1, '#9c6b3f', 0, 0.7, -0.18)); for (const x of [-0.5, 0.5]) g.add(box(0.1, 0.46, 0.42, '#666', x, 0.23)); return g }
const lamppost = () => grp(0.3, false, cyl(0.07, 0.1, 2.2, '#5a6472', 0, 1.1), box(0.5, 0.08, 0.08, '#5a6472', 0.2, 2.15), sph(0.16, '#ffe9a0', 0.45, 2.13))
const mailbox = () => grp(0.3, true, cyl(0.06, 0.06, 0.75, '#555', 0, 0.38), box(0.42, 0.32, 0.52, '#3a6ad0', 0, 0.86), box(0.06, 0.18, 0.06, '#e22', 0.24, 0.95))
const bush = () => { const g = grp(0.45, true); for (let i = 0; i < 3; i++) g.add(sph(0.32 - i * 0.04, '#4a9a4a', (Math.random() - 0.5) * 0.4, 0.32 + Math.random() * 0.2, (Math.random() - 0.5) * 0.4)); return g }
const car = () => { const c = pick(ROOF); const g = grp(0.9, true, box(1.8, 0.44, 0.86, c, 0, 0.42), box(0.95, 0.4, 0.76, c, -0.05, 0.82), box(0.86, 0.3, 0.8, '#9fd6f0', -0.05, 0.82)); for (const [x, z] of [[-0.56, 0.46], [0.56, 0.46], [-0.56, -0.46], [0.56, -0.46]] as const) { const w = cyl(0.21, 0.21, 0.18, '#222', x, 0.21, z, 14); w.rotation.x = Math.PI / 2; g.add(w) } g.add(sph(0.08, '#ffe', 0.9, 0.42, 0.28)); g.add(sph(0.08, '#ffe', 0.9, 0.42, -0.28)); return g }
const tree = () => grp(0.7, true, cyl(0.18, 0.26, 1, '#8a5a30', 0, 0.5), sph(0.72, '#3f9a55', 0, 1.45), sph(0.52, '#4aaa62', 0.1, 1.95))
const bus = () => { const c = pick(['#e0a83a', '#e05a5a', '#5aa0e0']); const g = grp(1.4, true, box(3.2, 1.2, 1.1, c, 0, 0.95), box(3.05, 0.44, 1.12, '#bfe3ff', 0.05, 1.2), box(0.12, 0.7, 1.12, c, 1.57, 0.85)); for (const x of [-1.0, 1.0]) for (const z of [0.5, -0.5]) { const w = cyl(0.3, 0.3, 0.16, '#222', x, 0.3, z, 14); w.rotation.x = Math.PI / 2; g.add(w) } return g }
const house = () => { const g = grp(1.6, true, box(2, 1.5, 2, '#efe2c8', 0, 0.75)); const roof = con(1.6, 1.05, pick(ROOF), 0, 2.02, 0, 4); roof.rotation.y = Math.PI / 4; g.add(roof); g.add(box(0.55, 0.95, 0.1, '#7a4a22', 0, 0.48, 1.01)); for (const x of [-0.55, 0.55]) g.add(box(0.42, 0.42, 0.06, '#9fd6f0', x, 1.0, 1.01)); return g }
const building = () => { const h = 4 + Math.random() * 2.5; const c = pick(['#9fb0c4', '#c4b89f', '#b0a0c0', '#a0c0b0']); const g = grp(2.0, false, box(2.4, h, 2.4, c, 0, h / 2)); for (let r = 0; r < Math.floor(h / 1.0); r++) for (let cc = -1; cc <= 1; cc++) g.add(box(0.45, 0.6, 0.06, '#3a4a66', cc * 0.7, 0.85 + r * 1.0, 1.21)); g.add(box(0.7, 1, 0.06, '#5a4a3a', 0, 0.5, 1.21)); return g }

// ---------- special objects (world-agnostic) ----------
// a wrapped PRESENT — swallow it and a friend pops out (a happy surprise)
const gift = () => { const c = pick(['#ff5d8f', '#5ec8ff', '#a07bff', '#5fd98a', '#ff944d']); const g = grp(0.5, false, box(0.72, 0.7, 0.72, c, 0, 0.37)); g.add(box(0.14, 0.72, 0.74, '#fff', 0, 0.37)); g.add(box(0.74, 0.72, 0.14, '#fff', 0, 0.37)); g.add(sph(0.12, '#fff', 0, 0.78)); for (const x of [-0.17, 0.17]) { const lo = sph(0.12, '#fff', x, 0.8); lo.scale.set(1.4, 0.7, 0.7); g.add(lo) } return g }
export { gift, friendNpc }

export const WORLDS: World[] = [
  { id: 'candy', sky: '#ffdcef', ground: '#f2b6db', tiers: [[gummybear, cookie, wrapped], [lollipop, cupcake, donut, candycane], [icecream, cakeSlice], [bigCake]], icons: ['🍬', '🍭', '🍦', '🎂'], landmark: gingerbreadHouse, movers: [gummybear, gummybear, wrapped] },
  { id: 'city', sky: '#bcd6ef', ground: '#9aa9ba', tiers: [[cone, hydrant, trashcan, person, dog], [bench, lamppost, mailbox, bush], [car, tree], [bus, house]], icons: ['🚧', '🧍', '🚗', '🚌'], landmark: building, movers: [person, person, dog] },
]

export function worldForLevel(n: number): World { return WORLDS[Math.floor((n - 1) / 10) % WORLDS.length] }

// a dramatic SIZE LADDER: each tier ~2x the previous, so un-eatable things tower.
// TIER_SIZE = nominal footprint (the eat gate); TIER_SCALE = visual scale applied.
export const TIER_SIZE = [0.6, 1.3, 2.6, 5.5]
export const TIER_SCALE = [0.5, 1.0, 1.9, 3.2]
export const LANDMARK_SIZE = 9
export const LANDMARK_SCALE = 3.4
// the BOSS finale: one enormous friendly object you grow big enough to swallow last
export const BOSS_SIZE = 12
export const BOSS_SCALE = 5.5

// ---------- friends in the world ----------
function numberTexture(n: number, bg: string) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128
  const x = c.getContext('2d')!; x.fillStyle = bg; x.fillRect(0, 0, 128, 128)
  x.fillStyle = '#fff'; x.font = 'bold 84px Fredoka, Heebo, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 64, 72)
  return new THREE.CanvasTexture(c)
}
function friendBillboard(index: number): THREE.Group {
  const post = cyl(0.08, 0.08, 1.4, '#6b4a2a', 0, 0.7)
  const tex = numberTexture(friendNumber(index), friendColor(index))
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.12), [lam(friendColor(index)), lam(friendColor(index)), lam(friendColor(index)), lam(friendColor(index)), new THREE.MeshBasicMaterial({ map: tex }), new THREE.MeshBasicMaterial({ map: tex })])
  panel.position.y = 2.1
  return grp(0.5, false, post, panel)
}
function friendNpc(index: number): THREE.Group {
  const rig = buildFriend3D(index); const g = new THREE.Group(); g.add(shadow(0.7))
  rig.group.scale.multiplyScalar(0.5); rig.group.position.y = 1.0; g.add(rig.group); g.rotation.y = Math.random() * Math.PI * 2; return g
}

// ---------- level layout: a bounded place with a winding breadcrumb PATH ----------
export type Spec = { x: number; z: number; tier: number; baseY: number; make: PropMaker; landmark?: boolean; mover?: boolean; kind?: 'gift' | 'ice' | 'boss'; friend?: number }
export type Target = { tier: number; icon: string; need: number; got: number }
export type Layout = { specs: Spec[]; targets: Target[]; world: World; bound: number; road: THREE.CatmullRomCurve3 }

export function buildLayout(n: number, maxFriend: number): Layout {
  const world = worldForLevel(n)
  const within = ((n - 1) % 10) + 1
  const maxTier = Math.min(world.tiers.length, 2 + Math.floor((within - 1) / 3))
  const bound = 13 + within * 0.9 // COMPACT — a packed little world, not a vast field
  const specs: Spec[] = []
  const place = (x: number, z: number, tier: number, baseY = 0, make?: PropMaker, landmark = false) => {
    if (Math.hypot(x, z) < 3) return // small clear spawn zone
    const t = Math.min(tier, world.tiers.length)
    specs.push({ x, z, tier: t, baseY, landmark, make: make ?? pick(world.tiers[t - 1]) })
  }

  // a winding ROAD from near the spawn, outward and around the compact area
  const ctrl: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)]
  const turns = 5 + (within % 3)
  let a0 = Math.random() * 6.28
  for (let i = 1; i <= turns; i++) { a0 += 1.5 + Math.random() * 1.1; const r = (i / turns) * bound * 0.92; ctrl.push(new THREE.Vector3(Math.cos(a0) * r, 0, Math.sin(a0) * r)) }
  const road = new THREE.CatmullRomCurve3(ctrl)

  // DENSELY line the road (breadcrumb: tier grows along it), with STACKS as payoffs
  const along = 72 + within * 6
  for (let i = 0; i < along; i++) {
    const t = i / (along - 1)
    const p = road.getPoint(t)
    const tier = Math.max(1, Math.min(maxTier, 1 + Math.floor(t * maxTier + Math.random() * 0.6)))
    place(p.x + (Math.random() - 0.5) * 3, p.z + (Math.random() - 0.5) * 3, tier)
    if (Math.random() < 0.5) place(p.x + (Math.random() - 0.5) * 3.6, p.z + (Math.random() - 0.5) * 3.6, Math.max(1, tier - 1))
    if (i % 9 === 4) { // a TOWER of one object (stack), every so often
      const st = 3 + Math.floor(Math.random() * 4), tt = Math.min(tier, 2), mk = pick(world.tiers[tt - 1]), step = tt <= 1 ? 0.95 : 1.35
      for (let s = 0; s < st; s++) place(p.x, p.z, tt, s * step, mk)
    }
  }

  // fill the rest of the compact area densely (Vogel) so the WHOLE view is packed
  const fill = 55 + within * 4
  const g = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < fill; i++) { const r = 3 + Math.sqrt((i + 1) / fill) * bound; const a = i * g; const rad = Math.min(1, r / bound); const tier = Math.max(1, Math.min(maxTier, 1 + Math.floor(rad * maxTier * 0.8 + Math.random() * 0.6))); place(Math.cos(a) * r, Math.sin(a) * r, tier) }

  // a towering landmark mid-road, and the BOSS — an enormous friendly thing at the
  // very end you finally grow big enough to swallow (the satisfying capstone)
  const lp = road.getPoint(0.62); place(lp.x, lp.z, world.tiers.length, 0, world.landmark, true)
  const bp = road.getPoint(1.0); specs.push({ x: bp.x, z: bp.z, tier: world.tiers.length, baseY: 0, kind: 'boss', make: world.landmark })

  // a LIVING world: wandering critters (gummy bears / people / dogs) you chase
  const nMov = 10 + within * 2
  for (let i = 0; i < nMov; i++) {
    const p = road.getPoint(Math.random())
    const x = p.x + (Math.random() - 0.5) * bound * 0.5, z = p.z + (Math.random() - 0.5) * bound * 0.5
    if (Math.hypot(x, z) < 3) continue
    specs.push({ x, z, tier: 1, baseY: 0, mover: true, make: pick(world.movers) })
  }

  // SPECIAL objects: gifts (swallow → a friend pops out) + ice (linger to melt, then eat)
  const nGift = 2 + Math.floor(within / 4)
  for (let i = 0; i < nGift; i++) { const p = road.getPoint(0.12 + Math.random() * 0.82); const x = p.x + (Math.random() - 0.5) * 4, z = p.z + (Math.random() - 0.5) * 4; if (Math.hypot(x, z) < 3) continue; specs.push({ x, z, tier: 1, baseY: 0, kind: 'gift', make: gift }) }
  const nIce = 1 + Math.floor(within / 4)
  for (let i = 0; i < nIce; i++) { const p = road.getPoint(0.3 + Math.random() * 0.6); const x = p.x + (Math.random() - 0.5) * 5, z = p.z + (Math.random() - 0.5) * 5; if (Math.hypot(x, z) < 4) continue; specs.push({ x, z, tier: 2, baseY: 0, kind: 'ice', make: pick(world.tiers[1]) }) }

  // friends in the world: 3D characters (NPCs) + billboard signs
  const nf = 2 + Math.floor(within / 4)
  const npcMax = Math.min(maxFriend, 100)
  for (let i = 0; i < nf; i++) {
    const p = road.getPoint(0.2 + Math.random() * 0.7); const off = () => (Math.random() - 0.5) * 4
    const x = p.x + off(), z = p.z + off()
    if (Math.hypot(x, z) < 3) continue
    if (i % 2 === 0 && npcMax > 11) { const fi = 10 + Math.floor(Math.random() * (npcMax - 10)); specs.push({ x, z, tier: 3, baseY: 0, friend: fi, make: () => friendNpc(fi) }) }
    else { const fi = Math.floor(Math.random() * Math.max(1, maxFriend)); specs.push({ x, z, tier: 2, baseY: 0, friend: fi, make: () => friendBillboard(fi) }) }
  }

  // collect MANY of 1–2 abundant types (a satisfying sweep, not a hunt for 5)
  const nT = Math.min(2, 1 + Math.floor((within - 1) / 4))
  const tiers = Array.from({ length: maxTier }, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, nT)
  const targets: Target[] = tiers.map((t) => ({ tier: t, icon: world.icons[t - 1], need: 12 + within * 2, got: 0 }))
  return { specs, targets, world, bound, road }
}
