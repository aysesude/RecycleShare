import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API calls
export const authAPI = {
  // Standard registration
  register: async (data) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  // Standard login
  login: async (data) => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  // Verify OTP
  verifyOTP: async (data) => {
    const response = await api.post('/auth/verify-otp', data)
    return response.data
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await api.post('/auth/resend-otp', { email })
    return response.data
  },

  // Google auth initial
  googleAuth: async (credential) => {
    const response = await api.post('/auth/google', { credential })
    return response.data
  },

  // Google auth complete with phone
  googleAuthComplete: async (data) => {
    const response = await api.post('/auth/google/complete', data)
    return response.data
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  }
}

export default api
