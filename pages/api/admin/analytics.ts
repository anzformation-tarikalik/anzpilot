import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function fmtMonth(d: Date): string {
  const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']
  return `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  res.setHeader('Cache-Control', 'no-store')

  try {
    // Charger tous les organismes
    const { data: organismes } = await sb.from('organismes').select('id, statut, plan, date_inscription, created_at')
    const allOrgs = organismes || []

    // Charger factures payées
    const { data: factures } = await sb.from('factures_saas').select('montant_ttc, date_paiement, date_emission, statut, plan_slug').eq('statut', 'paid')
    const allFactures = factures || []

    // Charger emails
    const { data: emails } = await sb.from('email_logs').select('created_at, statut')
    const allEmails = emails || []

    // Charger plans (pour MRR)
    const { data: plans } = await sb.from('plans').select('slug, prix_mensuel')
    const plansMap: Record<string, number> = {}
    ;(plans || []).forEach(p => { plansMap[p.slug] = p.prix_mensuel || 0 })

    // ═══ KPIs ═══
    const now = new Date()
    const days30 = daysAgo(30)
    const totalOf = allOrgs.length
    const actifs = allOrgs.filter(o => o.statut === 'actif').length
    const essais = allOrgs.filter(o => o.statut === 'essai').length
    const bloques = allOrgs.filter(o => o.statut === 'bloque').length
    const signups30d = allOrgs.filter(o => o.date_inscription && new Date(o.date_inscription) >= days30).length

    // MRR = somme des prix mensuels des OF actifs par plan
    let mrr = 0
    allOrgs.filter(o => o.statut === 'actif').forEach(o => {
      mrr += plansMap[o.plan] || 0
    })

    // CA total encaissé
    const caTotal = allFactures.reduce((sum, f) => sum + (f.montant_ttc || 0), 0)

    // ═══ Croissance 30 derniers jours ═══
    const growth: Array<{date:string, day:string, signups:number, cumul:number}> = []
    let cumul = allOrgs.filter(o => o.date_inscription && new Date(o.date_inscription) < daysAgo(30)).length
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i)
      const dNext = daysAgo(i - 1)
      const dayCount = allOrgs.filter(o => {
        if (!o.date_inscription) return false
        const t = new Date(o.date_inscription).getTime()
        return t >= d.getTime() && t < dNext.getTime()
      }).length
      cumul += dayCount
      growth.push({
        date: fmtDate(d),
        day: d.getDate() + '/' + (d.getMonth()+1),
        signups: dayCount,
        cumul,
      })
    }

    // ═══ Revenus 6 derniers mois ═══
    const revenue: Array<{month:string, ca:number, count:number}> = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthFactures = allFactures.filter(f => {
        const d = f.date_paiement ? new Date(f.date_paiement) : new Date(f.date_emission)
        return d >= monthDate && d < nextMonth
      })
      revenue.push({
        month: fmtMonth(monthDate),
        ca: monthFactures.reduce((s, f) => s + (f.montant_ttc || 0), 0),
        count: monthFactures.length,
      })
    }

    // ═══ Répartition par plan ═══
    const planCounts: Record<string, number> = {}
    allOrgs.forEach(o => {
      const p = o.plan || 'essai'
      planCounts[p] = (planCounts[p] || 0) + 1
    })
    const byPlan = Object.entries(planCounts).map(([name, value]) => ({ name, value }))

    // ═══ Répartition par statut ═══
    const statutCounts: Record<string, number> = { essai:0, actif:0, bloque:0, annule:0 }
    allOrgs.forEach(o => {
      const s = o.statut || 'essai'
      statutCounts[s] = (statutCounts[s] || 0) + 1
    })
    const byStatut = Object.entries(statutCounts).map(([name, value]) => ({ name, value }))

    // ═══ Emails 30 derniers jours ═══
    const emailsPerDay: Array<{date:string, day:string, count:number, failed:number}> = []
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i)
      const dNext = daysAgo(i - 1)
      const dayEmails = allEmails.filter(e => {
        const t = new Date(e.created_at).getTime()
        return t >= d.getTime() && t < dNext.getTime()
      })
      emailsPerDay.push({
        date: fmtDate(d),
        day: d.getDate() + '/' + (d.getMonth()+1),
        count: dayEmails.filter(e => e.statut === 'sent').length,
        failed: dayEmails.filter(e => e.statut === 'failed').length,
      })
    }

    return res.json({
      kpis: {
        total_of: totalOf,
        actifs, essais, bloques,
        signups_30d: signups30d,
        mrr_centimes: mrr,
        arr_centimes: mrr * 12,
        ca_total_centimes: caTotal,
      },
      growth, revenue, byPlan, byStatut, emailsPerDay
    })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
