import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [
    react({
      tsDecorators: true,
      jsxImportSource: '@emotion/react'
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['@react-pdf/renderer', 'framer-motion']
        }
      }
    },
    minify: true,
    target: 'es2015',
    chunkSizeWarningLimit: 2000
  },
  esbuild: {
    drop: ['console', 'debugger'],
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  server: {
    port: 5177,
    proxy: {
      '/api/ideogram': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
}); 