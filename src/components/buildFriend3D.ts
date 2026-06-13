import * as THREE from 'three'
import { BIG, BIG_KINDS, friendKindForIndex } from './FriendArt'

// Build ANY data-driven friend (11–100) as a 3D model, straight from the same
// `BIG` table the 2D art uses: each friend is a grid of round "bumps" whose count
// is its number. We drop an overlapping sphere on every bump so they fuse into one
// soft blob, then add a flat cartoon face, tapered arms, little feet and a floating
// number — all in the friend's own colour. One builder → 90 friends, no modelling.

export type Friend3DRig = {
  group: THREE.Group // outer: scaled + framed to a constant size
  inner: THREE.Group // the model itself, centred at origin
  bumps: THREE.Mesh[] // for the breathing animation
  armL: THREE.Group
  armR: THREE.Group
  bc: THREE.Color
}

// overlap factors mirror the 2D art (FriendArt H_OVER / V_OVER) so the number reads
const STEP_H = 1 - 0.16
const STEP_V = 1 - 0.26
const R = 0.6 // bump radius (unit = one bump); >0.5 so neighbours fuse

const mat = (c: THREE.ColorRepresentation, roughness = 0.5) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color(c), roughness, metalness: 0 })
// flat, UNLIT material — the trick for eyes that read as painted-on cartoon shapes
// (a shaded 3D ball looks like a creepy googly eye; a flat one looks drawn-on).
const flat = (c: THREE.ColorRepresentation) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c) })

// Friends 1–10 are bespoke 2D shapes (no `rows`). Until each gets its own 3D
// model, build them the same data-driven way: a round cluster whose count equals
// the number, in the friend's identity colour. Girls (gogo/nuni/koko) get lips.
type Spec = { rows: number[]; bc: string; shoe: string; face: 'plain' | 'girl' }
const SMALL: Spec[] = [
  { rows: [1], bc: '#ef4444', shoe: '#b91c1c', face: 'plain' }, // 1 lulu
  { rows: [2], bc: '#f97316', shoe: '#1e3a8a', face: 'plain' }, // 2 toki
  { rows: [3], bc: '#f59e0b', shoe: '#1e3a8a', face: 'plain' }, // 3 bobby
  { rows: [2, 2], bc: '#22c55e', shoe: '#1e3a8a', face: 'girl' }, // 4 gogo
  { rows: [3, 2], bc: '#14b8a6', shoe: '#1e3a8a', face: 'plain' }, // 5 moki
  { rows: [3, 3], bc: '#06b6d4', shoe: '#db2777', face: 'girl' }, // 6 nuni
  { rows: [3, 4], bc: '#3b82f6', shoe: '#1e3a8a', face: 'plain' }, // 7 piko
  { rows: [4, 4], bc: '#6366f1', shoe: '#1e3a8a', face: 'plain' }, // 8 dudi
  { rows: [3, 3, 3], bc: '#8b5cf6', shoe: '#1e3a8a', face: 'plain' }, // 9 zuzu
  { rows: [3, 4, 3], bc: '#ec4899', shoe: '#1e3a8a', face: 'girl' }, // 10 koko
]

function bumpCenters(rows: number[]) {
  const maxCols = Math.max(...rows)
  const w = 1 + (maxCols - 1) * STEP_H
  const h = 1 + (rows.length - 1) * STEP_V
  const centers: { x: number; y: number }[] = []
  rows.forEach((c, r) => {
    const rowW = 1 + (c - 1) * STEP_H
    const rowLeft = (w - rowW) / 2
    const cy = r * STEP_V + 0.5
    for (let j = 0; j < c; j++) {
      const cx = rowLeft + j * STEP_H + 0.5
      centers.push({ x: cx - w / 2, y: h / 2 - cy }) // centre + flip Y (screen→world)
    }
  })
  return { centers, w, h, maxCols }
}

// A flat, friendly cartoon eye built from unlit layers facing forward: a dark
// outline ring, a white, a BIG pupil (fills most of the eye — the cute look), and
// two catch-lights. Thin in z so it hugs the face like a decal.
function makeEye(x: number, y: number, z: number) {
  const g = new THREE.Group()
  const outline = new THREE.Mesh(new THREE.CircleGeometry(0.25, 32), flat(0x232a36))
  outline.scale.set(0.86, 1.16, 1)
  const white = new THREE.Mesh(new THREE.CircleGeometry(0.225, 32), flat(0xffffff))
  white.scale.set(0.82, 1.12, 1)
  white.position.z = 0.01
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.155, 28), flat(0x222630))
  pupil.scale.set(1, 1.12, 1)
  pupil.position.set(0, -0.03, 0.02)
  const shineA = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), flat(0xffffff))
  shineA.position.set(0.06, 0.07, 0.03)
  const shineB = new THREE.Mesh(new THREE.CircleGeometry(0.03, 14), flat(0xffffff))
  shineB.position.set(-0.045, -0.04, 0.03)
  g.add(outline, white, pupil, shineA, shineB)
  g.position.set(x, y, z)
  return g
}

