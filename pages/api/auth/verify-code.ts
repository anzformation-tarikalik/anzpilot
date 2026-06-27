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

    // Récupérer le code le plus récent pour cet email
    const { data: codes, error: errSearch } = await sb
      .from('magic_codes')
      .select('*')
      .eq('email', emailNorm)
      .order('created_at', { ascending: false })
      .limit(5)

    if (errSearch) {
      console.error('[verify-code] DB error:', errSearch)
      return res.status(500).json({ error: 'Erreur base de données : '+errSearch.message })
    }

    if (!codes || codes.length === 0) {
      return res.status(400).json({ error: 'Aucun code trouvé pour cet email. Renvoyez un nouveau code.' })
    }

    // Trouver le code qui matche
    const match = codes.find((c: any) => String(c.code).trim() === codeNorm)
    if (!match) {
      return res.status(400).json({ error: 'Code incorrect. Vérifiez le code reçu par email.' })
    }

    // Vérifier expiration
    if (new Date(match.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code expiré. Demandez un nouveau code.' })
    }

    // Vérifier non utilisé
    if (match.used) {
      return res.status(400).json({ error: 'Code déjà utilisé. Demandez un nouveau code.' })
    }

    // OK — marquer comme utilisé
    await sb.from('magic_codes').update({ used: true }).eq('id', match.id)
    return res.json({ success: true, email: match.email })

  } catch(e:any) {
    console.error('[verify-code] Error:', e)
    return res.status(500).json({ error: e.message || 'Erreur serveur' })
  }
}
