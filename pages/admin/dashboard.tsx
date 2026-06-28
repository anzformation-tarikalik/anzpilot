import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AdminShell, { useAdminAuth } from '../../components/admin/AdminShell'
import { Button, Card, Badge, KpiCard, EmptyState, tokens } from '../../components/admin/AdminUI'

const STATUTS_META: any = {
  essai: { label:'Essai', color:tokens.warning, icon:'⏳' },
  actif: { label:'Actif', color:tokens.success, icon:'✅' },
  bloque: { label:'Bloqué', color:tokens.danger, icon:'🔴' },
  annule: { label:'Annulé', color:tokens.textDim, icon:'⚪' },
}

export default function AdminDashboard() {
  const router = useRouter()
  const { auth } = useAdminAuth()

  const querySection = (router.query.section as string) || 'dashboard'
  const [section, setSection] = useState(querySection)
  useEffect(() => {
    // Redirects anciens liens
    if (querySection === 'organismes') { router.replace('/admin/organismes'); return }
    if (querySection === 'config') { router.replace('/admin/config'); return }
    setSection(querySection)
  }, [querySection, router])

  const [stats, setStats] = useState<any>(null)
  const [recentSignups, setRecentSignups] = useState<any[]>([])
  const [loadingDash, setLoadingDash] = useState(true)

  useEffect(() => {
    if (!auth) return
    fetch('/api/admin/dashboard-stats').then(r=>r.json()).then(d=>{
      setStats(d.stats); setRecentSignups(d.recentSignups||[]); setLoadingDash(false)
    }).catch(()=>setLoadingDash(false))
  }, [auth])

  if (!auth) return null

  const sectionTitles: any = {
    dashboard: 'Dashboard',
    abonnements: 'Abonnements',
    support: 'Support',
    analytics: 'Analytics',
    monitoring: 'Monitoring',
    communications: 'Communications',
    integrations: 'Intégrations',
    equipe: 'Équipe admin',
    audit: 'Audit & logs',
  }

  return (
    <>
      <Head><title>{sectionTitles[section] || 'Admin'} — ANZPilot</title></Head>
      <AdminShell activeSection={section} breadcrumb={[{ label: sectionTitles[section] || section }]}>

        {section === 'dashboard' && (
          <>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>📊 Vue d'ensemble</h1>
              <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>L'activité d'ANZPilot en un coup d'œil</p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:24 }}>
              <KpiCard label="Organismes inscrits" value={stats?.totalOf ?? '—'} icon="🏢" color={tokens.primary} loading={loadingDash}/>
              <KpiCard label="Essais en cours" value={stats?.ofEssai ?? '—'} icon="⏳" color={tokens.warning} loading={loadingDash}/>
              <KpiCard label="Clients actifs" value={stats?.ofActif ?? '—'} icon="✅" color={tokens.success} loading={loadingDash}/>
              <KpiCard label="Expirent < 7j" value={stats?.expireBientot ?? '—'} icon="⚠️" color={tokens.purple} loading={loadingDash}/>
            </div>

            <h2 style={{ fontFamily:tokens.fontDisplay, fontSize:15, fontWeight:700, color:tokens.text, margin:'0 0 12px' }}>📦 Activité métier (tous OF confondus)</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
              <KpiCard label="Conventions" value={stats?.totalConventions ?? '—'} icon="📄" color={tokens.primary} loading={loadingDash}/>
              <KpiCard label="Factures" value={stats?.totalFactures ?? '—'} icon="💳" color={tokens.success} loading={loadingDash}/>
              <KpiCard label="Modèles catalogue" value={stats?.totalCatalogue ?? '—'} icon="📚" color={tokens.purple} loading={loadingDash}/>
              <KpiCard label="Indicateurs Qualiopi" value={stats?.totalQualiopi ?? '—'} icon="🛡️" color={tokens.warning} loading={loadingDash}/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
              <Card
                title="📋 Derniers organismes inscrits"
                subtitle="Les 5 derniers comptes créés"
                actions={<Link href="/admin/organismes"><Button size="sm" variant="secondary">Voir tous →</Button></Link>}
              >
                {loadingDash ? <div style={{ padding:14, color:tokens.textDim, fontSize:13 }}>⏳ Chargement...</div>
                : recentSignups.length === 0 ? <div style={{ padding:14, color:tokens.textDim, fontSize:13 }}>Aucun organisme pour l'instant</div>
                : <div>{recentSignups.map((o:any, i:number) => {
                  const s = STATUTS_META[o.statut] || STATUTS_META.essai
                  return (
                    <Link key={o.id} href={`/admin/organismes/${o.id}`} style={{ textDecoration:'none', color:'inherit' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderTop: i>0 ? `1px solid ${tokens.border}`:'none', cursor:'pointer' }}>
                        <div style={{ width:34, height:34, borderRadius:8, background:s.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{s.icon}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:tokens.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.nom || o.email}</div>
                          <div style={{ fontSize:11, color:tokens.textDim, marginTop:2 }}>{new Date(o.date_inscription).toLocaleDateString('fr-FR')}</div>
                        </div>
                        <Badge color={s.color}>{s.label}</Badge>
                      </div>
                    </Link>
                  )
                })}</div>}
              </Card>

              <Card title="🩺 Services">
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    ['Supabase', 'Online', tokens.success],
                    ['Resend', 'Domain verified', tokens.success],
                    ['Vercel', 'Healthy', tokens.success],
                    ['ANZPilot Visio', 'Online', tokens.success],
                  ].map(([name, status, col]:any) => (
                    <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:tokens.bg, borderRadius:8 }}>
                      <span style={{ fontSize:12, color:tokens.text }}>{name}</span>
                      <span style={{ fontSize:11, color:col, fontWeight:600 }}>● {status}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {section !== 'dashboard' && (
          <>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>{sectionTitles[section]}</h1>
              <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Cette section sera disponible prochainement</p>
            </div>
            <EmptyState icon="🚧" title="Section en construction" description={`${sectionTitles[section]} arrive dans un prochain sprint.`}/>
          </>
        )}

      </AdminShell>
    </>
  )
}
