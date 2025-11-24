import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { db } from '../config/knex'
import { env } from '../config/env'

const router = Router()

const transporter =
  env.mail.host && env.mail.user
    ? nodemailer.createTransport({
        host: env.mail.host,
        port: env.mail.port,
        secure: env.mail.port === 465,
        auth: {
          user: env.mail.user,
          pass: env.mail.pass,
        },
      })
    : null

router.post('/register', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const existing = await db('users').where({ email }).first()
  if (existing) {
    return res.status(400).json({ message: 'Email already registered' })
  }

  const password_hash = await bcrypt.hash(password, 10)
  const [insertedId] = await db('users').insert({
    email,
    password_hash,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  })

  const user = { id: Number(insertedId), email }
  const token = jwt.sign(user, env.jwtSecret, { expiresIn: '7d' })
  return res.json({ token, user })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const user = await db('users').where({ email }).first()
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const payload = { id: user.id, email: user.email }
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' })
  return res.json({ token, user: payload })
})

router.post('/forgot', async (req, res) => {
  const { email } = req.body as { email?: string }
  if (!email) {
    return res.status(400).json({ message: 'Email is required' })
  }

  const user = await db('users').where({ email }).first()
  // 为防止暴露用户是否存在，即便不存在也返回 200
  if (!user) {
    return res.json({ message: 'If the email exists, a reset link has been sent.' })
  }

  if (!transporter) {
    return res.status(500).json({ message: 'Mail service is not configured' })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + env.resetTokenExpiresMinutes * 60 * 1000)

  await db('password_resets').insert({
    user_id: user.id,
    token,
    expires_at: expiresAt,
    used: false,
    created_at: db.fn.now(),
  })

  const resetLink = `${env.resetBaseUrl}?token=${token}`
  await transporter.sendMail({
    from: env.mail.from,
    to: email,
    subject: 'LinkNest 密码重置',
    html: `
      <p>您收到此邮件是因为请求了密码重置。</p>
      <p>点击下方链接重置密码（${env.resetTokenExpiresMinutes} 分钟内有效）：</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>如果不是您操作，请忽略本邮件。</p>
    `,
  })

  return res.json({ message: 'Reset email sent if account exists' })
})

router.post('/reset', async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string }
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required' })
  }

  const reset = await db('password_resets')
    .where({ token, used: false })
    .andWhere('expires_at', '>', db.fn.now())
    .first()

  if (!reset) {
    return res.status(400).json({ message: 'Invalid or expired token' })
  }

  const password_hash = await bcrypt.hash(password, 10)
  await db('users').where({ id: reset.user_id }).update({ password_hash, updated_at: db.fn.now() })
  await db('password_resets').where({ id: reset.id }).update({ used: true })

  const user = await db('users').where({ id: reset.user_id }).first()
  const payload = { id: user.id, email: user.email }
  const jwtToken = jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' })

  return res.json({ token: jwtToken, user: payload })
})

export default router
