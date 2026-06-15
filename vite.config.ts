import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        pixelSnapper: path.resolve(__dirname, 'pixel-snapper/index.html'),
        imageToPixelArt: path.resolve(__dirname, 'image-to-pixel-art/index.html'),
        aiPixelArtFixer: path.resolve(__dirname, 'ai-pixel-art-fixer/index.html'),
        localPixelArtConverter: path.resolve(__dirname, 'local-pixel-art-converter/index.html'),
        transparentPngSpriteExport: path.resolve(
          __dirname,
          'transparent-png-sprite-export/index.html',
        ),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
