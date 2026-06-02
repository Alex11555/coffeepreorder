// Auth endpoints
import { api } from './client';

export const signUp = (email, password, name) =>
  api('/api/auth/signup', { method: 'POST', body: { email, password, name }, auth: false });

export const signIn = (email, password) =>
  api('/api/auth/signin', { method: 'POST', body: { email, password }, auth: false });

export const fetchMe = () => api('/api/auth/me');

export const fetchLoyalty = () => api('/api/auth/loyalty');
