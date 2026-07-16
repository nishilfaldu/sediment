import { acceleratorFromKeyboardEvent, displayAccelerator } from '@shared/hotkey'
import type { JSX } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDismiss } from '@/hooks/use-dismiss'
import { useToast } from '@/stores/toast'

export function SettingsMenu(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [hotkey, setHotkey] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLButtonElement>(null)
  const showToast = useToast((s) => s.show)

  useDismiss(
    ref,
    () => {
      setOpen(false)
      setCapturing(false)
    },
    open
  )

  useEffect(() => {
    if (!open) return
    void window.api.settings.get().then((s) => setHotkey(s.globalHotkey))
  }, [open])

  const saveHotkey = useCallback(
    async (next: string | null): Promise<void> => {
      const result = await window.api.settings.setGlobalHotkey(next)
      setHotkey(result.globalHotkey)
      setCapturing(false)
      if (!result.ok) {
        showToast(result.error ?? 'Could not set shortcut')
        return
      }
      showToast(next ? `Hotkey set to ${displayAccelerator(next)}` : 'Hotkey cleared')
    },
    [showToast]
  )

  // Listen on window in the capture phase so ⌘⌥ / ⌘⌃ combos aren't lost
  // (Option remaps e.key; we read e.code instead via the shared helper).
  useEffect(() => {
    if (!capturing) return

    function onKeyDown(e: KeyboardEvent): void {
      e.preventDefault()
      e.stopPropagation()

      if (e.key === 'Escape') {
        setCapturing(false)
        return
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        void saveHotkey(null)
        return
      }

      const accel = acceleratorFromKeyboardEvent(e)
      if (accel) void saveHotkey(accel)
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [capturing, saveHotkey])

  useEffect(() => {
    if (capturing) captureRef.current?.focus()
  }, [capturing])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-secondary transition-colors hover:text-primary"
      >
        Settings
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1.5 w-[260px] border border-ui bg-card p-3 font-sans text-secondary shadow-popover">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Global hotkey
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Bring Sediment to the front from anywhere. Combine ⌘ with ⌥ or ⌃ for multi-key
            shortcuts.
          </p>

          <button
            ref={captureRef}
            type="button"
            onClick={() => setCapturing(true)}
            className={`mt-3 w-full border px-3 py-2 text-left font-mono text-[12px] outline-none ${
              capturing
                ? 'border-primary bg-panel text-primary'
                : 'border-ui bg-surface text-secondary hover:border-primary'
            }`}
          >
            {capturing ? 'Press a shortcut…' : displayAccelerator(hotkey)}
          </button>

          {hotkey && !capturing && (
            <button
              type="button"
              onClick={() => void saveHotkey(null)}
              className="mt-2 text-xs text-muted hover:text-iron"
            >
              Clear hotkey
            </button>
          )}
        </div>
      )}
    </div>
  )
}
