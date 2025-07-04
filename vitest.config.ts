import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.next/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    // Configurações para testes de integração
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    // Configurações de retry para testes flaky
    retry: {
      integration: 2,
      unit: 0
    },
    // Configurações de ambiente
    env: {
      NODE_ENV: 'test',
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-key',
      VITE_APP_ENV: 'test'
    },
    // Configurações de mock
    deps: {
      inline: [
        '@supabase/supabase-js',
        '@tanstack/react-query'
      ]
    },
    // Configurações de watch
    watch: {
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'coverage/**'
      ]
    },
    // Configurações de reporter
    reporter: [
      'default',
      'json',
      'html'
    ],
    outputFile: {
      json: './coverage/test-results.json',
      html: './coverage/test-results.html'
    },
    // Configurações de benchmark (se necessário)
    benchmark: {
      include: ['**/*.{bench,benchmark}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', '.next']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/config': path.resolve(__dirname, './src/config'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/tests': path.resolve(__dirname, './src/tests')
    }
  },
  // Configurações específicas para diferentes tipos de teste
  define: {
    'import.meta.vitest': undefined
  }
});

// Configuração específica para testes de integração
export const integrationConfig = defineConfig({
  ...defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
      include: ['src/tests/integration/**/*.test.{ts,tsx}'],
      testTimeout: 30000,
      hookTimeout: 15000,
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true
        }
      },
      retry: 3,
      env: {
        NODE_ENV: 'test',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'test-key',
        VITE_APP_ENV: 'test'
      }
    }
  })
});

// Configuração específica para testes unitários
export const unitConfig = defineConfig({
  ...defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
      include: ['src/tests/unit/**/*.test.{ts,tsx}'],
      testTimeout: 5000,
      hookTimeout: 3000,
      pool: 'threads',
      retry: 0
    }
  })
});

// Configuração para testes de performance
export const performanceConfig = defineConfig({
  ...defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
      include: ['src/tests/performance/**/*.test.{ts,tsx}'],
      testTimeout: 60000,
      hookTimeout: 30000,
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true
        }
      }
    }
  })
});