import env from 'dotenv'
import pg from 'pg'

import { validateContainerOwnership, validateTaskOwnership } from './validation'
import { removeMockData, createMockData, mockTasks, mockContainer } from '../util/testData'

env.config()

const credentials = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD
}

const pool = new pg.Pool(credentials)

beforeAll(async () => {
  const client = await pool.connect()
  await createMockData(client)
  client.release()
})

test('Validation: root task', async () => {
  const client = await pool.connect()
  await expect(validateTaskOwnership('test', mockContainer[0][0], client)).resolves.toEqual(true)
  client.release()
})

test('Validation: unowned task', async () => {
  const client = await pool.connect()
  await expect(validateTaskOwnership('test', '0-0-0-0-0', client)).resolves.toEqual(false)
  client.release()
})

test('Validation: owned task', async () => {
  const client = await pool.connect()
  await expect(validateTaskOwnership('test', mockTasks[0][0], client)).resolves.toEqual(true)
  client.release()
})

test('Validation: owned container', async () => {
  const client = await pool.connect()
  await expect(validateContainerOwnership(mockContainer[0][1], mockContainer[0][0], client)).resolves.toEqual(true)
  client.release()
})

test('Validation: unowned container', async () => {
  const client = await pool.connect()
  await expect(validateContainerOwnership('notTest', mockContainer[0][0], client)).resolves.toEqual(true)
  client.release()
})

afterAll(async () => {
  const client = await pool.connect()
  await removeMockData(client)
  client.release()
})
