import { readFileSync, writeFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app, type BrowserWindow, screen } from 'electron'

// Persist window size/position across restarts. Kept dependency-free (a small
// JSON file in userData) rather than pulling in electron-store — we only need
// four numbers.

interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
}

const DEFAULTS: WindowState = { width: 1280, height: 800 }
const SAVE_DEBOUNCE_MS = 400

function stateFile(): string {
  return join(app.getPath('userData'), 'window-state.json')
}

// True when the given top-left corner still lands on a connected display, so we
// don't restore a window onto a monitor that's been unplugged.
function isVisibleOnSomeDisplay(x: number, y: number): boolean {
  return screen.getAllDisplays().some((d) => {
    const b = d.bounds
    return x >= b.x && y >= b.y && x < b.x + b.width && y < b.y + b.height
  })
}

export function loadWindowState(): WindowState {
  try {
    const raw = JSON.parse(readFileSync(stateFile(), 'utf-8')) as Partial<WindowState>
    const width = Number.isFinite(raw.width) ? (raw.width as number) : DEFAULTS.width
    const height = Number.isFinite(raw.height) ? (raw.height as number) : DEFAULTS.height
    if (
      typeof raw.x === 'number' &&
      typeof raw.y === 'number' &&
      isVisibleOnSomeDisplay(raw.x, raw.y)
    ) {
      return { width, height, x: raw.x, y: raw.y }
    }
    return { width, height }
  } catch {
    // No file yet, or corrupt — fall back to defaults (window will be centred).
    return { ...DEFAULTS }
  }
}

export function manageWindowState(window: BrowserWindow): void {
  // Async write for the frequent resize/move path so disk IO never blocks the
  // main-process event loop (which handles DB queries and OG-fetch callbacks).
  async function save(): Promise<void> {
    if (window.isDestroyed() || window.isMinimized()) return
    try {
      await writeFile(stateFile(), JSON.stringify(window.getBounds()))
    } catch {
      // Persisting window bounds is best-effort; ignore write failures.
    }
  }

  // On close the process is about to exit, so write synchronously to guarantee
  // the bounds land before the event loop stops.
  function saveSync(): void {
    if (window.isDestroyed()) return
    try {
      writeFileSync(stateFile(), JSON.stringify(window.getBounds()))
    } catch {
      // best-effort
    }
  }

  let timer: NodeJS.Timeout | null = null
  function debouncedSave(): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(save, SAVE_DEBOUNCE_MS)
  }

  window.on('resize', debouncedSave)
  window.on('move', debouncedSave)
  window.on('close', saveSync)
}
