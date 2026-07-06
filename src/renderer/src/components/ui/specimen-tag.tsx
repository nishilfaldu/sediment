import type { JSX, ReactNode } from 'react'
import { specimenTagClass, specimenTagOverlayClass } from '@/lib/ui-classes'

export interface SpecimenTagProps {
  children: ReactNode
  /** Semi-transparent background for badges over thumbnails. */
  overlay?: boolean
  className?: string
}

export function SpecimenTag({
  children,
  overlay = false,
  className = ''
}: SpecimenTagProps): JSX.Element {
  const base = overlay ? specimenTagOverlayClass : specimenTagClass
  return <span className={className ? `${base} ${className}` : base}>{children}</span>
}
