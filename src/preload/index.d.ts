interface Api {
  items: {
    getByDay: (dayId: string) => Promise<unknown[]>
    create: (payload: unknown) => Promise<unknown>
    update: (id: string, patch: unknown) => Promise<unknown>
    delete: (id: string) => Promise<void>
    move: (id: string, x: number, y: number) => Promise<unknown>
    bringToFront: (id: string, dayId: string) => Promise<unknown>
    updateMetadata: (id: string, metadata: unknown) => Promise<void>
  }
  days: {
    list: () => Promise<unknown[]>
    getOrCreate: (dayId: string) => Promise<unknown>
  }
  search: {
    query: (q: string) => Promise<unknown[]>
  }
  export: {
    day: (dayId: string) => Promise<{ saved: boolean; filePath?: string }>
    copyMarkdown: (dayId: string) => Promise<void>
    openInAi: (dayId: string, provider: 'chatgpt' | 'claude') => Promise<void>
  }
  on: {
    shortcutTriggered: (cb: (payload: unknown) => void) => () => void
    itemMetadataUpdated: (cb: (payload: { id: string; dayId: string }) => void) => () => void
  }
}

// Ambient declaration — no imports, so this file is a script (not a module)
// and Window augmentation works without declare global { ... }
interface Window {
  api: Api
}
