// Helpers for placing new items on the canvas without burying existing ones.

// Probe footprint for the not-yet-created item. Width matches CARD_WIDTH; the
// height is a small assumption (the new item's real height isn't known yet), but
// existing items are measured exactly so tall cards are no longer missed.
const NEW_W = 300
const NEW_H = 120
const STEP = 28
const MAX_TRIES = 200

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

// Measure the on-screen rectangle of every canvas item inside `container`.
// offsetLeft/Top are relative to the canvas surface (the offset parent), matching
// the x/y coordinate space, and offsetHeight captures each card's real height.
export function measureCardRects(container: HTMLElement): Rect[] {
  const els = container.querySelectorAll<HTMLElement>('[data-item-id]')
  return Array.from(els, (el) => ({
    x: el.offsetLeft,
    y: el.offsetTop,
    w: el.offsetWidth,
    h: el.offsetHeight
  }))
}

// Returns the requested point, or — if a new item there would overlap an
// existing card — the nearest free spot found by cascading down-right.
export function findFreeSpot(rects: Rect[], x: number, y: number): Point {
  let px = x
  let py = y
  for (let i = 0; i < MAX_TRIES; i++) {
    const probe: Rect = { x: px, y: py, w: NEW_W, h: NEW_H }
    if (!rects.some((r) => intersects(probe, r))) break
    px += STEP
    py += STEP
  }
  return { x: Math.max(0, px), y: Math.max(0, py) }
}
