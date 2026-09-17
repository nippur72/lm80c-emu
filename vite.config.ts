import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // required in library mode: Vite does not replace process.env.NODE_ENV here,
    // and react-dom/jsx-runtime would crash with "process is not defined" in the browser
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    lib: {
      entry: 'src/emulator.ts',
      formats: ['es'],
      fileName: () => 'bundle.js',
      cssFileName: 'style'
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: false
  }
});
