/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment configuration
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Test exclusions
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache'
    ],
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './coverage/test-results.json',
      html: './coverage/test-results.html'
    },
    
    // Mock configuration
    deps: {
      inline: ['@testing-library/jest-dom']
    },
    
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      VITE_API_URL: 'http://localhost:3001',
      VITE_APP_NAME: 'Holonic Travel Planner Test'
    },
    
    // Pool configuration for parallel testing
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Watch configuration
    watch: {
      exclude: ['node_modules', 'dist', 'coverage']
    },
    
    // UI configuration for test UI
    ui: {
      enabled: true,
      open: false,
      port: 51204
    }
  },
  
  // Resolve configuration for tests
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@config': path.resolve(__dirname, './src/config'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles')
    }
  },
  
  // Define configuration for test builds
  define: {
    __TEST__: true,
    __DEV__: false,
    __PROD__: false
  },
  
  // Optimizations for testing
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event'
    ]
  }
});