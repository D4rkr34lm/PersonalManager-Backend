import pg from 'pg'
import env from 'dotenv'

import getData from './dataGetters'
import { updateTaskOrder, updateTaskOwnership } from './dataManipulators'
import { removeMockData, createMockData } from '../util/testData'

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

test('DataManipulators: Data order change (Move to end)', async () => {
  const client = await pool.connect()

  const containers = await getData('test', client)
  const container = containers[0]

  const order: string[] = []

  for (const task of container.tasks) {
    order.push(task.uuid)
  }

  const first = container.tasks[0].uuid
  const last = container.tasks[container.tasks.length - 1].uuid

  await updateTaskOrder(first, last, client)

  order.splice(0, 1)
  order.push(first)

  const newContainers = await getData('test', client)
  const newContainer = newContainers[0]

  for (let i = 0; i < newContainer.tasks.length; i++) {
    expect(newContainer.tasks[i].uuid).toBe(order[i])
  }

  client.release()
})

test('DataManipulators: Data order change (Move to start)', async () => {
  const client = await pool.connect()

  const containers = await getData('test', client)
  const container = containers[0]

  const order: string[] = container.tasks.map(task => task.uuid)

  const last = container.tasks[container.tasks.length - 1].uuid

  await updateTaskOrder(last, container.uuid, client)

  order.splice(0, 0, last)
  order.pop()

  const newContainers = await getData('test', client)
  const newContainer = newContainers[0]

  for (let i = 0; i < newContainer.tasks.length; i++) {
    expect(newContainer.tasks[i].uuid).toBe(order[i])
  }

  client.release()
})

test('DataManipulators: Data ownership change', async () => {
  const client = await pool.connect()
  const containers = await getData('test', client)

  const moveTaskId = containers[1].tasks[0].uuid

  await updateTaskOwnership(moveTaskId, containers[2].uuid, client)
  await updateTaskOrder(moveTaskId, containers[2].uuid, client)

  const containersAfter = await getData('test', client)

  expect(containersAfter[2].tasks.length).toBe(1)
  expect(containersAfter[2].tasks[0].uuid).toBe(moveTaskId)
})

afterAll(async () => {
  const client = await pool.connect()
  await removeMockData(client)
  client.release()
})
