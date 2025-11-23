import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'open-docxtemplater-image-module': 'docxtemplater-image-module-free'
    }
  },
  optimizeDeps: {
    include: ['docxtemplater-image-module-free']
  }
})
