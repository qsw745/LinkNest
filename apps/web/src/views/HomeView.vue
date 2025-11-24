<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, Tag } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  fetchBookmarks,
  createBookmark,
  deleteBookmark,
  updateBookmark,
  publicLink,
  type Bookmark,
} from '../api/bookmarks'
import AddBookmarkModal from '../components/AddBookmarkModal.vue'
import EditBookmarkModal from '../components/EditBookmarkModal.vue'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const router = useRouter()
const columns = [
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: 'URL', dataIndex: 'url', key: 'url' },
  { title: '来源', dataIndex: 'browser_id', key: 'browser_id', width: 120 },
  { title: '公开状态', dataIndex: 'is_public', key: 'is_public', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', sorter: true },
  { title: '操作', key: 'actions', width: 240 },
]
const state = reactive({
  list: [] as Bookmark[],
  total: 0,
  loading: false,
  page: 1,
  pageSize: 20,
  search: '',
})

const addModalOpen = ref(false)
const addLoading = ref(false)
const showInstallAlert = ref(localStorage.getItem('hideInstallAlert') !== '1')
const editModalOpen = ref(false)
const editLoading = ref(false)
const editingBookmark = ref<Bookmark | null>(null)

const loadData = async () => {
  state.loading = true
  try {
    const data = await fetchBookmarks({ q: state.search, page: state.page, pageSize: state.pageSize })
    state.list = data.data
    state.total = data.total
  } catch (error: any) {
    message.error(error?.response?.data?.message || '加载失败')
  } finally {
    state.loading = false
  }
}

onMounted(() => {
  loadData()
})

const onSearch = () => {
  state.page = 1
  loadData()
}

const onTableChange = (pagination: { current?: number; pageSize?: number }) => {
  state.page = pagination.current || 1
  state.pageSize = pagination.pageSize || 20
  loadData()
}

const handleAdd = async (payload: { title: string; url: string; description?: string; folderPath?: string }) => {
  addLoading.value = true
  try {
    await createBookmark(payload)
    message.success('新增成功')
    addModalOpen.value = false
    loadData()
  } catch (error: any) {
    message.error(error?.response?.data?.message || '新增失败')
  } finally {
    addLoading.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await deleteBookmark(id)
    message.success('已删除')
    loadData()
  } catch (error: any) {
    message.error(error?.response?.data?.message || '删除失败')
  }
}

const hideInstallTip = () => {
  showInstallAlert.value = false
  localStorage.setItem('hideInstallAlert', '1')
}

const openEdit = (record: Bookmark) => {
  editingBookmark.value = record
  editModalOpen.value = true
}

const handleEdit = async (payload: { title: string; url: string; description?: string; folderPath?: string }) => {
  if (!editingBookmark.value) return
  editLoading.value = true
  try {
    await updateBookmark(editingBookmark.value.id, payload)
    message.success('已更新')
    editModalOpen.value = false
    loadData()
  } catch (error: any) {
    message.error(error?.response?.data?.message || '更新失败')
  } finally {
    editLoading.value = false
  }
}

const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    message.success('已复制链接')
  } catch {
    message.error('复制失败')
  }
}

const closeEdit = () => {
  editModalOpen.value = false
  editingBookmark.value = null
}

const togglePublic = async (record: Bookmark, next: boolean) => {
  try {
    await updateBookmark(record.id, { isPublic: next })
    message.success(next ? '已设为公开' : '已取消公开')
    loadData()
  } catch (error: any) {
    message.error(error?.response?.data?.message || '更新失败')
  }
}

