// Real-animal pets for the "My Friend" (Tamagotchi) game — an alternative to the
// 100 abstract friends. They are front-facing chibi animals built on the SAME
// skeleton as the friends (two paw-arms `.gal-arm`, two feet `.gal-foot`, eyes
// `.gf-eye`), so the existing walk / carry / eat / drink rigs animate them for
// free. Each animal adds its own ears / snout / tail via `.animal-<kind>` CSS.

export type AnimalKind = 'dog' | 'cat' | 'rabbit' | 'hamster'

export const ANIMAL_KINDS: AnimalKind[] = ['dog', 'cat', 'rabbit', 'hamster']

export const ANIMAL_NAMES: Record<AnimalKind, string> = {
  dog: 'כלב',
  cat: 'חתול',
  rabbit: 'ארנב',
  hamster: 'אוגר',
}

// the emoji shown on the picker chip + spoken-name fallback
export const ANIMAL_EMOJI: Record<AnimalKind, string> = {
  dog: '🐶',
  cat: '🐱',
  rabbit: '🐰',
  hamster: '🐹',
}

// natural box each animal is drawn in (px), used to scale it to fit the room
export const ANIMAL_NATURAL: Record<AnimalKind, { w: number; h: number }> = {
  dog: { w: 150, h: 150 },
  cat: { w: 150, h: 150 },
  rabbit: { w: 140, h: 176 },
  hamster: { w: 152, h: 140 },
}

export const animalMaxDim = (k: AnimalKind) => Math.max(ANIMAL_NATURAL[k].w, ANIMAL_NATURAL[k].h)

type Props = {
  kind: AnimalKind
  /** looping march (legs + paws) — reuses the friends' `.is-walking` rig */
  walking?: boolean
  /** open + chew the mouth, paw to the mouth — reuses the `.is-eating` rig */
  eating?: boolean
}

export default function AnimalArt({ kind, walking = false, eating = false }: Props) {
  return (
    <div className={`friend-art animal animal-${kind} ${walking ? 'is-walking' : ''} ${eating ? 'is-eating' : ''}`}>
      {/* behind the body */}
      <span className="an-tail" />
      {/* paws double as the friend "arms" so the walk/eat rigs grab them */}
      <span className="gal-arm l">
        <span className="hand" />
      </span>
      <span className="gal-arm r">
        <span className="hand" />
      </span>
      <span className="an-ear l" />
      <span className="an-ear r" />
      <span className="an-body" />
      <span className="an-cheek l" />
      <span className="an-cheek r" />
      <span className="gf-eye l" />
      <span className="gf-eye r" />
      <span className="an-snout">
        <span className="an-nose" />
        <span className="an-mouth" />
      </span>
      {/* feet double as the friend "feet" — the walk rig lifts them in turn */}
      <span className="gal-foot l" />
      <span className="gal-foot r" />
    </div>
  )
}
