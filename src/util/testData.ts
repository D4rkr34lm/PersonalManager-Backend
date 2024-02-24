import type pg from 'pg'

export const mockTasks = [['af7c1fe6-d669-414e-b066-e9733f0de7a8', 'b50dcee9-cd61-4fb1-a541-e0c1a4beb5d1', 'test1', '{}', 'basic', 'b50dcee9-cd61-4fb1-a541-e0c1a4beb5d1'],
  ['08c71152-c552-42e7-b094-f510ff44e9cb', 'b50dcee9-cd61-4fb1-a541-e0c1a4beb5d1', 'test2', '{}', 'basic', 'af7c1fe6-d669-414e-b066-e9733f0de7a8'],
  ['c558a80a-f319-4c10-95d4-4282ef745b4b', 'b50dcee9-cd61-4fb1-a541-e0c1a4beb5d1', 'test2', '{}', 'basic', '08c71152-c552-42e7-b094-f510ff44e9cb'],
  ['cd452f0c-99f8-4176-b5be-5fccb19c0b33', '2b1f7fb2-881c-4f2d-bd46-77a48d2846c8', 'movetest1', '{}', 'basic', '2b1f7fb2-881c-4f2d-bd46-77a48d2846c8']]

export const mockContainer = [['b50dcee9-cd61-4fb1-a541-e0c1a4beb5d1', 'test'],
  ['2b1f7fb2-881c-4f2d-bd46-77a48d2846c8', 'test'],
  ['3fcb9f36-4cb1-451e-9562-4c4d915a2c24', 'test']]

export async function createMockData (client: pg.PoolClient): Promise<void> {
  for (const task of mockTasks) {
    await client.query('INSERT INTO tasks VALUES ($1, $2, $3, $4, $5, $6)', task)
  }

  for (const container of mockContainer) {
    await client.query('INSERT INTO containers VALUES ($1, $2)', container)
  }
}

export async function removeMockData (client: pg.PoolClient): Promise<void> {
  for (const task of mockTasks) {
    await client.query(`DELETE FROM tasks WHERE uuid='${task[0]}'`)
  }

  for (const container of mockContainer) {
    await client.query(`DELETE FROM containers WHERE uuid='${container[0]}'`)
  }
}
