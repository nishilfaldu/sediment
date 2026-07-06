import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import type { Item } from '@/types'

export interface ImageCardProps {
  item: Item
}

export function ImageCard({ item }: ImageCardProps): JSX.Element {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const src = item.imagePath ?? item.content ?? ''

  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightboxOpen])

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block w-full"
        aria-label="View full image"
      >
        <img src={src} alt="" className="max-h-64 w-full object-cover" loading="lazy" />
      </button>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-primary/85 p-8"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <img
            src={src}
            alt=""
            className="max-h-full max-w-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
