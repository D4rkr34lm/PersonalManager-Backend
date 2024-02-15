declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_PORT: string
      DATABASE_HOST: string
      DATABASE_NAME: string
      DATABASE_USER: string
      DATABASE_PASSWORD: string
      HASHING_SECRET: string
    }
  }
}

export {}
