import pg from "pg"

interface TaskContainer{
    uuid: string
    tasks: Task[]
}

interface Task{
    uuid: string
    type: string
    title: string
    body: any
}

async function getData(user: string, client: pg.PoolClient) : Promise<TaskContainer[]>{
    const containers = await getContainers(user, client);

    for(let container of containers){
        const tasks = await getTasksOfContainer(container.uuid, client);
        container.tasks = tasks;
    }

    return containers;
}

async function getContainers(user: string, client: pg.PoolClient): Promise<TaskContainer[]>{
    const containerQuery = `SELECT uuid FROM containers WHERE owner = '${user}'`

    const data = await client.query(containerQuery);
    const containers : TaskContainer[] = [];

    for(let row of data.rows){
        const container : TaskContainer = {uuid: row.uuid, tasks: []};
        containers.push(container);
    }

    return containers;
}

async function getTasksOfContainer(uuid: string, client: pg.PoolClient): Promise<Task[]>{
    const query = `SELECT uuid, title, type, body FROM tasks WHERE parent = '${uuid}'`;

    const data = await client.query(query);

    let tasks : Task[] = [];

    for(let row of data.rows){
        const task : Task = {uuid: row.uuid, type: row.type, title: row.title, body: row.body};
        tasks.push(task);
    }

    return tasks;
}

export default getData;