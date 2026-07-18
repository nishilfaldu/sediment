import { createWriteStream } from 'node:fs'
import { mkdir, mkdtemp, readdir, rename, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { app, type BrowserWindow } from 'electron'

const execFileAsync = promisify(execFile)

const RELEASES_API = 'https://api.github.com/repos/nishilfaldu/sediment/releases/latest'
const USER_AGENT = 'Sediment-Updater'

export type UpdaterState =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'installing'
  | 'error'

export interface UpdaterStatus {
  currentVersion: string
  state: UpdaterState
  availableVersion: string | null
  /** 0–1 while downloading */
  progress: number | null
  error: string | null
  /** Packaged builds only; false in `bun dev`. */
  supported: boolean
}

interface GithubAsset {
  name: string
  browser_download_url: string
}

interface GithubRelease {
  tag_name: string
  assets: GithubAsset[]
}

type StatusListener = (status: UpdaterStatus) => void

let status: UpdaterStatus = {
  currentVersion: app.getVersion(),
  state: 'idle',
  availableVersion: null,
  progress: null,
  error: null,
  supported: app.isPackaged
}

let pendingZipUrl: string | null = null
const listeners = new Set<StatusListener>()

function setStatus(patch: Partial<UpdaterStatus>): void {
  status = { ...status, ...patch }
  for (const listener of listeners) listener(status)
}

export function getUpdaterStatus(): UpdaterStatus {
  return status
}

export function onUpdaterStatus(listener: StatusListener): () => void {
  listeners.add(listener)
  listener(status)
  return () => listeners.delete(listener)
}

/** Compare dotted versions; ignores a leading `v`. */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split('.').map((p) => Number.parseInt(p, 10) || 0)
  const pb = b.replace(/^v/i, '').split('.').map((p) => Number.parseInt(p, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

function archToken(): string {
  return process.arch === 'arm64' ? 'arm64' : 'x64'
}

function pickZipAsset(assets: GithubAsset[]): GithubAsset | null {
  const arch = archToken()
  const zips = assets.filter((a) => a.name.endsWith('.zip') && a.name.includes('-mac'))
  return (
    zips.find((a) => a.name.includes(`-${arch}-`)) ??
    zips.find((a) => a.name.includes(arch)) ??
    null
  )
}

/** Path to the running .app bundle (…/Sediment.app). */
function appBundlePath(): string {
  // …/Sediment.app/Contents/MacOS/Sediment
  return join(dirname(app.getPath('exe')), '..', '..')
}

export async function checkForUpdates(): Promise<UpdaterStatus> {
  if (!app.isPackaged) {
    setStatus({
      state: 'idle',
      supported: false,
      error: 'Updates are only available in the packaged app.',
      availableVersion: null,
      progress: null
    })
    return status
  }

  setStatus({
    state: 'checking',
    error: null,
    progress: null,
    supported: true
  })

  try {
    const res = await fetch(RELEASES_API, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': USER_AGENT
      }
    })
    if (!res.ok) {
      throw new Error(`GitHub returned ${res.status}`)
    }

    const release = (await res.json()) as GithubRelease
    const latest = release.tag_name.replace(/^v/i, '')
    const current = app.getVersion()

    if (compareVersions(latest, current) <= 0) {
      pendingZipUrl = null
      setStatus({
        state: 'up-to-date',
        availableVersion: null,
        error: null
      })
      return status
    }

    const zip = pickZipAsset(release.assets)
    if (!zip) {
      throw new Error(`No macOS zip for ${archToken()} in release ${release.tag_name}`)
    }

    pendingZipUrl = zip.browser_download_url
    setStatus({
      state: 'available',
      availableVersion: latest,
      error: null
    })
    return status
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update check failed'
    pendingZipUrl = null
    setStatus({ state: 'error', error: message, availableVersion: null })
    return status
  }
}

export async function downloadAndInstallUpdate(): Promise<UpdaterStatus> {
  if (!app.isPackaged) {
    setStatus({
      state: 'error',
      error: 'Updates are only available in the packaged app.',
      supported: false
    })
    return status
  }

  if (!pendingZipUrl || !status.availableVersion) {
    await checkForUpdates()
  }
  if (!pendingZipUrl || !status.availableVersion) {
    setStatus({
      state: status.state === 'up-to-date' ? 'up-to-date' : 'error',
      error: status.state === 'up-to-date' ? null : (status.error ?? 'No update available')
    })
    return status
  }

  const zipUrl = pendingZipUrl
  const version = status.availableVersion

  setStatus({ state: 'downloading', progress: 0, error: null })

  const workDir = await mkdtemp(join(tmpdir(), 'sediment-update-'))
  const zipPath = join(workDir, `sediment-${version}.zip`)
  const extractDir = join(workDir, 'extracted')

  try {
    await downloadFile(zipUrl, zipPath, (progress) => {
      setStatus({ state: 'downloading', progress })
    })

    setStatus({ state: 'installing', progress: 1 })
    await mkdir(extractDir, { recursive: true })
    await execFileAsync('unzip', ['-o', '-q', zipPath, '-d', extractDir])

    const newApp = await findAppBundle(extractDir)
    if (!newApp) {
      throw new Error('Update archive did not contain Sediment.app')
    }

    const target = appBundlePath()
    const backup = `${target}.bak-${Date.now()}`

    // Swap on possibly different volumes (tmp → /Applications): rename can fail.
    await rename(target, backup)
    try {
      await execFileAsync('ditto', [newApp, target])
    } catch (err) {
      await rename(backup, target).catch(() => undefined)
      throw err
    }
    await rm(backup, { recursive: true, force: true }).catch(() => undefined)
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined)

    // Relaunch the replaced binary, then quit this process.
    await execFileAsync('open', ['-n', target])
    app.quit()
    return status
  } catch (err) {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined)
    const message = err instanceof Error ? err.message : 'Update install failed'
    setStatus({ state: 'error', error: message, progress: null })
    return status
  }
}

async function downloadFile(
  url: string,
  dest: string,
  onProgress: (fraction: number) => void
): Promise<void> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow'
  })
  if (!res.ok || !res.body) {
    throw new Error(`Download failed (${res.status})`)
  }

  const total = Number(res.headers.get('content-length') ?? 0)
  let received = 0
  const file = createWriteStream(dest)

  // Node fetch body is a web ReadableStream.
  const nodeStream = Readable.fromWeb(res.body as import('node:stream/web').ReadableStream)

  nodeStream.on('data', (chunk: Buffer) => {
    received += chunk.length
    if (total > 0) onProgress(Math.min(1, received / total))
  })

  await pipeline(nodeStream, file)
  onProgress(1)
}

async function findAppBundle(root: string): Promise<string | null> {
  const entries = await readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(root, entry.name)
    if (entry.isDirectory() && entry.name.endsWith('.app')) {
      return full
    }
    if (entry.isDirectory()) {
      const nested = await findAppBundle(full)
      if (nested) return nested
    }
  }
  return null
}

/** Silent check a few seconds after launch; notifies the main window if available. */
export function scheduleStartupUpdateCheck(getWindow: () => BrowserWindow | null): void {
  if (!app.isPackaged) return

  setTimeout(() => {
    void checkForUpdates().then((result) => {
      if (result.state !== 'available') return
      const win = getWindow()
      win?.webContents.send('updater:status', result)
    })
  }, 8_000)
}
