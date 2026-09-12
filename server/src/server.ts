import 'dotenv/config'

import cors from 'cors'
import express from 'express'

import { connectDatabase } from './config/database.js'
import userRoutes from './routes/user.routes.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

// The backend is intentionally tiny. Its purpose is only to give the Vue app
// a real asynchronous CRUD API; backend architecture is not the learning goal.
app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.use('/api/users', userRoutes)

/**
 * Connect to Mongo before accepting HTTP traffic. If the DB connection fails,
 * starting an apparently healthy API would only make every CRUD request fail.
 */
async function startServer(): Promise<void> {
  try {
    await connectDatabase()

    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`)
    })
  } catch (error: unknown) {
    console.error('Unable to start API:', error)
    process.exitCode = 1
  }
}

void startServer()
