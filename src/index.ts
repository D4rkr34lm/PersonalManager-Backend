import env from 'dotenv'
import express from 'express'
import pg from 'pg'
import cors from 'cors'
import jwt, { type JwtPayload } from 'jsonwebtoken'

import handleLogin from './auth/login'
import getData, { type Task } from './data/dataGetters'
import { validateTaskOwnership, validateContainerOwnership } from './auth/validation'
import { updateTaskOrder, updateTaskOwnership } from './data/dataManipulators'
import { createContainer, createTask } from './data/dataCreators'

env.config({ path: '.env' })

const credentials = {
  host: 'home.local',
  port: 5432,
  database: 'pms',
  user: 'postgres',
  password: process.env.DATABASE_PASSWORD
}

const pool = new pg.Pool(credentials)

const app = express()

app.use(cors())
app.use(express.json())

app.use('/data', async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (authHeader === undefined) {
    console.log('[WRN] Request without auth recived')
    res.status(403).end()
    return
  }

  const auth = authHeader.split(' ')
  if (auth[0] === 'Bearer') {
    try {
      const payload = jwt.verify(auth[1], process.env.HASHING_SECRET) as JwtPayload
      res.locals.username = payload.username
      next()
    } catch (e) {
      console.log('[INF] Request with invalid token recived')
      res.status(403).end()
    }
  } else {
    console.log('[WRN] Request with faulty auth recived')
    res.status(403).end()
  }
})

app.options('*', cors())

app.post('/login', async (req, res) => {
  const password = req.body.password as string | undefined
  const username = req.body.username as string | undefined
  if (password !== undefined && username !== undefined) {
    const client = await pool.connect()

    try {
      const token = await handleLogin(
        username,
        password,
        client
      )
      client.release()

      console.log(`[INF] Auth for ${req.body.username} succeded`)
      res.status(200).send(token)
    } catch (err) {
      console.log(`[INF] Auth for ${req.body.username} failed`)
      res.status(401).end()
    }
  } else {
    console.log('[WRN] Auth request with incorect payload configuration')
    res.status(400)
    res.end()
  }
})

app.get('/data', async (req, res) => {
  const username = res.locals.username as string
  console.log(`[INF] Recived data request for user ${username}`)
  const client = await pool.connect()
  const containers = await getData(username, client)
  client.release()
  const body = { containers }

  res.status(200).json(body)
})

app.post('/data/alter/task/order', async (req, res) => {
  const username = res.locals.username as string
  console.log(`[INF] Recived task order alteration request for user ${username}`)
  const client = await pool.connect()

  const taskId = req.body.taskId as string | undefined
  const prevId = req.body.prevId as string | undefined

  if (taskId === undefined || prevId === undefined) {
    console.log('[ERR] Faulty task order alteration request')
    res.status(400).end()
    return
  }
  const taskOwnership = await validateTaskOwnership(username, taskId, client)
  const prevOwnership = await validateTaskOwnership(username, prevId, client)

  if (!taskOwnership || !prevOwnership) {
    console.log(`[ERR] User ${username} does not own Task:${taskId} or Task:${prevId}`)
    res.status(403).end()
    return
  }

  await updateTaskOrder(taskId, prevId, client)
  client.release()
})

app.post('/data/alter/task/ownership', async (req, res) => {
  const username = res.locals.username as string
  console.log(`[INF] Recived task order ownership request for user ${username}`)
  const client = await pool.connect()

  const taskId = req.body.taskId as string | undefined
  const containerId = req.body.containerId as string | undefined

  if (taskId === undefined || containerId === undefined) {
    console.log('[ERR] Faulty task order alteration request')
    res.status(400).end()
    return
  }

  const taskOwnership = await validateTaskOwnership(username, taskId, client)
  const containerOwnership = await validateContainerOwnership(username, containerId, client)

  if (!taskOwnership || !containerOwnership) {
    console.log(`[ERR] User ${username} does not own Task:${taskId} or Container:${containerId}`)
    res.status(403).end()
    return
  }

  await updateTaskOwnership(taskId, containerId, client)
  client.release()
})

app.post('/data/create/task', async (req, res) => {
  const username = res.locals.username as string
  const client = await pool.connect()

  const task = req.body.task as Task | undefined
  const containerId = req.body.containerId as string | undefined
  const prevId = req.body.prevId as string | undefined

  if (task === undefined || containerId === undefined || prevId === undefined) {
    console.log('[ERR] Faulty task creation request')
    res.status(400).end()
    return
  }

  const containerOwnership = await validateContainerOwnership(username, containerId, client)
  const prevOwnership = await validateTaskOwnership(username, prevId, client)

  if (!containerOwnership || !prevOwnership) {
    console.log(`[ERR] User ${username} does not own Task:${prevId} or Container:${containerId}`)
    res.status(403).end()
    return
  }

  await createTask(task, containerId, prevId, client)
  client.release()
})

app.post('/data/create/container', async (req, res) => {
  const username = res.locals.username as string
  const client = await pool.connect()

  const containerId = req.body.containerId as string | undefined

  if (containerId === undefined) {
    console.log('[ERR] Faulty container creation request')
    res.status(400).end()
    return
  }

  await createContainer(containerId, username, client)
})

app.listen(9001, () => { console.log('[INF] Server started, listening to port 9001') }
)
