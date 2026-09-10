import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// GitHub Pages serves the site from https://<user>.github.io/<repo>/, so
// asset URLs need that repo-name prefix in production. Locally (`vite`,
// `vite preview`) the base stays `/` so nothing else has to change.
const isGithubPagesBuild = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  base: isGithubPagesBuild ? '/tl-engine/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-recharts'
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-tiptap'
          if (id.includes('@dnd-kit')) return 'vendor-dnd-kit'
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('@tanstack/react-query') ||
            id.includes('@radix-ui') ||
            id.includes('lucide-react')
          ) {
            return 'vendor'
          }
          // Leave remaining node_modules deps to Rollup's default chunking
          // (forcing them into another manual chunk here creates a
          // circular dependency between it and `vendor`).
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
