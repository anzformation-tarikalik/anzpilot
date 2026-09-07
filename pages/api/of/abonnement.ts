import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  res.setHeader('Cache-Control', 'no-store')
  const email = (req.query.email as string || '').toLowerCase().trim()
  if (!email) return res.status(400).json({ error: 'Email requis' })
  try {
    const { data: organisme } = await sb.from('organismes').select('*').eq('email', email).maybeSingle()
    if (!organisme) return res.status(404).json({ error: 'Organisme introuvable' })

    let joursRestants: number | null = null
    if (organisme.date_fin_essai) {
      joursRestants = Math.ceil((new Date(organisme.date_fin_essai).getTime() - Date.now()) / 86400000)
    }

    const [{ data: factures }, { data: plans }] = await Promise.all([
      sb.from('factures_saas').select('*').eq('organisme_id', organisme.id).order('date_emission', { ascending: false }),
      sb.from('plans').select('*').eq('is_active', true).order('ordre', { ascending: true }),
    ])

    return res.json({
      organisme: { ...organisme, joursRestants },
      factures: factures || [],
      plans: plans || [],
    })
  } catch (e: any) { return res.status(500).json({ error: e.message }) }
}
