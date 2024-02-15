import env from 'dotenv'
import express from 'express'
import pg from "pg"
import cors from "cors"
import jwt, { JwtPayload } from "jsonwebtoken"

import handleLogin from './auth/login'
import getData from './data/data'


env.config({path: '.env'})

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

app.options('*', cors())

app.post("/login", async (req, res) => {
    if(req.body.password && req.body.username){
        const client = await pool.connect()

        try{
            const token = await handleLogin(req.body.password, req.body.username, client)
            client.release()

            console.log(`[INF] Auth for ${req.body.username} succeded`)
            res.status(200).send(token)
        }
        catch (err){
            console.log(`[INF] Auth for ${req.body.username} failed`)
            res.status(401).end()
        }
    }
    else{
        console.log("[WRN] Auth request with incorect payload configuration")
        res.status(400)
        res.end()
    }
});

app.get("/data", (req, res) => {
    if(!req.headers.authorization){
        console.log("[WRN] Request without auth recived")
        res.status(403).end()
    }
        

    const auth = req.headers.authorization.split(' ')
    if(auth[0] == "Bearer"){
        jwt.verify(auth[1], process.env.HASHING_SECRET, async (err, token : JwtPayload) =>{
            if(err){
                console.log("[INF] Request with invalid token recived")
                res.status(403).end()
            }
            else{
                const username = token.username;
                console.log(`[INF] Recived data request for user ${username}`)
                const client = await pool.connect()
                const containers = await getData(username, client)
                client.release()
                const body = {containers: containers}

                res.status(200).json(body)
            }
        });
    }
    else{
        console.log("[WRN] Request with faulty auth recived")
        res.status(403).end()
    }
});

app.listen(9001, () => console.log("[INF] Server started, listening to port 9001"))