import { writeFile } from 'node:fs/promises'
import { BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron'
import { ignoreNextClipboardWrites } from '../services/clipboard-watcher'

export interface ExportResult {
  saved: boolean
  filePath?: string
}

export type AiProvider = 'chatgpt' | 'claude'

const PROMPT_URL_LIMIT = 4000

function aiUrl(provider: AiProvider, prompt: string): string {
  const q = encodeURIComponent(
    prompt.length > PROMPT_URL_LIMIT
      ? `${prompt.slice(0, PROMPT_URL_LIMIT)}\n\n…(truncated)`
      : prompt
  )
  return provider === 'chatgpt' ? `https://chatgpt.com/?q=${q}` : `https://claude.ai/new?q=${q}`
}

export function registerExportHandlers(): void {
  ipcMain.handle(
    'export:saveMarkdown',
    async (e, defaultPath: string, markdown: string): Promise<ExportResult> => {
      const win = BrowserWindow.fromWebContents(e.sender)

      const { canceled, filePath } = await dialog.showSaveDialog(
        win ?? BrowserWindow.getAllWindows()[0],
        {
          title: 'Export day as Markdown',
          defaultPath,
          filters: [{ name: 'Markdown', extensions: ['md'] }]
        }
      )

      if (canceled || !filePath) return { saved: false }

      await writeFile(filePath, markdown, 'utf-8')
      return { saved: true, filePath }
    }
  )

  ipcMain.handle('export:copyText', (_e, text: string): void => {
    ignoreNextClipboardWrites()
    clipboard.writeText(text)
  })

  ipcMain.handle('export:openAi', (_e, provider: AiProvider, prompt: string): Promise<void> => {
    return shell.openExternal(aiUrl(provider, prompt))
  })
}
