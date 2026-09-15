import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds only the Side Panel (React) app. The background service worker and
// content script are plain TypeScript with no JSX/CSS needs, so they are
// bundled separately by scripts/build-extension.mjs via esbuild — MV3
// requires the content script to be a classic (non-module) script, which
// doesn't mix well with Vite's code-split ESM output for a second entry.
export default defineConfig({
  root: "src/sidepanel",
  base: "",
  plugins: [react()],
  build: {
    outDir: "../../dist/sidepanel",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
