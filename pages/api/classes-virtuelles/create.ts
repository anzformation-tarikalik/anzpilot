import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const d = req.body || {}
    const { data, error } = await sb.from('classes_virtuelles').insert({
      titre:d.titre, formateur:d.formateur, plateforme:d.plateforme, url_meeting:d.url_meeting,
      date_debut:d.date_debut, duree_min:parseInt(d.duree_min)||60, nb_participants:parseInt(d.nb_participants)||0,
      statut:'planifie'
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, classe: data })
  } catch(e:any) { return res.status(500).json({ error: e.message }) }
}
