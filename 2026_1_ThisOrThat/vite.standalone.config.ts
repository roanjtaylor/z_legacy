// Builds the whole app (JS, CSS, music, background image, car data) into one
// self-contained file: ThisOrThat.html. Double-click it to play — no server.
//   npm run build:standalone
import { copyFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const root = import.meta.dirname
const outDir = 'dist-standalone'

function standalone(): Plugin {
  return {
    name: 'this-or-that-standalone',
    transformIndexHtml(html) {
      // fetch() is blocked on file://, so embed the car data directly.
      const cars = readFileSync(resolve(root, 'public/curated-cars.json'), 'utf8')
      const json = JSON.stringify(JSON.parse(cars)).replace(/</g, '\\u003c')
      return html
        .replace(/\s*<link rel="icon"[^>]*>/, '')
        .replace('</head>', `<script>window.__CURATED_CARS__=${json}</script></head>`)
    },
    closeBundle() {
      copyFileSync(resolve(root, outDir, 'index.html'), resolve(root, 'ThisOrThat.html'))
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), standalone()],
  build: {
    outDir,
    copyPublicDir: false,
    assetsInlineLimit: 100_000_000, // inline the mp3s and background image
    chunkSizeWarningLimit: 100_000,
  },
})