const copyPublicLink = async (id: number) => {
  const link = publicLink(id)
  try {
    await navigator.clipboard.writeText(link)
    message.success('分享链接已复制')
  } catch {
    message.error('复制失败')
  }
}
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-header class="header">
      <div class="header-inner">
        <div class="brand">
          <div class="logo-dot"></div>
          <div class="brand-text">
            <div class="title">LinkNest</div>
            <div class="subtitle">书签同步中心</div>
          </div>
        </div>
        <div class="actions">
          <span class="user-email">{{ auth.user?.email }}</span>
          <a-button type="text" @click="auth.logout(); router.push('/login')">退出</a-button>
        </div>
      </div>
    </a-layout-header>
    <a-layout-content class="content">
      <div class="hero">
        <div class="hero-left">
          <div class="eyebrow">书签同步 · 在线中心</div>
          <h2>把分散的书签收拢到一个家</h2>
          <p>扩展自动监听新增/修改/删除，前端即可搜索与管理。</p>
          <a-space wrap>
            <a-button type="primary" size="large" @click="loadData">刷新列表</a-button>
            <a-button size="large" @click="addModalOpen = true">快速新增</a-button>
            <a-button size="large" href="/extension.zip" download>下载浏览器扩展</a-button>
          </a-space>
        </div>
        <div class="hero-meta">
          <div class="stat">
            <div class="stat-label">已同步</div>
            <div class="stat-number">{{ state.total }}</div>
            <div class="stat-desc">条书签</div>
          </div>
          <div class="stat">
            <div class="stat-label">每页</div>
            <div class="stat-number">{{ state.pageSize }}</div>
            <div class="stat-desc">条记录</div>
          </div>
          <div class="stat">
            <div class="stat-label">状态</div>
            <div class="stat-number">在线</div>
            <div class="stat-desc">API 4000</div>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <div class="search">
          <a-input-search
            v-model:value="state.search"
            placeholder="按标题或 URL 搜索"
            size="large"
            allow-clear
            @search="onSearch"
            @press-enter="onSearch"
          />
        </div>
        <a-space>
          <a-button type="default" size="large" @click="loadData">刷新</a-button>
          <a-button type="primary" size="large" @click="addModalOpen = true">手动新增</a-button>
        </a-space>
      </div>

      <a-card class="table-card" :body-style="{ padding: '12px' }" bordered>
        <a-alert
          v-if="showInstallAlert"
          type="info"
          show-icon
          closable
          @close="hideInstallTip"
          message="请安装浏览器扩展以自动同步您的书签。登录扩展后即可在后台自动上传。"
          style="margin-bottom: 12px"
        />

        <a-table
          size="middle"
          :columns="columns"
          :data-source="state.list"
          :loading="state.loading"
          :pagination="{
            current: state.page,
            pageSize: state.pageSize,
            total: state.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }"
          row-key="id"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <a :href="record.url" target="_blank" rel="noopener" class="title-link">{{ record.title }}</a>
            </template>
            <template v-else-if="column.key === 'url'">
              <span class="url-text">{{ record.url }}</span>
            </template>
            <template v-else-if="column.key === 'browser_id'">
              <Tag color="blue" v-if="record.browser_id === 'chrome'">扩展</Tag>
              <Tag color="purple" v-else>手动</Tag>
            </template>
            <template v-else-if="column.key === 'is_public'">
              <Tag color="green" v-if="record.is_public">公开</Tag>
              <Tag color="default" v-else>仅自己</Tag>
            </template>
            <template v-else-if="column.key === 'created_at'">
              {{ dayjs(record.created_at).format('YYYY-MM-DD HH:mm') }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space size="small">
                <a-button type="link" @click="openEdit(record)">编辑</a-button>
                <a-button type="link" @click="copyUrl(record.url)">复制</a-button>
                <a-popconfirm
                  v-if="record.is_public"
                  title="取消公开？"
                  @confirm="() => togglePublic(record, false)"
                >
                  <a-button type="link">私有</a-button>
                </a-popconfirm>
                <a-button v-else type="link" @click="togglePublic(record, true)">公开</a-button>
                <a-button type="link" v-if="record.is_public" @click="copyPublicLink(record.id)">分享链接</a-button>
                <a-popconfirm title="确认删除？" @confirm="() => handleDelete(record.id)">
                  <a-button type="link" danger>删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </a-layout-content>
  </a-layout>

  <AddBookmarkModal
    :open="addModalOpen"
    :loading="addLoading"
    @submit="handleAdd"
    @cancel="addModalOpen = false"
  />
  <EditBookmarkModal
    :open="editModalOpen"
    :loading="editLoading"
    :data="editingBookmark"
    @submit="handleEdit"
    @cancel="closeEdit"
  />
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #eef1f7;
  padding: 0 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-dot {
  width: 14px;
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(135deg, #1677ff, #22d3ee);
  box-shadow: 0 10px 30px rgba(34, 211, 238, 0.35);
}

.brand-text {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.brand-text .title {
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
}

.brand-text .subtitle {
  color: #6b7280;
  font-size: 13px;
  white-space: nowrap;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #475569;
}

.user-email {
  font-weight: 500;
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.content {
  padding: 24px 32px 64px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.table-card {
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  border: 1px solid #eef1f7;
}

.hero {
  background: radial-gradient(circle at 10% 10%, #e0f2ff 0, #f4f7ff 40%, #ffffff 100%);
  border: 1px solid #dbeafe;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.hero-left h2 {
  margin: 6px 0 4px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
}

.hero-left p {
  margin: 0 0 14px;
  color: #475569;
}

.eyebrow {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.hero-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  min-width: 110px;
}

.stat-label {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 4px;
}

.stat-number {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.stat-desc {
  color: #64748b;
  font-size: 12px;
  margin-top: 2px;
}

.toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search {
  flex: 1;
  min-width: 260px;
}

.title-link {
  color: #0f172a;
  font-weight: 600;
}

.title-link:hover {
  color: #1677ff;
}

.url-text {
  color: #64748b;
  word-break: break-all;
}
</style>
