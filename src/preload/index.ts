import type {
  CaptureToastShow,
  ClipboardCandidatePayload,
  ClipboardUndoPayload
} from '@shared/clipboard-capture'
import type { Api } from '@shared/ipc'
import { contextBridge, ipcRenderer } from 'electron'

const api: Api = {
  export: {
    saveMarkdown: (defaultPath: string, markdown: string) =>
      ipcRenderer.invoke('export:saveMarkdown', defaultPath, markdown),
    copyText: (text: string) => ipcRenderer.invoke('export:copyText', text),
    openAi: (provider: 'chatgpt' | 'claude', prompt: string) =>
      ipcRenderer.invoke('export:openAi', provider, prompt)
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
    ready: () => ipcRenderer.invoke('capture-toast:ready'),
    showOverlay: (payload) => ipcRenderer.invoke('capture-toast:showOverlay', payload),
    showDuplicateOverlay: (sourceUrl: string) =>
      ipcRenderer.invoke('capture-toast:showDuplicateOverlay', sourceUrl)
  },
  on: {
    clipboardCandidate: (cb: (payload: ClipboardCandidatePayload) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: ClipboardCandidatePayload) =>
        cb(payload)
      ipcRenderer.on('clipboard:candidate', handler)
      return () => ipcRenderer.removeListener('clipboard:candidate', handler)
    },
    clipboardUndoRequest: (cb: (payload: ClipboardUndoPayload) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: ClipboardUndoPayload) => cb(payload)
      ipcRenderer.on('clipboard:undo-request', handler)
      return () => ipcRenderer.removeListener('clipboard:undo-request', handler)
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
