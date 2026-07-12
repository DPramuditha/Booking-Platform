/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  ssr: {
    noExternal: [
      '@asamuzakjp/css-color',
      '@csstools/css-calc',
      '@csstools/css-color-parser',
      '@csstools/css-parser-algorithms',
      '@csstools/css-tokenizer',
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    execArgv: ['--experimental-require-module'],
    server: {
      deps: {
        inline: [
          '@asamuzakjp/css-color',
          '@csstools/css-calc',
          '@csstools/css-color-parser',
          '@csstools/css-parser-algorithms',
          '@csstools/css-tokenizer',
        ],
      },
    },
  },
})
