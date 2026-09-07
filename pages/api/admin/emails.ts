import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || 'contact@anzpilot.com'

function replaceVars(text: string, vars: Record<string, string>): string {
  let out = text
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v ?? ''))
  }
  return out
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean, id?: string, error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `ANZPilot <${EMAIL_FROM}>`, to, subject, html })
    })
    const d = await res.json()
    if (!res.ok) return { ok: false, error: d.message || 'Erreur Resend' }
    return { ok: true, id: d.id }
  } catch (e: any) { return { ok: false, error: e.message } }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const action = req.query.action as string

  if (req.method === 'GET') {
    try {
      if (action === 'templates') {
        const { data } = await sb.from('email_templates').select('*').order('categorie').order('nom')
        return res.json({ templates: data || [] })
      }
      if (action === 'logs') {
        const { data } = await sb.from('email_logs').select('*').order('created_at', { ascending: false }).limit(200)
        return res.json({ logs: data || [] })
      }
      return res.status(400).json({ error: 'Action manquante' })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  if (req.method === 'POST') {
    try {
      if (action === 'test-send') {
        const { template_slug, destinataire, variables } = req.body || {}
        if (!template_slug || !destinataire) return res.status(400).json({ error: 'Template et destinataire requis' })

        const { data: tpl } = await sb.from('email_templates').select('*').eq('slug', template_slug).maybeSingle()
        if (!tpl) return res.status(404).json({ error: 'Template introuvable' })

        const sujet = replaceVars(tpl.sujet, variables || {})
        const html = replaceVars(tpl.corps_html, variables || {})

        const result = await sendEmail(destinataire, sujet, html)

        await sb.from('email_logs').insert({
          template_slug, destinataire_email: destinataire, sujet,
          statut: result.ok ? 'sent' : 'failed',
          resend_id: result.id || null, erreur: result.error || null,
          contexte: variables || {}, envoye_par: 'admin_test',
        })
        if (!result.ok) return res.status(500).json({ error: result.error })
        return res.json({ success: true, id: result.id })
      }

      if (action === 'template') {
        const { slug, nom, description, sujet, corps_html, variables, categorie, is_active } = req.body || {}
        if (!slug || !nom || !sujet || !corps_html) return res.status(400).json({ error: 'Slug, nom, sujet et corps requis' })
        const { data, error } = await sb.from('email_templates').insert({
          slug: slug.toLowerCase().replace(/\s+/g,'_'),
          nom, description, sujet, corps_html,
          variables: variables || null,
          categorie: categorie || 'transactionnel',
          is_active: is_active !== false,
        }).select().single()
        if (error) return res.status(500).json({ error: error.message })
        return res.json({ success: true, template: data })
      }

      return res.status(400).json({ error: 'Action manquante' })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...fields } = req.body || {}
      if (!id) return res.status(400).json({ error: 'ID manquant' })
      const update: any = { updated_at: new Date().toISOString() }
      for (const k of ['nom','description','sujet','corps_html','variables','categorie','is_active']) {
        if (fields[k] !== undefined) update[k] = fields[k]
      }
      const { error } = await sb.from('email_templates').update(update).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ success: true })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  if (req.method === 'DELETE') {
    try {
      const id = req.query.id as string
      if (!id) return res.status(400).json({ error: 'ID manquant' })
      const { error } = await sb.from('email_templates').delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ success: true })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  return res.status(405).end()
}
