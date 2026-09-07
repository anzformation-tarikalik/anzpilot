import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notifyAdminsNewTicket } from '../../../lib/send-notification'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')

async function nextTicketNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await sb.from('tickets').select('*', { count:'exact', head:true })
  return `TCK-${year}-${String((count||0)+1).padStart(4,'0')}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  // ═══ GET ═══
  if (req.method === 'GET') {
    try {
      const email = ((req.query.email as string) || '').toLowerCase().trim()
      const id = req.query.id as string

      if (id) {
        const { data: ticket } = await sb.from('tickets').select('*').eq('id', id).maybeSingle()
        if (!ticket) return res.status(404).json({ error: 'Ticket introuvable' })
        if (email && ticket.organisme_email !== email) return res.status(403).json({ error: 'Accès refusé' })
        const { data: messages } = await sb.from('ticket_messages').select('*').eq('ticket_id', id).eq('is_internal', false).order('created_at', { ascending: true })
        return res.json({ ticket, messages: messages || [] })
      }

      if (!email) return res.status(400).json({ error: 'Email requis' })
      const { data } = await sb.from('tickets').select('*').eq('organisme_email', email).order('last_message_at', { ascending: false })
      return res.json({ tickets: data || [] })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  // ═══ POST — Créer ticket OU répondre ═══
  if (req.method === 'POST') {
    try {
      const action = req.query.action as string

      if (action === 'reply') {
        const { ticket_id, message, email } = req.body || {}
        if (!ticket_id || !message || !email) return res.status(400).json({ error: 'Ticket, message et email requis' })

        const { data: ticket } = await sb.from('tickets').select('organisme_email, organisme_nom').eq('id', ticket_id).maybeSingle()
        if (!ticket || ticket.organisme_email !== email.toLowerCase()) return res.status(403).json({ error: 'Accès refusé' })

        await sb.from('ticket_messages').insert({
          ticket_id, auteur_type: 'of',
          auteur_email: email.toLowerCase(),
          auteur_nom: ticket.organisme_nom || email,
          message, is_internal: false,
        })
        await sb.from('tickets').update({
          last_message_at: new Date().toISOString(),
          last_message_by: 'of',
          statut: 'ouvert',
          updated_at: new Date().toISOString(),
        }).eq('id', ticket_id)
        return res.json({ success: true })
      }

      // Créer un nouveau ticket
      const { email, sujet, message, categorie, priorite } = req.body || {}
      if (!email || !sujet || !message) return res.status(400).json({ error: 'Email, sujet et message requis' })
      const emailNorm = email.toLowerCase().trim()

      const { data: org } = await sb.from('organismes').select('id,nom').eq('email', emailNorm).maybeSingle()
      const numero = await nextTicketNumber()
      const { data: newTicket, error } = await sb.from('tickets').insert({
        numero, organisme_id: org?.id || null,
        organisme_email: emailNorm, organisme_nom: org?.nom || emailNorm,
        sujet, categorie: categorie || 'question', priorite: priorite || 'moyenne',
        statut: 'ouvert', last_message_by: 'of',
      }).select().single()
      if (error) return res.status(500).json({ error: error.message })

      await sb.from('ticket_messages').insert({
        ticket_id: newTicket.id, auteur_type: 'of',
        auteur_email: emailNorm, auteur_nom: org?.nom || emailNorm,
        message, is_internal: false,
      })

      // 📧 Notifier les admins (fire-and-forget)
      notifyAdminsNewTicket(newTicket).catch(()=>{})

      return res.json({ success: true, ticket: newTicket })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  // ═══ PUT — Fermer/rouvrir un ticket côté OF ═══
  if (req.method === 'PUT') {
    try {
      const { id, email, action: putAction } = req.body || {}
      if (!id || !email) return res.status(400).json({ error: 'ID et email requis' })

      const emailNorm = email.toLowerCase().trim()
      const { data: ticket } = await sb.from('tickets').select('organisme_email, statut').eq('id', id).maybeSingle()
      if (!ticket || ticket.organisme_email !== emailNorm) return res.status(403).json({ error: 'Accès refusé' })

      let newStatut: string
      if (putAction === 'close') newStatut = 'resolu'
      else if (putAction === 'reopen') newStatut = 'ouvert'
      else return res.status(400).json({ error: 'Action invalide (close ou reopen)' })

      const update: any = { statut: newStatut, updated_at: new Date().toISOString() }
      if (newStatut === 'resolu') update.closed_at = new Date().toISOString()
      else update.closed_at = null

      const { error } = await sb.from('tickets').update(update).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })

      // Ajouter un message système
      await sb.from('ticket_messages').insert({
        ticket_id: id,
        auteur_type: 'of',
        auteur_email: emailNorm,
        auteur_nom: 'Système',
        message: newStatut === 'resolu' ? '✅ Ticket marqué comme résolu par le client' : '🔄 Ticket rouvert par le client',
        is_internal: false,
      })
      await sb.from('tickets').update({ last_message_at: new Date().toISOString(), last_message_by: 'of' }).eq('id', id)

      return res.json({ success: true, statut: newStatut })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  return res.status(405).end()
}
