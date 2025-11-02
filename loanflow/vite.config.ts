// Vite build configuration with Angular and Ionic support
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: './tsconfig.app.json',
      inlineStylesExtension: 'scss',
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@app': '/src/app',
      '@core': '/src/app/core',
      '@features': '/src/app/features',
      '@shared': '/src/app/shared',
      '@environments': '/src/environments',
    },
  },
  server: {
    port: 8100,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          ionic: ['@ionic/angular'],
          angular: ['@angular/core', '@angular/common', '@angular/router'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      '@ionic/angular',
      '@angular/common',
      '@angular/core',
      '@angular/router',
      'rxjs',
      'ionicons',
    ],
  },
});
