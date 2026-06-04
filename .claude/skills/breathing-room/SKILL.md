---
name: breathing-room
description: Use whenever adding or editing UI in this app (any component, app.css, a new button/panel/screen, a new animation). Before finishing, verify spacing/padding so nothing is cramped or overlapping — between top-bar buttons and the title, between a title and the content under it, around nav/movement arrows, and between text and the friend/image. Pairs with the rtl-mirror skill.
---

# Breathing room — assaf-friends-games

This is a calm, sensory-friendly app for a young child. Cramped or overlapping
elements read as broken and are visually stressful. **Every time you add or move
something, check it has room to breathe.**

## Always verify these gaps

- **Top-bar buttons → the title / whatever is below them.** Give a *fixed,
  consistent* margin under the control row (e.g. `.game-controls { margin-bottom }`)
  so the title never sticks to the buttons. The title must "breathe".
- **Title → content below it.** A clear gap, not touching.
- **Around navigation / movement arrows** (prev/next pagers, ◀ ▶). They should
  look like an intentional group, not float "detached". Group them (e.g. put the
  current number between the arrows) and give margin above/below.
- **Text → image/friend.** A label, an equation, and a friend stacked together
  need real gap between each (`gap` on the flex column, ~18–20px), never
  overlapping ("one on top of the other").
- **Inside bursts/animations**, make sure effects are *centered on* their subject
  (e.g. hearts should emanate from the friend, not scatter to the screen edges),
  and that scaled content (split friends, etc.) stays **inside the screen** — if
  it clips the edges, shrink the scale fraction.

## How to do it cleanly

- Prefer a `gap` on a flex/grid container over per-child margins.
- Use a consistent rhythm (e.g. ~14px between sibling controls, ~20–22px between
  a header block and the content under it).
- After the change, picture the screen on a **phone width**: does anything touch,
  overlap, or run off the edge? Fix the scale/gap, don't ship it cramped.

Reference layouts that get this right: the home screen header and `GameShell`'s
`.game-controls` → `.game-title` spacing.
