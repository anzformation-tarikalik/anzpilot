import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AdminShell, { useAdminAuth } from '../../components/admin/AdminShell'
import { Button, Card, Badge, Input, Modal, KpiCard, Tabs, EmptyState, tokens } from '../../components/admin/AdminUI'

const STATUTS_META: any = {
  essai: { label:'Essai', color:tokens.warning, icon:'⏳' },
  actif: { label:'Actif', color:tokens.success, icon:'✅' },
  bloque: { label:'Bloqué', color:tokens.danger, icon:'🔴' },
  annule: { label:'Annulé', color:tokens.textDim, icon:'⚪' },
}

export default function AdminDashboard() {
  const router = useRouter()
  const { auth } = useAdminAuth()

  // Section active (depuis URL ?section=xxx)
  const querySection = (router.query.section as string) || 'dashboard'
  const [section, setSection] = useState(querySection)
  useEffect(() => {
    // Si quelqu'un arrive avec ?section=organismes (ancien lien) → redirect vers la nouvelle page
    if (querySection === 'organismes') {
      router.replace('/admin/organismes')
      return
    }
    setSection(querySection)
  }, [querySection, router])

  // ── Données dashboard ──
  const [stats, setStats] = useState<any>(null)
  const [recentSignups, setRecentSignups] = useState<any[]>([])
  const [loadingDash, setLoadingDash] = useState(true)

  // ── Config ──
  const [config, setConfig] = useState<Record<string,string>>({})
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)

  useEffect(() => {
    if (!auth) return
    fetch('/api/admin/dashboard-stats').then(r=>r.json()).then(d=>{
      setStats(d.stats); setRecentSignups(d.recentSignups||[]); setLoadingDash(false)
    }).catch(()=>setLoadingDash(false))
  }, [auth])

  useEffect(() => {
    if (!auth || section !== 'config') return
    setLoadingConfig(true)
    fetch('/api/admin/config').then(r=>r.json()).then(d=>{
      const obj: Record<string,string> = {}
      if (Array.isArray(d.config)) d.config.forEach((c:any) => { obj[c.cle] = c.valeur })
      else if (d.config && typeof d.config === 'object') Object.assign(obj, d.config)
      setConfig(obj); setLoadingConfig(false)
    }).catch(()=>setLoadingConfig(false))
  }, [auth, section])

  if (!auth) return null

  async function saveConfig() {
    setConfigSaving(true)
    try {
      const res = await fetch('/api/admin/config', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ config })
      })
      const d = await res.json()
      if (d.success) alert('✅ Configuration enregistrée')
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
    setConfigSaving(false)
  }

  const updateConfig = (k:string, v:string) => setConfig(p => ({...p, [k]: v}))

  const sectionTitles: any = {
    dashboard: 'Dashboard',
    config: 'Paramètres',
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

        {/* ═══════════════ DASHBOARD ═══════════════ */}
        {section === 'dashboard' && (
          <>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>📊 Vue d'ensemble</h1>
              <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>L'activité d'ANZPilot en un coup d'œil</p>
            </div>

            {/* KPIs principaux */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:24 }}>
              <KpiCard label="Organismes inscrits" value={stats?.totalOf ?? '—'} icon="🏢" color={tokens.primary} loading={loadingDash}/>
              <KpiCard label="Essais en cours" value={stats?.ofEssai ?? '—'} icon="⏳" color={tokens.warning} loading={loadingDash}/>
              <KpiCard label="Clients actifs" value={stats?.ofActif ?? '—'} icon="✅" color={tokens.success} loading={loadingDash}/>
              <KpiCard label="Expirent < 7j" value={stats?.expireBientot ?? '—'} icon="⚠️" color={tokens.purple} loading={loadingDash}/>
            </div>

            {/* Activité métier */}
            <h2 style={{ fontFamily:tokens.fontDisplay, fontSize:15, fontWeight:700, color:tokens.text, margin:'0 0 12px' }}>📦 Activité métier (tous OF confondus)</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
              <KpiCard label="Conventions" value={stats?.totalConventions ?? '—'} icon="📄" color={tokens.primary} loading={loadingDash}/>
              <KpiCard label="Factures" value={stats?.totalFactures ?? '—'} icon="💳" color={tokens.success} loading={loadingDash}/>
              <KpiCard label="Modèles catalogue" value={stats?.totalCatalogue ?? '—'} icon="📚" color={tokens.purple} loading={loadingDash}/>
              <KpiCard label="Indicateurs Qualiopi" value={stats?.totalQualiopi ?? '—'} icon="🛡️" color={tokens.warning} loading={loadingDash}/>
            </div>

            {/* Activité récente + Services */}
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

        {/* ═══════════════ CONFIG ═══════════════ */}
        {section === 'config' && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:14 }}>
              <div>
                <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>⚙️ Paramètres</h1>
                <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Configuration de la plateforme ANZPilot</p>
              </div>
              <Button variant="success" onClick={saveConfig} disabled={configSaving} icon="💾">{configSaving?'Enregistrement...':'Enregistrer'}</Button>
            </div>

            {loadingConfig ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div> : (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <Card title="🏷️ Identité plateforme">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <Input label="Nom" value={config.nom_plateforme||''} onChange={v=>updateConfig('nom_plateforme', v)} placeholder="ANZPilot"/>
                    <Input label="Email contact" type="email" value={config.email_contact||''} onChange={v=>updateConfig('email_contact', v)} placeholder="contact@anzpilot.com"/>
                  </div>
                  <div style={{ marginTop:14 }}>
                    <Input label="Slogan" value={config.slogan||''} onChange={v=>updateConfig('slogan', v)} placeholder="Pilotez votre organisme de formation"/>
                  </div>
                </Card>

                <Card title="🎨 Couleurs du thème">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                    {[['Couleur principale','couleur_principale','#0ea5e9'],['Couleur secondaire','couleur_secondaire','#2563eb'],['Couleur accent','couleur_accent','#10b981']].map(([label,key,def]:any)=>(
                      <div key={key}>
                        <label style={{ display:'block', fontSize:11, fontWeight:600, color:tokens.textMuted, marginBottom:5, textTransform:'uppercase' }}>{label}</label>
                        <div style={{ display:'flex', gap:8 }}>
                          <input type="color" value={config[key]||def} onChange={e=>updateConfig(key, e.target.value)} style={{ width:50, height:42, border:`1px solid ${tokens.border}`, borderRadius:8, background:tokens.bg, cursor:'pointer' }}/>
                          <input value={config[key]||def} onChange={e=>updateConfig(key, e.target.value)} style={{ flex:1, background:tokens.bg, border:`1px solid ${tokens.border}`, borderRadius:8, padding:'10px 12px', fontSize:13, color:tokens.text, fontFamily:tokens.fontSans, outline:'none' }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="💰 Tarifs des plans (en €/mois)">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:14 }}>
                    <Input label="Plan Starter" type="number" value={config.prix_starter||''} onChange={v=>updateConfig('prix_starter', v)} placeholder="49"/>
                    <Input label="Plan Pro" type="number" value={config.prix_pro||''} onChange={v=>updateConfig('prix_pro', v)} placeholder="99"/>
                    <Input label="Plan Enterprise" type="number" value={config.prix_enterprise||''} onChange={v=>updateConfig('prix_enterprise', v)} placeholder="299"/>
                    <Input label="Durée essai (j)" type="number" value={config.duree_essai||'30'} onChange={v=>updateConfig('duree_essai', v)}/>
                  </div>
                </Card>

                <Card title="💬 Messages plateforme">
                  <Input label="Message d'accueil" value={config.message_accueil||''} onChange={v=>updateConfig('message_accueil', v)} rows={2}/>
                  <div style={{ marginTop:14 }}>
                    <Input label="Bandeau info (haut de page)" value={config.bandeau_info||''} onChange={v=>updateConfig('bandeau_info', v)} placeholder="🎉 Essai gratuit 14 jours !"/>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}

        {/* ═══════════════ COMING SOON sections ═══════════════ */}
        {!['dashboard','config'].includes(section) && (
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
