import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@kecha/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@kecha/shared-utils': path.resolve(__dirname, '../../packages/shared-utils/src/index.ts'),
      '@kecha/shared-ui': path.resolve(__dirname, '../../packages/shared-ui/src/index.ts'),
      '@kecha/shared-auth': path.resolve(__dirname, '../../packages/shared-auth/src/index.ts')
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
