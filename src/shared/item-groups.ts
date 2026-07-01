import type { Item, ItemType } from './types'

const LINK_ARTIFACT_TYPES = new Set<ItemType>(['link', 'video', 'social', 'image'])

export type WorkspaceTab = 'links' | 'notes'

export function isLinkArtifact(type: ItemType): boolean {
  return LINK_ARTIFACT_TYPES.has(type)
}

export function isNote(type: ItemType): boolean {
  return type === 'text'
}

export function workspaceTabForItemType(type: ItemType): WorkspaceTab {
  return isLinkArtifact(type) ? 'links' : 'notes'
}

export interface PartitionedWorkspaceItems {
  links: Item[]
  notes: Item[]
  linkCount: number
  noteCount: number
}

export function partitionWorkspaceItems(items: Item[]): PartitionedWorkspaceItems {
  const links: Item[] = []
  const notes: Item[] = []
  for (const item of items) {
    if (isLinkArtifact(item.type)) links.push(item)
    else if (isNote(item.type)) notes.push(item)
  }
  return { links, notes, linkCount: links.length, noteCount: notes.length }
}
