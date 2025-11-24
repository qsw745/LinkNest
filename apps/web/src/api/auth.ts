import api from './client'

export interface AuthResponse {
  token: string
  user: { id: number; email: string }
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  return data
}

export async function register(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/register', { email, password })
  return data
}

export async function requestPasswordReset(email: string) {
  const { data } = await api.post<{ message: string }>('/auth/forgot', { email })
  return data
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/reset', { token, password })
  return data
}
