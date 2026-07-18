import { acceleratorFromKeyboardEvent, displayAccelerator } from '@shared/hotkey'
import type { UpdaterStatus } from '@shared/ipc'
import type { JSX } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDismiss } from '@/hooks/use-dismiss'
import { useToast } from '@/stores/toast'

export function SettingsMenu(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [hotkey, setHotkey] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [updater, setUpdater] = useState<UpdaterStatus | null>(null)
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
    void window.api.updater.getStatus().then(setUpdater)
  }, [open])

  useEffect(() => {
    return window.api.on.updaterStatus(setUpdater)
  }, [])

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

  const busy =
    updater?.state === 'checking' ||
    updater?.state === 'downloading' ||
    updater?.state === 'installing'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-secondary transition-colors hover:text-primary"
      >
        Settings
        {updater?.state === 'available' && (
          <span className="ml-1.5 inline-block size-1.5 rounded-full bg-iron align-middle" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1.5 w-[280px] border border-ui bg-card p-3 font-sans text-secondary shadow-popover">
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

          <div className="mt-4 border-t border-ui pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Updates</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {updaterLabel(updater)}
            </p>

            {updater?.state === 'downloading' && updater.progress != null && (
              <div className="mt-2 h-1 w-full bg-panel">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${Math.round(updater.progress * 100)}%` }}
                />
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              {updater?.state === 'available' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void window.api.updater.install()}
                  className="border border-ink bg-ink px-2.5 py-1.5 font-mono text-[11px] text-paper disabled:opacity-50"
                >
                  Install v{updater.availableVersion}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy || updater?.supported === false}
                  onClick={() => void window.api.updater.check()}
                  className="border border-ui px-2.5 py-1.5 font-mono text-[11px] text-secondary hover:border-primary disabled:opacity-50"
                >
                  {updater?.state === 'checking' ? 'Checking…' : 'Check for updates'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function updaterLabel(status: UpdaterStatus | null): string {
  if (!status) return 'Loading…'
  if (!status.supported) {
    return `v${status.currentVersion} (packaged builds can auto-update)`
  }
  switch (status.state) {
    case 'idle':
      return `Current version v${status.currentVersion}.`
    case 'checking':
      return 'Checking GitHub Releases…'
    case 'up-to-date':
      return `You're on v${status.currentVersion} - up to date.`
    case 'available':
      return `v${status.availableVersion} is ready. Install replaces this app and relaunches.`
    case 'downloading':
      return `Downloading v${status.availableVersion}…`
    case 'installing':
      return 'Installing and relaunching…'
    case 'error':
      return status.error ?? 'Update failed.'
    default: {
      const _exhaustive: never = status.state
      return _exhaustive
    }
  }
}
