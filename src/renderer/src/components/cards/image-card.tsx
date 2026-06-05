import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import type { Item } from '@/types'

export interface ImageCardProps {
  item: Item
}

export function ImageCard({ item }: ImageCardProps): JSX.Element {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  // imagePath holds the sediment:// URL written by image-store.ts
  const src = item.imagePath ?? item.content ?? ''

  // Listen for Escape on the document rather than adding tabIndex to the overlay
  // div — that avoids placing focus management on a non-interactive element.
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
      <div className="-mx-4 -my-4 overflow-hidden rounded-xl">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="block w-full"
          aria-label="View full image"
        >
          <img src={src} alt="" className="w-full object-cover" loading="lazy" />
        </button>
      </div>

      {/* Lightbox — fixed overlay, click backdrop or Escape to close */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={src}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
