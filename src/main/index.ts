import { join } from 'node:path'
import { app, BrowserWindow, nativeTheme, shell } from 'electron'
import { registerAllHandlers } from './ipc'
import { closeCaptureToastWindow, destroyCaptureToast } from './services/capture-toast'
import { registerClipboardWatcher, unregisterClipboardWatcher } from './services/clipboard-watcher'
import { registerGlobalHotkey, unregisterGlobalHotkey } from './services/global-hotkey'
import { createTray, destroyTray } from './services/tray'
import { loadWindowState, manageWindowState } from './services/window-state'

// Module-level handle so the tray (and dock re-activate) can reach the window.
let mainWindow: BrowserWindow | null = null

// electron-vite sets NODE_ENV='development' when running via `bun dev` and
// 'production' in built apps. We can't use app.isPackaged here because `app`
// is not yet initialised at module evaluation time in Electron 39+.
const isDev = process.env.NODE_ENV === 'development'

// The UI is light-only; pin the native theme so scrollbars, form controls,
// and prefers-color-scheme never follow the OS into dark mode.
nativeTheme.themeSource = 'light'

function createWindow(): void {
  // Restore the last-used size/position (falls back to defaults + centred).
  const windowState = loadWindowState()
  const win = new BrowserWindow({
    ...windowState,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden', // no native title bar chrome
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow = win
  win.on('closed', () => {
    mainWindow = null
    closeCaptureToastWindow()
  })

  // Persist size/position changes so they survive a restart
  manageWindowState(win)

  win.on('ready-to-show', () => {
    // Hide the red/yellow/green traffic light buttons — the app uses a
    // full-bleed white canvas and the buttons break the aesthetic.
    // setWindowButtonVisibility is macOS-only; guard so it's safe on other platforms.
    if (process.platform === 'darwin') {
      win.setWindowButtonVisibility(false)
    }
    win.show()
  })

  // Open external links in the system browser, not inside the app.
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  registerClipboardWatcher(() => mainWindow)

  // In dev, electron-vite sets ELECTRON_RENDERER_URL to the Vite dev server.
  // In production, load the built HTML file directly.
  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Windows only: set the app user model ID so notifications/taskbar group correctly.
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.sediment')
  }

  registerAllHandlers()

  // In dev: F12 toggles DevTools. In prod: block Cmd/Ctrl+R (accidental reload).
  app.on('browser-window-created', (_, window) => {
    window.webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return
      if (isDev) {
        if (input.code === 'F12') {
          if (window.webContents.isDevToolsOpened()) {
            window.webContents.closeDevTools()
          } else {
            window.webContents.openDevTools({ mode: 'undocked' })
          }
        }
      } else {
        // Block reload shortcut in production — there's no server to reload from.
        if (input.code === 'KeyR' && (input.control || input.meta)) {
          event.preventDefault()
        }
      }
    })
  })

  createWindow()

  // Menu-bar/tray icon — click toggles the window, stays put when it's hidden
  createTray(() => mainWindow)

  // Optional user-configured shortcut to bring Sediment back to the front
  registerGlobalHotkey(() => mainWindow)

  // On macOS, re-create the window when the dock icon is clicked with no windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS where the app stays in the
// dock until the user explicitly quits with Cmd+Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  unregisterClipboardWatcher()
  destroyCaptureToast()
  unregisterGlobalHotkey()
  destroyTray()
})
