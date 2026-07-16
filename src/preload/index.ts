import type {
  CaptureToastShow,
  ClipboardCapturePayload,
  ClipboardDuplicatePayload
} from '@shared/clipboard-capture'
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
    copyForFriend: (dayId: string) => ipcRenderer.invoke('export:copyForFriend', dayId),
    copyItemsForFriend: (ids: string[]) => ipcRenderer.invoke('export:copyItemsForFriend', ids),
    copyItemsMarkdown: (ids: string[]) => ipcRenderer.invoke('export:copyItemsMarkdown', ids),
    openInAi: (dayId: string, provider: 'chatgpt' | 'claude') =>
      ipcRenderer.invoke('export:openInAi', dayId, provider),
    openItemsInAi: (ids: string[], provider: 'chatgpt' | 'claude') =>
      ipcRenderer.invoke('export:openItemsInAi', ids, provider)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    setGlobalHotkey: (accelerator: string | null) =>
      ipcRenderer.invoke('settings:setGlobalHotkey', accelerator)
  },
  clipboard: {
    suppress: (url: string) => ipcRenderer.invoke('clipboard:suppress', url)
  },
  captureToast: {
    undo: () => ipcRenderer.invoke('capture-toast:undo'),
    dismiss: () => ipcRenderer.invoke('capture-toast:dismiss'),
    ready: () => ipcRenderer.invoke('capture-toast:ready')
  },
  on: {
    clipboardCaptured: (cb: (payload: ClipboardCapturePayload) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: ClipboardCapturePayload) =>
        cb(payload)
      ipcRenderer.on('clipboard:captured', handler)
      return () => ipcRenderer.removeListener('clipboard:captured', handler)
    },
    clipboardDuplicate: (cb: (payload: ClipboardDuplicatePayload) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: ClipboardDuplicatePayload) =>
        cb(payload)
      ipcRenderer.on('clipboard:duplicate', handler)
      return () => ipcRenderer.removeListener('clipboard:duplicate', handler)
    },
    clipboardUndone: (cb: (payload: { dayId: string }) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: { dayId: string }) => cb(payload)
      ipcRenderer.on('clipboard:undone', handler)
      return () => ipcRenderer.removeListener('clipboard:undone', handler)
    },
    itemMetadataUpdated: (cb: (payload: { id: string; dayId: string }) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: { id: string; dayId: string }) =>
        cb(payload)
      ipcRenderer.on('item:metadataUpdated', handler)
      return () => ipcRenderer.removeListener('item:metadataUpdated', handler)
    },
    captureToastShow: (cb: (payload: CaptureToastShow) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: CaptureToastShow) => cb(payload)
      ipcRenderer.on('capture-toast:show', handler)
      return () => ipcRenderer.removeListener('capture-toast:show', handler)
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
