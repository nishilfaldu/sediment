import { ipcMain } from 'electron'
import type { MetadataPatch } from '@shared/contracts'
import { fetchUrlMetadata } from '../services/og-fetcher'

export function registerMetadataHandlers(): void {
  ipcMain.handle('metadata:preview', async (_e, url: string): Promise<MetadataPatch> => {
    try {
      return await fetchUrlMetadata(url)
    } catch {
      return { title: null, description: null, thumbnail: null, metadata: null }
    }
  })
}
