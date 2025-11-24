import dotenv from 'dotenv'

dotenv.config({ path: process.env.API_ENV_PATH || '.env' })

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'linknest-dev-secret',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'exampwd',
    database: process.env.DB_NAME || 'linknest',
  },
  mail: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'no-reply@linknest.local',
  },
  resetBaseUrl: process.env.RESET_BASE_URL || 'http://localhost:5173/reset',
  resetTokenExpiresMinutes: Number(process.env.RESET_EXPIRES_MINUTES || 30),
}
