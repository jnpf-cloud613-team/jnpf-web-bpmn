import path from 'node:path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      // eslint-disable-next-line unicorn/prefer-module
      entry: path.resolve(__dirname, 'src/components/bpmn/index.ts'),
      fileName: `index`,
      name: 'index',
    },
    minify: 'terser',
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
  },
  plugins: [vue()],
});
