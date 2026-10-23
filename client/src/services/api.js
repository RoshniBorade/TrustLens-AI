import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchServerHealth() {
  const response = await api.get('/health');
  return response.data;
}

export async function fetchApiStatus() {
  const response = await api.get('/status');
  return response.data;
}

export default api;
