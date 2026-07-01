import type { Api } from '@shared/ipc'
import type { CreateItemPayload } from '@shared/contracts'
import type { ShortcutPayload } from '@shared/shortcut'
import { contextBridge, ipcRenderer } from 'electron'

const api: Api = {
  items: {
    getByDay: (dayId: string) => ipcRenderer.invoke('items:getByDay', dayId),
    create: (payload: CreateItemPayload) => ipcRenderer.invoke('items:create', payload),
    update: (id: string, patch: Partial<CreateItemPayload>) =>
      ipcRenderer.invoke('items:update', id, patch),
    delete: (id: string) => ipcRenderer.invoke('items:delete', id)
  },
  days: {
    list: () => ipcRenderer.invoke('days:list'),
    getOrCreate: (dayId: string) => ipcRenderer.invoke('days:getOrCreate', dayId)
  },
  search: {
    query: (q: string) => ipcRenderer.invoke('search:query', q)
  },
  metadata: {
    preview: (url: string) => ipcRenderer.invoke('metadata:preview', url)
  },
  export: {
    day: (dayId: string) => ipcRenderer.invoke('export:day', dayId),
    copyMarkdown: (dayId: string) => ipcRenderer.invoke('export:copyMarkdown', dayId),
    openInAi: (dayId: string, provider: 'chatgpt' | 'claude') =>
      ipcRenderer.invoke('export:openInAi', dayId, provider)
  },
  on: {
    shortcutTriggered: (cb: (payload: ShortcutPayload) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: ShortcutPayload) => cb(payload)
      ipcRenderer.on('shortcut:triggered', handler)
      return () => ipcRenderer.removeListener('shortcut:triggered', handler)
    },
    itemMetadataUpdated: (cb: (payload: { id: string; dayId: string }) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: { id: string; dayId: string }) =>
        cb(payload)
      ipcRenderer.on('item:metadataUpdated', handler)
      return () => ipcRenderer.removeListener('item:metadataUpdated', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.api = api
}
