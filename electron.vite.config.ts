import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'
import type { Plugin } from 'vite'

// Copies *.sql migration files from the source tree into out/main/migrations/ so
// the production build can find them at runtime. electron-vite doesn't bundle
// non-JS assets from the main process source automatically.
function copyMigrationsPlugin(): Plugin {
  return {
    name: 'copy-migrations',
    closeBundle() {
      const src = resolve('src/main/db/migrations')
      const dest = resolve('out/main/migrations')
      mkdirSync(dest, { recursive: true })
      for (const file of readdirSync(src).filter((f) => f.endsWith('.sql'))) {
        copyFileSync(join(src, file), join(dest, file))
      }
    }
  }
}

const sharedAlias = { '@shared': resolve('src/shared') }

export default defineConfig({
  main: {
    // externalizeDeps: true is the default in electron-vite v5 — all node_modules
    // are kept as require/import calls rather than being bundled.
    resolve: { alias: sharedAlias },
    plugins: [copyMigrationsPlugin()],
    build: {
      rollupOptions: {
        // Output as ES module so Electron 36+ can intercept `import 'electron'`
        // properly. With CJS, Node's module resolver finds node_modules/electron
        // (the npm shim that just returns the binary path) before Electron's
        // built-in interception kicks in.
        output: { format: 'es' }
      }
    }
  },
  preload: {
    resolve: { alias: sharedAlias }
  },
  renderer: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        // @/ maps to the renderer source root — consistent with React/Vite ecosystem convention
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
