// Real-animal pets for the "My Friend" (Tamagotchi) game — an alternative to the
// 100 abstract friends. Front-facing chibi animals (a big head + a smaller body)
// built on the SAME skeleton as the friends (two paw-arms `.gal-arm`, two feet
// `.gal-foot`, eyes `.gf-eye`), so the existing walk / carry / eat / drink rigs
// animate them for free. Each animal gets its own ears / snout / tail / extras
// via `.animal-<kind>` CSS, with strong defining features so it's unmistakable.

export type AnimalKind = 'dog' | 'cat' | 'rabbit' | 'hamster'

export const ANIMAL_KINDS: AnimalKind[] = ['dog', 'cat', 'rabbit', 'hamster']

export const ANIMAL_NAMES: Record<AnimalKind, string> = {
  dog: 'כלב',
  cat: 'חתול',
  rabbit: 'ארנב',
  hamster: 'אוגר',
}

export const ANIMAL_EMOJI: Record<AnimalKind, string> = {
  dog: '🐶',
  cat: '🐱',
  rabbit: '🐰',
  hamster: '🐹',
}

// natural box each animal is drawn in (px). The animal's FEET sit at the very
// bottom of this box, so it stands on the floor like the friends.
export const ANIMAL_NATURAL: Record<AnimalKind, { w: number; h: number }> = {
  dog: { w: 156, h: 168 },
  cat: { w: 156, h: 172 },
  rabbit: { w: 150, h: 196 },
  hamster: { w: 160, h: 156 },
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
      {/* behind everything */}
      <span className="an-tail" />
      {/* lower rounded body, with the feet + paws */}
      <span className="an-body" />
      <span className="gal-foot l" />
      <span className="gal-foot r" />
      <span className="gal-arm l">
        <span className="hand" />
      </span>
      <span className="gal-arm r">
        <span className="hand" />
      </span>
      {/* big head carries the face + ears */}
      <span className="an-head">
        <span className="an-ear l" />
        <span className="an-ear r" />
        <span className="an-cheek l" />
        <span className="an-cheek r" />
        <span className="an-whisker l" />
        <span className="an-whisker r" />
        <span className="gf-eye l" />
        <span className="gf-eye r" />
        <span className="an-snout">
          <span className="an-nose" />
          <span className="an-mouth" />
          <span className="an-tongue" />
          <span className="an-teeth" />
        </span>
      </span>
    </div>
  )
}
