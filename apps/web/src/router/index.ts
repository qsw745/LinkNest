import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/forgot',
      name: 'forgot',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { public: true },
    },
    {
      path: '/reset',
      name: 'reset',
      component: () => import('../views/ResetPasswordView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    next({ name: 'login' })
    return
  }
  if (to.meta.public && auth.isAuthenticated && (to.name === 'login' || to.name === 'register')) {
    next({ name: 'home' })
    return
  }
  next()
})

export default router
