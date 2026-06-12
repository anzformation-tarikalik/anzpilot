import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { CheckCircle, CreditCard, FileText, ArrowRight, Zap, Shield, Users, AlertCircle } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PLANS = [
  {
    id: 'starter', nom: 'Starter', prix_mensuel: 49, prix_annuel: 390,
    color: 'blue', stripe_monthly: 'STRIPE_PRICE_STARTER_MONTHLY', stripe_annual: 'STRIPE_PRICE_STARTER_ANNUAL',
    features: ['3 utilisateurs admins', 'Sessions illimitées', '∞ Apprenants (aucune limite)', 'Émargement numérique', 'BPF automatique', 'Connexion EDOF/CPF', 'Conventions & documents', 'Support email 24h']
  },
  {
    id: 'pro', nom: 'Pro', prix_mensuel: 129, prix_annuel: 1068, popular: true,
    color: 'violet', stripe_monthly: 'STRIPE_PRICE_PRO_MONTHLY', stripe_annual: 'STRIPE_PRICE_PRO_ANNUAL',
    features: ['10 utilisateurs admins', 'LMS complet + classes virtuelles', 'CRM & pipeline commercial', 'Qualiopi — 7 critères complets', 'Questionnaires satisfaction IA', 'App mobile apprenants', 'IA assistante basique', 'Support prioritaire 4h']
  },
  {
    id: 'business', nom: 'Business', prix_mensuel: 299, prix_annuel: 2508,
    color: 'amber', stripe_monthly: 'STRIPE_PRICE_BUSINESS_MONTHLY', stripe_annual: 'STRIPE_PRICE_BUSINESS_ANNUAL',
    features: ['Utilisateurs illimités', 'Multi-centres', 'IA complète (génération programmes)', 'Marketplace formateurs', 'API publique + webhooks', 'Export comptable avancé', 'Marque personnalisée', 'Support dédié 1h + CSM']
  },
]

const colorConfig: Record<string, { border: string; bg: string; text: string }> = {
  blue: { border: 'rgba(59,130,246,.4)', bg: 'rgba(59,130,246,.08)', text: '#93c5fd' },
  violet: { border: 'rgba(139,92,246,.4)', bg: 'rgba(139,92,246,.08)', text: '#c4b5fd' },
  amber: { border: 'rgba(245,158,11,.4)', bg: 'rgba(245,158,11,.08)', text: '#fcd34d' },
}

interface AbonnementsProps {
  currentPlan?: string
  organismeId?: string
  stripeCustomerId?: string
}

