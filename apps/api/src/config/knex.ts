import knex from 'knex'
import { env } from './env'

export const db = knex({
  client: 'mysql2',
  connection: {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  },
  pool: {
    min: 0,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
})
