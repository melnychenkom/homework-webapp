import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/static/react/' : '/',
  server: {
    cors: true,
  },
  build: {
    outDir: '../react',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'main.js',
        assetFileNames: (info) => info.name?.endsWith('.css') ? 'main.css' : 'assets/[name]-[hash][extname]',
      },
    },
  },
}))
