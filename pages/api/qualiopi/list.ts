import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  res.setHeader('Cache-Control','no-store')
  try {
    const { data, error } = await sb.from('qualiopi_preuves').select('*')
    if (error) return res.json({ preuves: [] })
    return res.json({ preuves: data || [] })
  } catch { return res.json({ preuves: [] }) }
}
