import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // Gzip for broad compatibility
    compression({ algorithm: 'gzip', exclude: /\.(png|webp|jpg|woff2)$/ }),
    // Brotli for modern browsers (smaller than gzip)
    compression({ algorithm: 'brotliCompress', exclude: /\.(png|webp|jpg|woff2)$/ }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Bundle + minify everything; no readable source ships to the browser.
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,
    cssMinify: true,
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: false,
        passes: 2,
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        // Split vendor code into stable, cacheable, hashed chunks.
        // rolldown (Vite 8) requires manualChunks to be a function.
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
        },
        // Hashed, generic filenames — no source-revealing names in the output tree.
        chunkFileNames: 'assets/js/[hash].js',
        entryFileNames: 'assets/js/[hash].js',
        assetFileNames: 'assets/[ext]/[hash][extname]',
      },
    },
    chunkSizeWarningLimit: 700,
  },
}))
