// Auth endpoints — staff dashboard uses the same routes as customers.
import { api } from './client.js';

export const signIn = (email, password) =>
  api('/api/auth/signin', { method: 'POST', body: { email, password }, auth: false });

export const fetchMe = () => api('/api/auth/me');
