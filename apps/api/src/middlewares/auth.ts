import type { NextFunction, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { AuthenticatedRequest, AuthUser } from '../types'

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const token = authHeader.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthUser
    req.user = payload
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
