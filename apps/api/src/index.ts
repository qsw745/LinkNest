import express from 'express'
import cors from 'cors'
import routes from './routes'
import { env } from './config/env'
import { db } from './config/knex'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', async (_req, res) => {
  try {
    await db.raw('SELECT 1')
    res.json({ status: 'ok' })
  } catch (error) {
    res.status(500).json({ status: 'error', message: String(error) })
  }
})

app.use('/api', routes)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(env.port, env.host, () => {
  const hostLabel = env.host === '0.0.0.0' ? 'localhost or LAN IP' : env.host
  console.log(`API server listening on http://${hostLabel}:${env.port}`)
})
