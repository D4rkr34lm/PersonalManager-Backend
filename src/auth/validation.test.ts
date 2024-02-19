import env from 'dotenv'
import pg from 'pg'

import { validateOwnership } from './validation'

env.config()

const credentials = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD
}

const pool = new pg.Pool(credentials)

test('Validation: unowned task', async () => {
  const client = await pool.connect()
  await expect(validateOwnership('qs', '0-0-0-0-0', client)).resolves.toEqual(false)
  client.release()
})

test('Validation: owned task', async () => {
  const client = await pool.connect()
  await expect(validateOwnership('test', 'af1c1fe6-d669-414e-b066-e9733f0de7a8', client)).resolves.toEqual(true)
  client.release()
})

afterAll(async () => {
  await pool.end()
})
