/**
 * API Configuration
 *
 * Render (Static Site): set VITE_* env vars in Render dashboard — Vite bakes them
 *   into the bundle at build time, so the browser calls the backends directly.
 *   The backends must allow CORS from the Render frontend URL.
 *
 * Vercel: VITE_* vars are NOT set — falls back to /api/* proxy paths which
 *   vercel.json rewrites to the real backends (no CORS needed).
 *
 * Development: VITE_* vars are NOT set — falls back to /api/* proxy paths which
 *   vite.config.js proxies to the real backends (no CORS needed).
 */

export const API_CONFIG = {
  // All requests use /api/* proxy paths.
  // Dev: proxied by vite.config.js | Render/Vercel: proxied by server.js / vercel.json
  BASE_URL: "/api/rag",
  IMAGE_BASE_URL: "/api/rag",
  DRONE_BASE_URL: "/api/cv",
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
