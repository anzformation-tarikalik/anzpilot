/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import Head from 'next/head'

const DEFAULTS: any = {
  nom_plateforme: 'ANZPilot',
  slogan: 'Pilotez votre organisme de formation',
  email_contact: 'contact@anzpilot.com',
  couleur_principale: '#0ea5e9',
  couleur_secondaire: '#2563eb',
  couleur_accent: '#8b5cf6',
  essai_duree_jours: '14',
  essai_nb_sessions: '5',
  essai_nb_apprenants: '10',
  prix_starter_mensuel: '49',
  prix_pro_mensuel: '129',
  prix_business_mensuel: '299',
  prix_starter_annuel: '390',
  prix_pro_annuel: '1068',
  prix_business_annuel: '2508',
  remise_annuel_pct: '35',
  remise_code_promo: '',
  remise_code_valeur: '0',
  starter_nb_utilisateurs: '3',
  pro_nb_utilisateurs: '10',
  message_accueil: 'Bienvenue sur ANZPilot !',
  message_essai_expire: 'Votre essai gratuit a expiré.',
  feature_marketplace: 'true',
  feature_ia: 'true',
  feature_visio: 'false',
  feature_mobile: 'false',
  maintenance_mode: 'false',
}

const menu = [
  { icon:'⊞', label:'Vue générale', id:'overview' },
  { icon:'💰', label:'Tarifs & Remises', id:'tarifs' },
  { icon:'🎁', label:'Essai gratuit', id:'essai' },
  { icon:'🎨', label:'Apparence', id:'apparence' },
  { icon:'⚡', label:'Fonctionnalités', id:'features' },
  { icon:'💬', label:'Messages', id:'messages' },
  { icon:'🏢', label:'Organismes', id:'organismes' },
]

