import type { ClipboardCapturePayload } from '@shared/clipboard-capture'
import type { CreateItemPayload } from '@shared/contracts'
import type { Api } from '@shared/ipc'
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
  export: {
    day: (dayId: string) => ipcRenderer.invoke('export:day', dayId),
    copyMarkdown: (dayId: string) => ipcRenderer.invoke('export:copyMarkdown', dayId),
    openInAi: (dayId: string, provider: 'chatgpt' | 'claude') =>
      ipcRenderer.invoke('export:openInAi', dayId, provider)
  },
  clipboard: {
    suppress: (url: string) => ipcRenderer.invoke('clipboard:suppress', url)
  },
  on: {
    clipboardCaptured: (cb: (payload: ClipboardCapturePayload) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: ClipboardCapturePayload) =>
        cb(payload)
      ipcRenderer.on('clipboard:captured', handler)
      return () => ipcRenderer.removeListener('clipboard:captured', handler)
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
