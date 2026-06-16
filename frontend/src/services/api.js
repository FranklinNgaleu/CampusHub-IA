import axios from 'axios';

// En développement, utilisez l'URL complète
// const API_URL = 'http://localhost:8000';
// const API_URL = 'http://127.0.0.1:8000';
const API_URL = 'https://campushub-backend-vo1m.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.clear();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        processQueue(null, access_token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  refresh: (token) => api.post('/api/auth/refresh', { refresh_token: token }),
  getMe: () => api.get('/api/users/me'),
};

export const users = {
  getMe: () => api.get('/api/users/me'),
  updateMe: (data) => api.put('/api/users/me', data),
  deleteMe: () => api.delete('/api/users/me'),
  getById: (id) => api.get(`/api/users/${id}`),
};

export const skills = {
  getAll: () => api.get('/api/skills'),
  create: (data) => api.post('/api/skills', data),
  update: (id, data) => api.put(`/api/skills/${id}`, data),
  delete: (id) => api.delete(`/api/skills/${id}`),
};

export const matching = {
  getProjects: (params = {}) => api.get('/api/matching/projects', { params }),
  getMentors: (params = {}) => api.get('/api/matching/mentors', { params }),
  applyToProject: (projectId, message = null) =>
    api.post(`/api/matching/projects/${projectId}/apply`, message ? { message } : {}),
  createProject: (data) => api.post('/api/matching/projects', data),
};

export const mentorat = {
  getAll: () => api.get('/api/mentorat'),
  create: (mentorId, goals = null) => api.post('/api/mentorat', { mentor_id: mentorId, goals }),
  getMessages: (mentorshipId) => api.get(`/api/mentorat/${mentorshipId}/messages`),
  sendMessage: (mentorshipId, content) =>
    api.post(`/api/mentorat/${mentorshipId}/messages`, { content }),
  getSessions: (mentorshipId) => api.get(`/api/mentorat/${mentorshipId}/sessions`),
  createSession: (mentorshipId, data) =>
    api.post(`/api/mentorat/${mentorshipId}/sessions`, data),
  submitFeedback: (mentorshipId, sessionId, rating, feedback = null) =>
    api.post(`/api/mentorat/${mentorshipId}/sessions/${sessionId}/feedback`, { rating, feedback }),
};

export const clubs = {
  getAll: () => api.get('/api/clubs'),
  getKPIs: () => api.get('/api/clubs/kpis'),
  create: (data) => api.post('/api/clubs', data),
  join: (clubId) => api.post(`/api/clubs/${clubId}/join`),
  leave: (clubId) => api.delete(`/api/clubs/${clubId}/leave`),
};

export const events = {
  getAll: () => api.get('/api/events'),
  getRecommended: () => api.get('/api/events/recommended'),
  create: (data) => api.post('/api/events', data),
  register: (eventId) => api.post(`/api/events/${eventId}/register`),
  unregister: (eventId) => api.delete(`/api/events/${eventId}/register`),
};

export const admin = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getUsers: () => api.get('/api/admin/users'),
};

// ⭐ CERTIFICATIONS - AJOUT ⭐
export const certifications = {
  getAll: () => api.get('/api/certifications'),
  create: (data) => api.post('/api/certifications', data),
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/certifications/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/api/certifications/${id}`),
};

export default api;