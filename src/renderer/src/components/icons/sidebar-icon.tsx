import type { JSX } from 'react'

export function SidebarIcon(): JSX.Element {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="13" height="13" rx="2" />
      <line x1="5" y1="1" x2="5" y2="14" />
    </svg>
  )
}
