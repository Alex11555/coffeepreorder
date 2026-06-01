// Thin fetch wrapper that adds the API base URL and bearer token.
import { getItem } from '../utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export async function api(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  if (auth) {
    const token = await getItem('authToken');
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  // On Android/Hermes, POST with Content-Type: application/json but no body
  // can cause fetch() to throw a JSON parse error internally. Always send at
  // least '{}' for non-GET requests to avoid this.
  let finalBody = undefined;
  if (body) {
    finalBody = JSON.stringify(body);
  } else if (method !== 'GET') {
    finalBody = '{}';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: finalBody,
  });

  let data = null;
  let text = '';
  try {
    text = await res.text();
  } catch {
    // network cut mid-stream — treat as empty
  }
  if (text && text.trim().length > 0) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const msg = (typeof data === 'object' && data && data.error) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export const API_BASE_URL = BASE_URL;
