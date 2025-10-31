import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [angular()],
  server: {
    port: 4200,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4200
  },
  build: {
    target: 'ES2022',
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@angular/common', '@angular/core', '@angular/platform-browser'],
          rxjs: ['rxjs']
        }
      }
    }
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer]
    }
  },
  optimizeDeps: {
    include: [
      '@angular/common',
      '@angular/core',
      '@angular/platform-browser',
      '@angular/platform-browser-dynamic',
      '@angular/router',
      '@angular/forms',
      'rxjs',
      'zone.js'
    ],
    exclude: ['@angular/animations', '@angular/platform-browser/animations']
  },
  define: {
    ngDevMode: true
  },
  assetsInclude: ['**/*.html']
});
