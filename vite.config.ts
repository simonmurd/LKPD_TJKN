import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    // Jalur base relatif agar aset terbaca sempurna di GitHub Pages
    base: './',
    
    plugins: [react(), tailwindcss()],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    // Pengaturan build tambahan untuk optimasi produksi
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false, // Nonaktifkan sourcemap untuk mempercepat load & menjaga keamanan kode di production
      minify: 'esbuild', // Menggunakan esbuild bawaan Vite yang sangat cepat
      rollupOptions: {
        output: {
          // Memisahkan vendor library besar agar caching browser lebih optimal
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              return 'vendor';
            }
          },
        },
      },
    },

    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
