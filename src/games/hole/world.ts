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

// ---------- BEACH world ----------
const SEAC = ['#ff7a5a', '#ffb03a', '#ff5d8f', '#5ec8ff', '#5fd98a']
const seashell = () => { const c = pick(['#ffd9c0', '#ffc9e0', '#ffe6a0', '#ffe0c8']); const base = sph(0.34, c, 0, 0.26); base.scale.set(1, 0.55, 1); const g = grp(0.36, true, base); for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * 1.7; g.add(box(0.035, 0.34, 0.3, '#e8b894', Math.sin(a) * 0.24, 0.3, 0)) } return g }
const starfishB = () => { const c = pick(['#ff7a4a', '#ffae3a', '#ff6a8a']); const g = grp(0.4, true); for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283 - 1.57; const arm = con(0.18, 0.62, c, Math.cos(a) * 0.26, 0.12, Math.sin(a) * 0.26, 5); arm.rotation.set(Math.PI / 2, 0, -a); g.add(arm) } g.add(sph(0.22, c, 0, 0.13)); for (let i = 0; i < 5; i++) g.add(sph(0.03, '#fff', (Math.random() - 0.5) * 0.5, 0.2, (Math.random() - 0.5) * 0.5)); return g }
const pebbleB = () => { const o = sph(0.3, pick(['#b8b0a0', '#c8c0b0', '#a89c88', '#d0c8b8']), 0, 0.2); o.scale.set(1, 0.55, 0.78); return grp(0.3, true, o) }
const pail = () => { const c = pick(SEAC); const g = grp(0.38, true, cyl(0.36, 0.27, 0.5, c, 0, 0.3, 0, 16)); g.add(cyl(0.37, 0.37, 0.06, '#fff', 0, 0.56, 0, 16)); const h = tor(0.34, 0.025, '#e8e8e8', 12); h.position.y = 0.62; g.add(h); return g }
const beachball = () => { const g = grp(0.42, true, sph(0.42, '#fff', 0, 0.46)); for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283; const seg = box(0.05, 0.84, 0.26, pick(SEAC), Math.cos(a) * 0.36, 0.46, Math.sin(a) * 0.36); seg.rotation.y = -a; g.add(seg) } return g }
const crab = () => { const c = pick(['#ff6a4a', '#ff8050', '#e0524a']); const body = sph(0.32, c, 0, 0.3); body.scale.set(1.25, 0.7, 1); const g = grp(0.42, true, body); for (const sx of [-1, 1]) { g.add(cyl(0.05, 0.05, 0.34, c, sx * 0.42, 0.3, 0.06, 6)); const claw = sph(0.13, c, sx * 0.56, 0.3, 0.18); claw.scale.set(1, 0.7, 1.2); g.add(claw) } for (const sx of [-0.13, 0.13]) { g.add(cyl(0.025, 0.025, 0.16, c, sx, 0.5, 0.22, 4)); g.add(sph(0.06, '#fff', sx, 0.58, 0.22)); g.add(sph(0.03, '#111', sx, 0.59, 0.27)) } for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) { const leg = cyl(0.03, 0.03, 0.22, c, sx * 0.34, 0.16, -0.16 + i * 0.14, 4); leg.rotation.z = sx * 0.5; g.add(leg) } return g }
const sandcastle = () => { const c = '#e8c890'; const g = grp(0.7, true, box(1.2, 0.65, 1.2, c, 0, 0.33)); for (const [x, z] of [[-0.48, -0.48], [0.48, -0.48], [-0.48, 0.48], [0.48, 0.48]] as const) { g.add(cyl(0.2, 0.22, 0.85, c, x, 0.42, z, 8)); g.add(con(0.22, 0.32, pick(SEAC), x, 1.0, z, 8)) } g.add(box(0.32, 0.5, 0.08, '#9c7848', 0, 0.25, 0.61)); g.add(con(0.16, 0.6, c, 0, 0.95, 0, 8)); return g }
const umbrella = () => { const c = pick(SEAC); const g = grp(0.6, false, cyl(0.035, 0.035, 1.7, '#f0f0f0', 0, 0.85, 0, 6)); g.add(con(1.0, 0.55, c, 0, 1.55, 0, 14)); g.add(sph(0.08, '#fff', 0, 1.85)); return g }
const boat = () => { const c = pick(['#e0524a', '#4a90e0', '#e0a94a']); const g = grp(0.9, false, box(1.5, 0.42, 0.7, c, 0, 0.4)); g.add(box(1.55, 0.1, 0.78, '#8a5a30', 0, 0.62)); g.add(cyl(0.04, 0.04, 1.3, '#9c6b3f', 0, 1.25, 0, 6)); g.add(box(0.05, 0.85, 0.62, '#fff', 0.22, 1.25, 0)); g.add(box(0.04, 0.22, 0.3, '#e0524a', -0.02, 1.7, 0)); return g }
const lighthouse = () => { const g = grp(1.3, false, cyl(0.9, 1.2, 3.4, '#fff', 0, 1.7, 0, 16)); for (let i = 0; i < 3; i++) g.add(cyl(0.92 - i * 0.06, 1.05 - i * 0.06, 0.45, '#e0524a', 0, 0.55 + i * 1.15, 0, 16)); g.add(cyl(0.85, 0.85, 0.5, '#ffe9a0', 0, 3.65, 0, 12)); g.add(con(0.95, 0.7, '#3a4452', 0, 4.25, 0, 12)); return g }

