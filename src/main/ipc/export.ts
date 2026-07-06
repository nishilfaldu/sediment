import { writeFile } from 'node:fs/promises'
import { asc, eq } from 'drizzle-orm'
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

function renderMarkdown(dayId: string, rows: Item[]): string {
  const lines: string[] = [`# Sediment — ${dayId}`, '']

  for (const item of rows) {
    if (item.type === 'text') {
      if (item.content?.trim()) lines.push(item.content.trim(), '')
      continue
    }
    const label = item.title?.trim() || item.sourceUrl || 'Link'
    lines.push(`- [${label}](${item.sourceUrl ?? ''})`)
    if (item.description?.trim()) lines.push(`  ${item.description.trim()}`)
    lines.push('')
  }

  return lines.join('\n')
}

function getDayMarkdown(dayId: string): string {
  const rows = getDb()
    .select()
    .from(items)
    .where(eq(items.dayId, dayId))
    .orderBy(asc(items.createdAt))
    .all()
  return renderMarkdown(dayId, rows)
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

  ipcMain.handle('export:openInAi', (_e, dayId: string, provider: AiProvider): Promise<void> => {
    return shell.openExternal(aiUrl(provider, getDayMarkdown(dayId)))
  })
}
