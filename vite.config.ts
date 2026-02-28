import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['local.xpense-ops.app'],
    hmr: {
      host: 'local.xpense-ops.app',
      protocol: 'wss',
      clientPort: 443,
    }
  }
})