export default function Abonnements({ currentPlan = 'trial', organismeId, stripeCustomerId }: AbonnementsProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')
  const [loading, setLoading] = useState<string | null>(null)
  const [virementMode, setVirementMode] = useState<string | null>(null)

  const handleStripeCheckout = async (planId: string) => {
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billing, organismeId, stripeCustomerId })
      })
      const { sessionId, error } = await res.json()
      if (error) { alert(error); setLoading(null); return }
      const stripe = await stripePromise
      await stripe?.redirectToCheckout({ sessionId })
    } catch (e) {
      alert('Erreur lors de la redirection vers le paiement')
    }
    setLoading(null)
  }

  const handleVirement = async (planId: string) => {
    setVirementMode(planId)
  }

  return (
    <div className="p-6 max-w-[1200px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">Abonnements</h1>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          Choisissez le plan adapté à votre organisme · <strong className="text-emerald-400">∞ Participants illimités</strong> sur tous les plans
        </p>
      </div>

      {/* Plan actuel */}
      {currentPlan === 'trial' && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border" style={{ background: 'rgba(245,158,11,.06)', borderColor: 'rgba(245,158,11,.3)' }}>
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-amber-300">Essai gratuit en cours</span>
            <span className="text-xs ml-2" style={{ color: 'var(--text3)' }}>— 14 jours restants · Passez à un plan payant pour continuer après l'essai</span>
          </div>
        </div>
      )}

      {/* Toggle mensuel/annuel */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className="text-sm" style={{ color: billing === 'monthly' ? 'var(--text)' : 'var(--text3)' }}>Mensuel</span>
        <button
          onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
          className="relative w-12 h-6 rounded-full transition-colors"
          style={{ background: billing === 'annual' ? '#2563eb' : 'var(--border2)' }}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${billing === 'annual' ? 'left-6' : 'left-0.5'}`} />
        </button>
        <span className="text-sm" style={{ color: billing === 'annual' ? 'var(--text)' : 'var(--text3)' }}>
          Annuel
          <span className="ml-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            -33%
          </span>
        </span>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {PLANS.map(plan => {
          const isActive = currentPlan === plan.id
          const prix = billing === 'annual' ? Math.round(plan.prix_annuel / 12) : plan.prix_mensuel
          const cc = colorConfig[plan.color]
          return (
            <div
              key={plan.id}
              className="rounded-2xl p-5 transition-all relative"
              style={{
                background: plan.popular ? cc.bg : 'var(--bg3)',
                border: `${plan.popular ? 2 : 1}px solid ${plan.popular ? cc.border : 'var(--border)'}`,
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white px-3 py-1 rounded-full" style={{ background: '#7c3aed' }}>
                  ⚡ PLUS POPULAIRE
                </div>
              )}
              {isActive && (
                <div className="absolute -top-3 right-4 text-[10px] font-bold text-white px-3 py-1 rounded-full bg-emerald-600">
                  ✓ PLAN ACTUEL
                </div>
              )}

              <div className="mb-4">
                <div className="font-display text-base font-semibold text-white mb-1">{plan.nom}</div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-white">{prix}€</span>
                  <span className="text-xs" style={{ color: 'var(--text3)' }}>/mois</span>
                </div>
                {billing === 'annual' && (
                  <div className="text-xs text-emerald-400 mt-0.5">
                    Facturé {plan.prix_annuel}€/an · Économie {(plan.prix_mensuel * 12 - plan.prix_annuel)}€
                  </div>
                )}
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text2)' }}>
                    <CheckCircle size={11} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA Stripe */}
              <button
                onClick={() => handleStripeCheckout(plan.id)}
                disabled={!!loading || isActive}
                className="w-full btn justify-center mb-2"
                style={{
                  background: isActive ? 'rgba(16,185,129,.1)' : plan.popular ? '#7c3aed' : '#2563eb',
                  color: isActive ? '#6ee7b7' : '#fff',
                  border: isActive ? '1px solid rgba(16,185,129,.3)' : 'none',
                  opacity: loading === plan.id ? 0.7 : 1
                }}
              >
                {loading === plan.id ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redirection…
                  </span>
                ) : isActive ? (
                  '✓ Plan actuel'
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard size={14} /> Payer par carte
                  </span>
                )}
              </button>

              {/* CTA Virement */}
              {!isActive && (
                <button
                  onClick={() => handleVirement(plan.id)}
                  className="w-full btn btn-secondary justify-center text-xs"
                >
                  <FileText size={12} /> Payer par virement
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Modale virement */}
      {virementMode && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,.7)' }}
          onClick={e => e.target === e.currentTarget && setVirementMode(null)}>
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-white">Paiement par virement</h3>
              <button onClick={() => setVirementMode(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
            <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="text-xs space-y-2" style={{ color: 'var(--text2)' }}>
                <div className="flex justify-between"><span>Bénéficiaire :</span><strong className="text-white">ANZPilot SAS</strong></div>
                <div className="flex justify-between"><span>IBAN :</span><strong className="text-white font-mono">FR76 3000 4028 3700 0123 4567 890</strong></div>
                <div className="flex justify-between"><span>BIC :</span><strong className="text-white">BNPAFRPP</strong></div>
                <div className="flex justify-between"><span>Référence :</span><strong className="text-white font-mono">{`FA-${organismeId?.slice(0,8).toUpperCase() || 'XXXXX'}`}</strong></div>
              </div>
            </div>
            <div className="text-xs mb-4 p-3 rounded-lg" style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.2)', color: '#93c5fd' }}>
              ℹ Indiquez obligatoirement la référence en motif du virement. Votre compte sera activé sous 24-48h après réception.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setVirementMode(null)} className="btn btn-secondary flex-1 justify-center">Fermer</button>
              <button
                onClick={async () => {
                  await fetch('/api/stripe/request-invoice', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ planId: virementMode, billing, organismeId }) })
                  alert('Devis envoyé par email !')
                  setVirementMode(null)
                }}
                className="btn btn-primary flex-1 justify-center"
              >
                <FileText size={13} /> Recevoir la facture proforma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entreprise */}
      <div className="card flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.2)' }}>🏢</div>
        <div className="flex-1">
          <div className="font-semibold text-white">Formule Entreprise</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>Infrastructure dédiée · SSO/LDAP · Marque blanche · SLA contractuel · Développements spécifiques</div>
        </div>
        <a href="mailto:contact@anzpilot.fr?subject=Formule Entreprise" className="btn btn-primary flex-shrink-0">
          Nous contacter <ArrowRight size={14} />
        </a>
      </div>

      {/* Garanties */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { icon: Shield, label: 'RGPD', desc: 'Données hébergées en France · Chiffrement SSL' },
          { icon: Zap, label: '99.9% uptime', desc: 'SLA garanti · Sauvegardes quotidiennes' },
          { icon: Users, label: 'Support humain', desc: 'Réponse humaine · Pas de bot' },
        ].map(g => (
          <div key={g.label} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <g.icon size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-white">{g.label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{g.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
