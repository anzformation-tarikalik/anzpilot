import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { email, code } = req.body || {}
    if (!email || !code) return res.status(400).json({ error: 'Email et code requis' })

    const emailNorm = email.toLowerCase().trim()
    const codeNorm = String(code).trim().replace(/\D/g, '')

    // 1. Vérifier le code
    const { data: codes, error: errSearch } = await sb
      .from('magic_codes').select('*').eq('email', emailNorm)
      .order('created_at', { ascending: false }).limit(5)
    if (errSearch) return res.status(500).json({ error: 'Erreur DB : '+errSearch.message })
    if (!codes || codes.length === 0) return res.status(400).json({ error: 'Aucun code trouvé. Redemandez un code.' })

    const match = codes.find((c: any) => String(c.code).trim() === codeNorm)
    if (!match) return res.status(400).json({ error: 'Code incorrect.' })
    if (new Date(match.expires_at) < new Date()) return res.status(400).json({ error: 'Code expiré.' })
    if (match.used) return res.status(400).json({ error: 'Code déjà utilisé. Demandez un nouveau code.' })

    await sb.from('magic_codes').update({ used: true }).eq('id', match.id)

    // 2. Trouver ou créer l'organisme (approche défensive)
    let org: any = null
    try {
      const { data } = await sb.from('organismes').select('*').eq('email', emailNorm).maybeSingle()
      org = data
    } catch {}

    if (!org) {
      // Insert MINIMAL — laisse les valeurs DEFAULT SQL faire leur travail
      try {
        const { data: newOrg, error: errCreate } = await sb.from('organismes').insert({
          email: emailNorm,
        }).select().single()
        if (errCreate) {
          console.error('Insert simple failed, trying with statut/plan:', errCreate)
          // Fallback : tenter avec statut/plan mais SANS date_fin_essai
          const retry = await sb.from('organismes').insert({
            email: emailNorm,
            statut: 'essai',
            plan: 'essai',
          }).select().single()
          if (retry.error) return res.status(500).json({ error: 'Création OF: '+retry.error.message })
          org = retry.data
        } else org = newOrg
      } catch (e: any) {
        return res.status(500).json({ error: 'Création OF: '+e.message })
      }
    } else {
      // Login existant — mettre à jour date_dernier_login si possible
      try { await sb.from('organismes').update({ date_dernier_login: new Date().toISOString() }).eq('id', org.id) } catch {}
    }

    // 3. Vérifier statut (tolérant)
    if (org?.statut === 'bloque') {
      return res.status(403).json({ error: 'Votre essai gratuit est terminé. Veuillez activer un plan payant.' })
    }

    // Calculer jours restants essai
    let joursRestants = 0
    if (org?.statut === 'essai' && org?.date_fin_essai) {
      const ms = new Date(org.date_fin_essai).getTime() - Date.now()
      joursRestants = Math.max(0, Math.ceil(ms / (1000*60*60*24)))
    }

    return res.json({
      success: true,
      email: emailNorm,
      organisme: {
        id: org?.id,
        nom: org?.nom || 'Mon Organisme',
        statut: org?.statut || 'essai',
        plan: org?.plan || 'essai',
        joursRestants,
        dateFinEssai: org?.date_fin_essai,
      }
    })
  } catch(e:any) {
    return res.status(500).json({ error: e.message || 'Erreur serveur' })
  }
}
