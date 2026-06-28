import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    try {
      const { data, error } = await sb.from('config').select('cle, valeur')
      if (error) return res.status(500).json({ error: error.message, config: {} })
      // Renvoyer soit en objet (plus simple), soit en tableau (rétrocompat)
      const obj: Record<string,string> = {}
      ;(data || []).forEach((row: any) => { if (row.cle) obj[row.cle] = row.valeur || '' })
      return res.json({ config: obj, configArray: data || [] })
    } catch (e: any) {
      return res.status(500).json({ error: e.message, config: {} })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {}
      // Accepte 3 formats :
      // 1. { config: { key: value, ... } }
      // 2. { updates: [{ cle, valeur }, ...] }
      // 3. { cle, valeur } (single update)
      let updates: Array<{ cle: string, valeur: string }> = []

      if (body.config && typeof body.config === 'object' && !Array.isArray(body.config)) {
        updates = Object.entries(body.config).map(([cle, valeur]) => ({ cle, valeur: String(valeur ?? '') }))
      } else if (Array.isArray(body.updates)) {
        updates = body.updates.map((u: any) => ({ cle: u.cle, valeur: String(u.valeur ?? '') }))
      } else if (body.cle) {
        updates = [{ cle: body.cle, valeur: String(body.valeur ?? '') }]
      } else {
        return res.status(400).json({ error: 'Aucune donnée à enregistrer. Format attendu : { config: { cle: valeur } }' })
      }

      if (updates.length === 0) return res.status(400).json({ error: 'Aucune donnée à enregistrer' })

      // Upsert chaque clé (insert ou update si existe)
      for (const u of updates) {
        if (!u.cle) continue
        const { error } = await sb.from('config').upsert({ cle: u.cle, valeur: u.valeur }, { onConflict: 'cle' })
        if (error) return res.status(500).json({ error: `Erreur sur "${u.cle}" : ${error.message}` })
      }

      return res.json({ success: true, count: updates.length })
    } catch (e: any) {
      return res.status(500).json({ error: e.message })
    }
  }

  return res.status(405).end()
}
