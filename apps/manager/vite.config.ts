import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],

  // Alias for dev/build (optional). Prefer relative imports in code for max portability.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  base: "./",
  server: { port: 5173, host: true },
  preview: { port: 4173, host: true },
});
