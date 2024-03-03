import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import ViteYaml from '@modyfi/vite-plugin-yaml';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: "./src/env",
  plugins: [
    react(),
  ],
  server: {
    port: 8080
  },
  preview: {
    port: 8080
  }
})
