// Shared list of children's melodies — reusable across the dance game, the piano,
// and future games. Encoded as notes so they're generated in code (no audio
// files). Each note is [semitones from middle C (C4 = 0), beats].
//
// LICENSING: only PUBLIC-DOMAIN tunes (traditional / folk, copyright long
// expired). We deliberately DO NOT include still-copyrighted songs such as
// "I'm a Little Teapot" (1939), "I Can Sing a Rainbow" (1955), or "Hokey Cokey"
// (1949). Add a song only after checking its melody is public domain.
//
// We grow this list a few at a time and verify each one by ear in the app, so
// the notes are right before relying on it.

export type Note = [number, number]
export type Song = { id: string; label: string; bpm: number; notes: Note[] }

export const SONGS: Song[] = [
  // Twinkle Twinkle Little Star — same melody as Baa Baa Black Sheep & the
  // Alphabet song ("Ah! vous dirai-je, maman", 1761).
  {
    id: 'twinkle',
    label: 'כוכב קטן',
    bpm: 132,
    notes: [
      [0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2],
      [5, 1], [5, 1], [4, 1], [4, 1], [2, 1], [2, 1], [0, 2],
      [7, 1], [7, 1], [5, 1], [5, 1], [4, 1], [4, 1], [2, 2],
      [7, 1], [7, 1], [5, 1], [5, 1], [4, 1], [4, 1], [2, 2],
      [0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2],
      [5, 1], [5, 1], [4, 1], [4, 1], [2, 1], [2, 1], [0, 2],
    ],
  },
  // Frère Jacques (אחינו יעקב)
  {
    id: 'jacques',
    label: 'אחינו יעקב',
    bpm: 120,
    notes: [
      [0, 1], [2, 1], [4, 1], [0, 1], [0, 1], [2, 1], [4, 1], [0, 1],
      [4, 1], [5, 1], [7, 2], [4, 1], [5, 1], [7, 2],
      [7, 0.5], [9, 0.5], [7, 0.5], [5, 0.5], [4, 1], [0, 1],
      [7, 0.5], [9, 0.5], [7, 0.5], [5, 0.5], [4, 1], [0, 1],
      [0, 1], [-5, 1], [0, 2], [0, 1], [-5, 1], [0, 2],
    ],
  },
  // Old MacDonald Had a Farm (לדוד משה הייתה חווה)
  {
    id: 'macdonald',
    label: 'לדוד משה',
    bpm: 130,
    notes: [
      [7, 1], [7, 1], [7, 1], [2, 1], [4, 1], [4, 1], [2, 2],
      [11, 1], [11, 1], [9, 1], [9, 1], [7, 2],
      [2, 1], [7, 1], [7, 1], [7, 1], [2, 1], [4, 1], [4, 1], [2, 2],
    ],
  },
  // Mary Had a Little Lamb (טלה קטן)
  {
    id: 'mary',
    label: 'טלה קטן',
    bpm: 120,
    notes: [
      [4, 1], [2, 1], [0, 1], [2, 1], [4, 1], [4, 1], [4, 2],
      [2, 1], [2, 1], [2, 2], [4, 1], [7, 1], [7, 2],
      [4, 1], [2, 1], [0, 1], [2, 1], [4, 1], [4, 1], [4, 1], [4, 1],
      [2, 1], [2, 1], [4, 1], [2, 1], [0, 2],
    ],
  },
  // Row, Row, Row Your Boat (הסירה שלי)
  {
    id: 'row',
    label: 'הסירה שלי',
    bpm: 120,
    notes: [
      [0, 1], [0, 1], [0, 1.5], [2, 0.5], [4, 1.5],
      [4, 0.5], [2, 0.5], [4, 0.5], [5, 0.5], [7, 2],
      [12, 0.5], [12, 0.5], [7, 0.5], [7, 0.5], [4, 0.5], [4, 0.5], [0, 0.5], [0, 0.5],
      [7, 0.5], [5, 0.5], [4, 0.5], [2, 0.5], [0, 2],
    ],
  },
  // London Bridge Is Falling Down (גשר לונדון)
  {
    id: 'london',
    label: 'גשר לונדון',
    bpm: 120,
    notes: [
      [7, 1.5], [9, 0.5], [7, 1], [5, 1], [4, 1], [5, 1], [7, 2],
      [2, 1], [4, 1], [5, 2], [4, 1], [5, 1], [7, 2],
      [7, 1.5], [9, 0.5], [7, 1], [5, 1], [4, 1], [5, 1], [7, 2],
      [2, 2], [7, 1], [4, 1], [0, 2],
    ],
  },
  // Hot Cross Buns
  {
    id: 'hotcross',
    label: 'באנים חמים',
    bpm: 120,
    notes: [
      [4, 1], [2, 1], [0, 2], [4, 1], [2, 1], [0, 2],
      [0, 0.5], [0, 0.5], [0, 0.5], [0, 0.5], [2, 0.5], [2, 0.5], [2, 0.5], [2, 0.5],
      [4, 1], [2, 1], [0, 2],
    ],
  },
  // Three Blind Mice (שלושה עכברים עיוורים)
  {
    id: 'threeblind',
    label: 'שלושה עכברים',
    bpm: 120,
    notes: [
      [4, 1], [2, 1], [0, 2], [4, 1], [2, 1], [0, 2],
      [7, 1], [5, 0.5], [5, 0.5], [4, 2], [7, 1], [5, 0.5], [5, 0.5], [4, 2],
    ],
  },
  // Hänschen klein (יונתן הקטן)
  {
    id: 'yonatan',
    label: 'יונתן הקטן',
    bpm: 120,
    notes: [
      [7, 1], [4, 1], [4, 2], [5, 1], [2, 1], [2, 2],
      [0, 1], [2, 1], [4, 1], [5, 1], [7, 1], [7, 1], [7, 2],
      [7, 1], [4, 1], [4, 1], [4, 1], [5, 1], [2, 1], [2, 2],
      [0, 1], [4, 1], [7, 1], [7, 1], [4, 2], [0, 2],
    ],
  },
  // Rain, Rain, Go Away
  {
    id: 'rainrain',
    label: 'גשם גשם',
    bpm: 120,
    notes: [
      [7, 1], [4, 1], [7, 1], [4, 1], [7, 1], [7, 1], [4, 2],
      [7, 1], [4, 1], [7, 1], [4, 1], [4, 1], [2, 1], [0, 2],
    ],
  },
]

export const SONG_IDS = SONGS.map((s) => s.id)
export function getSong(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id)
}
