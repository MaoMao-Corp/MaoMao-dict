import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.jsx'), // Content script
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]" // Los assets (imágenes) estarán en dist/assets/
      }
    },
    outDir: "dist/", // Los archivos compilados irán aquí
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@assets': resolve(__dirname, 'src/assets'), // Atajo para importar imágenes
    }
  }
});
