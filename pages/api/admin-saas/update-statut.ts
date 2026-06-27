import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { id, statut, plan, prolongation_jours, notes_admin } = req.body || {}
    if (!id) return res.status(400).json({ error: 'ID manquant' })

    const update: any = { updated_at: new Date().toISOString() }
    if (statut) update.statut = statut
    if (plan) update.plan = plan
    if (notes_admin !== undefined) update.notes_admin = notes_admin
    if (prolongation_jours) {
      const { data: org } = await sb.from('organismes').select('date_fin_essai').eq('id', id).single()
      if (org) {
        const base = new Date(org.date_fin_essai || new Date())
        base.setDate(base.getDate() + parseInt(prolongation_jours))
        update.date_fin_essai = base.toISOString()
      }
    }

    const { error } = await sb.from('organismes').update(update).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  } catch(e:any) {
    return res.status(500).json({ error: e.message })
  }
}
