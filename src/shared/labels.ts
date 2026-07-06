import type { ItemType, Platform } from './types'

export const TYPE_LABELS: Record<ItemType, string> = {
  text: 'text',
  link: 'link',
  video: 'video',
  social: 'post',
  image: 'image'
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  twitter: 'X / Twitter',
  instagram: 'Instagram',
  bluesky: 'Bluesky'
}
