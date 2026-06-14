import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Conversion sûre: chaîne vide → null pour les dates
const nullIfEmpty = (v: any) => (v === '' || v === undefined || v === null) ? null : v

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const data = req.body || {}
    const apprenant_nom = `${data.apprenant_civilite || ''} ${data.apprenant_prenom || ''} ${data.apprenant_nom || ''}`.trim()

    const { data: created, error } = await sb
      .from('conventions')
      .insert({
        numero: data.numero,
        type: data.type,
        statut: 'en_attente',
        of_nom: data.of_nom, of_siret: data.of_siret, of_nda: data.of_nda, of_adresse: data.of_adresse,
        of_email: data.of_email, of_telephone: data.of_telephone, of_representant: data.of_representant,
        apprenant_nom, apprenant_email: data.apprenant_email, apprenant_civilite: data.apprenant_civilite,
        apprenant_prenom: data.apprenant_prenom, apprenant_nom_seul: data.apprenant_nom,
        apprenant_telephone: data.apprenant_telephone, apprenant_adresse: data.apprenant_adresse,
        apprenant_naissance: nullIfEmpty(data.apprenant_naissance),
        employeur_nom: data.employeur_nom, employeur_siret: data.employeur_siret,
        employeur_adresse: data.employeur_adresse, employeur_representant: data.employeur_representant,
        formation_titre: data.formation_titre, formation_objectifs: data.formation_objectifs,
        formation_programme: data.formation_programme, formation_modalites: data.formation_modalites,
        formation_lieu: data.formation_lieu,
        // ✅ FIX: convertir les dates vides en null
        date_debut: nullIfEmpty(data.date_debut),
        date_fin: nullIfEmpty(data.date_fin),
        duree_heures: parseInt(data.duree_heures) || 0,
        nb_participants: parseInt(data.nb_participants) || 1,
        prix_ht: parseFloat(data.prix_ht) || 0,
        tva_taux: parseFloat(data.tva_taux) || 0,
        tva_montant: parseFloat(data.tva_montant) || 0,
        prix_ttc: parseFloat(data.prix_ttc) || 0,
        financement: data.financement,
        modalites_paiement: data.modalites_paiement,
      })
      .select().single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true, id: created.id, convention: created })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
