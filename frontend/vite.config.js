import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/static/react/' : '/',
  server: {
    cors: true,
  },
  optimizeDeps: {
    exclude: ['molstar'],
  },
  build: {
    outDir: '../react',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'main.js',
        assetFileNames: (info) => info.name?.endsWith('.css') ? 'main.css' : 'assets/[name]-[hash][extname]',
        manualChunks: (id) => {
          if (id.includes('node_modules/molstar/')) return 'molstar'
        },
      },
    },
  },
}))
