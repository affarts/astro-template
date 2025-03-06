import { defineConfig } from 'astro/config'
import icon from 'astro-icon'
import sassGlobImports from 'vite-plugin-sass-glob-import'
import tailwind from '@astrojs/tailwind'

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
    }),
    tailwind({
      applyBaseStyles: false
    })
  ],
  compressHTML: false,
  build: {
    assets: 'assets'
  },
  server: {
    open: '/sitemap'
  },
  vite: {
    build: {
      minify: true,
      emptyOutDir: true,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          entryFileNames: 'scripts/global.js'
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
