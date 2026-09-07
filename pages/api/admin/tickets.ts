import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notifyOfNewReply } from '../../../lib/send-notification'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')

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
        let org = null
        if (ticket.organisme_id) {
          const { data: o } = await sb.from('organismes').select('id,nom,email,plan,statut,date_inscription').eq('id', ticket.organisme_id).maybeSingle()
          org = o || null
        }
        return res.json({ ticket, messages: messages || [], organisme: org })
      }
      if (action === 'stats') {
        // Récupérer tickets + messages pour calculer stats
        const { data: tickets } = await sb.from('tickets').select('id, statut, created_at, priorite')
        const { data: allMessages } = await sb.from('ticket_messages').select('ticket_id, auteur_type, created_at').order('created_at', { ascending: true })

        const tk = tickets || []
        const msgs = allMessages || []

        // Temps de réponse moyen (première réponse admin après création)
        let totalResponseMs = 0
        let countWithResponse = 0
        for (const t of tk) {
          const firstAdminMsg = msgs.find((m:any) => m.ticket_id === t.id && m.auteur_type === 'admin')
          if (firstAdminMsg) {
            const ms = new Date(firstAdminMsg.created_at).getTime() - new Date(t.created_at).getTime()
            if (ms > 0) { totalResponseMs += ms; countWithResponse++ }
          }
        }
        const avgResponseHours = countWithResponse > 0 ? (totalResponseMs / countWithResponse / (1000 * 60 * 60)) : 0

        return res.json({
          stats: {
            total: tk.length,
            ouverts: tk.filter((t:any)=>t.statut==='ouvert').length,
            en_cours: tk.filter((t:any)=>t.statut==='en_cours').length,
            resolus: tk.filter((t:any)=>t.statut==='resolu').length,
            fermes: tk.filter((t:any)=>t.statut==='ferme').length,
            urgents: tk.filter((t:any)=>t.priorite==='urgente' && (t.statut==='ouvert'||t.statut==='en_cours')).length,
            avg_response_hours: Math.round(avgResponseHours * 10) / 10,
            taux_resolution: tk.length > 0 ? Math.round(((tk.filter((t:any)=>t.statut==='resolu'||t.statut==='ferme').length) / tk.length) * 100) : 0,
            with_response: countWithResponse,
          }
        })
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
        const update: any = {
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        if (!is_internal) {
          update.last_message_by = 'admin'
          update.statut = 'en_cours'
        }
        await sb.from('tickets').update(update).eq('id', ticket_id)

        // 📧 Envoi email OF (SEULEMENT si pas note interne)
        if (!is_internal) {
          const { data: ticket } = await sb.from('tickets').select('*').eq('id', ticket_id).maybeSingle()
          if (ticket) {
            // Fire-and-forget (ne pas bloquer la réponse)
            notifyOfNewReply(ticket, message, admin_nom || 'Support ANZPilot').catch(()=>{})
          }
        }

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
