import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { user_id, email, prenom, nom, nom_organisme, siret, plan } = req.body || {}
  if (!email || !nom_organisme) return res.status(400).json({ error: 'Données manquantes' })
  const { data: org, error: orgErr } = await sb.from('organismes').insert({ nom: nom_organisme, siret: siret || null, email_contact: email, plan: plan || 'trial' }).select().single()
  if (orgErr) return res.status(500).json({ error: orgErr.message })
  if (user_id) await sb.from('utilisateurs').insert({ id: user_id, organisme_id: org.id, prenom: prenom || '', nom: nom || '', email, role: 'admin' })
  return res.json({ success: true, organisme_id: org.id })
}
