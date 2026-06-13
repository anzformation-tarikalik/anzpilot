import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface Classe {
  id: string
  titre: string
  formateur: string
  plateforme: string
  url_meeting: string
  date_debut: string
  duree_min: number
  nb_participants: number
  statut: string
}

export default function ClassesVirtuellesList() {
  const [classes, setClasses] = useState<Classe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titre:'', formateur:'', plateforme:'zoom', url_meeting:'',
    date_debut:'', duree_min:'60', nb_participants:'10'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/classes-virtuelles/list').then(r=>r.json()).then(d=>{ setClasses(d.classes||[]); setLoading(false) }).catch(()=>setLoading(false))
  }, [])

  async function createClasse() {
    setSaving(true)
    try {
      const res = await fetch('/api/classes-virtuelles/create', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form)
      })
      const d = await res.json()
      if (d.success) {
        setClasses(p => [d.classe, ...p])
        setShowForm(false)
        setForm({ titre:'', formateur:'', plateforme:'zoom', url_meeting:'', date_debut:'', duree_min:'60', nb_participants:'10' })
      } else alert('Erreur: '+(d.error||'inconnue'))
    } catch(e:any) { alert(e.message) }
    setSaving(false)
  }

  const upcoming = classes.filter(c => new Date(c.date_debut) > new Date()).length
  const past = classes.length - upcoming

  return (
    <>
      <Head><title>Classes virtuelles — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <Link href="/dashboard" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour</Link>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'12px 0 24px' }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0 }}>🎥 Classes virtuelles</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Zoom, Teams, Google Meet · Centralisez vos visioconférences</p>
            </div>
            <button onClick={()=>setShowForm(true)} style={{ padding:'12px 22px', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:10, border:'none', cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:'DM Sans,system-ui' }}>➕ Nouvelle classe</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
            {[
              ['🎥', 'Total classes', classes.length, '#0ea5e9'],
              ['📅', 'À venir', upcoming, '#10b981'],
              ['✅', 'Terminées', past, '#8b5cf6'],
              ['⏱️', 'Heures totales', classes.reduce((s,c)=>s+(c.duree_min||0),0)/60+'h', '#f59e0b'],
            ].map(([icon,label,val,color]:any)=>(
              <div key={label} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18 }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color }}>{val}</div>
                <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          {loading ? <div style={{ padding:48, textAlign:'center', color:'#64748b' }}>⏳ Chargement...</div>
          : classes.length === 0 ? (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>🎥</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#fff', marginBottom:6 }}>Aucune classe virtuelle</div>
              <div style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>Centralisez vos sessions Zoom, Teams ou Google Meet</div>
              <button onClick={()=>setShowForm(true)} style={{ padding:'11px 22px', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui' }}>➕ Créer ma première classe</button>
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, overflow:'hidden' }}>
              {classes.map((c,i) => {
                const isUpcoming = new Date(c.date_debut) > new Date()
                const icons:any = { zoom:'📹', teams:'🎬', meet:'🎥', other:'💻' }
                return (
                  <div key={c.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:14, padding:14, borderBottom:i<classes.length-1?'1px solid rgba(255,255,255,.05)':'none', alignItems:'center' }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:'rgba(14,165,233,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icons[c.plateforme]||'🎥'}</div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{c.titre}</div>
                      <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{c.formateur} · {c.plateforme} · {c.duree_min}min</div>
                    </div>
                    <div style={{ fontSize:12, color:isUpcoming?'#10b981':'#64748b' }}>{new Date(c.date_debut).toLocaleString('fr-FR', { dateStyle:'short', timeStyle:'short' })}</div>
                    {c.url_meeting && (
                      <a href={c.url_meeting} target="_blank" rel="noopener" style={{ padding:'8px 14px', borderRadius:8, background:isUpcoming?'#10b981':'rgba(255,255,255,.08)', color:'#fff', fontSize:12, fontWeight:600, textDecoration:'none' }}>{isUpcoming?'Rejoindre →':'Voir'}</a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal création */}
        {showForm && (
          <div onClick={()=>setShowForm(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:24, maxWidth:500, width:'100%' }}>
              <h3 style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 18px' }}>🎥 Nouvelle classe virtuelle</h3>
              {[
                ['Titre','titre','text','Excel niveau 2 — Session 1'],
                ['Formateur','formateur','text','Sophie Martin'],
              ].map(([l,k,t,p])=>(
                <div key={k} style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' }}>{l}</label>
                  <input type={t} value={(form as any)[k]} onChange={e=>setForm(p=>({...p, [k]:e.target.value}))} placeholder={p} style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}/>
                </div>
              ))}
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' }}>Plateforme</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                  {[['zoom','📹','Zoom'],['teams','🎬','Teams'],['meet','🎥','Meet'],['other','💻','Autre']].map(([id,icon,name])=>(
                    <button key={id} onClick={()=>setForm(p=>({...p, plateforme:id}))} style={{ padding:'10px 6px', borderRadius:8, cursor:'pointer', fontFamily:'DM Sans,system-ui', background:form.plateforme===id?'rgba(14,165,233,.15)':'rgba(255,255,255,.04)', border:form.plateforme===id?'1px solid #0ea5e9':'1px solid rgba(255,255,255,.08)' }}>
                      <div style={{ fontSize:18, marginBottom:2 }}>{icon}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:form.plateforme===id?'#0ea5e9':'#94a3b8' }}>{name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' }}>URL de la réunion</label>
                <input value={form.url_meeting} onChange={e=>setForm(p=>({...p, url_meeting:e.target.value}))} placeholder="https://zoom.us/j/..." style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:18 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' }}>Date/Heure</label>
                  <input type="datetime-local" value={form.date_debut} onChange={e=>setForm(p=>({...p, date_debut:e.target.value}))} style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' }}>Durée (min)</label>
                  <input type="number" value={form.duree_min} onChange={e=>setForm(p=>({...p, duree_min:e.target.value}))} style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' }}>Participants</label>
                  <input type="number" value={form.nb_participants} onChange={e=>setForm(p=>({...p, nb_participants:e.target.value}))} style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, padding:11, borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>Annuler</button>
                <button onClick={createClasse} disabled={saving} style={{ flex:1, padding:11, borderRadius:9, border:'none', background:saving?'#1e3a5f':'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:saving?'not-allowed':'pointer' }}>{saving?'⏳':'🎥 Créer'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
