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

export const PLATFORM_COLOURS: Record<Platform, string> = {
  twitter: 'bg-stone-900 text-white',
  instagram: 'bg-pink-500 text-white',
  bluesky: 'bg-sky-500 text-white',
  youtube: 'bg-red-600 text-white',
  vimeo: 'bg-cyan-600 text-white'
}
