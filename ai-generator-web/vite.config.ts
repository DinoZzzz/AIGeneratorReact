import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import type { Plugin } from 'vite'

// Read version from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Vite plugin: write version.json to dist/ after build
function generateVersionFile(): Plugin {
  return {
    name: 'generate-version-file',
    writeBundle(options) {
      const dir = options.dir || 'dist'
      mkdirSync(dir, { recursive: true })
      writeFileSync(
        `${dir}/version.json`,
        JSON.stringify({ version: pkg.version, buildTime: new Date().toISOString() })
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    '__APP_VERSION__': JSON.stringify(pkg.version),
  },
  plugins: [
    react({
      jsxRuntime: 'automatic'
    }),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any, // Plugin type compatibility - visualizer types don't match Vite plugin interface
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['icon-192x192.png', 'icon-512x512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'AI Generator',
        short_name: 'AI Generator',
        description: 'Professional construction report generator with AI assistance',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
        globIgnores: ['**/stats.html', '**/version.json'], // Exclude from SW cache so version.json is always fetched fresh
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      devOptions: {
        enabled: true
      }
    }),
    generateVersionFile(),
  ],
  resolve: {
    alias: {
      'open-docxtemplater-image-module': 'docxtemplater-image-module-free'
    }
  },
  optimizeDeps: {
    include: ['docxtemplater-image-module-free']
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-checkbox', '@radix-ui/react-label', '@radix-ui/react-slot'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase': ['@supabase/supabase-js'],
          'pdf-export': ['jspdf', 'jspdf-autotable'],
          'word-export': ['docxtemplater', 'docxtemplater-image-module-free', 'pizzip'],
          'charts': ['recharts'],
        },
      },
    },
  },
  esbuild: {
    // Strip console.log/warn/info and debugger statements in production builds
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))
