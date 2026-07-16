/** Build an Electron accelerator string from a DOM keyboard event. */

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph'])

function keyFromEvent(code: string, key: string): string | null {
  // Prefer physical key codes so Option/Alt doesn't turn F into ƒ, etc.
  if (code.startsWith('Key') && code.length === 4) return code.slice(3)
  if (code.startsWith('Digit') && code.length === 6) return code.slice(5)
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code
  if (code === 'Space') return 'Space'
  if (code.startsWith('Arrow')) return code.slice(5)
  if (code === 'Escape') return 'Escape'
  if (code === 'Tab') return 'Tab'
  if (code === 'Enter' || code === 'NumpadEnter') return 'Return'
  if (code === 'Backspace') return 'Backspace'
  if (code === 'Delete') return 'Delete'
  if (code === 'Home') return 'Home'
  if (code === 'End') return 'End'
  if (code === 'PageUp') return 'PageUp'
  if (code === 'PageDown') return 'PageDown'

  const punctuation: Record<string, string> = {
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backslash: '\\',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Semicolon: ';',
    Quote: "'",
    Backquote: '`'
  }
  if (punctuation[code]) return punctuation[code]

  if (key === 'Dead' || MODIFIER_KEYS.has(key)) return null
  if (/^[a-zA-Z0-9]$/.test(key)) return key.toUpperCase()
  return null
}

/**
 * Convert a keydown into an Electron accelerator, or null if incomplete
 * (modifier-only) / reserved (Escape clears capture, Backspace clears hotkey).
 */
export function acceleratorFromKeyboardEvent(e: {
  key: string
  code: string
  metaKey: boolean
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
}): string | null {
  if (e.key === 'Escape' || e.key === 'Tab') return null
  if (e.key === 'Backspace' || e.key === 'Delete') return null
  if (MODIFIER_KEYS.has(e.key)) return null

  const parts: string[] = []

  // Keep Command and Control distinct when both are held (⌘⌃T).
  // Otherwise use CommandOrControl for a lone ⌘/Ctrl press.
  if (e.metaKey && e.ctrlKey) {
    parts.push('Command', 'Control')
  } else if (e.metaKey) {
    parts.push('CommandOrControl')
  } else if (e.ctrlKey) {
    parts.push('Control')
  }

  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')

  // Need at least one modifier so we don't steal bare letter keys globally.
  if (parts.length === 0) return null

  const key = keyFromEvent(e.code, e.key)
  if (!key) return null

  parts.push(key)
  return parts.join('+')
}

export function displayAccelerator(accelerator: string | null): string {
  if (!accelerator) return 'Not set'
  return accelerator
    .replaceAll('CommandOrControl', '⌘')
    .replaceAll('Command', '⌘')
    .replaceAll('Control', '⌃')
    .replaceAll('Alt', '⌥')
    .replaceAll('Shift', '⇧')
    .replaceAll('+', '')
}
