import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const bootId = `boot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __SERVER_BOOT_ID__: JSON.stringify(bootId)
  }
})
