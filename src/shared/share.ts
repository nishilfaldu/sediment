import type { Item } from './types'

function formatDayLabel(dayId: string): string {
  const [y, m, d] = dayId.split('-').map(Number)
  if (!y || !m || !d) return dayId
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function linkLabel(item: Item): string {
  return item.title?.trim() || item.sourceUrl || 'Link'
}

function linkNote(item: Item): string | null {
  const note = item.content?.trim()
  return note || null
}

function shareableItems(rows: Item[]): Item[] {
  return rows.filter((item) => {
    if (item.type === 'text') return Boolean(item.content?.trim())
    return Boolean(item.sourceUrl)
  })
}

/** Warm, readable paste for sharing a day (or a subset) with a friend. */
export function formatMoodboardLetter(dayId: string, rows: Item[]): string {
  const items = shareableItems(rows)

  if (items.length === 0) {
    return `Nothing saved on ${formatDayLabel(dayId)} yet.`
  }

  const lines: string[] = [`A few things that caught my eye on ${formatDayLabel(dayId)}:`, '']

  for (const item of items) {
    if (item.type === 'text') {
      lines.push(`• ${item.content!.trim()}`, '')
      continue
    }

    lines.push(`• ${linkLabel(item)}`)
    if (item.sourceUrl) lines.push(`  ${item.sourceUrl}`)
    const note = linkNote(item)
    if (note) lines.push(`  — ${note}`)
    lines.push('')
  }

  lines.push('—')
  lines.push('From Sediment')
  return lines.join('\n')
}

/** Compact share block for one or more selected items (no day framing). */
export function formatItemsForFriend(rows: Item[]): string {
  const items = shareableItems(rows)

  if (items.length === 0) return ''

  const lines: string[] = []
  for (const item of items) {
    if (item.type === 'text') {
      if (lines.length > 0) lines.push('')
      lines.push(item.content!.trim())
      continue
    }

    if (lines.length > 0) lines.push('')
    lines.push(linkLabel(item))
    if (item.sourceUrl) lines.push(item.sourceUrl)
    const note = linkNote(item)
    if (note) lines.push(`— ${note}`)
  }

  return lines.join('\n')
}

/** Archive-style Markdown for one or more items (no day heading). */
export function formatItemsMarkdown(rows: Item[]): string {
  const lines: string[] = []

  for (const item of rows) {
    if (item.type === 'text') {
      if (item.content?.trim()) lines.push(item.content.trim(), '')
      continue
    }
    const label = linkLabel(item)
    lines.push(`- [${label}](${item.sourceUrl ?? ''})`)
    const note = linkNote(item)
    if (note) lines.push(`  ${note}`)
    else if (item.description?.trim()) lines.push(`  ${item.description.trim()}`)
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

/** Archive-style Markdown for a day (includes optional link notes). */
export function formatDayMarkdown(dayId: string, rows: Item[]): string {
  const body = formatItemsMarkdown(rows)
  if (!body) return `# Sediment — ${dayId}\n`
  return [`# Sediment — ${dayId}`, '', body, ''].join('\n')
}
