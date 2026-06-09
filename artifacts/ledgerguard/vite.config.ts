import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer/',
      '@workspace/api-client-react': path.resolve(__dirname, './src/mocks/api-client-react.tsx')
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: false,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  optimizeDeps: {
    include: ['@workspace/api-client-react', 'buffer']
  }
})
