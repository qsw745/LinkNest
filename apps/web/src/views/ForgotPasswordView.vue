<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'
import { requestPasswordReset } from '../api/auth'

const router = useRouter()
const loading = ref(false)
const sent = ref(false)
const form = reactive({
  email: '',
})

const submit = async () => {
  loading.value = true
  try {
    await requestPasswordReset(form.email)
    sent.value = true
    message.success('如果邮箱存在，已发送重置邮件')
  } catch (error: any) {
    message.error(error?.response?.data?.message || '发送失败')
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
        <span>忘记密码</span>
      </div>
      <p class="hint">输入邮箱，我们会发送重置密码链接。</p>
      <a-form layout="vertical" :model="form" @finish="submit">
        <a-form-item name="email" label="Email" :rules="[{ required: true, message: '请输入邮箱' }]">
          <a-input v-model:value="form.email" size="large" placeholder="you@example.com">
            <template #prefix>
              <MailOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-space direction="vertical" style="width: 100%">
          <a-button type="primary" size="large" block :loading="loading" html-type="submit">
            发送重置邮件
          </a-button>
          <a-button size="large" block @click="router.push('/login')">
            <ArrowLeftOutlined />
            返回登录
          </a-button>
        </a-space>
      </a-form>
      <a-alert
        v-if="sent"
        type="success"
        show-icon
        message="如果邮箱存在，重置邮件已发送。请在 30 分钟内完成重置。"
        style="margin-top: 12px"
      />
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
