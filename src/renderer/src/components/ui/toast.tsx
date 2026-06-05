import type { JSX } from 'react'
import { useToast } from '@/stores/toast'

export function Toast(): JSX.Element {
  const { message, visible } = useToast()

  return (
    /*
     * Fixed to the bottom-centre of the viewport, above the bottom bar.
     * Slides up 4px and fades in when visible; slides down and fades out
     * when dismissed. pointer-events-none when hidden so it doesn't intercept
     * clicks on the canvas below.
     */
    <div
      className={`fixed bottom-12 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
      }`}
    >
      <div className="rounded-full bg-stone-900 px-4 py-1.5 text-sm text-white shadow-lg">
        {message}
      </div>
    </div>
  )
}
