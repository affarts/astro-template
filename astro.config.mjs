import { defineConfig } from 'astro/config'
import icon from 'astro-icon'
import sassGlobImports from 'vite-plugin-sass-glob-import'

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },
  integrations: [
    icon({
      iconDir: 'src/assets/icons',
      svgoOptions: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                // customize default plugin options
                inlineStyles: {
                  onlyMatchedOnce: false
                },
                // or disable plugins
                removeDoctype: false
              }
            }
          }
        ]
      }
    })
  ],
  compressHTML: false,
  build: {
    assets: 'assets',
    format: 'file'
  },
  server: {
    open: '/sitemap',
    port: 4321,
    host: true
  },
  vite: {
    server: {
      host: true,
      port: 4321,
      allowedHosts: [
        // 'preliminary-leads-dome-obviously.trycloudflare.com', // example for cloudflare tunnel
        'localhost',
        '127.0.0.1'
      ]
    },
    resolve: {
      alias: {
        '@scss': '/src/assets/styles/'
      }
    },
    build: {
      minify: true,
      emptyOutDir: true,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/scripts.js',
          assetFileNames: (assetInfo) => {
            return assetInfo.name === 'index.css'
              ? 'assets/style.css'
              : `assets/${assetInfo.name}`
          }
          // use to split vendor js into separate chunks
          // manualChunks: (id) => {
          //   if (id.includes('node_modules/swiper')) {
          //     return 'swiper'
          //   }

          //   if (id.includes('node_modules/simplebar')) {
          //     return 'simplebar'
          //   }

          //   if (id.includes('node_modules/flatpickr')) {
          //     return 'flatpickr'
          //   }

          //   if (id.includes('node_modules/intl-tel-input')) {
          //     return 'intl-tel-input'
          //   }

          //   if (id.includes('node_modules/nouislider')) {
          //     return 'nouislider'
          //   }

          //   if (id.includes('node_modules/@floating-ui')) {
          //     return '@floating-ui'
          //   }

          //   if (id.includes('node_modules/html2canvas')) {
          //     return 'html2canvas'
          //   }

          //   if (id.includes('node_modules')) {
          //     return 'vendor'
          //   }

          //   return null
          // }
        }
      }
    },
    plugins: [sassGlobImports()],
    css: {
      devSourcemap: true,
      transformer: 'postcss'
    }
  }
})
