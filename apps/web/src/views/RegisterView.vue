<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { MailOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const form = reactive({
  email: '',
  password: '',
})

const submit = async () => {
  loading.value = true
  try {
    await auth.register(form.email, form.password)
    message.success('注册成功，已自动登录')
    router.push('/')
  } catch (error: any) {
    message.error(error?.response?.data?.message || '注册失败')
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
        <span>LinkNest · 注册</span>
      </div>
      <a-form layout="vertical" :model="form" @finish="submit">
        <a-form-item name="email" label="Email" :rules="[{ required: true, message: '请输入邮箱' }]">
          <a-input v-model:value="form.email" size="large" placeholder="you@example.com">
            <template #prefix>
              <MailOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item name="password" label="密码" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="form.password" size="large" placeholder="••••••••">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
        <a-space direction="vertical" style="width: 100%">
          <a-button type="primary" size="large" block :loading="loading" html-type="submit">注册并登录</a-button>
          <a-button type="link" block @click="router.push('/login')">已有账号？去登录</a-button>
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
  margin-bottom: 16px;
  gap: 8px;
  color: #111827;
  letter-spacing: 0.2px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1677ff, #22d3ee);
  box-shadow: 0 8px 20px rgba(34, 211, 238, 0.4);
}
</style>
