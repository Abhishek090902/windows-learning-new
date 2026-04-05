const PROD_API_URL = 'https://windows-learning-new.onrender.com/api/v1';
const PROD_SOCKET_URL = 'https://windows-learning-new.onrender.com';
const DEV_API_URL = 'http://localhost:3000/api/v1';
const DEV_SOCKET_URL = 'http://localhost:3000';

const trimEnv = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const getApiBaseUrl = (): string => {
  const envUrl = trimEnv(import.meta.env.VITE_API_URL);
  if (envUrl) return envUrl;
  return import.meta.env.PROD ? PROD_API_URL : DEV_API_URL;
};

export const getSocketBaseUrl = (): string => {
  const envSocketUrl = trimEnv(import.meta.env.VITE_SOCKET_URL);
  if (envSocketUrl) return envSocketUrl;

  const apiUrl = trimEnv(import.meta.env.VITE_API_URL);
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      return apiUrl;
    }
  }

  return import.meta.env.PROD ? PROD_SOCKET_URL : DEV_SOCKET_URL;
};

export const getAssetUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  try {
    return new URL(path, getApiBaseUrl()).toString();
  } catch {
    return path;
  }
};
