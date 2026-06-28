import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminShell, { useAdminAuth } from '../../../components/admin/AdminShell'
import { Button, Card, Input, Tabs, EmptyState, tokens } from '../../../components/admin/AdminUI'

// ═══ Définition des modules ═══
const MODULES = [
  { id:'catalogue', icon:'📚', label:'Catalogue de formations', desc:"Modèles de formations réutilisables" },
  { id:'conventions', icon:'📄', label:'Conventions', desc:"Génération PDF des conventions de formation" },
  { id:'factures', icon:'💳', label:'Facturation', desc:"Factures OPCO, CPF, entreprises, individuels" },
  { id:'qualiopi', icon:'🛡️', label:'Qualiopi', desc:"32 indicateurs officiels + preuves" },
  { id:'bpf', icon:'📊', label:'BPF automatique', desc:"Bilan Pédagogique et Financier" },
  { id:'classes_virtuelles', icon:'🎥', label:'Classes virtuelles', desc:"Planification Zoom/Teams/Meet" },
  { id:'visio', icon:'📹', label:'ANZPilot Visio', desc:"Salles de visio Jitsi intégrées" },
  { id:'multi_of', icon:'🏢', label:'Multi-OF', desc:"Plateforme multi-organismes (SaaS)" },
]

export default function ConfigPage() {
  const { auth } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('branding')
  const [config, setConfig] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!auth) return
    load()
  }, [auth])

  function load() {
    setLoading(true)
    fetch('/api/admin/config').then(r=>r.json()).then(d=>{
      const obj: Record<string,string> = {}
      if (Array.isArray(d.config)) d.config.forEach((c:any) => { obj[c.cle] = c.valeur })
      else if (d.config && typeof d.config === 'object') Object.assign(obj, d.config)
      setConfig(obj); setLoading(false); setDirty(false)
    }).catch(()=>setLoading(false))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/config', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ config })
      })
      const d = await res.json()
      if (d.success) { setDirty(false); alert('✅ Configuration enregistrée') }
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
    setSaving(false)
  }

  function update(key: string, value: string) {
    setConfig(p => ({...p, [key]: value}))
    setDirty(true)
  }

  function toggleModule(id: string) {
    const key = `feature_${id}`
    update(key, config[key] === 'true' ? 'false' : 'true')
  }

  function isModuleEnabled(id: string): boolean {
    const v = config[`feature_${id}`]
    return v === undefined ? true : v === 'true'  // Activé par défaut
  }

  if (!auth) return null

  return (
    <>
      <Head><title>Paramètres — Admin ANZPilot</title></Head>
      <AdminShell activeSection="config" breadcrumb={[{ label:'Paramètres' }]}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:14 }}>
          <div>
            <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>⚙️ Paramètres plateforme</h1>
            <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Personnalisez ANZPilot selon vos besoins</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {dirty && <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:8, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.3)', color:tokens.warning, fontSize:12, fontWeight:600 }}>● Modifications non enregistrées</div>}
            <Button variant="success" icon="💾" onClick={save} disabled={saving||!dirty}>{saving?'Enregistrement...':'Enregistrer'}</Button>
          </div>
        </div>

        <Tabs
          tabs={[
            { id:'branding', label:'Branding', icon:'🏷️' },
            { id:'apparence', label:'Apparence', icon:'🎨' },
            { id:'tarifs', label:'Tarifs & Plans', icon:'💰' },
            { id:'essai', label:'Essai gratuit', icon:'⏰' },
            { id:'modules', label:'Modules', icon:'🔌' },
            { id:'legal', label:'Légal', icon:'📜' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {loading ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div> : (
          <>
          {/* ═══════════════ BRANDING ═══════════════ */}
          {activeTab === 'branding' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Card title="🏷️ Identité de la plateforme" subtitle="Informations affichées partout sur la plateforme">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <Input label="Nom de la plateforme" value={config.nom_plateforme||''} onChange={v=>update('nom_plateforme', v)} placeholder="ANZPilot"/>
                  <Input label="Email de contact" type="email" value={config.email_contact||''} onChange={v=>update('email_contact', v)} placeholder="contact@anzpilot.com"/>
                </div>
                <div style={{ marginTop:14 }}>
                  <Input label="Slogan" value={config.slogan||''} onChange={v=>update('slogan', v)} placeholder="Pilotez votre organisme de formation"/>
                </div>
                <div style={{ marginTop:14 }}>
                  <Input label="Description (SEO)" value={config.meta_description||''} onChange={v=>update('meta_description', v)} rows={2} placeholder="SaaS pour organismes de formation — Conventions, Qualiopi, BPF automatiques"/>
                </div>
              </Card>

              <Card title="🖼️ Logos & Visuels" subtitle="URLs des images de marque (upload de fichiers à venir dans un prochain sprint)">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <Input label="URL du logo principal" value={config.logo_url||''} onChange={v=>update('logo_url', v)} placeholder="https://anzpilot.com/logo.png" hint="Format PNG transparent recommandé, ~200×60 px"/>
                    {config.logo_url && (
                      <div style={{ marginTop:10, padding:14, borderRadius:8, background:'#fff', textAlign:'center' }}>
                        <img src={config.logo_url} alt="Logo" style={{ maxHeight:60, maxWidth:'100%' }} onError={(e:any)=>e.target.style.display='none'}/>
                      </div>
                    )}
                  </div>
                  <div>
                    <Input label="URL du logo blanc (fond sombre)" value={config.logo_white_url||''} onChange={v=>update('logo_white_url', v)} placeholder="https://anzpilot.com/logo-white.png" hint="Pour fonds sombres"/>
                    {config.logo_white_url && (
                      <div style={{ marginTop:10, padding:14, borderRadius:8, background:'#0a1628', textAlign:'center' }}>
                        <img src={config.logo_white_url} alt="Logo blanc" style={{ maxHeight:60, maxWidth:'100%' }} onError={(e:any)=>e.target.style.display='none'}/>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:14 }}>
                  <Input label="URL du favicon" value={config.favicon_url||''} onChange={v=>update('favicon_url', v)} placeholder="https://anzpilot.com/favicon.ico" hint="Icône onglet navigateur (32×32 px, format ICO ou PNG)"/>
                  <Input label="URL image de partage social (OG)" value={config.og_image_url||''} onChange={v=>update('og_image_url', v)} placeholder="https://anzpilot.com/og.png" hint="Affichée lors du partage sur réseaux sociaux (1200×630 px)"/>
                </div>
              </Card>

              <Card title="🌐 Réseaux sociaux">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <Input label="LinkedIn" value={config.linkedin_url||''} onChange={v=>update('linkedin_url', v)} placeholder="https://linkedin.com/company/anzpilot"/>
                  <Input label="Twitter / X" value={config.twitter_url||''} onChange={v=>update('twitter_url', v)} placeholder="https://x.com/anzpilot"/>
                  <Input label="Facebook" value={config.facebook_url||''} onChange={v=>update('facebook_url', v)} placeholder="https://facebook.com/anzpilot"/>
                  <Input label="YouTube" value={config.youtube_url||''} onChange={v=>update('youtube_url', v)} placeholder="https://youtube.com/@anzpilot"/>
                </div>
              </Card>
            </div>
          )}

          {/* ═══════════════ APPARENCE ═══════════════ */}
          {activeTab === 'apparence' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Card title="🎨 Couleurs du thème" subtitle="Personnalisez l'identité visuelle de la plateforme">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                  {[
                    ['Couleur principale','couleur_principale','#0ea5e9','Boutons primaires, liens'],
                    ['Couleur secondaire','couleur_secondaire','#2563eb','Dégradés, accents'],
                    ['Couleur accent','couleur_accent','#10b981','Succès, validations'],
                  ].map(([label,key,def,desc]:any)=>(
                    <div key={key}>
                      <label style={{ display:'block', fontSize:11, fontWeight:600, color:tokens.textMuted, marginBottom:5, textTransform:'uppercase' }}>{label}</label>
                      <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                        <input type="color" value={config[key]||def} onChange={e=>update(key, e.target.value)} style={{ width:50, height:42, border:`1px solid ${tokens.border}`, borderRadius:8, background:tokens.bg, cursor:'pointer' }}/>
                        <input value={config[key]||def} onChange={e=>update(key, e.target.value)} style={{ flex:1, background:tokens.bg, border:`1px solid ${tokens.border}`, borderRadius:8, padding:'10px 12px', fontSize:13, color:tokens.text, fontFamily:tokens.fontSans, outline:'none' }}/>
                      </div>
                      <div style={{ fontSize:11, color:tokens.textDim }}>{desc}</div>
                    </div>
                  ))}
                </div>

                {/* Aperçu */}
                <div style={{ marginTop:24, padding:18, borderRadius:10, background:tokens.bg, border:`1px solid ${tokens.border}` }}>
                  <div style={{ fontSize:11, fontWeight:600, color:tokens.textMuted, marginBottom:10, textTransform:'uppercase' }}>Aperçu</div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    <button style={{ padding:'10px 18px', background:`linear-gradient(135deg,${config.couleur_principale||'#0ea5e9'},${config.couleur_secondaire||'#2563eb'})`, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600 }}>Bouton primaire</button>
                    <button style={{ padding:'10px 18px', background:`linear-gradient(135deg,${config.couleur_accent||'#10b981'},#059669)`, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600 }}>Bouton de succès</button>
                    <span style={{ padding:'4px 10px', borderRadius:12, background:(config.couleur_principale||'#0ea5e9')+'22', color:config.couleur_principale||'#0ea5e9', fontSize:11, fontWeight:600 }}>● Badge</span>
                  </div>
                </div>
              </Card>

              <Card title="🌗 Mode d'affichage">
                <Input label="Thème par défaut" value={config.theme_default||'dark'} onChange={v=>update('theme_default', v)} options={[
                  { value:'dark', label:'🌙 Sombre (recommandé)' },
                  { value:'light', label:'☀️ Clair' },
                  { value:'auto', label:'🔄 Auto (selon système OS)' },
                ]}/>
              </Card>
            </div>
          )}

          {/* ═══════════════ TARIFS ═══════════════ */}
          {activeTab === 'tarifs' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { id:'starter', label:'🚀 Plan Starter', desc:'Pour les petits OF qui démarrent' },
                { id:'pro', label:'💼 Plan Pro', desc:'Pour les OF établis avec plusieurs formateurs' },
                { id:'enterprise', label:'🏢 Plan Enterprise', desc:'Pour les grandes structures' },
              ].map(plan => (
                <Card key={plan.id} title={plan.label} subtitle={plan.desc}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                    <Input label="Prix mensuel (€)" type="number" value={config[`prix_${plan.id}`]||''} onChange={v=>update(`prix_${plan.id}`, v)} placeholder={plan.id==='starter'?'49':plan.id==='pro'?'99':'299'}/>
                    <Input label="Prix annuel (€) (-20%)" type="number" value={config[`prix_${plan.id}_annuel`]||''} onChange={v=>update(`prix_${plan.id}_annuel`, v)}/>
                    <Input label="Limite apprenants" type="number" value={config[`limite_apprenants_${plan.id}`]||''} onChange={v=>update(`limite_apprenants_${plan.id}`, v)} placeholder="Illimité = vide"/>
                  </div>
                  <div style={{ marginTop:14 }}>
                    <Input label="Liste des features incluses (1 par ligne)" value={config[`features_${plan.id}`]||''} onChange={v=>update(`features_${plan.id}`, v)} rows={4} placeholder="Conventions illimitées&#10;Factures auto&#10;Qualiopi inclus&#10;Support email"/>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ═══════════════ ESSAI GRATUIT ═══════════════ */}
          {activeTab === 'essai' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Card title="⏰ Paramètres de l'essai gratuit">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <Input label="Durée par défaut (jours)" type="number" value={config.duree_essai||'30'} onChange={v=>update('duree_essai', v)} hint="Nouveaux OF auront cette durée d'essai"/>
                  <Input label="Plan attribué à l'inscription" value={config.plan_essai_defaut||'essai'} onChange={v=>update('plan_essai_defaut', v)} options={[
                    { value:'essai', label:'⏳ Essai (limité)' },
                    { value:'starter', label:'🚀 Starter (toutes features)' },
                    { value:'pro', label:'💼 Pro (toutes features)' },
                  ]} hint="Le plan utilisé pendant l'essai"/>
                </div>
              </Card>

              <Card title="📧 Emails automatiques" subtitle="Envoyés à l'OF pendant son essai">
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {[
                    ['email_bienvenue', 'Email de bienvenue', 'Envoyé immédiatement à l\'inscription'],
                    ['rappel_j7', 'Rappel J-7 avant fin d\'essai', 'Envoyé 7 jours avant expiration'],
                    ['rappel_j3', 'Rappel J-3 avant fin d\'essai', 'Envoyé 3 jours avant expiration'],
                    ['rappel_j1', 'Rappel J-1 avant fin d\'essai', 'Envoyé la veille de l\'expiration'],
                    ['email_expiration', 'Email à l\'expiration', 'Envoyé le jour où l\'essai se termine'],
                  ].map(([key, label, desc]) => {
                    const enabled = config[key] !== 'false'  // Activé par défaut
                    return (
                      <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:14, background:tokens.bg, borderRadius:10, border:`1px solid ${tokens.border}` }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:tokens.text }}>{label}</div>
                          <div style={{ fontSize:11, color:tokens.textDim, marginTop:2 }}>{desc}</div>
                        </div>
                        <label style={{ position:'relative', display:'inline-block', width:42, height:24, cursor:'pointer' }}>
                          <input type="checkbox" checked={enabled} onChange={()=>update(key, enabled?'false':'true')} style={{ opacity:0, width:0, height:0 }}/>
                          <span style={{ position:'absolute', inset:0, background:enabled?tokens.success:tokens.surface, borderRadius:12, transition:'.2s' }}>
                            <span style={{ position:'absolute', height:18, width:18, left:enabled?20:3, top:3, background:'#fff', borderRadius:'50%', transition:'.2s' }}/>
                          </span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card title="🔒 Blocage automatique">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:14, background:tokens.bg, borderRadius:10, border:`1px solid ${tokens.border}` }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:tokens.text }}>Bloquer l'accès à l'expiration</div>
                    <div style={{ fontSize:11, color:tokens.textDim, marginTop:2 }}>Si activé, l'OF ne peut plus se connecter après la fin d'essai sans plan payant</div>
                  </div>
                  <label style={{ position:'relative', display:'inline-block', width:42, height:24, cursor:'pointer' }}>
                    <input type="checkbox" checked={config.blocage_auto !== 'false'} onChange={()=>update('blocage_auto', config.blocage_auto==='false'?'true':'false')} style={{ opacity:0, width:0, height:0 }}/>
                    <span style={{ position:'absolute', inset:0, background:config.blocage_auto!=='false'?tokens.success:tokens.surface, borderRadius:12, transition:'.2s' }}>
                      <span style={{ position:'absolute', height:18, width:18, left:config.blocage_auto!=='false'?20:3, top:3, background:'#fff', borderRadius:'50%', transition:'.2s' }}/>
                    </span>
                  </label>
                </div>
              </Card>
            </div>
          )}

          {/* ═══════════════ MODULES ═══════════════ */}
          {activeTab === 'modules' && (
            <Card title="🔌 Modules de la plateforme" subtitle="Activez ou désactivez globalement les fonctionnalités d'ANZPilot">
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {MODULES.map(m => {
                  const enabled = isModuleEnabled(m.id)
                  return (
                    <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, padding:16, background:tokens.bg, borderRadius:10, border:`1px solid ${enabled?'rgba(16,185,129,.2)':tokens.border}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:14, flex:1 }}>
                        <div style={{ width:42, height:42, borderRadius:10, background:enabled?'rgba(16,185,129,.15)':tokens.surface, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{m.icon}</div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:600, color:tokens.text }}>{m.label}</div>
                          <div style={{ fontSize:12, color:tokens.textDim, marginTop:2 }}>{m.desc}</div>
                        </div>
                      </div>
                      <label style={{ position:'relative', display:'inline-block', width:48, height:26, cursor:'pointer', flexShrink:0 }}>
                        <input type="checkbox" checked={enabled} onChange={()=>toggleModule(m.id)} style={{ opacity:0, width:0, height:0 }}/>
                        <span style={{ position:'absolute', inset:0, background:enabled?tokens.success:tokens.surface, borderRadius:13, transition:'.2s' }}>
                          <span style={{ position:'absolute', height:20, width:20, left:enabled?24:3, top:3, background:'#fff', borderRadius:'50%', transition:'.2s' }}/>
                        </span>
                      </label>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop:14, padding:12, borderRadius:8, background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', fontSize:12, color:tokens.warning }}>
                ⚠️ Note : la désactivation d'un module masque l'accès dans la sidebar OF, mais ne supprime aucune donnée. Réactivable à tout moment.
              </div>
            </Card>
          )}

          {/* ═══════════════ LÉGAL ═══════════════ */}
          {activeTab === 'legal' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Card title="📜 Conditions Générales de Vente (CGV)" subtitle="Affichées lors de l'inscription et accessibles depuis le footer">
                <Input label="" value={config.cgv||''} onChange={v=>update('cgv', v)} rows={10} placeholder="Article 1 — Objet&#10;Les présentes conditions générales..."/>
              </Card>

              <Card title="⚖️ Mentions légales" subtitle="Informations légales obligatoires">
                <Input label="" value={config.mentions_legales||''} onChange={v=>update('mentions_legales', v)} rows={8} placeholder="ANZPilot est édité par...&#10;SIRET : ...&#10;Hébergeur : Vercel Inc."/>
              </Card>

              <Card title="🔒 Politique de confidentialité (RGPD)" subtitle="Comment vous traitez les données personnelles">
                <Input label="" value={config.politique_confidentialite||''} onChange={v=>update('politique_confidentialite', v)} rows={10} placeholder="Conformément au RGPD..."/>
              </Card>

              <Card title="🍪 Politique de cookies" subtitle="Cookies utilisés par la plateforme">
                <Input label="" value={config.politique_cookies||''} onChange={v=>update('politique_cookies', v)} rows={6} placeholder="ANZPilot utilise les cookies suivants..."/>
              </Card>
            </div>
          )}
          </>
        )}

      </AdminShell>
    </>
  )
}

