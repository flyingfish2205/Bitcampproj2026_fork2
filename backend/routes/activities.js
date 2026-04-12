import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// GET /api/activities
// Get global activity feed (all activities, newest first)
router.get('/', async (req, res) => {
  const { limit = 50 } = req.query

  const { data, error } = await supabase
    .from('activities')
    .select('*, tama_a:tama_a_id(id, name, body_url, neck_url, face_url, hat_url), tama_b:tama_b_id(id, name, body_url, neck_url, face_url, hat_url)')
    .order('created_at', { ascending: false })
    .limit(Number(limit))

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/activities
// Log a new activity between two tamagotchis, then recalculate best friends
router.post('/', async (req, res) => {
  const { tama_a_id, tama_b_id, description, activity_image_url } = req.body

  if (!tama_a_id || !tama_b_id) return res.status(400).json({ error: 'tama_a_id and tama_b_id are required' })
  if (!description) return res.status(400).json({ error: 'description is required' })
  if (tama_a_id === tama_b_id) return res.status(400).json({ error: 'A tamagotchi cannot interact with itself' })

  // Insert the activity
  const { data: activity, error } = await supabase
    .from('activities')
    .insert({ tama_a_id, tama_b_id, description, activity_image_url })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Recalculate best friends for both tamagotchis
  await updateBestFriend(tama_a_id)
  await updateBestFriend(tama_b_id)

  // Fetch the full activity with tamagotchi data to broadcast
  const { data: fullActivity } = await supabase
    .from('activities')
    .select('*, tama_a:tama_a_id(id, name, body_url, neck_url, face_url, hat_url), tama_b:tama_b_id(id, name, body_url, neck_url, face_url, hat_url)')
    .eq('id', activity.id)
    .single()

  // Broadcast to all connected clients via Socket.io (io attached in server.js)
  if (req.io) req.io.emit('new_activity', fullActivity)

  res.status(201).json(fullActivity)
})

// Recalculates and saves the best friend for a given tamagotchi
async function updateBestFriend(tamaId) {
  // Count interactions grouped by the other participant
  const { data: activities } = await supabase
    .from('activities')
    .select('tama_a_id, tama_b_id')
    .or(`tama_a_id.eq.${tamaId},tama_b_id.eq.${tamaId}`)

  if (!activities || activities.length === 0) return

  // Tally interaction counts per partner
  const counts = {}
  for (const act of activities) {
    const friendId = act.tama_a_id === tamaId ? act.tama_b_id : act.tama_a_id
    counts[friendId] = (counts[friendId] || 0) + 1
  }

  const bestFriendId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]

  await supabase
    .from('tamagotchis')
    .update({ best_friend_id: bestFriendId })
    .eq('id', tamaId)
}

export default router
