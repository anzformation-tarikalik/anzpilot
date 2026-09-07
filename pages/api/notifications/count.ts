import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  res.setHeader('Cache-Control', 'no-store')
  const type = req.query.type as string
  const email = ((req.query.email as string) || '').toLowerCase().trim()

  try {
    if (type === 'of') {
      if (!email) return res.json({ tickets_unread: 0 })
      // OF : compter tickets où l'admin a répondu en dernier et statut != ferme
      const { count } = await sb.from('tickets').select('*', { count:'exact', head:true })
        .eq('organisme_email', email)
        .eq('last_message_by', 'admin')
        .neq('statut', 'ferme')
      return res.json({ tickets_unread: count || 0 })
    }

    if (type === 'admin') {
      // Admin : compter tickets où l'OF a écrit en dernier et statut ouvert/en_cours
      const { count } = await sb.from('tickets').select('*', { count:'exact', head:true })
        .eq('last_message_by', 'of')
        .in('statut', ['ouvert', 'en_cours'])
      // Compter aussi les urgents
      const { count: urgent } = await sb.from('tickets').select('*', { count:'exact', head:true })
        .eq('priorite', 'urgente')
        .in('statut', ['ouvert', 'en_cours'])
      return res.json({ tickets_unread: count || 0, urgent: urgent || 0 })
    }

    return res.status(400).json({ error: 'type=of ou type=admin requis' })
  } catch (e: any) { return res.status(500).json({ error: e.message }) }
}
