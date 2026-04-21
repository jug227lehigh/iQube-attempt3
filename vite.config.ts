import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vitest configuration lives in ./vitest.config.ts — keep this file
// focused on the dev/build pipeline.
export default defineConfig({
  plugins: [react()],
})