// ---------- SPACE world ----------
const moonrock = () => { const o = sph(0.32, pick(['#9aa0b0', '#b0b4c0', '#888c98']), 0, 0.26); o.scale.set(1, 0.85, 0.9); const g = grp(0.32, true, o); for (let i = 0; i < 3; i++) { const cr = sph(0.07, '#70747e', (Math.random() - 0.5) * 0.4, 0.42, (Math.random() - 0.5) * 0.4); cr.scale.y = 0.4; g.add(cr) } return g }
const spacestar = () => { const c = pick(['#ffe066', '#ffd23a', '#fff0a0']); const g = grp(0.34, true); for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283 - 1.57; const arm = con(0.13, 0.42, c, Math.cos(a) * 0.2, 0.2, Math.sin(a) * 0.2, 4); arm.rotation.set(Math.PI / 2, 0, -a); g.add(arm) } g.add(sph(0.16, c, 0, 0.2)); return g }
const bolt = () => grp(0.24, true, cyl(0.1, 0.1, 0.38, '#c0c4d0', 0, 0.27, 0, 6), cyl(0.18, 0.18, 0.13, '#9aa0b0', 0, 0.5, 0, 6))
const satellite = () => { const c = '#c8ccd8'; const g = grp(0.45, true, box(0.42, 0.42, 0.5, c, 0, 0.5)); for (const sx of [-1, 1]) g.add(box(0.7, 0.03, 0.42, '#3a6ad0', sx * 0.62, 0.5, 0)); g.add(cyl(0.02, 0.02, 0.4, c, 0, 0.85, 0, 4)); g.add(sph(0.12, '#9fd6f0', 0, 1.02)); return g }
const alien = () => { const c = pick(['#7fd86a', '#6ad8c0', '#b88aff']); const body = sph(0.24, c, 0, 0.5); body.scale.set(0.9, 1.1, 0.9); const head = sph(0.22, c, 0, 0.82); const g = grp(0.32, true, body, head); for (const sx of [-0.09, 0.09]) { const eye = sph(0.08, '#111', sx, 0.86, 0.16); eye.scale.set(1, 1.4, 1); g.add(eye) } for (const sx of [-0.24, 0.24]) g.add(cyl(0.045, 0.045, 0.34, c, sx, 0.5, 0, 5)); g.add(cyl(0.02, 0.02, 0.16, c, 0, 1.04, 0, 4)); g.add(sph(0.05, '#ff5d8f', 0, 1.15)); return g }
const crystal = () => { const c = pick(['#9ad8ff', '#c0a0ff', '#ff9ad8', '#9affc0']); const g = grp(0.3, true); for (let i = 0; i < 4; i++) { const h = 0.45 + Math.random() * 0.45; g.add(con(0.11, h, c, (Math.random() - 0.5) * 0.34, h / 2, (Math.random() - 0.5) * 0.34, 5)) } return g }
const rover = () => { const c = '#d4d8e0'; const g = grp(0.55, true, box(0.85, 0.28, 0.55, c, 0, 0.42)); for (const [x, z] of [[-0.34, 0.3], [0.34, 0.3], [-0.34, -0.3], [0.34, -0.3]] as const) { const w = cyl(0.15, 0.15, 0.13, '#333', x, 0.18, z, 10); w.rotation.x = Math.PI / 2; g.add(w) } g.add(box(0.4, 0.02, 0.36, '#3a6ad0', -0.05, 0.58, 0)); g.add(cyl(0.02, 0.02, 0.3, c, 0.3, 0.7, 0, 4)); g.add(sph(0.09, '#9fd6f0', 0.3, 0.86)); return g }
const capsule = () => { const c = '#e0e4ec'; const g = grp(0.55, false, cyl(0.42, 0.54, 1.0, c, 0, 0.6, 0, 14), con(0.42, 0.5, '#e0524a', 0, 1.35, 0, 14)); g.add(cyl(0.55, 0.55, 0.08, '#3a4452', 0, 0.42, 0, 14)); g.add(sph(0.15, '#3a4452', 0, 0.72, 0.42)); return g }
const rocketS = () => { const c = '#eef0f4'; const g = grp(0.7, false, cyl(0.5, 0.62, 2.4, c, 0, 1.5, 0, 16), con(0.5, 0.85, '#e0524a', 0, 3.1, 0, 16)); for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283; g.add(box(0.1, 0.6, 0.4, '#e0524a', Math.cos(a) * 0.56, 0.45, Math.sin(a) * 0.56)) } g.add(sph(0.2, '#9fd6f0', 0, 2.0)); g.add(con(0.46, 0.5, '#ffb03a', 0, 0.08, 0, 12)); return g }
const spacestation = () => { const c = '#c8ccd8'; const g = grp(1.3, false, cyl(0.62, 0.8, 3.3, c, 0, 1.65, 0, 16)); for (const y of [0.7, 1.6, 2.6]) { const ring = tor(1.0, 0.16, '#a8aec0', 16); ring.position.y = y; ring.rotation.x = Math.PI / 2; g.add(ring) } g.add(con(0.8, 0.95, '#3a4452', 0, 3.75, 0, 12)); g.add(sph(0.34, '#9fd6f0', 0, 3.15)); for (const sx of [-1, 1]) { g.add(cyl(0.06, 0.06, 0.55, c, sx * 0.55, 1.65, 0, 5)); g.add(box(0.55, 0.55, 0.05, '#3a6ad0', sx * 0.95, 1.65, 0)) } return g }

