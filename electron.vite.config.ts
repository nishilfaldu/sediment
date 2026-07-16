import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'
import type { Plugin } from 'vite'

// Copies ensure-schema.sql into out/main/ so the production build can apply it
// at startup. electron-vite doesn't bundle non-JS assets from main automatically.
function copySchemaPlugin(): Plugin {
  return {
    name: 'copy-schema',
    closeBundle() {
      const src = resolve('src/main/db/ensure-schema.sql')
      const dest = resolve('out/main/ensure-schema.sql')
      copyFileSync(src, dest)
    }
  }
}

const sharedAlias = { '@shared': resolve('src/shared') }

export default defineConfig({
  main: {
    // externalizeDeps: true is the default in electron-vite v5 — all node_modules
    // are kept as require/import calls rather than being bundled.
    resolve: { alias: sharedAlias },
    plugins: [copySchemaPlugin()],
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
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
          toast: resolve('src/renderer/toast.html')
        }
      }
    }
  }
})
