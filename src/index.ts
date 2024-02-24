import env from 'dotenv'
import express from 'express'
import pg from 'pg'
import cors from 'cors'
import jwt, { type JwtPayload } from 'jsonwebtoken'

import handleLogin from './auth/login'
import getData from './data/dataGetters'
import { validateTaskOwnership, validateContainerOwnership } from './auth/validation'
import { updateTaskOrder } from './data/dataManipulators'

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
        password,
        username,
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
    console.log(`[ERR] User ${username} is not allowed to alter order of ${taskId} or ${prevId}`)
    res.status(403).end()
    return
  }

  await updateTaskOrder(taskId, prevId, client)
  client.release()
})

app.listen(9001, () => { console.log('[INF] Server started, listening to port 9001') }
)
