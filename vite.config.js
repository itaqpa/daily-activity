import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo/driver-apps-icon.png'],
      manifest: {
        name: 'Apps Aqpa',
        short_name: 'Apps Aqpa',
        description: 'Apps Aqpa',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/logo/driver-apps-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo/driver-apps-icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
})
