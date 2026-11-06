import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // DigitalPersona's UMD entry expects a global WebSdk; use its ESM package entry.
  resolve: {
    mainFields: ['module', 'jsnext:main', 'browser'],
    alias: {
      WebSdk: fileURLToPath(new URL('./src/services/websdkDependency.js', import.meta.url)),
    },
  },
  // Build React into Spring Boot's static resources so the app is available at /.
  build: {
    outDir: '../src/main/resources/static',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
