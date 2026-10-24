import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept error responses to provide clean, helpful error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let customMessage = 'An unexpected error occurred during communication with the server.';
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      customMessage = 'The request timed out while the AI service was retrieving evidence and evaluating claims. Please try again.';
    } else if (error.response?.data?.error?.message) {
      customMessage = error.response.data.error.message;
    } else if (error.response?.data?.detail) {
      customMessage = error.response.data.detail;
    } else if (error.code === 'ERR_NETWORK') {
      customMessage = 'Unable to connect to the backend server at http://localhost:5000. Please ensure the server is running.';
    } else if (error.message) {
      customMessage = error.message;
    }
    const enhancedError = new Error(customMessage);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    return Promise.reject(enhancedError);
  }
);

export async function fetchServerHealth() {
  const response = await api.get('/health');
  return response.data;
}

export async function fetchApiStatus() {
  const response = await api.get('/status');
  return response.data;
}

export default api;
