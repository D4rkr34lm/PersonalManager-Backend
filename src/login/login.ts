import crypto from "crypto"
import pg from "pg"
import jwt from "jsonwebtoken"

async function handleLogin(username: string, password: string, client : pg.PoolClient) : Promise<string>{
    const hash = crypto.createHash("md5").update(password).digest("hex");

    const query = `SELECT role FROM auth WHERE username = '${username}' AND password = '${hash}'`;
    const res = await client.query(query);

    if(res.rowCount > 0){
        const payload = {
            username: username,
            role: res.rows[0].role
        }

        const token = jwt.sign(payload, process.env.HASHING_SECRET, {expiresIn: '6h'});

        return token;
    }
    else{
        return Promise.reject("Invalid credentials");
    }
}

export default handleLogin;