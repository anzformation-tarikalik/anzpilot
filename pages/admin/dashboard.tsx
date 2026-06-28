import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

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

const STATUTS: any = {
  essai: { label:'Essai', color:'#f59e0b', icon:'⏳' },
  actif: { label:'Actif', color:'#10b981', icon:'✅' },
  bloque: { label:'Bloqué', color:'#ef4444', icon:'🔴' },
  annule: { label:'Annulé', color:'#64748b', icon:'⚪' },
}
const PLANS: any = {
  essai: { label:'Essai', color:'#94a3b8' },
  starter: { label:'Starter', color:'#0ea5e9' },
  pro: { label:'Pro', color:'#8b5cf6' },
  enterprise: { label:'Enterprise', color:'#f59e0b' },
}

export default function AdminDashboard() {
  const router = useRouter()
  const [auth, setAuth] = useState(false)
  const [section, setSection] = useState<'organismes'|'config'|'stats'>('organismes')

  // Organismes state
  const [organismes, setOrganismes] = useState<Organisme[]>([])
  const [loadingOrg, setLoadingOrg] = useState(true)
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<Organisme | null>(null)
  const [saving, setSaving] = useState(false)

  // Config state
  const [config, setConfig] = useState<Record<string,string>>({})
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [configSaving, setConfigSaving] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('anzpilot_admin') !== 'ok') {
      router.push('/admin')
      return
    }
    setAuth(true)
    loadOrganismes()
    loadConfig()
  }, [router])

  function loadOrganismes() {
    setLoadingOrg(true)
    fetch('/api/admin-saas/list-organismes').then(r=>r.json()).then(d=>{
      setOrganismes(d.organismes||[]); setLoadingOrg(false)
    }).catch(()=>setLoadingOrg(false))
  }

  function loadConfig() {
    setLoadingConfig(true)
    fetch('/api/admin/config').then(r=>r.json()).then(d=>{
      const obj: Record<string,string> = {}
      if (Array.isArray(d.config)) d.config.forEach((c:any) => { obj[c.cle] = c.valeur })
      else if (d.config && typeof d.config === 'object') Object.assign(obj, d.config)
      setConfig(obj); setLoadingConfig(false)
    }).catch(()=>setLoadingConfig(false))
  }

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
      if (d.success) { setEditing(null); loadOrganismes() }
      else alert('Erreur: '+(d.error||''))
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
      if (d.success) loadOrganismes()
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
  }

  function logout() {
    sessionStorage.removeItem('anzpilot_admin')
    router.push('/admin')
  }

  if (!auth) return null

  const filtered = filter==='all' ? organismes : organismes.filter(o => o.statut===filter)
  const stats = {
    total: organismes.length,
    essai: organismes.filter(o => o.statut==='essai').length,
    actif: organismes.filter(o => o.statut==='actif').length,
    bloque: organismes.filter(o => o.statut==='bloque').length,
    expireBientot: organismes.filter(o => o.statut==='essai' && o.joursRestants !== null && o.joursRestants <= 7 && o.joursRestants > 0).length,
  }

  const updateConfig = (k:string, v:string) => setConfig(p => ({...p, [k]: v}))
  const inputStyle = { width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }
  const labelStyle = { display:'block' as const, fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' as const, letterSpacing:'.06em' }

  return (
    <>
      <Head><title>Administration ANZPilot</title></Head>
      <div style={{ display:'flex', minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui' }}>

        {/* Sidebar admin */}
        <aside style={{ width:240, flexShrink:0, background:'#0a1628', borderRight:'1px solid rgba(255,255,255,.06)', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh' }}>
          <div style={{ padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,#ef4444,#dc2626)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🔐</div>
            <div>
              <div style={{ fontFamily:'Sora,Georgia', fontSize:15, fontWeight:700, color:'#fff' }}>Admin Console</div>
              <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>ANZPilot Master</div>
            </div>
          </div>

          <nav style={{ flex:1, padding:'14px 8px' }}>
            {[
              ['organismes', '🏢', 'Organismes'],
              ['config', '⚙️', 'Configuration'],
              ['stats', '📊', 'Statistiques'],
            ].map(([id, icon, label]:any) => (
              <button key={id} onClick={()=>setSection(id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, color:section===id?'#0ea5e9':'#94a3b8', background:section===id?'rgba(14,165,233,.1)':'transparent', border:'none', fontSize:13, fontWeight:500, marginBottom:2, width:'100%', textAlign:'left', cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>
                <span style={{ fontSize:16, width:20 }}>{icon}</span><span>{label}</span>
              </button>
            ))}
          </nav>

          <div style={{ padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, color:'#64748b', textDecoration:'none', fontSize:13 }}>
              <span style={{ fontSize:16, width:20, textAlign:'center' }}>←</span>
              <span>Retour à ANZPilot</span>
            </Link>
            <button onClick={logout} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, border:'none', background:'transparent', color:'#ef4444', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,system-ui' }}>
              <span style={{ fontSize:14, width:20, textAlign:'center' }}>🚪</span><span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1, padding:24, overflowY:'auto' }}>
          <div style={{ maxWidth:1200, margin:'0 auto' }}>

            {/* === SECTION ORGANISMES === */}
            {section === 'organismes' && (
              <>
                <div style={{ marginBottom:24 }}>
                  <h1 style={{ fontFamily:'Sora,Georgia', fontSize:26, fontWeight:700, color:'#fff', margin:0 }}>🏢 Organismes inscrits</h1>
                  <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Gérez tous les organismes de formation utilisant ANZPilot</p>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
                  {[
                    ['🏢','Total OF',stats.total,'#0ea5e9'],
                    ['⏳','En essai',stats.essai,'#f59e0b'],
                    ['✅','Actifs',stats.actif,'#10b981'],
                    ['🔴','Bloqués',stats.bloque,'#ef4444'],
                    ['⚠️','Expirent <7j',stats.expireBientot,'#a855f7'],
                  ].map(([icon,label,val,color]:any)=>(
                    <div key={label} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18 }}>
                      <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
                      <div style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color }}>{val}</div>
                      <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                  {[['all','Tous'],['essai','⏳ Essai'],['actif','✅ Actifs'],['bloque','🔴 Bloqués']].map(([id,label]:any)=>(
                    <button key={id} onClick={()=>setFilter(id)} style={{ padding:'8px 14px', borderRadius:8, border:filter===id?'1px solid #0ea5e9':'1px solid rgba(255,255,255,.1)', background:filter===id?'rgba(14,165,233,.15)':'rgba(255,255,255,.04)', color:filter===id?'#0ea5e9':'#94a3b8', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>{label}</button>
                  ))}
                </div>

                {loadingOrg ? <div style={{ padding:48, textAlign:'center', color:'#64748b' }}>⏳ Chargement...</div>
                : filtered.length === 0 ? (
                  <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:48, textAlign:'center' }}>
                    <div style={{ fontSize:48, marginBottom:14 }}>🏢</div>
                    <div style={{ fontSize:14, color:'#64748b' }}>Aucun organisme dans cette catégorie</div>
                  </div>
                ) : (
                  <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, overflow:'hidden' }}>
                    {filtered.map((o,i) => {
                      const s = STATUTS[o.statut] || STATUTS.essai
                      const p = PLANS[o.plan] || PLANS.essai
                      return (
                        <div key={o.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto auto', gap:14, padding:14, borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,.05)':'none', alignItems:'center' }}>
                          <div>
                            <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{o.nom || '(non renseigné)'}</div>
                            <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>📧 {o.email}</div>
                          </div>
                          <div style={{ fontSize:11, color:'#94a3b8' }}>{new Date(o.date_inscription).toLocaleDateString('fr-FR')}</div>
                          <div style={{ padding:'4px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:s.color+'22', color:s.color }}>{s.icon} {s.label}</div>
                          <div style={{ padding:'4px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:p.color+'22', color:p.color }}>{p.label}</div>
                          <div style={{ fontSize:11, color: o.joursRestants !== null && o.joursRestants <= 3 ? '#ef4444' : o.joursRestants !== null && o.joursRestants <= 7 ? '#f59e0b' : '#94a3b8', fontWeight:600 }}>
                            {o.statut==='essai' && o.joursRestants !== null ? (o.joursRestants > 0 ? `J-${o.joursRestants}` : 'Expiré') : '—'}
                          </div>
                          <div style={{ display:'flex', gap:6 }}>
                            {o.statut === 'essai' && (
                              <button onClick={()=>prolonger(o.id, 30)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(245,158,11,.3)', background:'rgba(245,158,11,.1)', color:'#f59e0b', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>+30j</button>
                            )}
                            <button onClick={()=>setEditing(o)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>✏️</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* === SECTION CONFIGURATION === */}
            {section === 'config' && (
              <>
                <div style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14 }}>
                  <div>
                    <h1 style={{ fontFamily:'Sora,Georgia', fontSize:26, fontWeight:700, color:'#fff', margin:0 }}>⚙️ Configuration plateforme</h1>
                    <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Personnalisez le branding et les tarifs ANZPilot</p>
                  </div>
                  <button onClick={saveConfig} disabled={configSaving} style={{ padding:'12px 22px', background:configSaving?'#1e3a5f':'linear-gradient(135deg,#10b981,#059669)', color:'#fff', borderRadius:10, border:'none', cursor:configSaving?'wait':'pointer', fontSize:14, fontWeight:600, fontFamily:'DM Sans,system-ui' }}>
                    {configSaving?'⏳ Enregistrement...':'💾 Enregistrer'}
                  </button>
                </div>

                {loadingConfig ? <div style={{ padding:48, textAlign:'center', color:'#64748b' }}>⏳ Chargement...</div> : (
                  <>
                    <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24, marginBottom:16 }}>
                      <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', margin:'0 0 16px' }}>🏷️ Identité de la plateforme</h3>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                        <div><label style={labelStyle}>Nom de la plateforme</label><input value={config.nom_plateforme||''} onChange={e=>updateConfig('nom_plateforme', e.target.value)} placeholder="ANZPilot" style={inputStyle}/></div>
                        <div><label style={labelStyle}>Email de contact</label><input type="email" value={config.email_contact||''} onChange={e=>updateConfig('email_contact', e.target.value)} placeholder="contact@anzpilot.com" style={inputStyle}/></div>
                        <div style={{ gridColumn:'1 / -1' }}><label style={labelStyle}>Slogan</label><input value={config.slogan||''} onChange={e=>updateConfig('slogan', e.target.value)} placeholder="Pilotez votre organisme de formation" style={inputStyle}/></div>
                      </div>
                    </div>

                    <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24, marginBottom:16 }}>
                      <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', margin:'0 0 16px' }}>🎨 Couleurs du thème</h3>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                        <div>
                          <label style={labelStyle}>Couleur principale</label>
                          <div style={{ display:'flex', gap:8 }}>
                            <input type="color" value={config.couleur_principale||'#0ea5e9'} onChange={e=>updateConfig('couleur_principale', e.target.value)} style={{ width:50, height:42, border:'1px solid rgba(255,255,255,.1)', borderRadius:8, background:'#050c1a', cursor:'pointer' }}/>
                            <input value={config.couleur_principale||'#0ea5e9'} onChange={e=>updateConfig('couleur_principale', e.target.value)} style={inputStyle}/>
                          </div>
                        </div>
                        <div>
                          <label style={labelStyle}>Couleur secondaire</label>
                          <div style={{ display:'flex', gap:8 }}>
                            <input type="color" value={config.couleur_secondaire||'#2563eb'} onChange={e=>updateConfig('couleur_secondaire', e.target.value)} style={{ width:50, height:42, border:'1px solid rgba(255,255,255,.1)', borderRadius:8, background:'#050c1a', cursor:'pointer' }}/>
                            <input value={config.couleur_secondaire||'#2563eb'} onChange={e=>updateConfig('couleur_secondaire', e.target.value)} style={inputStyle}/>
                          </div>
                        </div>
                        <div>
                          <label style={labelStyle}>Couleur accent</label>
                          <div style={{ display:'flex', gap:8 }}>
                            <input type="color" value={config.couleur_accent||'#10b981'} onChange={e=>updateConfig('couleur_accent', e.target.value)} style={{ width:50, height:42, border:'1px solid rgba(255,255,255,.1)', borderRadius:8, background:'#050c1a', cursor:'pointer' }}/>
                            <input value={config.couleur_accent||'#10b981'} onChange={e=>updateConfig('couleur_accent', e.target.value)} style={inputStyle}/>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24, marginBottom:16 }}>
                      <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', margin:'0 0 16px' }}>💰 Tarifs (en €)</h3>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                        <div><label style={labelStyle}>Plan Starter (mensuel)</label><input type="number" value={config.prix_starter||''} onChange={e=>updateConfig('prix_starter', e.target.value)} placeholder="49" style={inputStyle}/></div>
                        <div><label style={labelStyle}>Plan Pro (mensuel)</label><input type="number" value={config.prix_pro||''} onChange={e=>updateConfig('prix_pro', e.target.value)} placeholder="99" style={inputStyle}/></div>
                        <div><label style={labelStyle}>Plan Enterprise (mensuel)</label><input type="number" value={config.prix_enterprise||''} onChange={e=>updateConfig('prix_enterprise', e.target.value)} placeholder="299" style={inputStyle}/></div>
                        <div><label style={labelStyle}>Durée essai gratuit (jours)</label><input type="number" value={config.duree_essai||'30'} onChange={e=>updateConfig('duree_essai', e.target.value)} style={inputStyle}/></div>
                      </div>
                    </div>

                    <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24 }}>
                      <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', margin:'0 0 16px' }}>💬 Messages plateforme</h3>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14 }}>
                        <div><label style={labelStyle}>Message d'accueil</label><textarea value={config.message_accueil||''} onChange={e=>updateConfig('message_accueil', e.target.value)} rows={2} style={{...inputStyle, resize:'vertical' as const}}/></div>
                        <div><label style={labelStyle}>Bandeau info (haut de page)</label><input value={config.bandeau_info||''} onChange={e=>updateConfig('bandeau_info', e.target.value)} placeholder="🎉 Essai gratuit 14 jours !" style={inputStyle}/></div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* === SECTION STATS === */}
            {section === 'stats' && (
              <>
                <div style={{ marginBottom:24 }}>
                  <h1 style={{ fontFamily:'Sora,Georgia', fontSize:26, fontWeight:700, color:'#fff', margin:0 }}>📊 Statistiques globales</h1>
                  <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Vue d'ensemble de l'activité ANZPilot</p>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:24 }}>
                  {[
                    ['🏢','OF inscrits',stats.total,'#0ea5e9'],
                    ['⏳','Essais en cours',stats.essai,'#f59e0b'],
                    ['✅','Clients payants',stats.actif,'#10b981'],
                    ['💸','MRR potentiel','—','#8b5cf6'],
                  ].map(([icon,label,val,color]:any)=>(
                    <div key={label} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:20 }}>
                      <div style={{ fontSize:28, marginBottom:10 }}>{icon}</div>
                      <div style={{ fontFamily:'Sora,Georgia', fontSize:26, fontWeight:700, color }}>{val}</div>
                      <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:48, textAlign:'center' }}>
                  <div style={{ fontSize:48, marginBottom:14 }}>📈</div>
                  <div style={{ fontSize:14, color:'#64748b' }}>Statistiques détaillées à venir (graphiques, conversion, churn...)</div>
                </div>
              </>
            )}

          </div>
        </main>

        {/* Modal édition organisme */}
        {editing && (
          <div onClick={()=>setEditing(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:24, maxWidth:500, width:'100%' }}>
              <h3 style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>✏️ {editing.nom || editing.email}</h3>
              <p style={{ fontSize:12, color:'#64748b', margin:'0 0 18px' }}>{editing.email}</p>
              <label style={labelStyle}>Statut</label>
              <select value={editing.statut} onChange={e=>setEditing({...editing, statut: e.target.value})} style={{...inputStyle, marginBottom:14}}>
                <option value="essai">⏳ Essai gratuit</option>
                <option value="actif">✅ Actif (payant)</option>
                <option value="bloque">🔴 Bloqué</option>
                <option value="annule">⚪ Annulé</option>
              </select>
              <label style={labelStyle}>Plan</label>
              <select value={editing.plan} onChange={e=>setEditing({...editing, plan: e.target.value})} style={{...inputStyle, marginBottom:14}}>
                <option value="essai">Essai</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
              </select>
              <label style={labelStyle}>Notes admin</label>
              <textarea value={editing.notes_admin || ''} onChange={e=>setEditing({...editing, notes_admin: e.target.value})} rows={3} placeholder="Notes internes..." style={{...inputStyle, resize:'vertical' as const, marginBottom:18}}/>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setEditing(null)} style={{ flex:1, padding:11, borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>Annuler</button>
                <button onClick={saveOrganisme} disabled={saving} style={{ flex:1, padding:11, borderRadius:9, border:'none', background:saving?'#1e3a5f':'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', fontFamily:'DM Sans,system-ui' }}>{saving?'⏳':'💾 Enregistrer'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
