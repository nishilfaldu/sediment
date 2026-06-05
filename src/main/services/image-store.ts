import { mkdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { app } from 'electron'

// Single source of truth for the in-app image scheme/location. image-store
// builds these URLs, protocol.ts serves them, and export.ts resolves them back
// to disk — all via the helpers here so the scheme/dir live in one place.
export const IMAGE_URL_PREFIX = 'sediment://images/'

// userData on macOS: ~/Library/Application Support/sediment/
export function imagesDir(): string {
  return join(app.getPath('userData'), 'images')
}

// Resolve a sediment://images/<file> URL to its absolute path on disk, or null
// if the URL isn't one of ours. basename() strips any path components to keep
// the result inside the images dir (path-traversal guard).
export function imageUrlToDiskPath(url: string | null | undefined): string | null {
  if (!url?.startsWith(IMAGE_URL_PREFIX)) return null
  return join(imagesDir(), basename(url.slice(IMAGE_URL_PREFIX.length)))
}

// Decodes a base64 data URL and writes it to userData/images/<id>.png.
// Returns a sediment:// URL; protocol.ts maps it back to the same directory.
export function saveImageDataUrl(id: string, dataUrl: string): string {
  const dir = imagesDir()
  mkdirSync(dir, { recursive: true })

  // dataUrl format: "data:<mime>;base64,<base64data>"
  const commaIdx = dataUrl.indexOf(',')
  if (commaIdx === -1) throw new Error('Malformed data URL — no comma separator')

  writeFileSync(join(dir, `${id}.png`), Buffer.from(dataUrl.slice(commaIdx + 1), 'base64'))

  return `${IMAGE_URL_PREFIX}${id}.png`
}
