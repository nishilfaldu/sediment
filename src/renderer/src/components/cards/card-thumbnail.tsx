import type { JSX, ReactNode } from 'react'

export interface CardThumbnailProps {
  src: string
  alt?: string
  badge?: ReactNode
  onClick?: () => void
  buttonLabel?: string
  overlay?: ReactNode
}

export function CardThumbnail({
  src,
  alt = '',
  badge,
  onClick,
  buttonLabel,
  overlay
}: CardThumbnailProps): JSX.Element {
  const image = <img src={src} alt={alt} className="h-40 w-full object-cover" loading="lazy" />

  const content = (
    <>
      {badge && <div className="absolute left-3 top-3 z-10">{badge}</div>}
      {image}
      {overlay}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative block w-full text-left"
        aria-label={buttonLabel}
      >
        {content}
      </button>
    )
  }

  return <div className="relative w-full">{content}</div>
}
