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
      entry: "src/index.ts",
      formats: ["iife"],
      name: "SpotifyCustomization",
      fileName: () => "spotify-customization.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        banner:
          "// NAME: Spotify customization\n" +
          "// DESCRIPTION: Album hide/show toggle and hidden albums manager.\n",
      },
    },
  },
});
