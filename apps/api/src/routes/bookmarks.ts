import { Router } from 'express'
import { db } from '../config/knex'
import { authMiddleware } from '../middlewares/auth'
import type { AuthenticatedRequest } from '../types'

const router = Router()

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id
  const { q = '', page = '1', pageSize = '20' } = req.query
  const currentPage = Math.max(Number(page) || 1, 1)
  const perPage = Math.min(Math.max(Number(pageSize) || 20, 1), 100)

  const baseQuery = db('bookmarks')
    .where({ user_id: userId, deleted: 0 })
    .modify((qb) => {
      if (q) {
        qb.andWhere(function search() {
          this.where('title', 'like', `%${q}%`).orWhere('url', 'like', `%${q}%`)
        })
      }
    })

  const [{ count }] = (await baseQuery.clone().count({ count: '*' })) as { count: number | string }[]
  const data = await baseQuery
    .clone()
    .orderBy('created_at', 'desc')
    .limit(perPage)
    .offset((currentPage - 1) * perPage)

  return res.json({
    data,
    total: Number(count),
    page: currentPage,
    pageSize: perPage,
  })
})

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id
  const { title, url, description, folderPath } = req.body as {
    title?: string
    url?: string
    description?: string
    folderPath?: string
  }
  if (!title || !url) {
    return res.status(400).json({ message: 'Title and URL are required' })
  }

  const [id] = await db('bookmarks').insert({
    user_id: userId,
    title,
    url,
    description: description || null,
    folder_path: folderPath || null,
    browser_id: 'manual',
    browser_bookmark_id: null,
    deleted: 0,
    is_public: false,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  })

  const created = await db('bookmarks').where({ id }).first()
  return res.status(201).json(created)
})

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id
  const id = Number(req.params.id)
  const { title, url, description, folderPath, isPublic } = req.body as {
    title?: string
    url?: string
    description?: string
    folderPath?: string
    isPublic?: boolean
  }
  const updates: Record<string, unknown> = {}
  if (title) updates.title = title
  if (url) updates.url = url
  if (description !== undefined) updates.description = description
  if (folderPath !== undefined) updates.folder_path = folderPath
    if (isPublic !== undefined) updates.is_public = Boolean(isPublic)

  const updated = await db('bookmarks')
    .where({ id, user_id: userId })
    .update({ ...updates, updated_at: db.fn.now() })

  if (!updated) {
    return res.status(404).json({ message: 'Bookmark not found' })
  }

  const item = await db('bookmarks').where({ id }).first()
  return res.json(item)
})

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id
  const id = Number(req.params.id)
  const deleted = await db('bookmarks')
    .where({ id, user_id: userId })
    .update({ deleted: 1, updated_at: db.fn.now() })

  if (!deleted) {
    return res.status(404).json({ message: 'Bookmark not found' })
  }

  return res.status(204).send()
})

router.post('/sync', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id
  const { event, data } = req.body as {
    event?: 'created' | 'changed' | 'removed'
    data?: {
      id?: string
      title?: string
      url?: string
      folderPath?: string
      dateAdded?: number
    }
  }

  if (!event || !data || !data.id) {
    return res.status(400).json({ message: 'Invalid sync payload' })
  }

  const bookmarkId = data.id
  if (event === 'created') {
    const existing = await db('bookmarks')
      .where({ user_id: userId, browser_bookmark_id: bookmarkId })
      .first()
    if (existing) {
      return res.json({ skipped: true, id: existing.id })
    }

    const [id] = await db('bookmarks').insert({
      user_id: userId,
      title: data.title || 'Untitled',
      url: data.url || '',
      folder_path: data.folderPath || null,
      browser_id: 'chrome',
      browser_bookmark_id: bookmarkId,
      deleted: 0,
      is_public: false,
      created_at: data.dateAdded ? new Date(data.dateAdded) : db.fn.now(),
      updated_at: db.fn.now(),
    })
    return res.status(201).json({ id })
  }

  if (event === 'changed') {
    const updated = await db('bookmarks')
      .where({ user_id: userId, browser_bookmark_id: bookmarkId })
      .update({
        title: data.title,
        url: data.url,
        updated_at: db.fn.now(),
      })
    if (!updated) {
      return res.status(404).json({ message: 'Bookmark not found' })
    }
    return res.json({ updated: true })
  }

  if (event === 'removed') {
    await db('bookmarks')
      .where({ user_id: userId, browser_bookmark_id: bookmarkId })
      .update({ deleted: 1, updated_at: db.fn.now() })
    return res.json({ deleted: true })
  }

  return res.status(400).json({ message: 'Unsupported event' })
})

// Public endpoint to view a single bookmark if marked public
router.get('/public/:id', async (req, res) => {
  const id = Number(req.params.id)
  const bookmark = await db('bookmarks').where({ id, is_public: true, deleted: 0 }).first()
  if (!bookmark) {
    return res.status(404).json({ message: 'Not found' })
  }
  return res.json(bookmark)
})

export default router
