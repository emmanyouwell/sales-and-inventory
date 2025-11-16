import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

let runtimeErrorOverlay: any;
let cartographer: any;

try {
  runtimeErrorOverlay = require("@replit/vite-plugin-runtime-error-modal").default;
} catch {
  runtimeErrorOverlay = () => ({ name: "noop-runtime-error-overlay" });
  console.warn("⚠️ Replit runtime error overlay not found — skipping...");
}

try {
  cartographer = require("@replit/vite-plugin-cartographer").cartographer;
} catch {
  cartographer = () => ({ name: "noop-cartographer" });
  console.warn("⚠️ Replit cartographer not found — skipping...");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, "client"),
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID ? [cartographer()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  css: {
    postcss: path.resolve(__dirname, "postcss.config.js"), // ✅ fixes "from" warning
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
 server: {
  fs: {
    strict: true,
    deny: ["**/.*"],
  },
  port: 5173, // optional but useful for consistency
  proxy: {
    "/api": {
      target: "http://localhost:3000", // your Express dev server
      changeOrigin: true,
    },
  },
},
});
