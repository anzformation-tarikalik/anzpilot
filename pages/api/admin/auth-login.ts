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

const MASTER_PASSWORD = process.env.ADMIN_MASTER_PASSWORD || 'ANZPilot2026!'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  res.setHeader('Cache-Control', 'no-store')

  try {
    const { email, password } = req.body || {}
    if (!password) return res.status(400).json({ error: 'Mot de passe requis' })

    // Mode MASTER (sans email)
    if (!email || email.trim() === '') {
      if (password === MASTER_PASSWORD) {
        // Log activité
        try {
          await sb.from('admin_activity').insert({
            admin_email: 'master',
            admin_role: 'super_admin',
            action: 'login_master',
            ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
          })
        } catch {}
        return res.json({
          success: true,
          user: { email: 'master', nom: 'Master Admin', role: 'super_admin' }
        })
      }
      return res.status(401).json({ error: 'Mot de passe master incorrect' })
    }

    // Mode admin_users (avec email)
    const emailNorm = email.toLowerCase().trim()
    const { data: user, error } = await sb.from('admin_users')
      .select('*').eq('email', emailNorm).maybeSingle()

    if (error) return res.status(500).json({ error: 'Erreur DB: '+error.message })
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    if (!user.actif) return res.status(403).json({ error: 'Compte désactivé' })

    if (user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    // Login OK — mettre à jour last_login_at
    await sb.from('admin_users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id)

    // Log activité
    try {
      await sb.from('admin_activity').insert({
        admin_email: user.email,
        admin_role: user.role,
        action: 'login',
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
      })
    } catch {}

    return res.json({
      success: true,
      user: { email: user.email, nom: user.nom, role: user.role }
    })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
