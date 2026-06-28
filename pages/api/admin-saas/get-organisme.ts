import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function safeCount(table: string): Promise<number> {
  try {
    const { count } = await sb.from(table).select('*', { count: 'exact', head: true })
    return count || 0
  } catch { return 0 }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  res.setHeader('Cache-Control', 'no-store')
  
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'ID manquant' })

  try {
    const { data: organisme, error } = await sb.from('organismes').select('*').eq('id', id).maybeSingle()
    if (error || !organisme) return res.status(404).json({ error: 'Organisme introuvable' })

    // Calculer jours restants
    let joursRestants: number | null = null
    if (organisme.date_fin_essai) {
      const ms = new Date(organisme.date_fin_essai).getTime() - Date.now()
      joursRestants = Math.ceil(ms / (1000*60*60*24))
    }

    // Stats associées (single-tenant pour l'instant — tous les comptages)
    // TODO Sprint 5: filtrer par organisme_id
    const [conventions, factures, modeles, qualiopi, classes] = await Promise.all([
      safeCount('conventions'),
      safeCount('factures'),
      safeCount('modeles_formations'),
      safeCount('qualiopi_preuves'),
      safeCount('classes_virtuelles'),
    ])

    // Dernières connexions (basé sur magic_codes utilisés pour cet email)
    let lastLogins: any[] = []
    try {
      const { data } = await sb.from('magic_codes')
        .select('created_at, used')
        .eq('email', organisme.email)
        .eq('used', true)
        .order('created_at', { ascending: false })
        .limit(10)
      lastLogins = data || []
    } catch {}

    return res.json({
      organisme: { ...organisme, joursRestants },
      stats: { conventions, factures, modeles, qualiopi, classes },
      lastLogins
    })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
