import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const backendProxy = {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false,
  },
  '/oauth2/authorization': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false,
  },
  '/login/oauth2': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: backendProxy,
  },
  preview: {
    port: 4173,
    proxy: backendProxy,
  },
})