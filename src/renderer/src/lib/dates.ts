import { format, isToday, isYesterday } from 'date-fns'

// dayId ("2026-05-26") is a LOCAL calendar date, not a UTC moment.
// Timestamps (createdAt, updatedAt) are UTC epoch ms; display them via
// new Date(ms) which date-fns automatically formats in the user's local zone.
//
// Why dayId is local: if a user in UTC-4 saves something at 10 PM, their
// local date is May 26 but UTC is already May 27 — a UTC-derived dayId would
// put the item on tomorrow's board.

// Parse dayId as local noon so isToday/isYesterday work correctly.
// Appending T12:00:00 (no Z) = local time; noon is safely within the correct
// day for every UTC offset (-12 to +14).
function parseDayId(dayId: string): Date {
  return new Date(`${dayId}T12:00:00`)
}

export function formatDayHeading(dayId: string): string {
  const d = parseDayId(dayId)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, MMMM d') // "Monday, May 26"
}

export function formatDaySidebar(dayId: string): string {
  const d = parseDayId(dayId)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d') // "May 26"
}

// Derives today's dayId from the LOCAL calendar date.
// Avoids new Date().toISOString() which gives UTC and can return the wrong date.
export function todayId(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
