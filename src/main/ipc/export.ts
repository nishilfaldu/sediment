import { writeFile } from 'node:fs/promises'
import {
  formatDayMarkdown,
  formatItemsForFriend,
  formatItemsMarkdown,
  formatMoodboardLetter
} from '@shared/share'
import { asc, eq, inArray } from 'drizzle-orm'
import { BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron'
import { getDb } from '../db'
import { type Item, items } from '../db/schema'
import { ignoreNextClipboardWrites } from '../services/clipboard-watcher'

export interface ExportResult {
  saved: boolean
  filePath?: string
}

export type AiProvider = 'chatgpt' | 'claude'

const PROMPT_URL_LIMIT = 4000

function getDayItems(dayId: string): Item[] {
  return getDb()
    .select()
    .from(items)
    .where(eq(items.dayId, dayId))
    .orderBy(asc(items.createdAt))
    .all()
}

function getItemsByIds(ids: string[]): Item[] {
  if (ids.length === 0) return []
  const rows = getDb().select().from(items).where(inArray(items.id, ids)).all()
  const order = new Map(ids.map((id, i) => [id, i]))
  return rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

function getDayMarkdown(dayId: string): string {
  return formatDayMarkdown(dayId, getDayItems(dayId))
}

function aiUrl(provider: AiProvider, prompt: string): string {
  const q = encodeURIComponent(
    prompt.length > PROMPT_URL_LIMIT
      ? `${prompt.slice(0, PROMPT_URL_LIMIT)}\n\n…(truncated)`
      : prompt
  )
  return provider === 'chatgpt' ? `https://chatgpt.com/?q=${q}` : `https://claude.ai/new?q=${q}`
}

export function registerExportHandlers(): void {
  ipcMain.handle('export:day', async (e, dayId: string): Promise<ExportResult> => {
    const markdown = getDayMarkdown(dayId)
    const win = BrowserWindow.fromWebContents(e.sender)

    const { canceled, filePath } = await dialog.showSaveDialog(
      win ?? BrowserWindow.getAllWindows()[0],
      {
        title: 'Export day as Markdown',
        defaultPath: `sediment-${dayId}.md`,
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      }
    )

    if (canceled || !filePath) return { saved: false }

    await writeFile(filePath, markdown, 'utf-8')
    return { saved: true, filePath }
  })

  ipcMain.handle('export:copyMarkdown', (_e, dayId: string): void => {
    ignoreNextClipboardWrites()
    clipboard.writeText(getDayMarkdown(dayId))
  })

  ipcMain.handle('export:copyForFriend', (_e, dayId: string): void => {
    ignoreNextClipboardWrites()
    clipboard.writeText(formatMoodboardLetter(dayId, getDayItems(dayId)))
  })

  ipcMain.handle('export:copyItemsForFriend', (_e, ids: string[]): void => {
    ignoreNextClipboardWrites()
    clipboard.writeText(formatItemsForFriend(getItemsByIds(ids)))
  })

  ipcMain.handle('export:copyItemsMarkdown', (_e, ids: string[]): void => {
    ignoreNextClipboardWrites()
    clipboard.writeText(formatItemsMarkdown(getItemsByIds(ids)))
  })

  ipcMain.handle('export:openInAi', (_e, dayId: string, provider: AiProvider): Promise<void> => {
    return shell.openExternal(aiUrl(provider, getDayMarkdown(dayId)))
  })

  ipcMain.handle(
    'export:openItemsInAi',
    (_e, ids: string[], provider: AiProvider): Promise<void> => {
      return shell.openExternal(aiUrl(provider, formatItemsMarkdown(getItemsByIds(ids))))
    }
  )
}
