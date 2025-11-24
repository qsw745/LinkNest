import axios from 'axios'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

const api = axios.create({
  baseURL: apiBase,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
