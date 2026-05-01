import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/agent": {
        target: "https://agrigpt-agent-backend.onrender.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/agent/, ""),
      },
      "/api/rag": {
        target: "https://agrigpt-rag-service.onrender.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rag/, ""),
      },
      "/api/cv": {
        target: "https://newapi.alumnx.com/agrigpt/cv",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cv/, ""),
      },
      "/api/speech": {
        target: "https://newapi.alumnx.com/agrigpt/speech",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/speech/, ""),
      },
    },
  },
});
