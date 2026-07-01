import { useRef, useState } from 'react'
import { detectUrl } from '@shared/detect-url'
import { useCreateItem } from '@/hooks/use-items'
import { findFreeSpot, measureCardRects } from '@/lib/layout'

const CASCADE = 24

export interface BoardDropHandlers {
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
}

export interface UseBoardDrop {
  isDraggingOver: boolean
  dropHandlers: BoardDropHandlers
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function firstUri(uriList: string): string | null {
  const line = uriList
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith('#'))
  return line ?? null
}

export function useBoardDrop(dayId: string): UseBoardDrop {
  const createItem = useCreateItem()
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const dragDepth = useRef(0)

  function onDragEnter(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    dragDepth.current += 1
    setIsDraggingOver(true)
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function onDragLeave(): void {
    dragDepth.current -= 1
    if (dragDepth.current <= 0) {
      dragDepth.current = 0
      setIsDraggingOver(false)
    }
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>): Promise<void> {
    e.preventDefault()
    dragDepth.current = 0
    setIsDraggingOver(false)

    const rect = e.currentTarget.getBoundingClientRect()
    const base = findFreeSpot(
      measureCardRects(e.currentTarget),
      Math.round(e.clientX - rect.left),
      Math.round(e.clientY - rect.top)
    )
    const imageFiles = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    const uriList = e.dataTransfer.getData('text/uri-list')
    const plainText = e.dataTransfer.getData('text/plain')

    if (imageFiles.length > 0) {
      const dataUrls = await Promise.all(imageFiles.map((f) => readAsDataUrl(f).catch(() => null)))
      dataUrls.forEach((dataUrl, i) => {
        if (!dataUrl) return
        createItem.mutate({
          dayId,
          type: 'image',
          content: dataUrl,
          x: base.x + i * CASCADE,
          y: base.y + i * CASCADE
        })
      })
      return
    }

    const raw = firstUri(uriList) ?? plainText.trim()
    if (!raw) return

    const detected = detectUrl(raw)
    if (detected) {
      createItem.mutate({
        dayId,
        type: detected.type,
        sourceUrl: detected.sourceUrl,
        platform: detected.platform,
        x: base.x,
        y: base.y
      })
    } else {
      createItem.mutate({ dayId, type: 'text', content: raw, x: base.x, y: base.y })
    }
  }

  return {
    isDraggingOver,
    dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop }
  }
}
