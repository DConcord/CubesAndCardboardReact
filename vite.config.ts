import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import ViteYaml from '@modyfi/vite-plugin-yaml';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ViteYaml(), // you may configure the plugin by passing in an object with the options listed below
  ],
  server: {
    port: 8080
  },
  preview: {
    port: 8080
  }
})