// ---------- FARM world ----------
const carrot = () => { const c = con(0.18, 0.7, '#ff8c2a', 0, 0.35, 0, 8); c.rotation.x = Math.PI; const g = grp(0.3, true, c); for (let i = 0; i < 3; i++) g.add(box(0.05, 0.32, 0.05, '#4aaa55', (i - 1) * 0.08, 0.8, 0)); return g }
const egg = () => { const e = sph(0.26, '#fff5e0', 0, 0.3); e.scale.set(1, 1.3, 1); return grp(0.28, true, e) }
const chick = () => { const c = '#ffd23a'; const g = grp(0.3, true, sph(0.26, c, 0, 0.3), sph(0.18, c, 0, 0.6)); g.add(con(0.06, 0.14, '#ff8c2a', 0, 0.6, 0.2, 6)); for (const sx of [-0.07, 0.07]) g.add(sph(0.03, '#111', sx, 0.64, 0.15)); for (const sx of [-0.1, 0.1]) g.add(cyl(0.02, 0.02, 0.12, '#ff8c2a', sx, 0.06, 0, 4)); return g }
const haybale = () => { const c = cyl(0.45, 0.45, 0.72, '#e0c060', 0, 0.45, 0, 14); c.rotation.z = Math.PI / 2; const g = grp(0.5, true, c); for (let i = 0; i < 3; i++) { const band = cyl(0.46, 0.46, 0.03, '#c0a040', 0, 0.45, 0, 14); band.rotation.z = Math.PI / 2; band.position.x = -0.28 + i * 0.28; g.add(band) } return g }
const chicken = () => { const c = '#fff'; const body = sph(0.32, c, 0, 0.42); body.scale.set(1, 1.1, 1.2); const g = grp(0.36, true, body, sph(0.2, c, 0.04, 0.78)); g.add(con(0.07, 0.16, '#ff8c2a', 0.04, 0.78, 0.24, 6)); g.add(box(0.04, 0.16, 0.14, '#e0524a', 0.04, 0.95, 0.02)); for (const sx of [-0.08, 0.08]) g.add(sph(0.028, '#111', 0.06, 0.82, sx)); for (const sx of [-0.12, 0.12]) g.add(cyl(0.025, 0.025, 0.18, '#ff8c2a', sx, 0.1, 0, 4)); g.add(con(0.18, 0.4, c, -0.34, 0.55, 0, 5)); return g }
const sheep = () => { const w = '#f0f0f0'; const g = grp(0.5, true); for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; g.add(sph(0.26, w, Math.cos(a) * 0.22, 0.55, Math.sin(a) * 0.16)) } g.add(sph(0.3, w, 0, 0.6)); g.add(sph(0.17, '#3a3a3a', 0, 0.6, 0.34)); for (const sx of [-0.07, 0.07]) g.add(sph(0.03, '#fff', sx, 0.66, 0.48)); for (const [x, z] of [[-0.16, 0.13], [0.16, 0.13], [-0.16, -0.13], [0.16, -0.13]] as const) g.add(cyl(0.05, 0.05, 0.3, '#3a3a3a', x, 0.15, z, 5)); return g }
const pig = () => { const c = '#f7a8c0'; const body = sph(0.36, c, 0, 0.44); body.scale.set(1.3, 1, 1); const g = grp(0.5, true, body, sph(0.24, c, 0.44, 0.46)); g.add(cyl(0.1, 0.1, 0.08, '#e088a0', 0.62, 0.46, 0, 8)).children.at(-1)!.rotation.z = Math.PI / 2; for (const sx of [-0.1, 0.1]) g.add(sph(0.025, '#111', 0.5, 0.57, sx)); for (const sx of [-0.13, 0.13]) g.add(con(0.07, 0.12, c, 0.36, 0.66, sx, 4)); for (const [x, z] of [[-0.18, 0.16], [0.2, 0.16], [-0.18, -0.16], [0.2, -0.16]] as const) g.add(cyl(0.06, 0.06, 0.26, c, x, 0.13, z, 5)); return g }
const cow = () => { const c = '#fff'; const body = sph(0.45, c, 0, 0.62); body.scale.set(1.5, 1, 1.1); const g = grp(0.72, true, body, sph(0.26, c, 0.66, 0.62)); g.add(sph(0.17, '#f7c0a8', 0.86, 0.56)); for (const sp of [[0.1, 0.3], [-0.2, -0.12], [0.32, -0.22]] as const) { const s = sph(0.18, '#3a3a3a', sp[0], 0.64, sp[1]); s.scale.set(1.3, 1, 1.1); g.add(s) } for (const [x, z] of [[-0.3, 0.22], [0.4, 0.22], [-0.3, -0.22], [0.4, -0.22]] as const) g.add(cyl(0.08, 0.08, 0.42, '#333', x, 0.21, z, 5)); for (const sx of [-0.13, 0.13]) g.add(con(0.06, 0.13, '#ddd', 0.7, 0.84, sx, 4)); return g }
const barn = () => { const g = grp(1.8, false, box(2.4, 2.7, 2.4, '#c0392b', 0, 1.35)); const roof = con(2.05, 1.35, '#8a2a20', 0, 3.35, 0, 4); roof.rotation.y = Math.PI / 4; g.add(roof); g.add(box(0.95, 1.45, 0.1, '#fff', 0, 0.72, 1.21)); g.add(box(0.12, 1.45, 0.12, '#7a241c', 0, 0.72, 1.27)); g.add(box(0.95, 0.12, 0.12, '#7a241c', 0, 1.45, 1.27)); g.add(box(0.55, 0.55, 0.1, '#e8c060', 0, 2.45, 1.22)); g.add(box(0.62, 0.1, 0.12, '#7a241c', 0, 2.45, 1.27)); return g }

