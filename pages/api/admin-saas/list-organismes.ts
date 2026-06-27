import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  res.setHeader('Cache-Control','no-store')
  try {
    const { data, error } = await sb.from('organismes').select('*').order('created_at', { ascending: false })
    if (error) return res.json({ organismes: [] })
    
    // Enrichir avec jours restants
    const now = Date.now()
    const enriched = (data || []).map((o: any) => {
      let joursRestants = null
      if (o.date_fin_essai) {
        const ms = new Date(o.date_fin_essai).getTime() - now
        joursRestants = Math.ceil(ms / (1000*60*60*24))
      }
      return { ...o, joursRestants }
    })
    
    return res.json({ organismes: enriched })
  } catch(e:any) {
    return res.status(500).json({ error: e.message })
  }
}
