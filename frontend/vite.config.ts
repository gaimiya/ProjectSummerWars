import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api へのアクセスは backend（localhost:8080）へ送る
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8080' } },
})
