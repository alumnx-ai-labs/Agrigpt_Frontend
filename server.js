import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 10000;

// Proxy /api/agent/* → AgriGPT agent backend (server-side, no CORS)
app.use(
  "/api/agent",
  createProxyMiddleware({
    target: "https://agrigpt-agent-backend.onrender.com",
    changeOrigin: true,
    pathRewrite: { "^/api/agent": "" },
  })
);

// Proxy /api/rag/* → RAG service (server-side, no CORS)
app.use(
  "/api/rag",
  createProxyMiddleware({
    target: "https://agrigpt-rag-service.onrender.com",
    changeOrigin: true,
    pathRewrite: { "^/api/rag": "" },
  })
);

// Serve built React app
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback — all other routes serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
