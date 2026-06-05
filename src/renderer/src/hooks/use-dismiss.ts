import { useEffect } from 'react'

// Calls onDismiss when a pointerdown lands outside `ref` or Escape is pressed.
// Pass active=false to disable the listeners (e.g. while a popover is closed).
// The ref is typed structurally so any element ref works without variance fuss.
export function useDismiss(
  ref: { readonly current: HTMLElement | null },
  onDismiss: () => void,
  active = true
): void {
  useEffect(() => {
    if (!active) return
    function handleDown(e: PointerEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss()
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('pointerdown', handleDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [ref, onDismiss, active])
}
