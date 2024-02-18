import pg from 'pg'
import env from 'dotenv'
import getData from './dataGetters'

env.config()

const credentials = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD
}

const pool = new pg.Pool(credentials)

test('DataGetters: Data retrival', async () => {
  const client = await pool.connect()

  const data = await client.query('SELECT uuid FROM tasks')

  expect(data.rowCount === null).toBe(false)
  expect(data.rowCount! > 0).toBe(true)

  client.release()
})

test('DataGetters: Data order', async () => {
  const client = await pool.connect()

  const data = await client.query('SELECT uuid, prev FROM tasks')

  const containers = await getData('test', client)

  for (const container of containers) {
    for (let i = 0; i < container.tasks.length; i++) {
      const uuid = container.tasks[i].uuid
      const prev = i === 0 ? '0-0-0-0-0' : container.tasks[i - 1].uuid

      const entry = data.rows.find(row => row.uuid === uuid)
      expect(entry).toBeDefined()
      expect(entry.prev).toBe(prev)
    }
  }
  client.release()
})
