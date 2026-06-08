import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, code } = req.body || {}
  if (!email || !code) return res.status(400).json({ error: 'Paramètres manquants' })
  const { data, error } = await sb.from('apprenants').select('id,lien_acces').eq('email', email).eq('code_acces', code).single()
  if (error || !data) return res.status(401).json({ error: 'Code invalide' })
  return res.json({ success: true, token: data.lien_acces })
}
