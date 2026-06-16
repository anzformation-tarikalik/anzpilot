import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { id, statut } = req.body || {}
    if (!id || !statut) return res.status(400).json({ error: 'id et statut requis' })

    const update: any = { statut, updated_at: new Date().toISOString() }
    if (statut === 'payee') update.date_paiement = new Date().toISOString().split('T')[0]

    const { error } = await sb.from('factures').update(update).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  } catch(e:any) { return res.status(500).json({ error: e.message }) }
}
