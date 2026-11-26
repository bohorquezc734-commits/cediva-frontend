import axios from 'axios';

const STORAGE_TOKEN_KEY = 'cediva_token';

// export const api = axios.create({
//   baseURL: 'https://localhost:5001/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });
export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function extraerMensajeError(err: unknown, mensajePorDefecto: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { detail?: string; message?: string } | undefined;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
  }
  return mensajePorDefecto;
}