import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    outDir: "docs",
  },
  resolve: {
    alias: {
      buffer: "buffer/",
      events: "events/",
      stream: "stream-browserify",
      util: "util/",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
