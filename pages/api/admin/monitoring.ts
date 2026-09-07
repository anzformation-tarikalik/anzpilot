import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || ''

interface ServiceStatus {
  name: string
  slug: string
  icon: string
  status: 'up' | 'degraded' | 'down' | 'unknown'
  latency_ms: number
  details?: string
  error?: string
}

async function pingSupabase(): Promise<ServiceStatus> {
  const t0 = Date.now()
  try {
    const { error } = await sb.from('organismes').select('id', { count: 'exact', head: true })
    const latency = Date.now() - t0
    if (error) return { name:'Supabase', slug:'supabase', icon:'🗄️', status:'down', latency_ms:latency, error:error.message }
    return { name:'Supabase', slug:'supabase', icon:'🗄️', status: latency < 500 ? 'up' : 'degraded', latency_ms:latency, details:'Base de données OK' }
  } catch (e: any) {
    return { name:'Supabase', slug:'supabase', icon:'🗄️', status:'down', latency_ms:Date.now()-t0, error:e.message }
  }
}

async function pingResend(): Promise<ServiceStatus> {
  const t0 = Date.now()
  if (!RESEND_API_KEY) return { name:'Resend', slug:'resend', icon:'📧', status:'unknown', latency_ms:0, error:'API key non configurée' }

  // Vérifier récente activité d'envoi comme indicateur de santé
  try {
    // Ping le service Resend directement (pas besoin d'auth pour l'API status)
    const res = await fetch('https://api.resend.com/', { method:'GET' })
    const latency = Date.now() - t0

    // Vérifier stats d'envoi récent (dernières 24h)
    const { count: recentEmails } = await sb.from('email_logs').select('*', { count:'exact', head:true })
      .eq('statut', 'sent')
      .gte('created_at', new Date(Date.now()-24*60*60*1000).toISOString())
    const { count: failedEmails } = await sb.from('email_logs').select('*', { count:'exact', head:true })
      .eq('statut', 'failed')
      .gte('created_at', new Date(Date.now()-24*60*60*1000).toISOString())

    const domainName = EMAIL_FROM.split('@')[1] || 'anzpilot.com'
    const totalSent = recentEmails || 0
    const totalFailed = failedEmails || 0
    const failRate = totalSent + totalFailed > 0 ? totalFailed / (totalSent + totalFailed) : 0

    let status: any = 'up'
    let details = `Clé configurée · ${totalSent} email${totalSent>1?'s':''} envoyé${totalSent>1?'s':''} (24h)`

    if (failRate > 0.5) { status = 'degraded'; details = `⚠️ ${totalFailed} échecs sur ${totalSent+totalFailed} envois (24h)` }
    else if (latency > 800) { status = 'degraded' }

    return { name:'Resend', slug:'resend', icon:'📧', status, latency_ms:latency, details }
  } catch (e: any) {
    return { name:'Resend', slug:'resend', icon:'📧', status:'down', latency_ms:Date.now()-t0, error:e.message }
  }
}

async function pingVercel(): Promise<ServiceStatus> {
  const t0 = Date.now()
  try {
    const res = await fetch('https://www.vercel-status.com/api/v2/status.json')
    const latency = Date.now() - t0
    if (!res.ok) return { name:'Vercel', slug:'vercel', icon:'▲', status:'unknown', latency_ms:latency }
    const data = await res.json()
    const ind = data?.status?.indicator || 'none'
    const status: any = ind === 'none' ? 'up' : ind === 'minor' ? 'degraded' : 'down'
    return { name:'Vercel', slug:'vercel', icon:'▲', status, latency_ms:latency, details:data?.status?.description||'Opérationnel' }
  } catch (e: any) {
    return { name:'Vercel', slug:'vercel', icon:'▲', status:'unknown', latency_ms:Date.now()-t0, error:e.message }
  }
}

async function pingJitsi(): Promise<ServiceStatus> {
  const t0 = Date.now()
  try {
    const res = await fetch('https://meet.jit.si/external_api.js', { method:'HEAD' })
    const latency = Date.now() - t0
    return { name:'ANZPilot Visio (Jitsi)', slug:'jitsi', icon:'🎥', status: res.ok ? (latency<800?'up':'degraded') : 'down', latency_ms:latency, details: res.ok ? 'Serveur Jitsi accessible' : 'HTTP '+res.status }
  } catch (e: any) {
    return { name:'ANZPilot Visio (Jitsi)', slug:'jitsi', icon:'🎥', status:'down', latency_ms:Date.now()-t0, error:e.message }
  }
}

async function getStats() {
  try {
    const [orgCount, factCount, emailsRecents, emailsFailed] = await Promise.all([
      sb.from('organismes').select('*', { count:'exact', head:true }),
      sb.from('factures_saas').select('*', { count:'exact', head:true }),
      sb.from('email_logs').select('*', { count:'exact', head:true }).gte('created_at', new Date(Date.now()-24*60*60*1000).toISOString()),
      sb.from('email_logs').select('*', { count:'exact', head:true }).eq('statut', 'failed').gte('created_at', new Date(Date.now()-24*60*60*1000).toISOString()),
    ])
    return {
      total_organismes: orgCount.count || 0,
      total_factures: factCount.count || 0,
      emails_24h: emailsRecents.count || 0,
      emails_failed_24h: emailsFailed.count || 0,
    }
  } catch { return { total_organismes:0, total_factures:0, emails_24h:0, emails_failed_24h:0 } }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  res.setHeader('Cache-Control', 'no-store')

  try {
    const [supabaseStatus, resendStatus, vercelStatus, jitsiStatus, stats] = await Promise.all([
      pingSupabase(), pingResend(), pingVercel(), pingJitsi(), getStats(),
    ])
    const services = [supabaseStatus, resendStatus, vercelStatus, jitsiStatus]
    const globalStatus = services.every(s=>s.status==='up') ? 'up' :
                        services.some(s=>s.status==='down') ? 'down' : 'degraded'
    return res.json({
      global_status: globalStatus,
      services,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) { return res.status(500).json({ error: e.message }) }
}
