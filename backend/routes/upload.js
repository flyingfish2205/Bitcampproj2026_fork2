import express from 'express'
import multer from 'multer'
import { supabase } from '../lib/supabase.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Valid buckets and tamagotchi part types
const VALID_BUCKETS = ['tamagotchi-parts', 'activity-images']
const VALID_PARTS = ['body', 'hat', 'face', 'neck']

// POST /api/upload/part
// Upload a tamagotchi body part PNG (body, hat, face, neck)
router.post('/part', upload.single('file'), async (req, res) => {
  const { part, tamagotchiId } = req.body

  if (!VALID_PARTS.includes(part)) {
    return res.status(400).json({ error: `Invalid part. Must be one of: ${VALID_PARTS.join(', ')}` })
  }
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  if (!tamagotchiId) return res.status(400).json({ error: 'tamagotchiId is required' })

  const filePath = `${tamagotchiId}/${part}.png`

  const { error } = await supabase.storage
    .from('tamagotchi-parts')
    .upload(filePath, req.file.buffer, {
      contentType: 'image/png',
      upsert: true
    })

  if (error) return res.status(500).json({ error: error.message })

  const { data } = supabase.storage.from('tamagotchi-parts').getPublicUrl(filePath)

  res.json({ url: data.publicUrl })
})

// POST /api/upload/activity-image
// Upload a PNG for an activity
router.post('/activity-image', upload.single('file'), async (req, res) => {
  const { activityId } = req.body

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  if (!activityId) return res.status(400).json({ error: 'activityId is required' })

  const filePath = `${activityId}.png`

  const { error } = await supabase.storage
    .from('activity-images')
    .upload(filePath, req.file.buffer, {
      contentType: 'image/png',
      upsert: true
    })

  if (error) return res.status(500).json({ error: error.message })

  const { data } = supabase.storage.from('activity-images').getPublicUrl(filePath)

  res.json({ url: data.publicUrl })
})

export default router
