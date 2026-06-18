import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// База './' — чтобы собранное приложение открывалось из любой папки OSPanel.
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5174,
    open: true
  }
})
