import type pg from 'pg'

import { type Task } from './dataGetters'

async function createTask (task: Task, containerID: string, prevId: string, client: pg.PoolClient): Promise<void> {
  const createQuery = 'INSERT INTO tasks VALUES ($1, $2, $3, $4, $5, $6)'
  const values = [task.uuid, prevId, task.title, JSON.stringify(task.body), task.type, prevId]

  await client.query(createQuery, values)
}

async function createContainer (containerID: string, owner: string, client: pg.PoolClient): Promise<void> {
  const createQuery = 'INSERT INTO containers VALUES ($1, $2)'
  const values = [containerID, owner]

  await client.query(createQuery, values)
}

export { createTask, createContainer }
