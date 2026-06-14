import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')
const nullIfEmpty = (v:any) => (v===''||v===undefined||v===null) ? null : v
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const d = req.body || {}
    const { data, error } = await sb.from('factures').insert({
      numero:d.numero, statut:'en_attente',
      date_emission: nullIfEmpty(d.date_emission), date_echeance: nullIfEmpty(d.date_echeance),
      of_nom:d.of_nom, of_siret:d.of_siret, of_nda:d.of_nda, of_adresse:d.of_adresse, of_iban:d.of_iban, of_bic:d.of_bic,
      destinataire_type:d.destinataire_type, destinataire_nom:d.destinataire_nom, destinataire_siret:d.destinataire_siret,
      destinataire_adresse:d.destinataire_adresse, destinataire_email:d.destinataire_email, destinataire_reference:d.destinataire_reference,
      apprenant_nom:d.apprenant_nom, formation_titre:d.formation_titre,
      date_formation_debut: nullIfEmpty(d.date_formation_debut), date_formation_fin: nullIfEmpty(d.date_formation_fin),
      duree_heures:parseInt(d.duree_heures)||0,
      prix_ht:d.prix_ht, tva_taux:parseFloat(d.tva_taux)||0, tva_montant:d.tva_montant, prix_ttc:d.prix_ttc,
      modalites_paiement:d.modalites_paiement, notes:d.notes,
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, id: data.id })
  } catch(e:any) { return res.status(500).json({ error: e.message }) }
}
