import { create } from 'zustand'

export interface ToastStore {
  message: string
  visible: boolean
  show: (message: string) => void
}

let dismissTimer: ReturnType<typeof setTimeout> | null = null

export const useToast = create<ToastStore>((set) => ({
  message: '',
  visible: false,

  show(message: string) {
    // Clear any in-flight dismiss timer so rapid captures don't flicker
    if (dismissTimer) clearTimeout(dismissTimer)

    set({ message, visible: true })

    // Keep the text in state during the fade-out (300ms transition) so it
    // doesn't blank before the animation completes
    dismissTimer = setTimeout(() => {
      set({ visible: false })
    }, 2500)
  }
}))
