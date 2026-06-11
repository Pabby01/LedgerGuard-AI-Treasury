import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer/'
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: false,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  optimizeDeps: {
    include: [
      '@workspace/api-client-react',
      'buffer',
      '@ledgerhq/hw-transport-webhid',
      '@ledgerhq/hw-app-solana',
    ]
  }
})
