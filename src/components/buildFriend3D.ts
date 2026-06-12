import * as THREE from 'three'
import { BIG, BIG_KINDS, friendKindForIndex } from './FriendArt'

// Build ANY data-driven friend (11–100) as a 3D model, straight from the same
// `BIG` table the 2D art uses: each friend is a grid of "bumps" whose silhouette
// spells its number. We drop a sphere on every bump (overlapping so they fuse
// into one lumpy blob), then add a face, feet, arms and a floating number — all
// in the friend's own identity colour. One builder → 90 friends, no hand-modelling.

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

const mat = (c: THREE.ColorRepresentation, roughness = 0.55) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color(c), roughness, metalness: 0 })

// Friends 1–10 are bespoke 2D shapes (no `rows`). Until each gets its own 3D
// model, build them the same data-driven way: a compact bump cluster whose count
// equals the number, in the friend's identity colour. Girls (gogo/nuni/koko) get
// the lips face. Accessories/exact silhouettes come later.
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
  return { centers, w, h }
}

// a friendly cartoon eye: a flat white disc, a smallish dark pupil, and a bright
// catch-light. Flattened in z so it sits ON the face instead of bulging out.
function makeEye(x: number, y: number, z: number) {
  const g = new THREE.Group()
  const white = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 28), mat(0xffffff, 0.25))
  white.scale.set(1, 1.12, 0.5)
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.105, 22, 22), mat(0x222431, 0.2))
  pupil.scale.set(1, 1.05, 0.55)
  pupil.position.set(0, -0.01, 0.12)
  const shine = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  )
  shine.position.set(0.055, 0.06, 0.2)
  g.add(white, pupil, shine)
  g.position.set(x, y, z)
  return g
}

// a rubber-hose arm that clearly belongs to the body: a shoulder ball that
// overlaps the body, a slim limb, and a rounded mitt hand. Pivots at the shoulder.
function makeArm(side: number, color: THREE.ColorRepresentation, x: number, y: number) {
  const shoulder = new THREE.Group()
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 20), mat(color))
  const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.46, 8, 16), mat(color))
  limb.position.y = -0.42
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 20), mat(color))
  hand.position.y = -0.74
  shoulder.add(joint, limb, hand)
  shoulder.position.set(side * x, y, 0.18)
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
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
  return sprite
}

export function buildFriend3D(index: number): Friend3DRig {
  const kind = friendKindForIndex(index)
  const isBig = (BIG_KINDS as readonly string[]).includes(kind)
  const spec = isBig ? BIG[kind as keyof typeof BIG] : (SMALL[index] ?? SMALL[0])
  const { centers, h } = bumpCenters(spec.rows)
  const bc = new THREE.Color(spec.bc)

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

  // face — constant size, centred, in the upper third. Because the whole model is
  // scaled to a fixed frame afterwards, a small friend gets a big face and a big
  // friend a small one — exactly like the 2D art.
  const faceY = h / 2 - Math.min(1.15, h * 0.34)
  const faceZ = R - 0.02
  inner.add(makeEye(-0.3, faceY, faceZ), makeEye(0.3, faceY, faceZ))
  if (spec.face === 'girl') {
    const lips = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 12, 24, Math.PI), mat(0xb91c4d, 0.5))
    lips.position.set(0, faceY - 0.42, faceZ)
    lips.rotation.z = Math.PI
    inner.add(lips)
  } else {
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.05, 12, 28, Math.PI), mat(0x7a1020, 0.5))
    mouth.position.set(0, faceY - 0.4, faceZ)
    mouth.rotation.z = Math.PI
    inner.add(mouth)
  }
  // cheeks
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, transparent: true, opacity: 0.5, roughness: 0.7 })
  for (const x of [-0.62, 0.62]) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), cheekMat)
    c.position.set(x, faceY - 0.18, faceZ)
    c.scale.set(1, 0.7, 0.4)
    inner.add(c)
  }

  // feet
  for (const x of [-0.42, 0.42]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), mat(spec.shoe))
    f.scale.set(1, 0.58, 1.35)
    f.position.set(x, -h / 2 - 0.12, 0.3)
    inner.add(f)
  }

  // arms — shoulder ball overlaps the outer bump (so they read as attached), set
  // at the upper-middle of the body and hanging down its sides.
  const maxCols = Math.max(...spec.rows)
  const bodyHalfCenters = ((maxCols - 1) * STEP_H) / 2 // x of the outermost bump centre
  const armX = bodyHalfCenters + 0.08
  const armY = Math.min(h * 0.16, h / 2 - 0.6)
  const armL = makeArm(-1, spec.bc, armX, armY)
  const armR = makeArm(1, spec.bc, armX, armY)
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
