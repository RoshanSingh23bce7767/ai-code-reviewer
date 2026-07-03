import axios from 'axios';

const isLocalHost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const renderApiUrl = 'https://roshan-codeinsight-ai-api.onrender.com/api/v1';
const localApiUrl = 'http://localhost:5050/api/v1';
const configuredApiUrl = import.meta.env.VITE_API_URL;
const API_URL =
  configuredApiUrl && (isLocalHost || !configuredApiUrl.includes('localhost'))
    ? configuredApiUrl
    : isLocalHost
      ? localApiUrl
      : renderApiUrl;
const CSRF_SAFE_METHODS = new Set(['get', 'head', 'options']);
let csrfToken: string | null = null;

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  xsrfCookieName: 'csrfToken',
  xsrfHeaderName: 'x-csrf-token'
});

const ensureCsrfToken = async () => {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await axios.get(`${API_URL}/csrf-token`, {
    withCredentials: true
  });

  csrfToken = response.data?.csrfToken || response.headers['x-csrf-token'] || null;
  return csrfToken;
};

apiClient.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!CSRF_SAFE_METHODS.has(method)) {
    const token = await ensureCsrfToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['x-csrf-token'] = token;
    }
  }

  return config;
});

// Flag to prevent multiple concurrent refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Trigger token refresh if unauthorized, and not already retrying or attempting to auth
    const isAuthRequest = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/auth/refresh');
        isRefreshing = false;
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        
        // Notify AuthContext to log out the user
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
