import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { BIG, BIG_KINDS, friendKindForIndex } from './FriendArt'

// Build ANY data-driven friend (11–100) as a 3D model, straight from the same
// `BIG` table the 2D art uses. Numberblocks-style: every friend is a stack of
// rounded cubes (one per unit, so the count = the number), in the friend's own
// colour, with a big friendly face on the front, noodle arms, little legs, and a
// floating number above. One builder → 90 friends, no hand-modelling.

export type Friend3DRig = {
  group: THREE.Group // outer: scaled + framed to a constant size
  inner: THREE.Group // the model itself, centred at origin
  bumps: THREE.Mesh[] // the cubes — for the breathing animation
  armL: THREE.Group
  armR: THREE.Group
  bc: THREE.Color
}

const CELL = 1.0 // grid spacing between cube centres
const CUBE = 0.94 // cube size (a hair smaller than CELL → visible seams)

const mat = (c: THREE.ColorRepresentation, roughness = 0.5) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color(c), roughness, metalness: 0 })

// Friends 1–10 are bespoke 2D shapes (no `rows`). Until each gets its own 3D
// model, build them the same data-driven way: a stack whose count equals the
// number, in the friend's identity colour. Girls (gogo/nuni/koko) get the lips.
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

// cube centres: each row centred, cubes touching. Returns the grid + its size.
function cubeGrid(rows: number[]) {
  const maxCols = Math.max(...rows)
  const w = maxCols * CELL
  const h = rows.length * CELL
  const centers: { x: number; y: number }[] = []
  rows.forEach((c, r) => {
    for (let j = 0; j < c; j++) {
      const x = (j - (c - 1) / 2) * CELL
      const y = ((rows.length - 1) / 2 - r) * CELL
      centers.push({ x, y })
    }
  })
  return { centers, w, h, maxCols }
}

// a big friendly cartoon eye: a tall flat white oval, a round dark pupil and a
// bright catch-light — sits ON the flat cube face (not a bulging ball).
function makeEye(x: number, y: number, z: number) {
  const g = new THREE.Group()
  const white = new THREE.Mesh(new THREE.SphereGeometry(0.22, 28, 28), mat(0xffffff, 0.32))
  white.scale.set(0.9, 1.28, 0.36)
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.12, 22, 22), mat(0x262833, 0.25))
  pupil.scale.set(1, 1.08, 0.5)
  pupil.position.set(0, -0.03, 0.07)
  const shine = new THREE.Mesh(
    new THREE.SphereGeometry(0.048, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  )
  shine.position.set(0.07, 0.08, 0.13)
  g.add(white, pupil, shine)
  g.position.set(x, y, z)
  return g
}

// a soft noodle arm in a slightly darker shade, clearly emerging from the body
// side (the shoulder sits just inside it). Pivots at the shoulder.
function makeArm(side: number, color: THREE.Color, x: number, y: number) {
  const shoulder = new THREE.Group()
  const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.56, 8, 16), mat(color))
  limb.position.y = -0.4
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 18), mat(color))
  hand.position.y = -0.74
  shoulder.add(limb, hand)
  shoulder.position.set(side * x, y, 0.22)
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
  const { centers, w, h } = cubeGrid(spec.rows)
  const bc = new THREE.Color(spec.bc)
  const limbColor = bc.clone().multiplyScalar(0.82)
  const faceZ = CUBE / 2

  const inner = new THREE.Group()
  const bumps: THREE.Mesh[] = []
  const cubeGeo = new RoundedBoxGeometry(CUBE, CUBE, CUBE, 4, 0.16)
  const bodyMat = mat(spec.bc)
  for (const c of centers) {
    const m = new THREE.Mesh(cubeGeo, bodyMat)
    m.position.set(c.x, c.y, 0)
    inner.add(m)
    bumps.push(m)
  }

  // face — on the front, in the upper-middle. Constant size, so after the model is
  // framed to a fixed size a small friend gets a big face and a big one a small.
  const faceY = h / 2 - Math.min(1.4, h * 0.42) - 0.1
  inner.add(makeEye(-0.27, faceY, faceZ + 0.04), makeEye(0.27, faceY, faceZ + 0.04))
  if (spec.face === 'girl') {
    const lips = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.05, 12, 24, Math.PI), mat(0xb91c4d, 0.5))
    lips.position.set(0, faceY - 0.46, faceZ + 0.04)
    lips.rotation.z = Math.PI
    inner.add(lips)
  } else {
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 12, 28, Math.PI), mat(0x6a0f1c, 0.5))
    mouth.position.set(0, faceY - 0.44, faceZ + 0.04)
    mouth.rotation.z = Math.PI
    inner.add(mouth)
  }
  // cheeks
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, transparent: true, opacity: 0.45, roughness: 0.7 })
  for (const x of [-0.56, 0.56]) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), cheekMat)
    c.position.set(x, faceY - 0.2, faceZ + 0.02)
    c.scale.set(1, 0.7, 0.3)
    inner.add(c)
  }

  // little legs + feet at the bottom
  for (const x of [-0.34, 0.34]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.12, 6, 12), mat(limbColor))
    leg.position.set(x, -h / 2 - 0.12, 0.18)
    inner.add(leg)
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 18), mat(spec.shoe))
    foot.scale.set(1, 0.55, 1.4)
    foot.position.set(x, -h / 2 - 0.3, 0.34)
    inner.add(foot)
  }

  // arms — emerge from the body sides at the upper-middle, hanging down a touch out
  const armX = w / 2 - 0.18
  const armY = Math.min(h * 0.12, h / 2 - 0.7)
  const armL = makeArm(-1, limbColor, armX, armY)
  const armR = makeArm(1, limbColor, armX, armY)
  inner.add(armL, armR)

  // floating number badge
  const num = makeNumberSprite(index + 1, spec.bc)
  num.scale.set(1.05, 1.05, 1.05)
  num.position.set(0, h / 2 + 0.8, 0.4)
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
  const scale = 3.6 / maxDim
  inner.position.sub(centerV) // centre the model at the origin
  group.scale.setScalar(scale)

  return { group, inner, bumps, armL, armR, bc }
}
