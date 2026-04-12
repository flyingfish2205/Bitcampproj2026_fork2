import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

import tamagotchisRouter from './routes/tamagotchis.js'
import activitiesRouter from './routes/activities.js'
import uploadRouter from './routes/upload.js'
import { supabase } from './lib/supabase.js'

const app = express()
const httpServer = createServer(app)
const allowedOrigin = /^http:\/\/localhost:\d+$|^https:\/\/frontend-production-cc9b\.up\.railway\.app$/

const io = new Server(httpServer, {
  cors: { origin: allowedOrigin, methods: ['GET', 'POST'] }
})

app.use(cors({ origin: allowedOrigin }))
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

// ── Activity log cleanup ─────────────────────────────────────────────────────
// Delete activities older than 24 hours every hour.
// best_friend_id lives on the tamagotchis table and is never touched here,
// so best friends survive the cleanup.
async function cleanupActivities() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('activities').delete().lt('created_at', cutoff)
  if (error) console.error('Activity cleanup error:', error.message)
  else console.log('Activity cleanup: removed records older than 24h')
}
cleanupActivities()
setInterval(cleanupActivities, 60 * 60 * 1000)

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))
