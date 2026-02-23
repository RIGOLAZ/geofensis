import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      // Utilisation du mode classic (ancien transform) qui ne nécessite pas jsx-runtime
      jsxRuntime: 'classic',
      // Optionnel: spécifier la factory si nécessaire
      jsxImportSource: 'react',
      babel: {
        parserOpts: {
          plugins: ['jsx']
        }
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  
  esbuild: {
    loader: 'jsx',
    include: /\.(jsx|js)$/,
    exclude: [],
    target: 'es2020'
  },
  
  build: {
    hunkSizeWarningLimit: 1500,
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': [
            '@mui/material', 
            '@mui/icons-material', 
            '@mui/x-date-pickers',
            '@emotion/react', 
            '@emotion/styled'
          ],
        }
      }
    },
  },
  
  server: {
    port: 3000,
    open: true,
  },
  
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled'
    ],
  },
});