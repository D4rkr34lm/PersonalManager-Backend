import type pg from 'pg'

interface TaskContainer {
  uuid: string
  tasks: Task[]
}

interface Task {
  uuid: string
  type: string
  title: string
  body: any
}

async function getData (
  user: string,
  client: pg.PoolClient
): Promise<TaskContainer[]> {
  const containers = await getContainers(user, client)

  for (const container of containers) {
    const tasks = await getTasksOfContainer(container.uuid, client)
    container.tasks = tasks
  }

  return containers
}

async function getContainers (
  user: string,
  client: pg.PoolClient
): Promise<TaskContainer[]> {
  const containerQuery = `SELECT uuid FROM containers WHERE owner = '${user}'`

  const data = await client.query(containerQuery)
  const containers: TaskContainer[] = []

  for (const row of data.rows) {
    const container: TaskContainer = { uuid: row.uuid, tasks: [] }
    containers.push(container)
  }

  return containers
}

async function getTasksOfContainer (
  uuid: string,
  client: pg.PoolClient
): Promise<Task[]> {
  const query = `SELECT uuid, title, type, body, prev FROM tasks WHERE parent = '${uuid}'`

  const data = await client.query(query)

  const tasks: Task[] = []

  if (data.rowCount === 0) return tasks

  let row = data.rows.find((row) => row.prev === '0-0-0-0-0')
  tasks.push(convertRowToTask(row))

  for (let i = 0; i < data.rowCount! - 1; i++) {
    row = data.rows.find((next) => next.prev === row.uuid)
    tasks.push(convertRowToTask(row))
  }

  return tasks
}

function convertRowToTask (row: any): Task {
  return { uuid: row.uuid, type: row.type, title: row.title, body: row.body }
}

export default getData
