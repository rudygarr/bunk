import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base + HashRouter so the build works on GitHub Pages at any path,
// and so a future Capacitor (iOS) wrapper can load it from the bundle.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5174, strictPort: true },
})
