// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: process.env.API_ENV_PATH || path.resolve(__dirname, '.env') })

const baseConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'linknest',
  },
  migrations: {
    directory: path.resolve(__dirname, 'src/migrations'),
  },
}

module.exports = {
  development: baseConfig,
  production: baseConfig,
}