// ---------- UNDERWATER world ----------
const smallfish = () => { const c = pick(['#ff944d', '#ffcf3f', '#5ec8ff', '#ff6b9d', '#5fd98a']); const body = sph(0.3, c, 0, 0.4); body.scale.set(1.4, 1, 0.7); const g = grp(0.34, true, body); const tail = con(0.22, 0.34, c, -0.5, 0.4, 0, 3); tail.rotation.z = Math.PI / 2; g.add(tail); g.add(con(0.12, 0.2, c, 0.05, 0.6, 0, 3)); g.add(sph(0.06, '#fff', 0.3, 0.44, 0.13)); g.add(sph(0.03, '#111', 0.34, 0.44, 0.16)); return g }
const coralbit = () => { const c = pick(['#ff7a9d', '#ffa84d', '#c08aff']); const g = grp(0.3, true); for (let i = 0; i < 3; i++) { const h = 0.4 + Math.random() * 0.3; g.add(cyl(0.06, 0.09, h, c, (Math.random() - 0.5) * 0.3, h / 2, (Math.random() - 0.5) * 0.3, 6)) } return g }
const jellyfish = () => { const c = pick(['#ff9ad8', '#b89aff', '#9ad8ff']); const dome = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10, 0, 6.283, 0, 1.7), new THREE.MeshLambertMaterial({ color: c, transparent: true, opacity: 0.9 })); dome.position.y = 0.7; const g = grp(0.34, false, dome); for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; g.add(cyl(0.02, 0.02, 0.45, c, Math.cos(a) * 0.2, 0.45, Math.sin(a) * 0.2, 4)) } return g }
const bigfish = () => { const c = pick(['#5ec8ff', '#5fd98a', '#ffb03a', '#ff6b9d']); const body = sph(0.5, c, 0, 0.62); body.scale.set(1.5, 1, 0.7); const g = grp(0.55, true, body); const tail = con(0.36, 0.5, c, -0.82, 0.62, 0, 3); tail.rotation.z = Math.PI / 2; g.add(tail); g.add(con(0.2, 0.34, c, 0.05, 0.94, 0, 3)); g.add(sph(0.09, '#fff', 0.55, 0.68, 0.2)); g.add(sph(0.045, '#111', 0.6, 0.68, 0.24)); return g }
const coral = () => { const c = pick(['#ff7a9d', '#ffa84d', '#c08aff', '#5fd98a']); const g = grp(0.6, false, cyl(0.12, 0.18, 0.6, c, 0, 0.3, 0, 8)); for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283; const br = cyl(0.07, 0.1, 0.7, c, Math.cos(a) * 0.24, 0.7, Math.sin(a) * 0.24, 6); br.rotation.set(0.5 * Math.sin(a), 0, -0.5 * Math.cos(a)); g.add(br) } return g }
const chest = () => { const c = '#8a5a30'; const g = grp(0.6, true, box(1.0, 0.6, 0.7, c, 0, 0.3), box(1.0, 0.36, 0.7, '#6a4424', 0, 0.78)); for (const y of [0.3, 0.62, 0.95]) g.add(box(1.04, 0.07, 0.74, '#e0b040', 0, y, 0)); g.add(box(0.14, 0.2, 0.05, '#ffd23a', 0, 0.5, 0.36)); for (let i = 0; i < 4; i++) g.add(sph(0.06, pick(['#ffd23a', '#9ad8ff', '#ff9ad8']), -0.3 + i * 0.2, 1.0, 0.1)); return g }
const whale = () => { const c = '#5a8ad0'; const body = sph(1.4, c, 0, 1.5); body.scale.set(1.7, 1, 1); const g = grp(1.9, false, body); const tail = con(0.9, 1.3, c, -2.5, 1.7, 0, 3); tail.rotation.z = -1.1; g.add(tail); for (const sx of [-0.45, 0.45]) { g.add(sph(0.17, '#fff', 1.9, 1.7, sx)); g.add(sph(0.08, '#111', 2.02, 1.7, sx)) } g.add(box(2.2, 0.1, 1.6, '#cfe0f5', 0.2, 0.55, 0)); for (let i = 0; i < 5; i++) g.add(cyl(0.03, 0.03, 0.5 + Math.random() * 0.4, '#bfe0ff', 0.2, 2.9, (i - 2) * 0.08, 4)); return g }

