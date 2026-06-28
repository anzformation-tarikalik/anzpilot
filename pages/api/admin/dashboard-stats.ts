import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function safeCount(table: string, filter?: { column: string, value: any }): Promise<number> {
  try {
    let q = sb.from(table).select('*', { count: 'exact', head: true })
    if (filter) q = q.eq(filter.column, filter.value)
    const { count, error } = await q
    if (error) return 0
    return count || 0
  } catch { return 0 }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  res.setHeader('Cache-Control', 'no-store')
  try {
    // Counts agrégés
    const [
      totalOf, ofEssai, ofActif, ofBloque,
      totalConventions, totalFactures, totalCatalogue, totalQualiopi
    ] = await Promise.all([
      safeCount('organismes'),
      safeCount('organismes', { column: 'statut', value: 'essai' }),
      safeCount('organismes', { column: 'statut', value: 'actif' }),
      safeCount('organismes', { column: 'statut', value: 'bloque' }),
      safeCount('conventions'),
      safeCount('factures'),
      safeCount('modeles_formations'),
      safeCount('qualiopi_preuves'),
    ])

    // Activité récente — derniers organismes inscrits
    let recentSignups: any[] = []
    try {
      const { data } = await sb.from('organismes').select('id,email,nom,date_inscription,statut').order('date_inscription', { ascending: false }).limit(5)
      recentSignups = data || []
    } catch {}

    // Organismes dont l'essai expire dans <7j
    let expireBientot = 0
    try {
      const sevenDays = new Date()
      sevenDays.setDate(sevenDays.getDate() + 7)
      const { count } = await sb.from('organismes').select('*', { count: 'exact', head: true })
        .eq('statut', 'essai')
        .gt('date_fin_essai', new Date().toISOString())
        .lt('date_fin_essai', sevenDays.toISOString())
      expireBientot = count || 0
    } catch {}

    return res.json({
      stats: {
        totalOf, ofEssai, ofActif, ofBloque, expireBientot,
        totalConventions, totalFactures, totalCatalogue, totalQualiopi
      },
      recentSignups
    })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
