import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

export interface AppSettings {
  /** Electron accelerator, e.g. "CommandOrControl+Shift+S". Null = disabled. */
  globalHotkey: string | null
}

const DEFAULTS: AppSettings = {
  globalHotkey: null
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export function loadSettings(): AppSettings {
  try {
    const raw = readFileSync(settingsPath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      globalHotkey:
        typeof parsed.globalHotkey === 'string' && parsed.globalHotkey.length > 0
          ? parsed.globalHotkey
          : null
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(settings: AppSettings): void {
  writeFileSync(settingsPath(), `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
}
