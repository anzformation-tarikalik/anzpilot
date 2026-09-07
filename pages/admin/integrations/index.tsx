import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminShell, { useAdminAuth } from '../../../components/admin/AdminShell'
import { Button, Card, Badge, Modal, EmptyState, tokens } from '../../../components/admin/AdminUI'

const INTEGRATIONS = [
  {
    slug:'resend', name:'Resend', icon:'📧', category:'Email',
    description:'Service d\'envoi d\'emails transactionnels et marketing pour ANZPilot.',
    website:'https://resend.com',
    features:['Envoi transactionnel', 'Domaines vérifiés', 'Webhooks', 'Analytics'],
    env_vars:['RESEND_API_KEY', 'EMAIL_FROM'],
    status_slug: 'resend',
  },
  {
    slug:'supabase', name:'Supabase', icon:'🗄️', category:'Database',
    description:'Base de données PostgreSQL managée avec Auth, Storage et Edge Functions.',
    website:'https://supabase.com',
    features:['PostgreSQL', 'Auth', 'Storage', 'Realtime'],
    env_vars:['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    status_slug: 'supabase',
  },
  {
    slug:'vercel', name:'Vercel', icon:'▲', category:'Hosting',
    description:'Plateforme de déploiement et hébergement de l\'application ANZPilot.',
    website:'https://vercel.com',
    features:['Déploiement auto', 'CDN mondial', 'Serverless', 'Analytics'],
    env_vars:[],
    status_slug: 'vercel',
  },
  {
    slug:'jitsi', name:'Jitsi Meet', icon:'🎥', category:'Visio',
    description:'Solution de visioconférence open source intégrée dans ANZPilot Visio.',
    website:'https://meet.jit.si',
    features:['Chiffrement E2E', 'Illimité', 'Sans compte', 'Embed'],
    env_vars:[],
    status_slug: 'jitsi',
  },
  {
    slug:'stripe', name:'Stripe', icon:'💳', category:'Paiement',
    description:'Solution de paiement pour les abonnements SaaS (à activer en Sprint 5B).',
    website:'https://stripe.com',
    features:['Checkout', 'Subscriptions', 'Customer Portal', 'Webhooks'],
    env_vars:['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLIC_KEY'],
    status_slug: null,
    disabled: true,
  },
]

const STATUS_META: any = {
  up: { label:'Connecté', color:tokens.success, icon:'✅' },
  degraded: { label:'Dégradé', color:tokens.warning, icon:'⚠️' },
  down: { label:'En panne', color:tokens.danger, icon:'❌' },
  unknown: { label:'Non configuré', color:tokens.textDim, icon:'○' },
}

export default function IntegrationsPage() {
  const { auth } = useAdminAuth()
  const [statuses, setStatuses] = useState<any>({})
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    if (!auth) return
    fetch('/api/admin/monitoring').then(r=>r.json()).then(d=>{
      const map:any = {}
      ;(d.services||[]).forEach((s:any) => { map[s.slug] = s })
      setStatuses(map)
    }).catch(()=>{})
  }, [auth])

  if (!auth) return null

  return (
    <>
      <Head><title>Intégrations — Admin ANZPilot</title></Head>
      <AdminShell activeSection="integrations" breadcrumb={[{ label:'Intégrations' }]}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>🔌 Intégrations</h1>
          <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Services tiers connectés à ANZPilot</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:14 }}>
          {INTEGRATIONS.map(int => {
            const svc = int.status_slug ? statuses[int.status_slug] : null
            const status = int.disabled ? 'unknown' : (svc?.status || 'unknown')
            const meta = STATUS_META[status]
            return (
              <Card key={int.slug} padding={20} style={{ opacity: int.disabled ? 0.6 : 1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:12 }}>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{ width:42, height:42, borderRadius:10, background:tokens.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, border:`1px solid ${tokens.border}` }}>{int.icon}</div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:tokens.text }}>{int.name}</div>
                      <div style={{ fontSize:10, color:tokens.textDim, textTransform:'uppercase', marginTop:2 }}>{int.category}</div>
                    </div>
                  </div>
                  <Badge color={meta.color} icon={meta.icon}>{int.disabled ? 'Bientôt' : meta.label}</Badge>
                </div>
                <p style={{ fontSize:12, color:tokens.textMuted, margin:'8px 0 14px', lineHeight:1.5, minHeight:36 }}>{int.description}</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
                  {int.features.slice(0,4).map(f => <span key={f} style={{ fontSize:10, padding:'3px 8px', borderRadius:10, background:tokens.bg, color:tokens.textMuted, border:`1px solid ${tokens.border}` }}>{f}</span>)}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <Button size="sm" variant="secondary" onClick={()=>setSelected(int)}>ℹ️ Détails</Button>
                  <a href={int.website} target="_blank" rel="noopener" style={{ padding:'6px 12px', borderRadius:9, background:tokens.surface, color:tokens.textMuted, border:`1px solid ${tokens.border}`, fontSize:12, fontWeight:600, textDecoration:'none' }}>↗️ Site officiel</a>
                </div>
              </Card>
            )
          })}
        </div>

        <Modal open={!!selected} onClose={()=>setSelected(null)} title={`${selected?.icon || ''} ${selected?.name || ''}`} subtitle={selected?.description} maxWidth={520}
          footer={<Button variant="primary" fullWidth onClick={()=>setSelected(null)}>Fermer</Button>}>
          {selected && <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:tokens.textMuted, textTransform:'uppercase', marginBottom:8 }}>Fonctionnalités</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {selected.features.map((f:string) => <span key={f} style={{ fontSize:11, padding:'4px 10px', borderRadius:10, background:tokens.bg, color:tokens.text, border:`1px solid ${tokens.border}` }}>{f}</span>)}
              </div>
            </div>
            {selected.env_vars.length > 0 && <div>
              <div style={{ fontSize:11, fontWeight:600, color:tokens.textMuted, textTransform:'uppercase', marginBottom:8 }}>Variables d'environnement</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {selected.env_vars.map((v:string) => <code key={v} style={{ fontSize:11, padding:'8px 12px', borderRadius:8, background:tokens.bg, color:tokens.primary, fontFamily:'monospace', border:`1px solid ${tokens.border}` }}>{v}</code>)}
              </div>
              <div style={{ fontSize:11, color:tokens.textDim, marginTop:8 }}>À configurer dans les variables d'environnement Vercel</div>
            </div>}
            <a href={selected.website} target="_blank" rel="noopener" style={{ padding:'10px 14px', borderRadius:9, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:600, textAlign:'center' }}>↗️ Aller sur {selected.name}</a>
          </div>}
        </Modal>
      </AdminShell>
    </>
  )
}

