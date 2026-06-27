import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || 'contact@anzpilot.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { email } = req.body || {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email invalide' })
    }

    // Générer code 6 chiffres
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expires = new Date(Date.now() + 15*60*1000).toISOString() // 15 min

    // Sauvegarder en BDD
    const { error: errSave } = await sb.from('magic_codes').insert({
      email: email.toLowerCase().trim(),
      code, expires_at: expires
    })
    if (errSave) return res.status(500).json({ error: 'Erreur de stockage : '+errSave.message })

    // Envoyer email via Resend
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;padding:20px;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:24px;text-align:center;color:#fff">
      <div style="font-size:24px;font-weight:700">ANZPilot</div>
      <div style="font-size:13px;opacity:.9;margin-top:4px">Code de connexion</div>
    </div>
    <div style="padding:32px;text-align:center">
      <p style="font-size:14px;color:#475569;margin:0 0 24px">Voici votre code de connexion :</p>
      <div style="display:inline-block;background:#f1f5f9;padding:16px 28px;border-radius:10px;font-family:'Courier New',monospace;font-size:36px;font-weight:700;color:#0ea5e9;letter-spacing:8px">${code}</div>
      <p style="font-size:12px;color:#64748b;margin:24px 0 0">Ce code expire dans 15 minutes.<br>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
    </div>
    <div style="padding:14px;text-align:center;font-size:11px;color:#94a3b8;background:#f8fafc">
      ANZPilot · Pilotez votre organisme de formation
    </div>
  </div>
</body></html>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `ANZPilot <${EMAIL_FROM}>`,
        to: email,
        subject: `Votre code ANZPilot : ${code}`,
        html
      })
    })
    if (!r.ok) {
      const err = await r.json().catch(()=>({}))
      return res.status(500).json({ error: 'Échec envoi email : '+(err.message||r.statusText) })
    }
    return res.json({ success: true, message: 'Code envoyé à '+email })
  } catch(e:any) {
    return res.status(500).json({ error: e.message })
  }
}
