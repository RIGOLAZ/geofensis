import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 3001, 
    host: true,
    hmr: { 
      overlay: false
    }
  },
  // Empêcher le re-bundling de Firebase à chaque changement
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage']
  }
})