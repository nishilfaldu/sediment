import type { JSX } from 'react'
import { ExternalLinkIcon } from '@/components/icons/external-link-icon'

export interface CardOpenButtonProps {
  label?: string
  url: string
}

export function CardOpenButton({ label = 'Open', url }: CardOpenButtonProps): JSX.Element {
  function open(): void {
    window.open(url, '_blank')
  }

  return (
    <button
      type="button"
      onClick={open}
      className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-stone-400 hover:bg-stone-100 hover:text-stone-600"
    >
      {label} <ExternalLinkIcon />
    </button>
  )
}
