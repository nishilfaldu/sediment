import type { JSX } from 'react'
import { useToast } from '@/stores/toast'

export function Toast(): JSX.Element {
  const { message, visible, action, dismiss } = useToast()

  return (
    <div
      className={`fixed bottom-12 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 rounded-full bg-stone-900 px-4 py-1.5 text-sm text-white shadow-lg dark:bg-stone-100 dark:text-stone-900">
        <span>{message}</span>
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick()
              dismiss()
            }}
            className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium hover:bg-white/25 dark:bg-stone-900/15 dark:hover:bg-stone-900/25"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
