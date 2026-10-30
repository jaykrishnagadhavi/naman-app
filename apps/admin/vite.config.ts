import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true
  },
  resolve: {
    alias: {
      '@abrainoconscious/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@abrainoconscious/shared': path.resolve(__dirname, '../../packages/shared/src')
    }
  }
});

