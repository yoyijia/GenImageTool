import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative paths so the built app works on GitHub Pages, jsDelivr, and any subfolder.
  base: "./",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) => {
          const fileName = (assetInfo as { names?: string[]; name?: string }).names?.[0]
            ?? assetInfo.name
            ?? "";
          if (fileName.endsWith(".css")) return "assets/app.css";
          return "assets/[name][extname]";
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  test: {
    environment: "jsdom",
  },
});
