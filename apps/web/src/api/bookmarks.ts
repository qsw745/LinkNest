import api from './client'

export interface Bookmark {
  id: number
  title: string
  url: string
  description?: string | null
  folder_path?: string | null
  browser_id?: string
  browser_bookmark_id?: string | null
  is_public?: boolean
  created_at: string
}

export interface BookmarkListResponse {
  data: Bookmark[]
  total: number
  page: number
  pageSize: number
}

export async function fetchBookmarks(params: { q?: string; page?: number; pageSize?: number }) {
  const { data } = await api.get<BookmarkListResponse>('/bookmarks', { params })
  return data
}

export async function createBookmark(payload: { title: string; url: string; description?: string; folderPath?: string }) {
  const { data } = await api.post<Bookmark>('/bookmarks', payload)
  return data
}

export async function updateBookmark(
  id: number,
  payload: { title?: string; url?: string; description?: string; folderPath?: string; isPublic?: boolean },
) {
  const { data } = await api.put<Bookmark>(`/bookmarks/${id}`, payload)
  return data
}

export async function deleteBookmark(id: number) {
  await api.delete(`/bookmarks/${id}`)
}

export function publicLink(id: number) {
  const origin = window.location.origin
  return `${origin}/api/bookmarks/public/${id}`
}
