import type { JSX } from 'react'

export function PlayIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="white"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.55)" />
      <polygon points="10,8 18,12 10,16" fill="white" />
    </svg>
  )
}
