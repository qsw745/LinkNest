<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'
import { resetPassword } from '../api/auth'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const token = ref('')
const form = reactive({
  password: '',
  confirm: '',
})

onMounted(() => {
  token.value = (route.query.token as string) || ''
  if (!token.value) {
    message.error('缺少重置令牌')
  }
})

const submit = async () => {
  if (!token.value) {
    message.error('无效的重置链接')
    return
  }
  if (form.password !== form.confirm) {
    message.error('两次密码不一致')
    return
  }
  loading.value = true
  try {
    const data = await resetPassword(token.value, form.password)
    auth.setAuth(data.user, data.token)
    message.success('密码已重置并自动登录')
    router.push('/')
  } catch (error: any) {
    message.error(error?.response?.data?.message || '重置失败或链接已过期')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-layout">
    <div class="auth-card">
      <div class="brand">
        <div class="dot"></div>
        <span>重置密码</span>
      </div>
      <p class="hint">设置新密码，提交后将自动登录。</p>
      <a-form layout="vertical" :model="form" @finish="submit">
        <a-form-item name="password" label="新密码" :rules="[{ required: true, message: '请输入新密码' }]">
          <a-input-password v-model:value="form.password" size="large" placeholder="••••••••">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
        <a-form-item name="confirm" label="确认密码" :rules="[{ required: true, message: '请再次输入新密码' }]">
          <a-input-password v-model:value="form.confirm" size="large" placeholder="••••••••">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
        <a-space direction="vertical" style="width: 100%">
          <a-button type="primary" size="large" block :loading="loading" html-type="submit">
            重置并登录
          </a-button>
          <a-button size="large" block @click="router.push('/login')">
            <ArrowLeftOutlined />
            返回登录
          </a-button>
        </a-space>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-card {
  width: 420px;
  padding: 32px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 70px rgba(15, 23, 42, 0.15);
  border: 1px solid #eef1f7;
}

.brand {
  display: flex;
  align-items: center;
  font-weight: 600;
  margin-bottom: 8px;
  gap: 8px;
  color: #111827;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1677ff, #22d3ee);
  box-shadow: 0 8px 20px rgba(34, 211, 238, 0.4);
}

.hint {
  margin: 0 0 16px;
  color: #475569;
}
</style>
