import type pg from 'pg'

import { Semaphore } from '../util/syncronization'

const updateOrderSemaphore = new Semaphore(1)
async function updateTaskOrder (taskId: string, prevId: string, client: pg.PoolClient): Promise<void> {
  await updateOrderSemaphore.wait()
  // Delete task out of old position
  const patchOutQuery = `
  UPDATE tasks 
  SET prev=subquery.prev 
  FROM (SELECT prev FROM tasks WHERE uuid='${taskId}') AS subquery
  WHERE tasks.prev='${taskId}'`

  // Alter surounding task for insertion
  const patchInQuery = `
  UPDATE tasks
  SET prev='${taskId}'
  WHERE prev='${prevId}'`

  // Alter task prev
  const updateQuery = `
  UPDATE tasks
  SET prev='${prevId}'
  WHERE uuid='${taskId}'`

  await client.query(patchOutQuery)
  await client.query(patchInQuery)
  await client.query(updateQuery)

  updateOrderSemaphore.signal()
}

async function updateTaskOwnership (taskId: string, containerId: string, client: pg.PoolClient): Promise<void> {
  const updateQuery = `
  UPDATE tasks
  SET parent='${containerId}'
  WHERE uuid='${taskId}'`

  await client.query(updateQuery)
}

export { updateTaskOrder, updateTaskOwnership }
