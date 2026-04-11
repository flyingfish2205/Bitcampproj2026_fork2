import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

import tamagotchisRouter from './routes/tamagotchis.js'
import activitiesRouter from './routes/activities.js'
import uploadRouter from './routes/upload.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
})

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Attach io to every request so routes can broadcast
app.use((req, _res, next) => { req.io = io; next() })

// Routes
app.use('/api/tamagotchis', tamagotchisRouter)
app.use('/api/activities', activitiesRouter)
app.use('/api/upload', uploadRouter)

// Health check
app.get('/', (_req, res) => res.json({ status: 'ok' }))

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id))
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))
