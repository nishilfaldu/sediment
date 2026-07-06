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
      <div className="flex items-center gap-3 bg-primary px-4 py-2 font-mono text-[12px] text-surface shadow-toast">
        <span>{message}</span>
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick()
              dismiss()
            }}
            className="bg-iron px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.1em] text-surface hover:brightness-110"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
