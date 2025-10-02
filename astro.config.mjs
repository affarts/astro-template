import { defineConfig } from 'astro/config'
import icon from 'astro-icon'
import { sassGlobPlugin } from './plugins/sassGlobPlugin.js'

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
    // plugins: [sassGlobPlugin()],
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
        '@scss': '/src/assets/styles/',
        'simplebar/dist/simplebar.css': 'simplebar-core/dist/simplebar.css'
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
            const name = assetInfo.names?.[0] || assetInfo.name
            return name === 'index.css' ? 'assets/style.css' : `assets/${name}`
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
    css: {
      preprocessorOptions: {
        scss: {
          importers: [sassGlobPlugin()]
        }
      },
      devSourcemap: true
      // transformer: 'postcss'
    }
  }
})
