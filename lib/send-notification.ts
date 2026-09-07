import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')
const RESEND_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || 'contact@anzpilot.com'

function replaceVars(text: string, vars: Record<string,string>): string {
  let out = text
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v ?? ''))
  }
  return out
}

async function sendMail(to: string, subject: string, html: string, template_slug?: string, contexte?: any): Promise<boolean> {
  if (!RESEND_KEY) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `ANZPilot <${EMAIL_FROM}>`, to, subject, html })
    })
    const d = await res.json()
    await sb.from('email_logs').insert({
      template_slug: template_slug || 'notification_auto',
      destinataire_email: to, sujet: subject,
      statut: res.ok ? 'sent' : 'failed',
      resend_id: d.id || null,
      erreur: !res.ok ? (d.message || 'HTTP ' + res.status) : null,
      contexte: contexte || {},
      envoye_par: 'system_notification',
    })
    return res.ok
  } catch { return false }
}

// Notifier les admins d'un nouveau ticket
export async function notifyAdminsNewTicket(ticket: any) {
  try {
    // Récupérer les admins super_admin depuis admin_users
    let adminEmails: string[] = []
    try {
      const { data } = await sb.from('admin_users').select('email').eq('is_active', true).in('role', ['super_admin', 'admin', 'support'])
      adminEmails = (data || []).map((a:any) => a.email).filter(Boolean)
    } catch {}
    // Fallback : depuis variable env
    if (adminEmails.length === 0) {
      const fallback = process.env.ADMIN_NOTIFICATIONS_EMAIL || 'tarikalik@gmail.com'
      adminEmails = [fallback]
    }

    const subject = `🎫 Nouveau ticket ${ticket.numero} — ${ticket.priorite === 'urgente' ? '🚨 URGENT' : ticket.priorite}`
    const html = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fafc">
  <div style="background:#fff;padding:24px;border-radius:12px;border:1px solid #e2e8f0">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div style="width:40px;height:40px;background:#0ea5e9;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px">🎫</div>
      <div>
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600">Nouveau ticket</div>
        <div style="font-size:18px;font-weight:700;color:#0f172a">${ticket.numero}</div>
      </div>
    </div>
    <h2 style="font-size:18px;color:#0f172a;margin:16px 0 8px">${ticket.sujet}</h2>
    <div style="display:inline-block;padding:4px 10px;border-radius:12px;background:${ticket.priorite==='urgente'?'#fee2e2':ticket.priorite==='haute'?'#fef3c7':'#e0f2fe'};color:${ticket.priorite==='urgente'?'#dc2626':ticket.priorite==='haute'?'#d97706':'#0284c7'};font-size:11px;font-weight:600;margin-bottom:14px">Priorité ${ticket.priorite.toUpperCase()}</div>
    <div style="padding:12px;background:#f1f5f9;border-radius:8px;font-size:13px;color:#475569;margin:14px 0">
      <strong>De :</strong> ${ticket.organisme_nom || ticket.organisme_email}<br>
      <strong>Email :</strong> ${ticket.organisme_email}<br>
      <strong>Catégorie :</strong> ${ticket.categorie}
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="https://anzpilot.com/admin/support" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Ouvrir dans la console →</a>
    </div>
  </div>
  <div style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px">ANZPilot — Notification automatique</div>
</div>`

    // Envoi en parallèle
    await Promise.all(adminEmails.map(e => sendMail(e, subject, html, 'notif_nouveau_ticket', { ticket_id: ticket.id, numero: ticket.numero })))
  } catch (e) { console.error('notifyAdminsNewTicket:', e) }
}

// Notifier l'OF d'une réponse admin
export async function notifyOfNewReply(ticket: any, message: string, adminNom: string) {
  try {
    if (!ticket.organisme_email) return
    const subject = `💬 Nouvelle réponse à votre ticket ${ticket.numero}`
    const html = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fafc">
  <div style="background:#fff;padding:24px;border-radius:12px;border:1px solid #e2e8f0">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div style="width:40px;height:40px;background:#10b981;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px">💬</div>
      <div>
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600">Nouvelle réponse</div>
        <div style="font-size:18px;font-weight:700;color:#0f172a">${ticket.numero}</div>
      </div>
    </div>
    <h2 style="font-size:16px;color:#0f172a;margin:16px 0 8px">${ticket.sujet}</h2>
    <p style="font-size:13px;color:#64748b;margin:0 0 14px"><strong>${adminNom}</strong> a répondu à votre ticket :</p>
    <div style="padding:14px;background:#f0fdf4;border-left:3px solid #10b981;border-radius:6px;font-size:14px;color:#166534;white-space:pre-wrap;line-height:1.5">${(message || '').substring(0, 500)}${(message || '').length > 500 ? '...' : ''}</div>
    <div style="text-align:center;margin:24px 0">
      <a href="https://anzpilot.com/support" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Voir la conversation →</a>
    </div>
  </div>
  <div style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px">ANZPilot — Notification automatique</div>
</div>`
    await sendMail(ticket.organisme_email, subject, html, 'notif_reponse_admin', { ticket_id: ticket.id, numero: ticket.numero })
  } catch (e) { console.error('notifyOfNewReply:', e) }
}