// ---------- special objects (world-agnostic) ----------
// a wrapped PRESENT — swallow it and a friend pops out (a happy surprise)
const gift = () => { const c = pick(['#ff5d8f', '#5ec8ff', '#a07bff', '#5fd98a', '#ff944d']); const g = grp(0.5, false, box(0.72, 0.7, 0.72, c, 0, 0.37)); g.add(box(0.14, 0.72, 0.74, '#fff', 0, 0.37)); g.add(box(0.74, 0.72, 0.14, '#fff', 0, 0.37)); g.add(sph(0.12, '#fff', 0, 0.78)); for (const x of [-0.17, 0.17]) { const lo = sph(0.12, '#fff', x, 0.8); lo.scale.set(1.4, 0.7, 0.7); g.add(lo) } return g }
// a FIREWORK rocket — swallow it and it shoots a colourful burst up out of the hole
const firework = () => { const c = pick(['#ff5d8f', '#5ec8ff', '#a07bff', '#5fd98a', '#ff944d', '#ffcf3f']); const body = cyl(0.16, 0.2, 0.8, c, 0, 0.5, 0, 10); const nose = con(0.17, 0.34, '#fff', 0, 1.04, 0, 10); const g = grp(0.3, false, body, nose); for (const a of [0, 2.094, 4.188]) g.add(box(0.04, 0.22, 0.2, '#3a4452', Math.cos(a) * 0.18, 0.18, Math.sin(a) * 0.18)); g.add(cyl(0.018, 0.018, 0.22, '#888', 0, 0.0, 0, 4)); return g }
// a BALLOON — swallow it and it pops, sweeping nearby treats into the hole
const balloon = () => { const c = pick(['#ff5d8f', '#5ec8ff', '#a07bff', '#5fd98a', '#ff944d', '#ffcf3f']); const b = sph(0.42, c, 0, 1.05); b.scale.set(0.85, 1.05, 0.85); const knot = con(0.09, 0.16, c, 0, 0.62, 0, 6); const str = cyl(0.015, 0.015, 0.6, '#bbb', 0, 0.32, 0, 4); return grp(0.28, false, b, knot, str) }
// a GATEWAY arch — towers over you until you grow big enough to swallow it (size gate)
const arch = () => { const c = '#cdbfa6', t = '#b3a488'; const g = grp(1.3, false); for (const sx of [-1, 1]) { g.add(box(0.55, 2.7, 0.7, c, sx * 1.15, 1.35, 0)); g.add(box(0.75, 0.4, 0.9, t, sx * 1.15, 0.2, 0)) } g.add(box(3.4, 0.6, 0.7, c, 0, 2.95, 0)); g.add(box(2.9, 0.32, 0.55, t, 0, 2.62, 0.08)); for (const sx of [-1, 1]) g.add(con(0.3, 0.5, pick(['#ff5d8f', '#5ec8ff', '#5fd98a', '#ffcf3f']), sx * 1.15, 3.45, 0, 8)); return g }
export { gift, friendNpc }

