import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for built assets so it works in Electron file:// protocol
  build: {
    emptyOutDir: false, // Don't attempt to delete locked build binaries in dist
  },
});
