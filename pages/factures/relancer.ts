import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || 'contact@anzpilot.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { id, message_perso } = req.body || {}
    if (!id) return res.status(400).json({ error: 'ID manquant' })

    const { data: f, error: errF } = await sb.from('factures').select('*').eq('id', id).single()
    if (errF || !f) return res.status(404).json({ error: 'Facture introuvable' })
    if (!f.destinataire_email) return res.status(400).json({ error: 'Email du destinataire manquant' })

    const isRetard = f.date_echeance && new Date(f.date_echeance) < new Date()
    const subject = isRetard
      ? `🔴 RELANCE — Facture ${f.numero} en retard`
      : `📧 Rappel — Facture ${f.numero}`

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#0f172a;background:#f1f5f9;padding:20px;margin:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:24px;color:#fff">
      <div style="font-size:22px;font-weight:700">${f.of_nom||'ANZ Formation'}</div>
      <div style="font-size:13px;opacity:.9;margin-top:4px">${isRetard?'🔴 Facture en retard':'📧 Rappel de paiement'}</div>
    </div>
    <div style="padding:28px">
      <p style="font-size:14px;margin:0 0 14px">Bonjour,</p>
      <p style="font-size:14px;line-height:1.5;margin:0 0 14px">
        ${isRetard
          ? `Nous nous permettons de vous relancer concernant la facture <strong>${f.numero}</strong> dont l'échéance était fixée au <strong>${new Date(f.date_echeance).toLocaleDateString('fr-FR')}</strong> et qui reste impayée à ce jour.`
          : `Nous vous remercions par avance de bien vouloir procéder au règlement de la facture <strong>${f.numero}</strong> avant le <strong>${new Date(f.date_echeance).toLocaleDateString('fr-FR')}</strong>.`}
      </p>
      <div style="background:#f8fafc;border-radius:9px;padding:18px;margin:18px 0">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:4px 0;color:#64748b">Numéro</td><td style="padding:4px 0;font-weight:600;text-align:right">${f.numero}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b">Formation</td><td style="padding:4px 0;font-weight:600;text-align:right">${f.formation_titre||''}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b">Apprenant</td><td style="padding:4px 0;font-weight:600;text-align:right">${f.apprenant_nom||''}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b">Émise le</td><td style="padding:4px 0;font-weight:600;text-align:right">${new Date(f.date_emission).toLocaleDateString('fr-FR')}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b">Échéance</td><td style="padding:4px 0;font-weight:600;text-align:right;color:${isRetard?'#ef4444':'#0f172a'}">${new Date(f.date_echeance).toLocaleDateString('fr-FR')}</td></tr>
          <tr><td style="padding:10px 0 4px;color:#64748b;border-top:1px solid #e2e8f0">Montant dû</td><td style="padding:10px 0 4px;font-weight:700;text-align:right;font-size:20px;color:#10b981;border-top:1px solid #e2e8f0">${(f.prix_ht||0).toLocaleString('fr-FR')}€</td></tr>
        </table>
      </div>
      ${message_perso ? `<div style="background:#fff7ed;border-left:3px solid #f59e0b;padding:12px 14px;margin:18px 0;border-radius:6px;font-size:13px;color:#92400e">${message_perso.replace(/\n/g,'<br>')}</div>` : ''}
      <div style="background:#f0f9ff;border-radius:9px;padding:14px;font-size:13px">
        <div style="font-weight:600;margin-bottom:6px">Coordonnées de paiement</div>
        ${f.of_iban ? `<div style="color:#64748b">IBAN : <strong style="color:#0f172a">${f.of_iban}</strong></div>` : ''}
        ${f.of_bic ? `<div style="color:#64748b">BIC : <strong style="color:#0f172a">${f.of_bic}</strong></div>` : ''}
        <div style="color:#64748b">Référence à indiquer : <strong style="color:#0f172a">${f.numero}</strong></div>
      </div>
      <p style="font-size:13px;line-height:1.5;margin:18px 0 0;color:#475569">
        Nous restons à votre disposition pour tout renseignement complémentaire.<br>
        Cordialement,<br><strong>${f.of_nom||'ANZ Formation'}</strong>
      </p>
    </div>
    <div style="padding:14px;text-align:center;font-size:11px;color:#94a3b8;background:#f8fafc">
      Envoyé via ANZPilot · TVA non applicable, art. 261-4-4 du CGI
    </div>
  </div>
</body></html>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${f.of_nom||'ANZPilot'} <${EMAIL_FROM}>`,
        to: f.destinataire_email,
        subject,
        html,
        reply_to: f.of_email || undefined,
      })
    })
    const result = await r.json()
    if (!r.ok) return res.status(500).json({ error: result?.message || 'Échec envoi email' })

    // Marquer la facture avec la date de relance
    await sb.from('factures').update({ updated_at: new Date().toISOString() }).eq('id', id)

    return res.json({ success: true, message: 'Relance envoyée à '+f.destinataire_email })
  } catch(e:any) { return res.status(500).json({ error: e.message }) }
}
