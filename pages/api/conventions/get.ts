import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'ID manquant' })
  try {
    const { data, error } = await sb.from('conventions').select('*').eq('id', id).single()
    if (error || !data) return res.status(404).json({ error: 'Introuvable' })
    return res.json({ convention: data })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
