import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env variables (with and without VITE_ prefix) for use in plugins
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),

      // ──────────────────────────────────────────────────────────────
      // Plugin: Inject Firebase config into the Service Worker file
      // after Vite finishes building (production only).
      // The public/firebase-messaging-sw.js uses __PLACEHOLDER__ tokens
      // that are replaced here with the actual Vercel env variable values,
      // so no secrets are stored in GitHub source code.
      // ──────────────────────────────────────────────────────────────
      {
        name: 'inject-firebase-sw-config',
        apply: 'build',
        closeBundle() {
          const swOutputPath = resolve(import.meta.dirname, 'dist/firebase-messaging-sw.js')

          if (!existsSync(swOutputPath)) {
            console.warn('[inject-firebase-sw-config] dist/firebase-messaging-sw.js not found, skipping injection.')
            return
          }

          let swContent = readFileSync(swOutputPath, 'utf-8')

          const replacements: Record<string, string> = {
            '__VITE_FIREBASE_API_KEY__':              env.VITE_FIREBASE_API_KEY             || '',
            '__VITE_FIREBASE_AUTH_DOMAIN__':          env.VITE_FIREBASE_AUTH_DOMAIN         || '',
            '__VITE_FIREBASE_PROJECT_ID__':           env.VITE_FIREBASE_PROJECT_ID          || '',
            '__VITE_FIREBASE_STORAGE_BUCKET__':       env.VITE_FIREBASE_STORAGE_BUCKET      || '',
            '__VITE_FIREBASE_MESSAGING_SENDER_ID__':  env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
            '__VITE_FIREBASE_APP_ID__':               env.VITE_FIREBASE_APP_ID              || '',
            '__VITE_FIREBASE_MEASUREMENT_ID__':       env.VITE_FIREBASE_MEASUREMENT_ID      || '',
          }

          for (const [placeholder, value] of Object.entries(replacements)) {
            swContent = swContent.replaceAll(placeholder, value)
          }

          writeFileSync(swOutputPath, swContent, 'utf-8')
          console.log('[inject-firebase-sw-config] ✅ Firebase config injected into dist/firebase-messaging-sw.js')
        },
      },
    ],
  }
})
