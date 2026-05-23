import axios from 'axios';
import { getToken, setToken } from './tokenStore';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send the refresh token cookie automatically
});

// Attach the current access token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Queue of requests that arrived while a token refresh was in flight
let isRefreshing = false;
let waitingQueue = [];

const flushQueue = (error, token = null) => {
  waitingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  waitingQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only retry 401s from authenticated requests (those that carried a Bearer token).
    // Login/register/forgot-password never send a token, so a 401 from them means
    // "wrong credentials", not "expired session" — don't try to refresh in that case.
    if (
      error.response?.status === 401 &&
      !original._retry &&
      original.headers?.Authorization?.startsWith('Bearer ') &&
      !original.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Park this request until the refresh resolves
        return new Promise((resolve, reject) => {
          waitingQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Use plain axios to avoid going through this interceptor again
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        setToken(data.accessToken);
        flushQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        flushQueue(err, null);
        setToken(null);
        // Signal the AuthContext to clear user state
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
