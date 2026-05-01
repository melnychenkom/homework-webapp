import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// deck.gl 8.9.x defines Layer.componentName as a getter-only static property.
// phylocanvas.gl's webpack bundle does bare assignments (e.g. X.componentName = "EdgesLayer")
// which silently fail in non-strict mode but throw in ESM strict mode.
// This plugin replaces those assignments with Object.defineProperty calls.
const fixPhylocanvasComponentName = {
  name: 'fix-phylocanvas-componentname',
  transform(code, id) {
    if (!id.includes('@phylocanvas/phylocanvas.gl')) return null;
    const fixed = code.replace(
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\.componentName\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
      'Object.defineProperty($1,"componentName",{value:$2,writable:!0,configurable:!0})'
    );
    return fixed !== code ? { code: fixed, map: null } : null;
  },
};

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), fixPhylocanvasComponentName],
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
