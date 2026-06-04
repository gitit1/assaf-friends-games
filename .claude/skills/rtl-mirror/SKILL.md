---
name: rtl-mirror
description: Use whenever building, editing, or reviewing UI in this app (any component, app.css, button rows, arrows, icons, navigation, layout). This is a Hebrew-FIRST / RTL app with an English (LTR) mode — directional things must mirror correctly in BOTH. Catches the easy-to-miss bug where a row of buttons or a directional icon looks right in LTR but backwards in RTL.
---

# RTL mirroring — assaf-friends-games

This app is **Hebrew-first / RTL** (the default language is `he`, `document.dir = 'rtl'`).
It also has an **English / LTR** mode. **Every UI change must look correct in BOTH.**
Hebrew is the one that matters most — it is what Assaf actually uses.

## The core rule

Anything with a **leading/trailing or left/right meaning must mirror** when the
language flips. Do NOT hard-code left/right. Let the document `dir` drive it.

### Button / control rows
A `display:flex` row **already honours `dir`**: the FIRST DOM child sits on the
**right in RTL** and on the **left in LTR**. So order the DOM by *meaning*
(leading element first) and let flex mirror it — never reorder by hard-coded side.

- Leading control (back / the primary "go up") → put it **first in the DOM**.
  In RTL it lands on the right (correct), in LTR on the left (correct).
- Example bug that already happened: home was first, back second → in RTL home
  ended up on the right and the back arrow on the left, i.e. **reversed**. Fix was
  to put **back first, home second** (see `GameShell.tsx` `.game-controls`).

### Directional glyphs (arrows, chevrons)
Flex mirrors *layout*, but a **character glyph is NOT mirrored**. Pick it by language:

```ts
const backArrow = lang === 'he' ? '→' : '←' // back points to the START side
```

In RTL the start is the **right** (→); in LTR it's the **left** (←). `useT()`
returns `lang`. `←/→/◀/▶` are not auto-mirrored by the browser, so choose them
explicitly (or flip with CSS) — don't assume.

### CSS
- Prefer logical properties: `margin-inline-start`, `inset-inline-start`,
  `padding-inline-end`, `text-align: start` — they flip with `dir` for free.
- Avoid `left:` / `right:` / `margin-left:` for anything that should mirror.
- Intentional exceptions exist: an **equation / number line** stays LTR on purpose
  (`direction: ltr`), e.g. `7 = 3 + 4` and the friend-split row, because maths reads
  left-to-right in Hebrew too. Mark such exceptions with a comment.

## Before you finish any UI change — verify both directions

1. Read it in your head as **RTL (he)**: is the leading control on the **right**?
   Does the back arrow point **right**? Is the row order mirrored vs LTR?
2. Switch the language toggle (Settings) to **English** and confirm it mirrors to
   the left and still reads naturally.
3. If something looks identical in both, double-check it actually *should* be
   (icons/arrows usually should differ; centered text usually should not).

When in doubt, compare against the home screen (`.home-controls`) and `GameShell`'s
`.game-controls`, which are the reference for a correct mirrored control row.
