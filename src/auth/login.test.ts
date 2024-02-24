import pg from 'pg'
import env from 'dotenv'

import handleLogin from './login'

env.config()

const credentials = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD
}

const pool = new pg.Pool(credentials)

test('Login: Valid', async () => {
  const client = await pool.connect()
  expect(await handleLogin('test', 'test', client)).toBeDefined()
  client.release()
})

test('Login: password invalid', async () => {
  const client = await pool.connect()
  await expect(handleLogin('test', 'tes', client)).rejects.toThrow(
    new Error('Invalid credentials')
  )
  client.release()
})

test('Login: username invalid', async () => {
  const client = await pool.connect()
  await expect(handleLogin('tes', 'test', client)).rejects.toThrow(
    new Error('Invalid credentials')
  )
  client.release()
})
