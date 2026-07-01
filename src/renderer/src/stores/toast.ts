import { create } from 'zustand'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  action?: ToastAction
  durationMs?: number
}

export interface ToastStore {
  message: string
  visible: boolean
  action: ToastAction | null
  show: (message: string, options?: ToastOptions) => void
  dismiss: () => void
}

let dismissTimer: ReturnType<typeof setTimeout> | null = null

export const useToast = create<ToastStore>((set) => ({
  message: '',
  visible: false,
  action: null,

  show(message: string, options?: ToastOptions) {
    if (dismissTimer) clearTimeout(dismissTimer)

    set({
      message,
      visible: true,
      action: options?.action ?? null
    })

    const durationMs = options?.durationMs ?? (options?.action ? 5000 : 2500)
    dismissTimer = setTimeout(() => {
      set({ visible: false, action: null })
    }, durationMs)
  },

  dismiss() {
    if (dismissTimer) clearTimeout(dismissTimer)
    set({ visible: false, action: null })
  }
}))
