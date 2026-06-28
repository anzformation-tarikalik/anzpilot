import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'anzpilot_salt_2026').digest('hex')
}

async function logActivity(req: NextApiRequest, action: string, details: any = {}) {
  try {
    const adminEmail = req.headers['x-admin-email'] as string || 'master'
    const adminRole = req.headers['x-admin-role'] as string || 'super_admin'
    await sb.from('admin_activity').insert({
      admin_email: adminEmail,
      admin_role: adminRole,
      action,
      cible_type: 'admin_user',
      cible_id: details.id || details.email || null,
      details,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
    })
  } catch {}
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  // GET — Liste de l'équipe
  if (req.method === 'GET') {
    try {
      const { data, error } = await sb.from('admin_users')
        .select('id, email, nom, role, actif, last_login_at, created_at, notes, created_by')
        .order('created_at', { ascending: false })
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ users: data || [] })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  // POST — Créer un admin
  if (req.method === 'POST') {
    try {
      const { email, nom, password, role, actif, notes } = req.body || {}
      if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })
      if (password.length < 8) return res.status(400).json({ error: 'Mot de passe : 8 caractères minimum' })

      const emailNorm = email.toLowerCase().trim()
      const existing = await sb.from('admin_users').select('id').eq('email', emailNorm).maybeSingle()
      if (existing.data) return res.status(409).json({ error: 'Email déjà utilisé' })

      const { data, error } = await sb.from('admin_users').insert({
        email: emailNorm,
        nom: nom || emailNorm.split('@')[0],
        password_hash: hashPassword(password),
        role: role || 'admin',
        actif: actif !== false,
        notes: notes || null,
        created_by: req.headers['x-admin-email'] || 'master',
      }).select().single()
      if (error) return res.status(500).json({ error: error.message })

      await logActivity(req, 'admin_user_create', { email: emailNorm, role })
      return res.json({ success: true, user: data })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  // PUT — Modifier un admin
  if (req.method === 'PUT') {
    try {
      const { id, nom, role, actif, password, notes } = req.body || {}
      if (!id) return res.status(400).json({ error: 'ID manquant' })

      const update: any = { updated_at: new Date().toISOString() }
      if (nom !== undefined) update.nom = nom
      if (role !== undefined) update.role = role
      if (actif !== undefined) update.actif = actif
      if (notes !== undefined) update.notes = notes
      if (password) {
        if (password.length < 8) return res.status(400).json({ error: 'Mot de passe : 8 caractères minimum' })
        update.password_hash = hashPassword(password)
      }

      const { error } = await sb.from('admin_users').update(update).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })

      await logActivity(req, 'admin_user_update', { id, fields: Object.keys(update) })
      return res.json({ success: true })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  // DELETE — Supprimer un admin
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'ID manquant' })

      // Protection : ne pas supprimer Tarik (super_admin initial)
      const { data: user } = await sb.from('admin_users').select('email,role').eq('id', id).maybeSingle()
      if (user?.email === 'tarikalik@gmail.com') return res.status(403).json({ error: 'Impossible de supprimer le super-admin principal' })

      const { error } = await sb.from('admin_users').delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })

      await logActivity(req, 'admin_user_delete', { id, email: user?.email })
      return res.json({ success: true })
    } catch (e: any) { return res.status(500).json({ error: e.message }) }
  }

  return res.status(405).end()
}
