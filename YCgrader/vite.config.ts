import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Frontend on :5173; proxy /api to the local Node grader server on :8787.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
        // Analysis makes several sequential LLM calls and can take >1 min.
        // Without a generous timeout the proxy closes the socket early and the
        // browser receives an empty body ("Unexpected end of JSON input").
        timeout: 600_000,
        proxyTimeout: 600_000,
      },
    },
  },
});
