import { defineStore } from 'pinia'
import { login as apiLogin, register as apiRegister } from '../api/auth'

interface User {
  id: number
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,
    token: localStorage.getItem('token'),
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    setAuth(user: User, token: string) {
      this.user = user
      this.token = token
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    async login(email: string, password: string) {
      const data = await apiLogin(email, password)
      this.setAuth(data.user, data.token)
    },
    async register(email: string, password: string) {
      const data = await apiRegister(email, password)
      this.setAuth(data.user, data.token)
    },
  },
})
