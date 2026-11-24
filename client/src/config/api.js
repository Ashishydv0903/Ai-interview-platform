/**
 * Dynamic API Base URL Config
 *
 * In Local Development:
 *   Defaults to empty string (''), using Vite's proxy (/api -> http://localhost:5001).
 *
 * In Production on Render (or Vercel / Netlify):
 *   Set VITE_API_URL in your Render dashboard environment variables:
 *   Example: VITE_API_URL=https://adaptive-interview-server.onrender.com
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Returns a fully qualified or relative URL depending on the environment.
 * @param {string} endpoint e.g. '/api/interview/start'
 * @returns {string} e.g. 'https://my-backend.onrender.com/api/interview/start' or '/api/interview/start'
 */
export const apiUrl = (endpoint) => {
  if (!endpoint) return API_BASE_URL || '';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default apiUrl;
