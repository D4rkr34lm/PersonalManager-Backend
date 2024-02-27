import pg from 'pg'
import env from 'dotenv'

import { createContainer, createTask } from './dataCreators'
import { mockContainer, mockTasks, removeMockData } from '../util/testData'
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

test('DataCreators: Create container', async () => {
  const client = await pool.connect()
  await createContainer(mockContainer[0][0], mockContainer[0][1], client)

  const containers = await getData('test', client)

  expect(containers.length).toBeGreaterThan(0)
  client.release()
})

test('DataCreators: Create container and task', async () => {
  const client = await pool.connect()
  await createContainer(mockContainer[1][0], mockContainer[1][1], client)
  await createTask({ uuid: mockTasks[3][0], title: mockTasks[3][2], body: mockTasks[3][3], type: mockTasks[3][4] }, mockTasks[3][1], mockTasks[3][5], client)

  const containers = await getData('test', client)

  expect(containers.length).toBeGreaterThan(1)
  expect(containers[1].tasks.length).toBeGreaterThan(0)
  client.release()
})

afterAll(async () => {
  const client = await pool.connect()
  await removeMockData(client)

  client.release()
  await pool.end()
})
