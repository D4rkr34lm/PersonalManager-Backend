import type pg from 'pg'

async function validateTaskOwnership (username: string, taskId: string, client: pg.PoolClient): Promise<boolean> {
  const rootTaskQuery = `SELECT owner FROM containers WHERE uuid='${taskId}'`
  const rootRes = await client.query(rootTaskQuery)

  if (rootRes.rowCount! > 0 && rootRes.rows[0].owner === username) {
    return true
  }

  const taskQuery = `SELECT parent FROM tasks WHERE uuid='${taskId}'`
  const res1 = await client.query(taskQuery)

  if (res1.rowCount! !== 1) return false

  const containerId = res1.rows[0].parent as string

  const containerQuery = `SELECT uuid FROM containers WHERE uuid='${containerId}' AND owner='${username}'`
  const res2 = await client.query(containerQuery)

  return res2.rowCount! === 1
}

async function validateContainerOwnership (username: string, containerId: string, client: pg.PoolClient): Promise<boolean> {
  const containerQuery = `SELECT uuid FROM containers WHERE uuid='${containerId}'`

  const res = await client.query(containerQuery)

  return res.rowCount === 1
}

export { validateTaskOwnership, validateContainerOwnership }
