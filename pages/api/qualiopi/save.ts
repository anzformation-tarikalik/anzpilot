import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { indicateur_num, statut, note, preuve_url } = req.body || {}
    if (!indicateur_num) return res.status(400).json({ error:'indicateur_num manquant' })
    const { error } = await sb.from('qualiopi_preuves').upsert({
      indicateur_num, statut, note, preuve_url, updated_at: new Date().toISOString()
    }, { onConflict:'indicateur_num' })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  } catch(e:any) { return res.status(500).json({ error: e.message }) }
}
