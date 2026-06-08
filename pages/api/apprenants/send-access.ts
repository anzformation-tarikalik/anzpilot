import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { apprenant_id } = req.body || {}
  if (!apprenant_id) return res.status(400).json({ error: 'ID apprenant manquant' })
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
  await sb.from('apprenants').update({ lien_acces: token, lien_expire: new Date(Date.now() + 90*24*60*60*1000).toISOString() }).eq('id', apprenant_id)
  return res.json({ success: true, token })
}
