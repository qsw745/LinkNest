import { Router } from 'express'
import authRoutes from './auth'
import bookmarkRoutes from './bookmarks'

const router = Router()

router.use('/auth', authRoutes)
router.use('/bookmarks', bookmarkRoutes)

export default router
