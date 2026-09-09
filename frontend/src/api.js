// Central API base URL — reads from .env in production, falls back to local
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default API_BASE;
