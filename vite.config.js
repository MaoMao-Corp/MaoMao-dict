import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Define la entrada para el content script
        content: resolve(__dirname, 'src/content.jsx')
        // Si tienes más entradas, como un popup o background, agrégalas aquí.
      },
      output: {
        // Configura el nombre de los archivos según necesites
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]"      }
    },
    outDir: "dist/", // Puedes colocar tus archivos compilados en "dist/assets"
    emptyOutDir: true
  }
});
