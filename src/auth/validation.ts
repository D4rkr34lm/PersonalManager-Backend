import type pg from 'pg'

async function validateOwnership (username: string, taskId: string, client: pg.PoolClient): Promise<boolean> {
  const taskQuery = `SELECT parent FROM tasks WHERE uuid='${taskId}'`
  const res1 = await client.query(taskQuery)

  if (res1.rowCount! !== 1) return false

  const containerId = res1.rows[0].parent as string

  const containerQuery = `SELECT uuid FROM containers WHERE uuid='${containerId}' AND owner='${username}'`
  const res2 = await client.query(containerQuery)

  return res2.rowCount! === 1
}

export { validateOwnership }
