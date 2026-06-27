import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const ADMIN_PASSWORD = 'ANZPilotMaster2026!'

interface Organisme {
  id: string
  email: string
  nom: string
  siret: string
  statut: string
  plan: string
  date_inscription: string
  date_fin_essai: string
  date_dernier_login: string
  joursRestants: number | null
  nb_apprenants: number
  nb_conventions: number
  ca_total: number
  notes_admin: string
}

const STATUTS: any = {
  essai: { label:'Essai gratuit', color:'#f59e0b', icon:'⏳' },
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

export default function AdminSaas() {
  const [auth, setAuth] = useState(false)
  const [password, setPassword] = useState('')
  const [organismes, setOrganismes] = useState<Organisme[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<Organisme | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ok = sessionStorage.getItem('anzpilot_master') === 'ok'
      if (ok) { setAuth(true); load() }
      else setLoading(false)
    }
  }, [])

  function login() {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('anzpilot_master', 'ok')
      setAuth(true); load()
    } else alert('Mot de passe incorrect')
  }

  function load() {
    setLoading(true)
    fetch('/api/admin-saas/list-organismes').then(r=>r.json()).then(d=>{
      setOrganismes(d.organismes||[]); setLoading(false)
    }).catch(()=>setLoading(false))
  }

  async function saveOrganisme() {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin-saas/update-statut', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          id: editing.id,
          statut: editing.statut,
          plan: editing.plan,
          notes_admin: editing.notes_admin
        })
      })
      const d = await res.json()
      if (d.success) { setEditing(null); load() }
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
      if (d.success) load()
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
  }

  const filtered = filter==='all' ? organismes : organismes.filter(o => o.statut===filter)
  const stats = {
    total: organismes.length,
    essai: organismes.filter(o => o.statut==='essai').length,
    actif: organismes.filter(o => o.statut==='actif').length,
    bloque: organismes.filter(o => o.statut==='bloque').length,
    expireBientot: organismes.filter(o => o.statut==='essai' && o.joursRestants !== null && o.joursRestants <= 7 && o.joursRestants > 0).length,
  }

  if (!auth) {
    return (
      <>
        <Head><title>Admin Master — ANZPilot</title></Head>
        <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ maxWidth:420, width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:32, textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🔒</div>
            <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff', margin:'0 0 4px' }}>Admin Master</h1>
            <p style={{ fontSize:13, color:'#64748b', margin:'0 0 22px' }}>Accès réservé à l'administration ANZPilot</p>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="Mot de passe master" autoFocus style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, padding:'12px 14px', fontSize:14, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', marginBottom:14, textAlign:'center' }}/>
            <button onClick={login} style={{ width:'100%', padding:13, borderRadius:10, border:'none', background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', fontSize:14, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>🔓 Accéder à la console</button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>Admin Master — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:1400, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:14 }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0 }}>🏢 Admin Master ANZPilot</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Gérez tous les organismes de formation inscrits sur la plateforme</p>
            </div>
            <button onClick={()=>{ sessionStorage.removeItem('anzpilot_master'); setAuth(false) }} style={{ padding:'10px 18px', borderRadius:8, border:'1px solid rgba(239,68,68,.3)', background:'rgba(239,68,68,.1)', color:'#ef4444', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>🚪 Se déconnecter</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
            {[
              ['🏢','OF inscrits',stats.total,'#0ea5e9'],
              ['⏳','En essai gratuit',stats.essai,'#f59e0b'],
              ['✅','Clients actifs',stats.actif,'#10b981'],
              ['🔴','Bloqués',stats.bloque,'#ef4444'],
              ['⚠️','Expirent < 7j',stats.expireBientot,'#a855f7'],
            ].map(([icon,label,val,color]:any)=>(
              <div key={label} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18 }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:24, fontWeight:700, color }}>{val}</div>
                <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {[['all','Tous'],['essai','⏳ Essai'],['actif','✅ Actifs'],['bloque','🔴 Bloqués'],['annule','⚪ Annulés']].map(([id,label]:any)=>(
              <button key={id} onClick={()=>setFilter(id)} style={{ padding:'8px 14px', borderRadius:8, border:filter===id?'1px solid #0ea5e9':'1px solid rgba(255,255,255,.1)', background:filter===id?'rgba(14,165,233,.15)':'rgba(255,255,255,.04)', color:filter===id?'#0ea5e9':'#94a3b8', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>{label}</button>
            ))}
          </div>

          {loading ? <div style={{ padding:48, textAlign:'center', color:'#64748b' }}>⏳ Chargement...</div>
          : filtered.length === 0 ? (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>🏢</div>
              <div style={{ fontSize:14, color:'#64748b' }}>Aucun organisme dans cette catégorie</div>
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto auto', gap:14, padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)', fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.06em' }}>
                <div>Organisme</div>
                <div>Inscription</div>
                <div>Statut</div>
                <div>Plan</div>
                <div>Essai</div>
                <div>Actions</div>
              </div>
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

          <div style={{ marginTop:24, textAlign:'center' }}>
            <Link href="/dashboard" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour au tableau de bord</Link>
          </div>
        </div>

        {/* Modal édition */}
        {editing && (
          <div onClick={()=>setEditing(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:24, maxWidth:500, width:'100%' }}>
              <h3 style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>✏️ {editing.nom || editing.email}</h3>
              <p style={{ fontSize:12, color:'#64748b', margin:'0 0 18px' }}>{editing.email}</p>

              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' }}>Statut</label>
              <select value={editing.statut} onChange={e=>setEditing({...editing, statut: e.target.value})} style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', marginBottom:14 }}>
                <option value="essai">⏳ Essai gratuit</option>
                <option value="actif">✅ Actif (payant)</option>
                <option value="bloque">🔴 Bloqué</option>
                <option value="annule">⚪ Annulé</option>
              </select>

              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' }}>Plan</label>
              <select value={editing.plan} onChange={e=>setEditing({...editing, plan: e.target.value})} style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', marginBottom:14 }}>
                <option value="essai">Essai</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>

              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' }}>Notes admin</label>
              <textarea value={editing.notes_admin || ''} onChange={e=>setEditing({...editing, notes_admin: e.target.value})} rows={3} placeholder="Notes internes sur cet OF..." style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', resize:'vertical', marginBottom:18 }}/>

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

