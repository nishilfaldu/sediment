// Derives today's dayId from the LOCAL calendar date.
// Avoids new Date().toISOString() which gives UTC and can return the wrong date.
export function todayId(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
