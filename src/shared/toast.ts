import { getLinkPresentation, youtubeVideoId } from './link-presentation'

/** How long the capture Undo affordance stays up (in-app and background overlay). */
export const CAPTURE_TOAST_MS = 8_000

/** Short toast for non-undo messages (export, duplicate, etc.). */
export const BRIEF_TOAST_MS = 3_000

export interface LinkCapturePreview {
  tagLabel: string
  /** Host + truncated path, for recognizing what was saved. */
  detail: string
  thumbnailUrl: string | null
}

const DETAIL_MAX = 52

/** Sync preview bits available at capture time (before OG metadata lands). */
export function linkCapturePreview(sourceUrl: string): LinkCapturePreview {
  const presentation = getLinkPresentation(sourceUrl)
  let detail = sourceUrl

  try {
    const url = new URL(sourceUrl)
    const host = url.hostname.replace(/^www\./, '')
    const path = `${url.pathname}${url.search}`
    if (path && path !== '/') {
      const clipped = path.length > DETAIL_MAX ? `${path.slice(0, DETAIL_MAX)}…` : path
      detail = `${host}${clipped}`
    } else {
      detail = host
    }
  } catch {
    if (detail.length > DETAIL_MAX + 16) {
      detail = `${detail.slice(0, DETAIL_MAX + 16)}…`
    }
  }

  const ytId = presentation.platform === 'youtube' ? youtubeVideoId(sourceUrl) : null
  const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null

  return {
    tagLabel: presentation.tagLabel,
    detail,
    thumbnailUrl
  }
}
