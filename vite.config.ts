import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const required = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ] as const;
  for (const key of required) {
    if (!env[key]) {
      throw new Error(
        `[vite] Missing ${key}. Copy .env.example to .env and fill it in.`,
      );
    }
  }
  return {
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "src") },
    },
    build: {
      outDir: "dist",
      emptyOutDir: false,
      minify: "terser",
      lib: {
        entry: "src/index.ts",
        formats: ["iife"],
        name: "HideAlbums",
        fileName: () => "hide-albums.js",
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          banner:
            "// NAME: Hide Albums in Spicetify\n" +
            "// DESCRIPTION: Hide albums from Home, Artist, Search, and carousels in Spotify Desktop. Sign in to sync with Hide Albums in Spotify (Chrome).\n",
        },
      },
    },
  };
});
