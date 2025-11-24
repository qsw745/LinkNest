import axios from 'axios'

// Use relative path by default so dev-server proxy works for LAN access.
const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

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
