import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const ALLOWED_FIELDS = [
  'nom', 'siret', 'nda', 'adresse', 'telephone', 'representant',
  'statut', 'plan', 'notes_admin', 'date_fin_essai'
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  try {
    const { id, ...fields } = req.body || {}
    if (!id) return res.status(400).json({ error: 'ID manquant' })

    // Whitelist des champs modifiables
    const update: any = { updated_at: new Date().toISOString() }
    for (const f of ALLOWED_FIELDS) {
      if (fields[f] !== undefined) update[f] = fields[f]
    }

    const { error } = await sb.from('organismes').update(update).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
