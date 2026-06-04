import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: "terser",
    lib: {
      entry: "src/webpack/post-snapshot.ts",
      formats: ["iife"],
      name: "SpotifyCustomizationPostSnapshot",
      fileName: () => "hidden-albums-post-snapshot.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
