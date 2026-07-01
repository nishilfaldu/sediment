import { useRef, useState, type RefObject } from 'react'
import { useDrag } from '@/stores/drag'

const DRAG_THRESHOLD = 8

export interface UseCanvasDragOptions {
  x: number
  y: number
  onMove: (x: number, y: number) => void
  onBringToFront: () => void
}

export interface UseCanvasDragResult {
  elementRef: RefObject<HTMLDivElement | null>
  isDragging: boolean
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void
    onPointerCancel: () => void
    onClickCapture: (e: React.MouseEvent) => void
  }
}

export function useCanvasDrag({ x, y, onMove, onBringToFront }: UseCanvasDragOptions): UseCanvasDragResult {
  const [isDragging, setIsDragging] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{
    startPointer: { x: number; y: number }
    startItem: { x: number; y: number }
    captured: boolean
  } | null>(null)
  const justDragged = useRef(false)

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>): void {
    if ((e.target as HTMLElement).closest('input,textarea,[contenteditable]')) return
    justDragged.current = false
    onBringToFront()
    drag.current = {
      startPointer: { x: e.clientX, y: e.clientY },
      startItem: { x, y },
      captured: false
    }
  }

  function onClickCapture(e: React.MouseEvent): void {
    if (justDragged.current) {
      justDragged.current = false
      e.preventDefault()
      e.stopPropagation()
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    if (!drag.current) return
    const dx = e.clientX - drag.current.startPointer.x
    const dy = e.clientY - drag.current.startPointer.y
    if (!drag.current.captured) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      e.currentTarget.setPointerCapture(e.pointerId)
      drag.current.captured = true
      setIsDragging(true)
      useDrag.getState().setDragging(true)
    }
    if (elementRef.current) {
      elementRef.current.style.transform = `translate(${dx}px, ${dy}px)`
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>): void {
    if (drag.current?.captured) {
      const dx = e.clientX - drag.current.startPointer.x
      const dy = e.clientY - drag.current.startPointer.y
      const newX = Math.max(0, drag.current.startItem.x + dx)
      const newY = Math.max(0, drag.current.startItem.y + dy)
      justDragged.current = true
      if (newX === x && newY === y) {
        if (elementRef.current) elementRef.current.style.transform = ''
      } else {
        onMove(newX, newY)
      }
    }
    drag.current = null
    setIsDragging(false)
    useDrag.getState().setDragging(false)
  }

  function onPointerCancel(): void {
    if (elementRef.current) elementRef.current.style.transform = ''
    drag.current = null
    setIsDragging(false)
    useDrag.getState().setDragging(false)
  }

  return {
    elementRef,
    isDragging,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onClickCapture
    }
  }
}
