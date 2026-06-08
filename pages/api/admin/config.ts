import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const DEFAULTS: Record<string,string> = {
  nom_plateforme: 'ANZPilot', slogan: 'Pilotez votre organisme de formation',
  email_contact: 'contact@anzpilot.com', couleur_principale: '#0ea5e9',
  couleur_secondaire: '#2563eb', couleur_accent: '#8b5cf6',
  essai_duree_jours: '14', prix_starter_mensuel: '49',
  prix_pro_mensuel: '129', prix_business_mensuel: '299',
  prix_starter_annuel: '390', prix_pro_annuel: '1068',
  prix_business_annuel: '2508', remise_annuel_pct: '35',
  remise_code_promo: '', remise_code_valeur: '0',
  starter_nb_utilisateurs: '3', pro_nb_utilisateurs: '10',
  message_accueil: 'Bienvenue !', message_essai_expire: 'Essai expiré.',
  feature_marketplace: 'true', feature_ia: 'true',
  feature_visio: 'false', feature_mobile: 'false', maintenance_mode: 'false',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  if (req.method === 'GET') {
    const { data, error } = await sb.from('config').select('cle,valeur')
    if (error || !data || data.length === 0) {
      return res.json({ config: DEFAULTS })
    }
    const cfg: Record<string,string> = { ...DEFAULTS }
    data.forEach((row: any) => { cfg[row.cle] = row.valeur })
    return res.json({ config: cfg })
  }

  if (req.method === 'POST') {
    const { updates } = req.body || {}
    if (!updates) return res.status(400).json({ error: 'Pas de données' })
    const errors: string[] = []
    for (const [cle, valeur] of Object.entries(updates)) {
      const { error } = await sb.from('config').update({ valeur: String(valeur) }).eq('cle', cle)
      if (error) errors.push(cle + ': ' + error.message)
    }
    if (errors.length > 0) return res.status(500).json({ error: errors.join(', ') })
    return res.json({ success: true })
  }

  res.status(405).end()
}
