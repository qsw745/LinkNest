import type { Request } from 'express'

export interface AuthUser {
  id: number
  email: string
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
}

export interface BookmarkPayload {
  title: string
  url: string
  description?: string | null
  folder_path?: string | null
  browser_id?: string
  browser_bookmark_id?: string | null
}
