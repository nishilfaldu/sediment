export interface DetectedText {
  type: 'text'
  content: string
}

export interface DetectedLink {
  type: 'link'
  sourceUrl: string
}

export type DetectedContent = DetectedText | DetectedLink

/*
 * Decide whether clipboard/hotkey input is plain text or a URL.
 * Platform-specific tags (YouTube, X, etc.) are derived at display time
 * from the URL — not stored on the row.
 */
export function detectContent(raw: string): DetectedContent {
  const text = raw.trim()

  try {
    const url = new URL(text)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { type: 'link', sourceUrl: url.href }
    }
  } catch {
    // Not a URL — treat as plain text
  }

  return { type: 'text', content: text }
}

export function detectUrl(raw: string): DetectedLink | null {
  const detected = detectContent(raw)
  return detected.type === 'link' ? detected : null
}
