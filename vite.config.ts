import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Github Pages usually serves from a subpath if not using a custom domain. 
  // If your repo is username.github.io/repo-name, change base to '/repo-name/'
  base: './', 
})