import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// GET /api/tamagotchis
// Get all tamagotchis
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('tamagotchis')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/tamagotchis/:id
// Get a single tamagotchi with their best friend info and latest activity
router.get('/:id', async (req, res) => {
  const { id } = req.params

  const { data: tama, error } = await supabase
    .from('tamagotchis')
    .select('*, best_friend:best_friend_id(*)')
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Tamagotchi not found' })

  // Get latest activity with best friend
  let latestBestFriendActivity = null
  if (tama.best_friend_id) {
    const { data: activity } = await supabase
      .from('activities')
      .select('*')
      .or(`and(tama_a_id.eq.${id},tama_b_id.eq.${tama.best_friend_id}),and(tama_a_id.eq.${tama.best_friend_id},tama_b_id.eq.${id})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    latestBestFriendActivity = activity
  }

  res.json({ ...tama, latest_best_friend_activity: latestBestFriendActivity })
})

// GET /api/tamagotchis/:id/activities
// Get the full activity log for a tamagotchi
router.get('/:id/activities', async (req, res) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('activities')
    .select('*, tama_a:tama_a_id(id, name, body_url, neck_url, face_url, hat_url), tama_b:tama_b_id(id, name, body_url, neck_url, face_url, hat_url)')
    .or(`tama_a_id.eq.${id},tama_b_id.eq.${id}`)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/tamagotchis
// Create a new tamagotchi
router.post('/', async (req, res) => {
  const { name, body_url, hat_url, face_url, neck_url, location_x, location_y } = req.body

  if (!name) return res.status(400).json({ error: 'name is required' })
  if (name.trim().length > 18) return res.status(400).json({ error: 'Name must be 18 characters or fewer' })

  // Enforce unique names (case-insensitive)
  const { data: existing } = await supabase
    .from('tamagotchis')
    .select('id')
    .ilike('name', name.trim())
    .limit(1)

  if (existing && existing.length > 0) {
    return res.status(409).json({ error: `A JIT named "${name.trim()}" already exists` })
  }

  const { data, error } = await supabase
    .from('tamagotchis')
    .insert({ name: name.trim(), body_url, hat_url, face_url, neck_url, location_x, location_y })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Broadcast to all connected clients so they can add the new JIT live
  if (req.io) req.io.emit('jit_created', data)

  res.status(201).json(data)
})

// PATCH /api/tamagotchis/:id/location
// Update a tamagotchi's position in the world
router.patch('/:id/location', async (req, res) => {
  const { id } = req.params
  const { location_x, location_y } = req.body

  const { data, error } = await supabase
    .from('tamagotchis')
    .update({ location_x, location_y })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
