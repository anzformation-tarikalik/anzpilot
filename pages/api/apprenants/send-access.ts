import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const resend = new Resend(process.env.RESEND_API_KEY || '')
const FROM_EMAIL = process.env.EMAIL_FROM || 'contact@anzpilot.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { apprenant_id, mode = 'magic_link' } = req.body || {}
  if (!apprenant_id) return res.status(400).json({ error: 'ID apprenant manquant' })

  try {
    // 1. Récupérer l'apprenant + organisme
    const { data: apprenant, error: appErr } = await sb
      .from('apprenants')
      .select('id, prenom, nom, email, organisme_id, organismes(nom, email_contact, couleur, logo_url)')
      .eq('id', apprenant_id)
      .single()

    if (appErr || !apprenant) {
      return res.status(404).json({ error: 'Apprenant introuvable' })
    }

    const organisme: any = apprenant.organismes
    if (!organisme) {
      return res.status(400).json({ error: 'Organisme manquant' })
    }

    // 2. Générer le token d'accès magique
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2)
    const code6 = Math.floor(100000 + Math.random() * 900000).toString()

    await sb.from('apprenants').update({
      lien_acces: token,
      code_acces: code6,
      lien_expire: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    }).eq('id', apprenant_id)

    // 3. Construire l'URL d'accès
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://anzpilot.com'
    const accessLink = `${appUrl}/apprenant/${token}`
    const couleur = organisme.couleur || '#0ea5e9'

    // 4. Construire l'email HTML
    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
<tr><td style="background:linear-gradient(135deg,${couleur},${couleur}dd);padding:40px 30px;text-align:center">
<div style="font-size:32px;margin-bottom:12px">🎓</div>
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">${organisme.nom}</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px">Votre espace de formation en ligne</p>
</td></tr>
<tr><td style="padding:40px 30px">
<p style="margin:0 0 20px;color:#0f172a;font-size:16px">Bonjour <strong>${apprenant.prenom} ${apprenant.nom}</strong>,</p>
<p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6">
Votre espace personnel de formation est disponible.<br/>
Vous y trouverez vos cours, documents, émargements et questionnaires de satisfaction.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:${couleur};border-radius:8px">
<a href="${accessLink}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600">
✈️ Accéder à mon espace formation
</a>
</td></tr></table>
<p style="margin:32px 0 0;color:#64748b;font-size:13px;line-height:1.5;text-align:center">
Lien personnel valable 90 jours · Code d'accès : <strong style="color:#0f172a;font-family:monospace">${code6}</strong>
</p>
<hr style="margin:32px 0;border:none;border-top:1px solid #e2e8f0"/>
<p style="margin:0;color:#94a3b8;font-size:12px;text-align:center">
Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
<a href="${accessLink}" style="color:${couleur};word-break:break-all">${accessLink}</a>
</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 30px;text-align:center;border-top:1px solid #e2e8f0">
<p style="margin:0;color:#94a3b8;font-size:11px">
Email envoyé par ${organisme.nom} via <strong>ANZPilot</strong><br/>
Pour toute question, répondez directement à cet email
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

    // 5. Envoyer l'email avec le NOM DE L'OF + Reply-To
    const emailResult = await resend.emails.send({
      from: `${organisme.nom} <${FROM_EMAIL}>`,
      to: apprenant.email,
      subject: `🎓 Votre espace formation ${organisme.nom} est prêt`,
      html,
      reply_to: organisme.email_contact || FROM_EMAIL,
    })

    if (emailResult.error) {
      return res.status(500).json({ error: 'Erreur envoi email: ' + emailResult.error.message })
    }

    return res.json({ success: true, message: 'Email envoyé à ' + apprenant.email, token, code: code6 })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Erreur inconnue' })
  }
}
