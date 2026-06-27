import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).end()
  const id = req.body?.id || req.query?.id
  if (!id) return res.status(400).json({ error:'ID manquant' })
  try {
    const { error } = await sb.from('conventions').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  } catch(e:any) { return res.status(500).json({ error: e.message }) }
}
