/**
 * API Configuration
 *
 * Production (Vercel): all /api/* routes proxied by vercel.json:
 *   /api/agent/*   → VITE_AGENT_URL   (AgriGPT agent backend — receives chat, calls RAG internally)
 *   /api/rag/*     → VITE_RAG_URL     (RAG service — image upload & retrieval)
 *   /api/cv/*      → VITE_CV_URL      (Computer Vision — drone analysis)
 *   /api/speech/*  → VITE_SPEECH_URL  (Speech service)
 *
 * Development: set VITE_*_URL vars in .env to your local servers.
 */

export const API_CONFIG = {
  // Agent backend — always via proxy (/api/agent) to avoid CORS in dev and prod
  BASE_URL: "/api/agent",

  // RAG service — always via proxy (/api/rag) to avoid CORS in dev and prod
  IMAGE_BASE_URL: "/api/rag",

  // Computer Vision backend — always via proxy to avoid CORS
  DRONE_BASE_URL: "/api/cv",

  // Speech service — always via proxy to avoid CORS
  SPEECH_BASE_URL: "/api/speech",

  // API endpoints
  ENDPOINTS: {
    QUERY: "/query",
    IMAGE_UPLOAD: "/query-image-upload",
    VIDEO_QUERY: "/image-query",
  },

  IMAGE_PROXY: null,

  TIMEOUT: 30000,

  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
    BACKOFF_MULTIPLIER: 2,
  },

  LANGUAGES: {
    ENGLISH: "en",
    HINDI: "hi",
    TELUGU: "te",
  },

  STORAGE_KEYS: {
    PHONE_NUMBER: "agrigpt_phone_number",
    USER_PREFERENCES: "agrigpt_user_preferences",
    CHAT_HISTORY: "agrigpt_chat_history",
  },

  PHONE: {
    COUNTRY_CODE: "91",
    LENGTH: 12,
  },

  IMAGE: {
    MAX_SIZE: 5 * 1024 * 1024,
    ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    COMPRESSION_QUALITY: 0.9,
  },
};

export default API_CONFIG;
