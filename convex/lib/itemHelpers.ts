export function buildSearchText(fields: {
  title?: string | null
  description?: string | null
  content?: string | null
  sourceUrl?: string | null
}): string {
  return [fields.title, fields.description, fields.content, fields.sourceUrl]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join('\n')
}
