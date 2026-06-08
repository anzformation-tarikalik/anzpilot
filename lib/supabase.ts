import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export type Plan = 'trial' | 'starter' | 'pro' | 'business' | 'enterprise'

export const PLANS: Record<Plan, { nom: string; prix_mensuel: number; prix_annuel: number; features: string[] }> = {
  trial: { nom: 'Essai gratuit', prix_mensuel: 0, prix_annuel: 0, features: ['14 jours gratuits', '1 utilisateur', '5 sessions', '10 apprenants'] },
  starter: { nom: 'Starter', prix_mensuel: 4900, prix_annuel: 46800, features: ['3 utilisateurs', 'Sessions illimitées', '∞ Apprenants', 'BPF auto', 'EDOF/CPF'] },
  pro: { nom: 'Pro', prix_mensuel: 12900, prix_annuel: 123600, features: ['10 utilisateurs', 'LMS + Visio', 'CRM', 'Qualiopi', 'IA basique'] },
  business: { nom: 'Business', prix_mensuel: 29900, prix_annuel: 286800, features: ['Illimité', 'Multi-centres', 'IA complète', 'Marketplace', 'API'] },
  enterprise: { nom: 'Entreprise', prix_mensuel: 0, prix_annuel: 0, features: ['Infrastructure dédiée', 'SSO/LDAP', 'Marque blanche', 'SLA'] }
}
