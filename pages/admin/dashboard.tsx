import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import AdminShell, { useAdminAuth } from '../../components/admin/AdminShell'
import { Button, Card, Badge, Input, Modal, KpiCard, Tabs, EmptyState, tokens } from '../../components/admin/AdminUI'

interface Organisme {
  id: string
  email: string
  nom: string
  siret: string
  statut: string
  plan: string
  date_inscription: string
  date_fin_essai: string
  joursRestants: number | null
  notes_admin: string
}

const STATUTS_META: any = {
  essai: { label:'Essai', color:tokens.warning, icon:'⏳' },
  actif: { label:'Actif', color:tokens.success, icon:'✅' },
  bloque: { label:'Bloqué', color:tokens.danger, icon:'🔴' },
  annule: { label:'Annulé', color:tokens.textDim, icon:'⚪' },
}
const PLANS_META: any = {
  essai: { label:'Essai', color:tokens.textDim },
  starter: { label:'Starter', color:tokens.primary },
  pro: { label:'Pro', color:tokens.purple },
  enterprise: { label:'Enterprise', color:tokens.warning },
}

export default function AdminDashboard() {
  const router = useRouter()
  const { auth } = useAdminAuth()

  // Section active (depuis URL ?section=xxx)
  const querySection = (router.query.section as string) || 'dashboard'
  const [section, setSection] = useState(querySection)
  useEffect(() => { setSection(querySection) }, [querySection])
  const navigate = (s: string) => router.push(`/admin/dashboard${s==='dashboard'?'':`?section=${s}`}`, undefined, { shallow: true })

  // ── Données dashboard ──
  const [stats, setStats] = useState<any>(null)
  const [recentSignups, setRecentSignups] = useState<any[]>([])
  const [loadingDash, setLoadingDash] = useState(true)

  // ── Organismes ──
  const [organismes, setOrganismes] = useState<Organisme[]>([])
  const [loadingOrg, setLoadingOrg] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<Organisme | null>(null)
  const [saving, setSaving] = useState(false)

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
    if (!auth || section !== 'organismes') return
    setLoadingOrg(true)
    fetch('/api/admin-saas/list-organismes').then(r=>r.json()).then(d=>{
      setOrganismes(d.organismes||[]); setLoadingOrg(false)
    }).catch(()=>setLoadingOrg(false))
  }, [auth, section])

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

  async function saveOrganisme() {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin-saas/update-statut', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id: editing.id, statut: editing.statut, plan: editing.plan, notes_admin: editing.notes_admin })
      })
      const d = await res.json()
      if (d.success) {
        setEditing(null)
        const r = await fetch('/api/admin-saas/list-organismes'); const dd = await r.json()
        setOrganismes(dd.organismes||[])
      } else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
    setSaving(false)
  }

  async function prolonger(id: string, jours: number) {
    if (!confirm(`Prolonger l'essai de ${jours} jours ?`)) return
    try {
      const res = await fetch('/api/admin-saas/update-statut', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id, prolongation_jours: jours })
      })
      const d = await res.json()
      if (d.success) {
        const r = await fetch('/api/admin-saas/list-organismes'); const dd = await r.json()
        setOrganismes(dd.organismes||[])
      } else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
  }

  const filteredOrgs = filter==='all' ? organismes : organismes.filter(o => o.statut===filter)
  const orgCounts = {
    all: organismes.length,
    essai: organismes.filter(o => o.statut==='essai').length,
    actif: organismes.filter(o => o.statut==='actif').length,
    bloque: organismes.filter(o => o.statut==='bloque').length,
  }
  const updateConfig = (k:string, v:string) => setConfig(p => ({...p, [k]: v}))

  // ═══════════════ RENDU ═══════════════
  const sectionTitles: any = {
    dashboard: 'Dashboard',
    organismes: 'Organismes',
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
            <div style={{ marginBottom: 8 }}>
              <h2 style={{ fontFamily:tokens.fontDisplay, fontSize:15, fontWeight:700, color:tokens.text, margin:'0 0 12px' }}>📦 Activité métier (tous OF confondus)</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
              <KpiCard label="Conventions" value={stats?.totalConventions ?? '—'} icon="📄" color={tokens.primary} loading={loadingDash}/>
              <KpiCard label="Factures" value={stats?.totalFactures ?? '—'} icon="💳" color={tokens.success} loading={loadingDash}/>
              <KpiCard label="Modèles catalogue" value={stats?.totalCatalogue ?? '—'} icon="📚" color={tokens.purple} loading={loadingDash}/>
              <KpiCard label="Indicateurs Qualiopi" value={stats?.totalQualiopi ?? '—'} icon="🛡️" color={tokens.warning} loading={loadingDash}/>
            </div>

            {/* Activité récente + Services */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
              <Card title="📋 Derniers organismes inscrits" subtitle="Les 5 derniers comptes créés">
                {loadingDash ? <div style={{ padding:14, color:tokens.textDim, fontSize:13 }}>⏳ Chargement...</div>
                : recentSignups.length === 0 ? <div style={{ padding:14, color:tokens.textDim, fontSize:13 }}>Aucun organisme pour l'instant</div>
                : <div>{recentSignups.map((o:any, i:number) => {
                  const s = STATUTS_META[o.statut] || STATUTS_META.essai
                  return (
                    <div key={o.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderTop: i>0 ? `1px solid ${tokens.border}`:'none' }}>
                      <div style={{ width:34, height:34, borderRadius:8, background:s.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{s.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:tokens.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.nom || o.email}</div>
                        <div style={{ fontSize:11, color:tokens.textDim, marginTop:2 }}>{new Date(o.date_inscription).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <Badge color={s.color}>{s.label}</Badge>
                    </div>
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

        {/* ═══════════════ ORGANISMES ═══════════════ */}
        {section === 'organismes' && (
          <>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>🏢 Organismes</h1>
              <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Gérez tous les organismes de formation inscrits</p>
            </div>

            <Tabs
              tabs={[
                { id:'all', label:'Tous', count: orgCounts.all },
                { id:'essai', label:'Essai', icon:'⏳', count: orgCounts.essai },
                { id:'actif', label:'Actifs', icon:'✅', count: orgCounts.actif },
                { id:'bloque', label:'Bloqués', icon:'🔴', count: orgCounts.bloque },
              ]}
              active={filter}
              onChange={setFilter}
            />

            {loadingOrg ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div>
            : filteredOrgs.length === 0 ? <EmptyState icon="🏢" title="Aucun organisme" description="Aucun organisme dans cette catégorie"/>
            : (
              <Card padding={0}>
                {filteredOrgs.map((o,i) => {
                  const s = STATUTS_META[o.statut] || STATUTS_META.essai
                  const p = PLANS_META[o.plan] || PLANS_META.essai
                  return (
                    <div key={o.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto auto', gap:14, padding:14, borderBottom: i<filteredOrgs.length-1 ? `1px solid ${tokens.border}`:'none', alignItems:'center' }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:tokens.text }}>{o.nom || '(non renseigné)'}</div>
                        <div style={{ fontSize:11, color:tokens.textDim, marginTop:2 }}>📧 {o.email}</div>
                      </div>
                      <div style={{ fontSize:11, color:tokens.textMuted }}>{new Date(o.date_inscription).toLocaleDateString('fr-FR')}</div>
                      <Badge color={s.color} icon={s.icon}>{s.label}</Badge>
                      <Badge color={p.color}>{p.label}</Badge>
                      <div style={{ fontSize:11, color: o.joursRestants !== null && o.joursRestants <= 3 ? tokens.danger : o.joursRestants !== null && o.joursRestants <= 7 ? tokens.warning : tokens.textMuted, fontWeight:600 }}>
                        {o.statut==='essai' && o.joursRestants !== null ? (o.joursRestants > 0 ? `J-${o.joursRestants}` : 'Expiré') : '—'}
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        {o.statut==='essai' && <Button size="sm" variant="secondary" onClick={()=>prolonger(o.id, 30)}>+30j</Button>}
                        <Button size="sm" variant="secondary" onClick={()=>setEditing(o)}>✏️</Button>
                      </div>
                    </div>
                  )
                })}
              </Card>
            )}
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
        {!['dashboard','organismes','config'].includes(section) && (
          <>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>{sectionTitles[section]}</h1>
              <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Cette section sera disponible prochainement</p>
            </div>
            <EmptyState icon="🚧" title="Section en construction" description={`${sectionTitles[section]} arrive dans un prochain sprint.`}/>
          </>
        )}

        {/* ═══ Modal édition organisme ═══ */}
        <Modal
          open={editing !== null}
          onClose={()=>setEditing(null)}
          title={`✏️ ${editing?.nom || editing?.email || ''}`}
          subtitle={editing?.email}
          footer={
            <>
              <Button variant="secondary" fullWidth onClick={()=>setEditing(null)}>Annuler</Button>
              <Button variant="success" fullWidth onClick={saveOrganisme} disabled={saving}>{saving?'⏳':'💾 Enregistrer'}</Button>
            </>
          }
        >
          {editing && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <Input label="Statut" value={editing.statut} onChange={v=>setEditing({...editing, statut:v})} options={[
                { value:'essai', label:'⏳ Essai gratuit' },
                { value:'actif', label:'✅ Actif (payant)' },
                { value:'bloque', label:'🔴 Bloqué' },
                { value:'annule', label:'⚪ Annulé' },
              ]}/>
              <Input label="Plan" value={editing.plan} onChange={v=>setEditing({...editing, plan:v})} options={[
                { value:'essai', label:'Essai' },
                { value:'starter', label:'Starter' },
                { value:'pro', label:'Pro' },
                { value:'enterprise', label:'Enterprise' },
              ]}/>
              <Input label="Notes admin" value={editing.notes_admin || ''} onChange={v=>setEditing({...editing, notes_admin:v})} rows={3} placeholder="Notes internes..."/>
            </div>
          )}
        </Modal>

      </AdminShell>
    </>
  )
}
