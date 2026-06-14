import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const d = req.body || {}
    if (!d.titre) return res.status(400).json({ error: 'Titre manquant' })
    const { data, error } = await sb.from('modeles_formations').insert({
      titre: d.titre, objectifs: d.objectifs, programme: d.programme,
      modalites: d.modalites, duree_heures: parseInt(d.duree_heures)||0, lieu: d.lieu,
      prix_ht: parseFloat(d.prix_ht)||0, tva_taux: parseFloat(d.tva_taux)||20,
      categorie: d.categorie
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, modele: data })
  } catch(e:any) { return res.status(500).json({ error: e.message }) }
}
