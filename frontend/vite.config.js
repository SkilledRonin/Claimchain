import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  define: {
    // Required by some Web3 libraries that check for global
    global: "globalThis",
  },
  optimizeDeps: {
    // Only exclude porto (it uses viem sub-paths that may not exist).
    // RainbowKit must NOT be excluded — it depends on eventemitter3 (CJS)
    // which Vite can only resolve correctly when RainbowKit is pre-bundled.
    exclude: ["porto"],
    // Force-include everything that needs CJS→ESM conversion.
    include: [
      "wagmi",
      "viem",
      "@tanstack/react-query",
      "@rainbow-me/rainbowkit",
      "eventemitter3",
    ],
  },
});

