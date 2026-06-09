import { defineConfig } from 'vite';
export default defineConfig({
    build: {
        lib: {
            entry: 'src/emulator.ts',
            formats: ['es'],
            fileName: () => 'bundle.js'
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
        minify: false
    }
});
//# sourceMappingURL=vite.config.js.map