import { basename, join } from 'node:path'
import { net, protocol } from 'electron'
import { imagesDir } from './services/image-store'

// Must be called BEFORE app.ready.
// registerSchemesAsPrivileged makes sediment:// behave as a standard secure
// origin: the URL parser treats it hierarchically (so new URL('sediment://...')
// works), and the renderer can load resources from it in <img> tags and via
// fetch() without it being treated as an opaque or blocked origin.
export function registerSedimentScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'sediment', privileges: { standard: true, secure: true, supportFetchAPI: true } }
  ])
}

// Must be called AFTER app.ready.
// Maps sediment://images/<file> → userData/images/<file>.
// userData on macOS: ~/Library/Application Support/sediment/
// basename() strips directory components to prevent path traversal
// (e.g. sediment://images/../../etc/passwd can't escape the images dir).
export function registerSedimentProtocol(): void {
  protocol.handle('sediment', (request) => {
    const { hostname, pathname } = new URL(request.url)
    if (hostname !== 'images' || !pathname || pathname === '/') {
      return new Response('Not found', { status: 404 })
    }
    const filename = basename(pathname)
    const filePath = join(imagesDir(), filename)
    return net.fetch(`file://${filePath}`)
  })
}