export default function AdminDashboard() {
  const [section, setSection] = useState('overview')
  const [cfg, setCfg] = useState<any>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('anzpilot_admin') !== 'true') {
        window.location.href = '/admin'
        return
      }
      loadConfig()
    }
  }, [])

  async function loadConfig() {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/config?t=' + Date.now())
      const d = await r.json()
      if (d.config && Object.keys(d.config).length > 0) {
        setCfg({ ...DEFAULTS, ...d.config })
        setStatus('✅ Config chargée depuis Supabase')
      } else {
        setStatus('⚠️ Supabase vide — valeurs par défaut utilisées')
      }
    } catch (e: any) {
      setStatus('❌ Erreur: ' + e.message)
    }
    setLoading(false)
  }

  function update(k: string, v: string) {
    setCfg((prev: any) => ({ ...prev, [k]: v }))
  }

  async function save(keys?: string[]) {
    setSaving(true)
    try {
      const updates: any = {}
      const ks = keys || Object.keys(cfg)
      ks.forEach((k: string) => { updates[k] = cfg[k] || '' })
      const r = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })
      const d = await r.json()
      if (d.success) {
        setSaved(true)
        setStatus('✅ Sauvegardé !')
        setTimeout(() => setSaved(false), 3000)
      } else {
        setStatus('❌ Erreur sauvegarde: ' + JSON.stringify(d))
      }
    } catch (e: any) {
      setStatus('❌ ' + e.message)
    }
    setSaving(false)
  }

  function logout() {
    localStorage.removeItem('anzpilot_admin')
    window.location.href = '/admin'
  }

  function Field({ label, k, type = 'text', hint = '' }: any) {
    if (type === 'boolean') return (
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'.06em' }}>{label}</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => update(k, cfg[k]==='true'?'false':'true')}
            style={{ width:48, height:26, borderRadius:13, border:'none', cursor:'pointer', position:'relative' as const, background:cfg[k]==='true'?'#0ea5e9':'#1e3a5f', transition:'background .2s' }}>
            <div style={{ position:'absolute' as const, top:3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left .2s', left:cfg[k]==='true'?'25px':'3px' }} />
          </button>
          <span style={{ fontSize:13, color:cfg[k]==='true'?'#10b981':'#64748b' }}>{cfg[k]==='true'?'✅ Activé':'❌ Désactivé'}</span>
        </div>
        {hint && <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>{hint}</div>}
      </div>
    )
    if (type === 'color') return (
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'.06em' }}>{label}</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="color" value={cfg[k]||'#0ea5e9'} onChange={(e: any) => update(k, e.target.value)}
            style={{ width:44, height:38, borderRadius:8, border:'1px solid rgba(255,255,255,.1)', background:'#0a1628', cursor:'pointer', padding:2 }} />
          <input type="text" value={cfg[k]||''} onChange={(e: any) => update(k, e.target.value)}
            style={{ flex:1, background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }} />
        </div>
      </div>
    )
    return (
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'.06em' }}>{label}</div>
        <input type={type} value={cfg[k]||''} onChange={(e: any) => update(k, e.target.value)}
          style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }} />
        {hint && <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>{hint}</div>}
      </div>
    )
  }

  function SaveBtn({ keys }: any) {
    return (
      <button onClick={() => save(keys)} disabled={saving}
        style={{ marginTop:12, padding:'11px 28px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', background:saved?'#10b981':saving?'#1e3a5f':'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', transition:'all .3s' }}>
        {saving?'⏳ Sauvegarde...':saved?'✅ Sauvegardé !':'💾 Sauvegarder'}
      </button>
    )
  }

  const card = { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:24, marginBottom:16 }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050c1a', color:'#94a3b8', fontFamily:'DM Sans,system-ui' }}>
      ⏳ Chargement...
    </div>
  )

  return (
    <>
      <Head><title>Admin — ANZPilot</title></Head>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#050c1a', fontFamily:'DM Sans,system-ui' }}>

        <aside style={{ width:220, flexShrink:0, background:'#0a1628', borderRight:'1px solid rgba(255,255,255,.06)', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center' }}>🛡️</div>
            <div>
              <div style={{ fontFamily:'Sora,Georgia', fontSize:13, fontWeight:700, color:'#fff' }}>ANZPilot</div>
              <div style={{ fontSize:9, color:'#0ea5e9', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em' }}>Super Admin</div>
            </div>
          </div>
          <nav style={{ flex:1, padding:'12px 8px' }}>
            {menu.map((item: any) => (
              <button key={item.id} onClick={() => setSection(item.id)}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 10px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,system-ui', color:section===item.id?'#93c5fd':'#64748b', background:section===item.id?'rgba(59,130,246,.12)':'transparent', textAlign:'left', marginBottom:2 }}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <a href="/" target="_blank" style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', fontSize:13, color:'#64748b', textDecoration:'none', marginBottom:4 }}>🌐 Voir le site</a>
            <button onClick={logout} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,system-ui', color:'#ef4444', background:'rgba(239,68,68,.08)' }}>
              🚪 Déconnexion
            </button>
          </div>
        </aside>

        <main style={{ flex:1, overflowY:'auto', padding:28 }}>
          {status && (
            <div style={{ padding:'8px 14px', borderRadius:9, fontSize:12, marginBottom:16, background:status.startsWith('✅')?'rgba(16,185,129,.1)':status.startsWith('⚠️')?'rgba(245,158,11,.1)':'rgba(239,68,68,.1)', border:`1px solid ${status.startsWith('✅')?'rgba(16,185,129,.25)':status.startsWith('⚠️')?'rgba(245,158,11,.25)':'rgba(239,68,68,.25)'}`, color:status.startsWith('✅')?'#6ee7b7':status.startsWith('⚠️')?'#fcd34d':'#fca5a5', display:'flex', justifyContent:'space-between' }}>
              <span>{status}</span>
              <button onClick={loadConfig} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'inherit', fontFamily:'DM Sans,system-ui' }}>🔄 Recharger</button>
            </div>
          )}

          {section === 'overview' && (
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff', marginBottom:20 }}>Vue générale</h1>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 }}>
                {[
                  { label:'Plateforme', value:cfg.nom_plateforme, icon:'✈️', color:'#0ea5e9' },
                  { label:'Essai', value:cfg.essai_duree_jours+'j', icon:'🎁', color:'#10b981' },
                  { label:'Remise', value:cfg.remise_annuel_pct+'%', icon:'💰', color:'#f59e0b' },
                  { label:'Starter', value:cfg.prix_starter_mensuel+'€', icon:'💳', color:'#8b5cf6' },
                ].map((stat: any) => (
                  <div key={stat.label} style={{ ...card, marginBottom:0 }}>
                    <div style={{ fontSize:22, marginBottom:8 }}>{stat.icon}</div>
                    <div style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:stat.color }}>{stat.value}</div>
                    <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'tarifs' && (
            <div style={{ maxWidth:700 }}>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff', marginBottom:20 }}>Tarifs & Remises</h1>
              <div style={card}>
                <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginBottom:16 }}>💰 Prix mensuels</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                  <Field label="Starter (€/mois)" k="prix_starter_mensuel" type="number" />
                  <Field label="Pro (€/mois)" k="prix_pro_mensuel" type="number" />
                  <Field label="Business (€/mois)" k="prix_business_mensuel" type="number" />
                </div>
              </div>
              <div style={card}>
                <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginBottom:16 }}>📅 Prix annuels</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                  <Field label="Starter (€/an)" k="prix_starter_annuel" type="number" />
                  <Field label="Pro (€/an)" k="prix_pro_annuel" type="number" />
                  <Field label="Business (€/an)" k="prix_business_annuel" type="number" />
                </div>
              </div>
              <div style={card}>
                <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginBottom:16 }}>🎁 Remises</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                  <Field label="Remise annuel (%)" k="remise_annuel_pct" type="number" hint="-35% affiché sur le site" />
                  <Field label="Code promo" k="remise_code_promo" />
                  <Field label="Valeur code (%)" k="remise_code_valeur" type="number" />
                </div>
              </div>
              <SaveBtn keys={['prix_starter_mensuel','prix_pro_mensuel','prix_business_mensuel','prix_starter_annuel','prix_pro_annuel','prix_business_annuel','remise_annuel_pct','remise_code_promo','remise_code_valeur']} />
            </div>
          )}

          {section === 'essai' && (
            <div style={{ maxWidth:500 }}>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff', marginBottom:20 }}>Essai gratuit</h1>
              <div style={card}>
                <Field label="Durée (jours)" k="essai_duree_jours" type="number" hint="Affiché sur la landing page" />
                <Field label="Sessions max" k="essai_nb_sessions" type="number" />
                <Field label="Apprenants max" k="essai_nb_apprenants" type="number" />
              </div>
              <SaveBtn keys={['essai_duree_jours','essai_nb_sessions','essai_nb_apprenants']} />
            </div>
          )}

          {section === 'apparence' && (
            <div style={{ maxWidth:600 }}>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff', marginBottom:20 }}>Apparence</h1>
              <div style={card}>
                <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginBottom:16 }}>🏷️ Identité</div>
                <Field label="Nom de la plateforme" k="nom_plateforme" />
                <Field label="Slogan" k="slogan" />
                <Field label="Email de contact" k="email_contact" type="email" />
              </div>
              <div style={card}>
                <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginBottom:16 }}>🎨 Couleurs</div>
                <Field label="Couleur principale" k="couleur_principale" type="color" />
                <Field label="Couleur secondaire" k="couleur_secondaire" type="color" />
              </div>
              <div style={{ padding:14, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, marginBottom:12 }}>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>APERÇU BOUTON</div>
                <div style={{ padding:'10px 20px', borderRadius:9, display:'inline-block', background:`linear-gradient(135deg,${cfg.couleur_principale},${cfg.couleur_secondaire})`, color:'#fff', fontSize:13, fontWeight:600 }}>
                  ✈️ {cfg.nom_plateforme}
                </div>
              </div>
              <SaveBtn keys={['nom_plateforme','slogan','email_contact','couleur_principale','couleur_secondaire']} />
            </div>
          )}

          {section === 'features' && (
            <div style={{ maxWidth:500 }}>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff', marginBottom:20 }}>Fonctionnalités</h1>
              <div style={card}>
                <Field label="🎓 Marketplace formateurs" k="feature_marketplace" type="boolean" />
                <Field label="⚡ Assistant IA" k="feature_ia" type="boolean" />
                <Field label="🎥 Classes virtuelles" k="feature_visio" type="boolean" />
                <Field label="📱 Application mobile" k="feature_mobile" type="boolean" />
                <Field label="🔧 Mode maintenance" k="maintenance_mode" type="boolean" />
              </div>
              <SaveBtn keys={['feature_marketplace','feature_ia','feature_visio','feature_mobile','maintenance_mode']} />
            </div>
          )}

          {section === 'messages' && (
            <div style={{ maxWidth:500 }}>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff', marginBottom:20 }}>Messages</h1>
              <div style={card}>
                <Field label="Message d'accueil" k="message_accueil" />
                <Field label="Message essai expiré" k="message_essai_expire" />
              </div>
              <SaveBtn keys={['message_accueil','message_essai_expire']} />
            </div>
          )}

          {section === 'organismes' && (
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff', marginBottom:20 }}>Organismes</h1>
              <div style={{ ...card, textAlign:'center', padding:48 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🏢</div>
                <div style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:8 }}>Aucun organisme inscrit</div>
                <a href="/inscription" target="_blank" style={{ display:'inline-block', padding:'10px 20px', borderRadius:9, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:600 }}>
                  Voir la page d'inscription →
                </a>
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  )
}
