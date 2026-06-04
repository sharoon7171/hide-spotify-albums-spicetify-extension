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
      entry: "src/webpack/bootstrap.ts",
      formats: ["iife"],
      name: "SpotifyCustomizationBootstrap",
      fileName: () => "hidden-albums-bootstrap.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
