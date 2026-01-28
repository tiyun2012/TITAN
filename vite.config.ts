import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Allows imports like: import x from "@/engine/..."
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  base: "./",
  server: {
    host: true,
    // Firebase Studio provides $PORT via the preview command
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    strictPort: true,
    allowedHosts: true,
  },
});
