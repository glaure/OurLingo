import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const host = process.env.TAURI_DEV_HOST
const appVersion = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
).version as string

// Web version for GitHub Pages: `npm run build:web` builds with this base path.
const webBase = '/OurLingo/app/'

// Writes sw.js next to the web build, listing every built file for offline use.
function serviceWorker(): Plugin {
  let outDir = ''
  return {
    name: 'ourlingo-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const list = (dir: string): string[] =>
        readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
          item.isDirectory()
            ? list(join(dir, item.name))
            : [relative(outDir, join(dir, item.name)).split(sep).join('/')],
        )
      const files = list(outDir)
        .filter((file) => file !== 'sw.js')
        .sort()
      const hash = createHash('sha256')
      for (const file of files) hash.update(file).update(readFileSync(join(outDir, file)))
      const worker = readFileSync(new URL('./web/service-worker.js', import.meta.url), 'utf8')
        .replace('self.__PRECACHE_FILES__', JSON.stringify(['./', ...files]))
        .replace('self.__PRECACHE_VERSION__', JSON.stringify(hash.digest('hex').slice(0, 12)))
      writeFileSync(join(outDir, 'sw.js'), worker)
    },
  }
}

export default defineConfig(({ mode }) => ({
  base: mode === 'web' ? webBase : '/',
  plugins: mode === 'web' ? [react(), serviceWorker()] : [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  clearScreen: false,
  server: {
    host: host || false,
    port: 5173,
    strictPort: true,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
  },
}))
