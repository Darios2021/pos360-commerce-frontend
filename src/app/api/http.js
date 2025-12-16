import axios from "axios";
import { useAuthStore } from "../store/auth.store";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  try {
    const auth = useAuthStore();
    if (auth?.accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
  } catch {
    // si pinia aún no está lista, no hacemos nada
  }
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        const auth = useAuthStore();
        auth.logout();
      } catch {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);