// a soft tapered arm: WIDE where it meets the body (so it grows out of the blob,
// no "severed" gap) and narrowing to a rounded hand. Pivots at the shoulder.
function makeArm(side: number, color: THREE.Color, x: number, y: number) {
  const shoulder = new THREE.Group()
  const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.27, 0.62, 18), mat(color))
  limb.position.y = -0.31 // top (wide) at the shoulder, narrow end down
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 20), mat(color))
  hand.position.y = -0.64
  shoulder.add(limb, hand)
  shoulder.position.set(side * x, y, 0.14)
  return shoulder
}

// a crisp number badge that floats above the head (canvas texture → sprite)
function makeNumberSprite(n: number, color: string) {
  const size = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = size
  const ctx = cv.getContext('2d')!
  ctx.font = 'bold 150px Fredoka, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 22
  ctx.strokeStyle = color
  ctx.strokeText(String(n), size / 2, size / 2 + 8)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(String(n), size / 2, size / 2 + 8)
  const tex = new THREE.CanvasTexture(cv)
  tex.anisotropy = 4
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
}

export function buildFriend3D(index: number): Friend3DRig {
  const kind = friendKindForIndex(index)
  const isBig = (BIG_KINDS as readonly string[]).includes(kind)
  const spec = isBig ? BIG[kind as keyof typeof BIG] : (SMALL[index] ?? SMALL[0])
  const { centers, h, maxCols } = bumpCenters(spec.rows)
  const bc = new THREE.Color(spec.bc)
  const limbColor = bc.clone().multiplyScalar(0.85)
  const faceZ = R - 0.02

  const inner = new THREE.Group()
  const bumps: THREE.Mesh[] = []
  const bumpGeo = new THREE.SphereGeometry(R, 32, 32)
  const bodyMat = mat(spec.bc)
  for (const c of centers) {
    const m = new THREE.Mesh(bumpGeo, bodyMat)
    m.position.set(c.x, c.y, 0)
    inner.add(m)
    bumps.push(m)
  }

  // face — flat cartoon eyes + smile on the front, upper-middle. Constant size, so
  // after framing a small friend gets a big face and a big one a small face.
  const faceY = h / 2 - Math.min(1.15, h * 0.34)
  inner.add(makeEye(-0.27, faceY, faceZ + 0.03), makeEye(0.27, faceY, faceZ + 0.03))
  if (spec.face === 'girl') {
    const lips = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.05, 12, 24, Math.PI), flat(0xc81e54))
    lips.position.set(0, faceY - 0.44, faceZ + 0.03)
    lips.rotation.z = Math.PI
    inner.add(lips)
  } else {
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 12, 28, Math.PI), flat(0x4a0d16))
    mouth.position.set(0, faceY - 0.42, faceZ + 0.03)
    mouth.rotation.z = Math.PI
    inner.add(mouth)
  }
  // cheeks (soft, semi-transparent)
  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.4 })
  for (const x of [-0.58, 0.58]) {
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), cheekMat)
    c.scale.set(1, 0.72, 1)
    c.position.set(x, faceY - 0.2, faceZ + 0.02)
    inner.add(c)
  }

  // feet
  for (const x of [-0.42, 0.42]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), mat(spec.shoe))
    f.scale.set(1, 0.58, 1.35)
    f.position.set(x, -h / 2 - 0.12, 0.3)
    inner.add(f)
  }

  // arms — the wide base overlaps the outermost bump so they look attached
  const bodyHalfCenters = ((maxCols - 1) * STEP_H) / 2
  const armX = bodyHalfCenters + 0.12
  const armY = Math.min(h * 0.14, h / 2 - 0.6)
  const armL = makeArm(-1, limbColor, armX, armY)
  const armR = makeArm(1, limbColor, armX, armY)
  inner.add(armL, armR)

  // floating number badge
  const num = makeNumberSprite(index + 1, spec.bc)
  num.scale.set(1.1, 1.1, 1.1)
  num.position.set(0, h / 2 + 0.85, 0.4)
  inner.add(num)

  // frame: scale the whole model so its largest dimension is constant, and recentre
  const group = new THREE.Group()
  group.add(inner)
  const box = new THREE.Box3().setFromObject(inner)
  const sizeV = new THREE.Vector3()
  box.getSize(sizeV)
  const centerV = new THREE.Vector3()
  box.getCenter(centerV)
  const maxDim = Math.max(sizeV.x, sizeV.y) || 1
  const scale = 3.5 / maxDim
  inner.position.sub(centerV) // centre the model at the origin
  group.scale.setScalar(scale)

  return { group, inner, bumps, armL, armR, bc }
}
