import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

const sharedAlias = { '@shared': resolve('src/shared') }

export default defineConfig({
  main: {
    // externalizeDeps: true is the default in electron-vite v5 — all node_modules
    // are kept as require/import calls rather than being bundled.
    resolve: { alias: sharedAlias },
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
        '@': resolve('src/renderer/src'),
        // Convex generated client — outside the renderer tree, so use an alias
        '@convex': resolve('convex')
      }
    },
    plugins: [react(), tailwindcss()],
    server: {
      // Allow importing convex/_generated from outside src/renderer
      fs: { allow: [resolve('.'), resolve('convex')] }
    },
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
