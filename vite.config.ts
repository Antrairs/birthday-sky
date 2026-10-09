import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/hubble-image': {
        target: 'https://science.nasa.gov',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            '/api/hubble-image',
            '/specials/apps/what-did-hubble-see-on-your-birthday/images',
          ),
      },
    },
  },
})
