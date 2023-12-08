import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig(({ mode }) => {
  const config = {
    build: {
      target: 'es2015'
    },
    plugins: [
      react(),
      legacy({
        targets: [
          'chrome >= 64',
          'edge >= 79',
          'safari >= 11.1',
          'firefox >= 67'
        ],
        ignoreBrowserslistConfig: true,
        renderLegacyChunks: false,
        modernPolyfills: ['es/global-this']
      })
    ],
    base: ''
  }
  return config
})
