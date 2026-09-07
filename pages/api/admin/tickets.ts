import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const action = req.query.action as string

  // ═══ GET ═══
  if (req.method === 'GET') {
    try {
      if (action === 'list') {
        const { data, error } = await sb.from('tickets').select('*').order('last_message_at', { ascending: false })
        if (error) return res.status(500).json({ error: error.message })
        return res.json({ tickets: data || [] })
      }
      if (action === 'detail') {
        const id = req.query.id as string
        if (!id) return res.status(400).json({ error: 'ID manquant' })
        const { data: ticket } = await sb.from('tickets').select('*').eq('id', id).maybeSingle()
        if (!ticket) return res.status(404).json({ error: 'Ticket introuvable' })
        const { data: messages } = await sb.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true })
        // Enrichir avec infos organisme
        const { data: org } = await sb.from('organismes').select('id,nom,email,plan,statut,date_inscription').eq('id', ticket.organisme_id).maybeSingle()
        return res.json({ ticket, messages: messages || [], organisme: org || null })
      }
      return res.status(400).json({ error: 'Action manquante' })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  // ═══ POST — Répondre à un ticket ═══
  if (req.method === 'POST') {
    try {
      if (action === 'reply') {
        const { ticket_id, message, is_internal, admin_email, admin_nom } = req.body || {}
        if (!ticket_id || !message) return res.status(400).json({ error: 'Ticket et message requis' })

        const { error } = await sb.from('ticket_messages').insert({
          ticket_id, auteur_type: 'admin',
          auteur_email: admin_email || 'admin',
          auteur_nom: admin_nom || 'Admin',
          message, is_internal: !!is_internal,
        })
        if (error) return res.status(500).json({ error: error.message })

        // Mettre à jour le ticket
        await sb.from('tickets').update({
          last_message_at: new Date().toISOString(),
          last_message_by: 'admin',
          statut: is_internal ? undefined : 'en_cours',
          updated_at: new Date().toISOString(),
        }).eq('id', ticket_id)

        return res.json({ success: true })
      }
      return res.status(400).json({ error: 'Action manquante' })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  // ═══ PUT — Modifier un ticket ═══
  if (req.method === 'PUT') {
    try {
      const { id, statut, priorite, categorie, assignee_email, assignee_nom } = req.body || {}
      if (!id) return res.status(400).json({ error: 'ID manquant' })
      const update: any = { updated_at: new Date().toISOString() }
      if (statut !== undefined) {
        update.statut = statut
        if (statut === 'ferme' || statut === 'resolu') update.closed_at = new Date().toISOString()
      }
      if (priorite !== undefined) update.priorite = priorite
      if (categorie !== undefined) update.categorie = categorie
      if (assignee_email !== undefined) update.assignee_email = assignee_email
      if (assignee_nom !== undefined) update.assignee_nom = assignee_nom
      const { error } = await sb.from('tickets').update(update).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ success: true })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  return res.status(405).end()
}
