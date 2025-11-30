import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Build optimizations
  build: {
    // Target modern browsers for smaller bundles
    target: 'esnext',
    
    // Enable minification
    minify: 'terser',
    
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core (changes rarely)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI libraries
          'ui-vendor': ['lucide-react', 'lightswind'],
          
          // State management & data fetching
          'state-vendor': ['zustand', '@tanstack/react-query'],
          
          // Form handling
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Utilities
          'utils-vendor': ['axios', 'date-fns'],
        },
        
        // Add hashes to filenames for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
  
  // Server configuration (for dev)
  server: {
    port: 5173,
    open: true,
  },
  
  // Preview configuration (for production preview)
  preview: {
    port: 4173,
  },
})