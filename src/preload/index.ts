import { contextBridge, ipcRenderer } from 'electron'

// Typed bridge between the renderer and main-process IPC handlers.
// Add methods here as handlers are registered in src/main/ipc/.
const api = {
  items: {
    getByDay: (dayId: string) => ipcRenderer.invoke('items:getByDay', dayId),
    create: (payload: unknown) => ipcRenderer.invoke('items:create', payload),
    update: (id: string, patch: unknown) => ipcRenderer.invoke('items:update', id, patch),
    delete: (id: string) => ipcRenderer.invoke('items:delete', id),
    move: (id: string, x: number, y: number) => ipcRenderer.invoke('items:move', id, x, y),
    bringToFront: (id: string, dayId: string) =>
      ipcRenderer.invoke('items:bringToFront', id, dayId),
    updateMetadata: (id: string, metadata: unknown) =>
      ipcRenderer.invoke('items:updateMetadata', id, metadata)
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
  // Event subscriptions: main → renderer direction.
  // ipcMain uses webContents.send() to push these; the renderer registers
  // listeners here and gets back an unsubscribe function to clean up on unmount.
  // Each subscription binds a specific handler so removeListener only tears down
  // that one registration (not all listeners on the channel as removeAllListeners would).
  on: {
    shortcutTriggered: (cb: (payload: unknown) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: unknown) => cb(payload)
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