export const WORLDS: World[] = [
  { id: 'candy', sky: '#ffdcef', ground: '#f2b6db', tiers: [[gummybear, cookie, wrapped], [lollipop, cupcake, donut, candycane], [icecream, cakeSlice], [bigCake]], icons: ['🍬', '🍭', '🍦', '🎂'], landmark: gingerbreadHouse, movers: [gummybear, gummybear, wrapped] },
  { id: 'city', sky: '#bcd6ef', ground: '#9aa9ba', tiers: [[cone, hydrant, trashcan, person, dog], [bench, lamppost, mailbox, bush], [car, tree], [bus, house]], icons: ['🚧', '🧍', '🚗', '🚌'], landmark: building, movers: [person, person, dog] },
  { id: 'beach', sky: '#bfe6ff', ground: '#f0d9a8', tiers: [[seashell, starfishB, pebbleB], [pail, beachball, crab], [sandcastle, umbrella], [boat]], icons: ['🐚', '🪣', '🏰', '⛵'], landmark: lighthouse, movers: [crab, crab, beachball] },
  { id: 'space', sky: '#10102a', ground: '#b0b4c2', tiers: [[moonrock, spacestar, bolt], [satellite, alien, crystal], [rover, capsule], [rocketS]], icons: ['🌙', '👽', '🤖', '🚀'], landmark: spacestation, movers: [alien, alien, rover] },
  { id: 'farm', sky: '#bfe6ff', ground: '#8fc96a', tiers: [[chick, egg, carrot], [chicken, haybale], [sheep, pig], [cow]], icons: ['🐤', '🐔', '🐑', '🐮'], landmark: barn, movers: [chicken, sheep, pig] },
  { id: 'underwater', sky: '#1a6fa0', ground: '#1f9a8a', tiers: [[smallfish, coralbit, seashell], [jellyfish, starfishB, crab], [bigfish, coral], [chest]], icons: ['🐟', '🪼', '🐠', '💎'], landmark: whale, movers: [smallfish, smallfish, jellyfish] },
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
export type Spec = { x: number; z: number; tier: number; baseY: number; make: PropMaker; landmark?: boolean; mover?: boolean; kind?: 'gift' | 'ice' | 'boss' | 'firework' | 'balloon' | 'linked'; friend?: number }
export type Target = { tier: number; icon: string; need: number; got: number }
export type Layout = { specs: Spec[]; targets: Target[]; world: World; bound: number; road: THREE.CatmullRomCurve3 }

export function buildLayout(n: number, maxFriend: number): Layout {
  const world = worldForLevel(n)
  const within = ((n - 1) % 10) + 1
  const maxTier = Math.min(world.tiers.length, 2 + Math.floor((within - 1) / 3))
  const bound = 16 + within * 1.2 // roomier — clear space between the candies (not a packed blob)
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

  // line the road (breadcrumb: tier grows along it), SPACED OUT, with STACKS as payoffs
  const along = 48 + within * 3
  for (let i = 0; i < along; i++) {
    const t = i / (along - 1)
    const p = road.getPoint(t)
    const tier = Math.max(1, Math.min(maxTier, 1 + Math.floor(t * maxTier + Math.random() * 0.6)))
    place(p.x + (Math.random() - 0.5) * 4.4, p.z + (Math.random() - 0.5) * 4.4, tier)
    if (Math.random() < 0.4) place(p.x + (Math.random() - 0.5) * 5, p.z + (Math.random() - 0.5) * 5, Math.max(1, tier - 1))
    if (i % 9 === 4) { // a TOWER of one object (stack), every so often
      const st = 3 + Math.floor(Math.random() * 4), tt = Math.min(tier, 2), mk = pick(world.tiers[tt - 1]), step = tt <= 1 ? 0.95 : 1.35
      for (let s = 0; s < st; s++) place(p.x, p.z, tt, s * step, mk)
    }
  }

  // scatter a FEW extra props (Vogel) so the field isn't empty — but with breathing room
  const fill = 26 + within * 2
  const g = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < fill; i++) { const r = 3 + Math.sqrt((i + 1) / fill) * bound; const a = i * g; const rad = Math.min(1, r / bound); const tier = Math.max(1, Math.min(maxTier, 1 + Math.floor(rad * maxTier * 0.8 + Math.random() * 0.6))); place(Math.cos(a) * r, Math.sin(a) * r, tier) }

  // a towering landmark mid-road, and the BOSS — an enormous friendly thing at the
  // very end you finally grow big enough to swallow (the satisfying capstone)
  const lp = road.getPoint(0.62); place(lp.x, lp.z, world.tiers.length, 0, world.landmark, true)
  const bp = road.getPoint(1.0); specs.push({ x: bp.x, z: bp.z, tier: world.tiers.length, baseY: 0, kind: 'boss', make: world.landmark })
  // a size-gate ARCH mid-road: towers over you until you grow big enough to swallow it
  const ap = road.getPoint(0.42); place(ap.x, ap.z, world.tiers.length, 0, arch, true)

  // a LIVING world: wandering critters (gummy bears / people / dogs) you chase
  const nMov = 10 + within * 2
  for (let i = 0; i < nMov; i++) {
    const p = road.getPoint(Math.random())
    const x = p.x + (Math.random() - 0.5) * bound * 0.5, z = p.z + (Math.random() - 0.5) * bound * 0.5
    if (Math.hypot(x, z) < 3) continue
    specs.push({ x, z, tier: 1, baseY: 0, mover: true, make: pick(world.movers) })
  }

  // SPECIAL objects: gifts (swallow → a friend pops out) + ice (linger to melt, then eat)
  // gifts are plentiful (each reveals an un-met friend) so collecting really progresses
  const nGift = 4 + Math.floor(within / 2)
  for (let i = 0; i < nGift; i++) { const p = road.getPoint(0.1 + Math.random() * 0.85); const x = p.x + (Math.random() - 0.5) * 4, z = p.z + (Math.random() - 0.5) * 4; if (Math.hypot(x, z) < 3) continue; specs.push({ x, z, tier: 1, baseY: 0, kind: 'gift', make: gift }) }
  const nIce = 1 + Math.floor(within / 4)
  for (let i = 0; i < nIce; i++) { const p = road.getPoint(0.3 + Math.random() * 0.6); const x = p.x + (Math.random() - 0.5) * 5, z = p.z + (Math.random() - 0.5) * 5; if (Math.hypot(x, z) < 4) continue; specs.push({ x, z, tier: 2, baseY: 0, kind: 'ice', make: pick(world.tiers[1]) }) }

  // TRICK objects (Donut County style): firework shoots up, balloon pops + sweeps treats in
  const nTrick = 2 + Math.floor(within / 3)
  for (let i = 0; i < nTrick; i++) { const p = road.getPoint(0.1 + Math.random() * 0.85); const x = p.x + (Math.random() - 0.5) * 4, z = p.z + (Math.random() - 0.5) * 4; if (Math.hypot(x, z) < 3) continue; const fw = i % 2 === 0; specs.push({ x, z, tier: 1, baseY: 0, kind: fw ? 'firework' : 'balloon', make: fw ? firework : balloon }) }

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

  // LINKED friends: a pair side by side — swallow one and its partner slides in too
  const nLink = 1 + Math.floor(within / 5)
  for (let i = 0; i < nLink; i++) {
    const p = road.getPoint(0.2 + Math.random() * 0.6); const a = Math.random() * 6.28
    if (Math.hypot(p.x, p.z) < 4) continue
    const f1 = Math.floor(Math.random() * Math.max(1, maxFriend)), f2 = Math.floor(Math.random() * Math.max(1, maxFriend))
    specs.push({ x: p.x, z: p.z, tier: 2, baseY: 0, kind: 'linked', friend: f1, make: () => friendBillboard(f1) })
    specs.push({ x: p.x + Math.cos(a) * 1.3, z: p.z + Math.sin(a) * 1.3, tier: 2, baseY: 0, kind: 'linked', friend: f2, make: () => friendBillboard(f2) })
  }

  // collect MANY of 1–2 abundant types (a satisfying sweep, not a hunt for 5)
  const nT = Math.min(2, 1 + Math.floor((within - 1) / 4))
  const tiers = Array.from({ length: maxTier }, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, nT)
  const targets: Target[] = tiers.map((t) => ({ tier: t, icon: world.icons[t - 1], need: 24 + within * 4, got: 0 }))
  return { specs, targets, world, bound, road }
}
