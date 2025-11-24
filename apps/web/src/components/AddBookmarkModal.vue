<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [{ title: string; url: string; description?: string; folderPath?: string }]
  cancel: []
}>()

const form = reactive({
  title: '',
  url: '',
  description: '',
  folderPath: '',
})

watch(
  () => props.open,
  (val) => {
    if (val) {
      form.title = ''
      form.url = ''
      form.description = ''
      form.folderPath = ''
    }
  },
)

const handleOk = () => {
  emit('submit', {
    title: form.title,
    url: form.url,
    description: form.description || undefined,
    folderPath: form.folderPath || undefined,
  })
}
</script>

<template>
  <a-modal
    :open="open"
    title="手动新增书签"
    :confirm-loading="loading"
    ok-text="保存"
    cancel-text="取消"
    @ok="handleOk"
    @cancel="emit('cancel')"
  >
    <a-form layout="vertical">
      <a-form-item label="标题" required>
        <a-input v-model:value="form.title" placeholder="例如：GitHub" />
      </a-form-item>
      <a-form-item label="URL" required>
        <a-input v-model:value="form.url" placeholder="https://github.com" />
      </a-form-item>
      <a-form-item label="描述">
        <a-textarea v-model:value="form.description" :rows="3" placeholder="可选说明" />
      </a-form-item>
      <a-form-item label="文件夹路径">
        <a-input v-model:value="form.folderPath" placeholder="书签栏/学习" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
