import { CARD_WIDTH } from '@shared/constants'

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

export function measureCardRects(container: HTMLElement): Rect[] {
  const els = container.querySelectorAll<HTMLElement>('[data-item-id]')
  return Array.from(els, (el) => ({
    x: el.offsetLeft,
    y: el.offsetTop,
    w: el.offsetWidth,
    h: el.offsetHeight
  }))
}

export function findFreeSpot(rects: Rect[], x: number, y: number): Point {
  let px = x
  let py = y
  for (let i = 0; i < MAX_TRIES; i++) {
    const probe: Rect = { x: px, y: py, w: CARD_WIDTH, h: NEW_H }
    if (!rects.some((r) => intersects(probe, r))) break
    px += STEP
    py += STEP
  }
  return { x: Math.max(0, px), y: Math.max(0, py) }
}
