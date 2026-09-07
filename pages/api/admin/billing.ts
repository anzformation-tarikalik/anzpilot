import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const action = req.query.action as string

  // ═══ GET — Liste plans ou factures ═══
  if (req.method === 'GET') {
    try {
      if (action === 'plans') {
        const { data, error } = await sb.from('plans').select('*').order('ordre', { ascending: true })
        if (error) return res.json({ plans: [], error: error.message })
        return res.json({ plans: data || [] })
      }
      if (action === 'factures') {
        const { data, error } = await sb.from('factures_saas').select('*').order('date_emission', { ascending: false })
        if (error) return res.json({ factures: [], error: error.message })

        // Enrichir avec nom OF
        const orgIds = Array.from(new Set((data || []).map((f:any)=>f.organisme_id).filter(Boolean)))
        let orgsMap: Record<string,any> = {}
        if (orgIds.length > 0) {
          const { data: orgs } = await sb.from('organismes').select('id,nom,email').in('id', orgIds)
          ;(orgs || []).forEach((o:any) => { orgsMap[o.id] = o })
        }
        const enriched = (data || []).map((f:any) => ({
          ...f,
          organisme_nom: orgsMap[f.organisme_id]?.nom || null,
          organisme_email: orgsMap[f.organisme_id]?.email || null,
        }))
        return res.json({ factures: enriched })
      }
      return res.status(400).json({ error: 'Action manquante (?action=plans ou ?action=factures)' })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  // ═══ POST — Créer plan ou facture ═══
  if (req.method === 'POST') {
    try {
      if (action === 'plan') {
        const { slug, nom, description, prix_mensuel, prix_annuel, features, limite_apprenants, is_active, is_featured, ordre } = req.body || {}
        if (!slug || !nom) return res.status(400).json({ error: 'Slug et nom requis' })
        const { data, error } = await sb.from('plans').insert({
          slug: slug.toLowerCase().replace(/\s+/g,'-'),
          nom, description: description||null,
          prix_mensuel: parseInt(prix_mensuel)||0,
          prix_annuel: parseInt(prix_annuel)||0,
          features: features||null,
          limite_apprenants: limite_apprenants?parseInt(limite_apprenants):null,
          is_active: is_active!==false, is_featured: !!is_featured, ordre: parseInt(ordre)||0,
        }).select().single()
        if (error) return res.status(500).json({ error: error.message })
        return res.json({ success: true, plan: data })
      }
      if (action === 'facture') {
        const { organisme_id, plan_slug, periode, montant_ttc, date_echeance, notes } = req.body || {}
        if (!organisme_id || !montant_ttc) return res.status(400).json({ error: 'Organisme et montant requis' })
        // Générer un numéro
        const year = new Date().getFullYear()
        const { count } = await sb.from('factures_saas').select('*', { count:'exact', head:true })
        const numero = `ANZ-${year}-${String((count||0)+1).padStart(5,'0')}`
        const { data, error } = await sb.from('factures_saas').insert({
          organisme_id, plan_slug: plan_slug||null, periode: periode||'mensuel',
          numero, montant_ttc: parseInt(montant_ttc), montant_ht: parseInt(montant_ttc),
          date_echeance: date_echeance||null, statut:'pending', methode_paiement:'virement', notes: notes||null,
        }).select().single()
        if (error) return res.status(500).json({ error: error.message })
        return res.json({ success: true, facture: data })
      }
      return res.status(400).json({ error: 'Action manquante' })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  // ═══ PUT — Mettre à jour plan/facture ═══
  if (req.method === 'PUT') {
    try {
      if (action === 'plan') {
        const { id, ...fields } = req.body || {}
        if (!id) return res.status(400).json({ error: 'ID manquant' })
        const update: any = { updated_at: new Date().toISOString() }
        for (const k of ['nom','description','prix_mensuel','prix_annuel','features','limite_apprenants','is_active','is_featured','ordre','stripe_product_id','stripe_price_id_mensuel','stripe_price_id_annuel']) {
          if (fields[k] !== undefined) update[k] = fields[k]
        }
        const { error } = await sb.from('plans').update(update).eq('id', id)
        if (error) return res.status(500).json({ error: error.message })
        return res.json({ success: true })
      }
      if (action === 'facture') {
        const { id, statut, date_paiement, reference_paiement, notes } = req.body || {}
        if (!id) return res.status(400).json({ error: 'ID manquant' })
        const update: any = { updated_at: new Date().toISOString() }
        if (statut !== undefined) update.statut = statut
        if (date_paiement !== undefined) update.date_paiement = date_paiement
        if (reference_paiement !== undefined) update.reference_paiement = reference_paiement
        if (notes !== undefined) update.notes = notes
        if (statut === 'paid' && !date_paiement) update.date_paiement = new Date().toISOString()
        const { error } = await sb.from('factures_saas').update(update).eq('id', id)
        if (error) return res.status(500).json({ error: error.message })
        return res.json({ success: true })
      }
      return res.status(400).json({ error: 'Action manquante' })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  // ═══ DELETE ═══
  if (req.method === 'DELETE') {
    try {
      const id = req.query.id as string
      if (!id) return res.status(400).json({ error: 'ID manquant' })
      if (action === 'plan') {
        const { error } = await sb.from('plans').delete().eq('id', id)
        if (error) return res.status(500).json({ error: error.message })
        return res.json({ success: true })
      }
      if (action === 'facture') {
        const { error } = await sb.from('factures_saas').delete().eq('id', id)
        if (error) return res.status(500).json({ error: error.message })
        return res.json({ success: true })
      }
      return res.status(400).json({ error: 'Action manquante' })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  return res.status(405).end()
}
