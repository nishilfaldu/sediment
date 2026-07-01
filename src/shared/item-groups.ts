import type { ItemType } from './types'

const LINK_ARTIFACT_TYPES = new Set<ItemType>(['link', 'video', 'social', 'image'])

export function isLinkArtifact(type: ItemType): boolean {
  return LINK_ARTIFACT_TYPES.has(type)
}

export function isNote(type: ItemType): boolean {
  return type === 'text'
}
