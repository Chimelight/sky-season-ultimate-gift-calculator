import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/sky-season-ultimate-gift-calculator/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
