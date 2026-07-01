import { writeFile } from 'node:fs/promises'
import { asc, eq } from 'drizzle-orm'
import { BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron'
import { getDb } from '../db'
import { type Item, items } from '../db/schema'
import { ignoreNextClipboardWrites } from '../services/clipboard-watcher'
import { imageUrlToDiskPath } from '../services/image-store'

export interface ExportResult {
  saved: boolean
  filePath?: string
}

export type AiProvider = 'chatgpt' | 'claude'

// Cap the prompt length for the URL-based "open in AI" flows — long days would
// blow past server URL limits. Copy-to-clipboard has no such limit.
const PROMPT_URL_LIMIT = 4000

// Exported Markdown should link to the real image file, not the internal
// sediment:// URL. Fall back to the raw imagePath/sourceUrl for anything else.
function imageHref(item: Item): string {
  return imageUrlToDiskPath(item.imagePath) ?? item.imagePath ?? item.sourceUrl ?? ''
}

// forPrompt: rendered for pasting into an AI model — images become a placeholder
// (a local file path is useless there). For file export, images keep their path.
function renderMarkdown(dayId: string, rows: Item[], forPrompt: boolean): string {
  const lines: string[] = [`# Sediment — ${dayId}`, '']

  for (const item of rows) {
    if (item.type === 'text') {
      if (item.content?.trim()) lines.push(item.content.trim(), '')
      continue
    }
    if (item.type === 'image') {
      lines.push(forPrompt ? '_(image)_' : `![image](${imageHref(item)})`, '')
      continue
    }
    // link / video / social
    const label = item.title?.trim() || item.sourceUrl || 'Link'
    lines.push(`- [${label}](${item.sourceUrl ?? ''})`)
    if (item.description?.trim()) lines.push(`  ${item.description.trim()}`)
    lines.push('')
  }

  return lines.join('\n')
}

function getDayMarkdown(dayId: string, forPrompt: boolean): string {
  // Order by creation time.
  const rows = getDb()
    .select()
    .from(items)
    .where(eq(items.dayId, dayId))
    .orderBy(asc(items.createdAt))
    .all()
  return renderMarkdown(dayId, rows, forPrompt)
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
  // Export a single day's items as a Markdown file chosen via the save dialog.
  ipcMain.handle('export:day', async (e, dayId: string): Promise<ExportResult> => {
    const markdown = getDayMarkdown(dayId, false)
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

  // Copy the day's Markdown to the clipboard for pasting into an AI model.
  ipcMain.handle('export:copyMarkdown', (_e, dayId: string): void => {
    ignoreNextClipboardWrites()
    clipboard.writeText(getDayMarkdown(dayId, true))
  })

  // Open the day's content as a prompt in ChatGPT or Claude (text + links only —
  // images can't travel through a URL).
  ipcMain.handle('export:openInAi', (_e, dayId: string, provider: AiProvider): Promise<void> => {
    return shell.openExternal(aiUrl(provider, getDayMarkdown(dayId, true)))
  })
}
