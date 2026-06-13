import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  res.setHeader('Cache-Control','no-store')
  try {
    const annee = parseInt(req.query.annee as string) || new Date().getFullYear()-1
    const start = `${annee}-01-01`
    const end = `${annee}-12-31`

    // Conventions de l'année
    const { data: convs } = await sb.from('conventions').select('*').gte('date_debut', start).lte('date_debut', end)
    const conventions = convs || []

    // Factures de l'année
    const { data: facts } = await sb.from('factures').select('*').gte('date_emission', start).lte('date_emission', end).eq('statut','payee')
    const factures = facts || []

    // Cadre B — Pédagogique
    const nb_stagiaires = new Set(conventions.map((c:any) => c.apprenant_email).filter(Boolean)).size || conventions.length
    const heures_stagiaires = conventions.reduce((s:number, c:any) => s + ((c.duree_heures||0) * (c.nb_participants||1)), 0)
    const nb_formations = new Set(conventions.map((c:any) => c.formation_titre)).size
    const heures_dispensees = conventions.reduce((s:number, c:any) => s + (c.duree_heures||0), 0)

    // Cadre C — Financier (depuis factures payées)
    const sumBy = (type:string) => factures.filter((f:any) => f.destinataire_type===type).reduce((s:number,f:any) => s + (f.prix_ht||0), 0)
    const ca_opco = sumBy('opco')
    const ca_entreprise = sumBy('entreprise')
    const ca_cpf = sumBy('cpf')
    const ca_pole_emploi = sumBy('pole_emploi')
    const ca_autres = sumBy('particulier') + factures.filter((f:any) => !['opco','entreprise','cpf','pole_emploi','particulier'].includes(f.destinataire_type)).reduce((s:number,f:any) => s + (f.prix_ht||0), 0)
    const ca_total = ca_opco + ca_entreprise + ca_cpf + ca_pole_emploi + ca_autres

    return res.json({
      annee, nb_stagiaires, heures_stagiaires, nb_formations, heures_dispensees,
      ca_opco, ca_entreprise, ca_cpf, ca_pole_emploi, ca_autres, ca_total,
      of_nom:'ANZ Formation', of_siret:'', of_nda:''
    })
  } catch(e:any) { return res.status(500).json({ error: e.message }) }
}
