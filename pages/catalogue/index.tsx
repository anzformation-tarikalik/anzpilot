import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface Modele {
  id: string
  titre: string
  objectifs: string
  programme: string
  modalites: string
  duree_heures: number
  lieu: string
  prix_ht: number
  tva_taux: number
  categorie: string
}

const empty: Modele = { id:'', titre:'', objectifs:'', programme:'', modalites:'présentiel', duree_heures:0, lieu:'', prix_ht:0, tva_taux:0, categorie:'' }

export default function Catalogue() {
  const [modeles, setModeles] = useState<Modele[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Modele>(empty)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])
  function load() {
    setLoading(true)
    fetch('/api/modeles/list').then(r=>r.json()).then(d=>{ setModeles(d.modeles||[]); setLoading(false) }).catch(()=>setLoading(false))
  }

  function openNew() { setEditing({ ...empty }); setShowForm(true) }
  function openEdit(m: Modele) { setEditing({ ...m }); setShowForm(true) }
  const update = (k:string, v:any) => setEditing(p => ({ ...p, [k]: v }))

  async function saveModele() {
    if (!editing.titre) { alert('Le titre est obligatoire'); return }
    setSaving(true)
    try {
      if (editing.id) {
        // Suppression puis recréation pour faire un "update" simple
        await fetch('/api/modeles/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: editing.id }) })
      }
      const res = await fetch('/api/modeles/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(editing) })
      const d = await res.json()
      if (d.success) { setShowForm(false); load() }
      else alert('Erreur: '+(d.error||'inconnue'))
    } catch(e:any) { alert(e.message) }
    setSaving(false)
  }

  async function deleteModele(id: string, titre: string) {
    if (!confirm(`Supprimer "${titre}" du catalogue ?`)) return
    try {
      const res = await fetch('/api/modeles/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
      const d = await res.json()
      if (d.success) load()
      else alert('Erreur: '+(d.error||'inconnue'))
    } catch(e:any) { alert(e.message) }
  }

  const categories = Array.from(new Set(modeles.map(m => m.categorie).filter(Boolean)))
  const filtered = filter === 'all' ? modeles : modeles.filter(m => m.categorie === filter)
  const totalCA = modeles.reduce((s,m) => s+(m.prix_ht||0), 0)

  const labelStyle = { display:'block' as const, fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' as const, letterSpacing:'.06em' }
  const inputStyle = { width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }

  return (
    <>
      <Head><title>Catalogue de formations — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <Link href="/dashboard" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour</Link>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'12px 0 24px', flexWrap:'wrap', gap:14 }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0 }}>📚 Catalogue de formations</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Personnalisez vos formations et leurs tarifs · Réutilisables à l'infini</p>
            </div>
            <button onClick={openNew} style={{ padding:'12px 22px', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:10, border:'none', cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:'DM Sans,system-ui' }}>➕ Nouvelle formation</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
            {[
              ['📚','Total formations',modeles.length,'#0ea5e9'],
              ['⏱️','Heures cumulées',modeles.reduce((s,m)=>s+(m.duree_heures||0),0)+'h','#10b981'],
              ['💰','CA potentiel',Math.round(totalCA).toLocaleString('fr-FR')+'€','#8b5cf6'],
              ['🗂️','Catégories',categories.length,'#f59e0b'],
            ].map(([icon,label,val,color]:any)=>(
              <div key={label} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18 }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color }}>{val}</div>
                <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          {categories.length > 0 && (
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <button onClick={()=>setFilter('all')} style={{ padding:'8px 14px', borderRadius:8, border:filter==='all'?'1px solid #0ea5e9':'1px solid rgba(255,255,255,.1)', background:filter==='all'?'rgba(14,165,233,.15)':'rgba(255,255,255,.04)', color:filter==='all'?'#0ea5e9':'#94a3b8', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>Toutes</button>
              {categories.map(cat => (
                <button key={cat} onClick={()=>setFilter(cat)} style={{ padding:'8px 14px', borderRadius:8, border:filter===cat?'1px solid #0ea5e9':'1px solid rgba(255,255,255,.1)', background:filter===cat?'rgba(14,165,233,.15)':'rgba(255,255,255,.04)', color:filter===cat?'#0ea5e9':'#94a3b8', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>{cat}</button>
              ))}
            </div>
          )}

          {loading ? <div style={{ padding:48, textAlign:'center', color:'#64748b' }}>⏳ Chargement...</div>
          : filtered.length === 0 ? (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>📚</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#fff', marginBottom:6 }}>Aucune formation dans votre catalogue</div>
              <div style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>Créez vos formations une fois, réutilisez-les pour toutes vos conventions</div>
              <button onClick={openNew} style={{ padding:'11px 22px', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui' }}>➕ Créer ma première formation</button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:14 }}>
              {filtered.map(m => (
                <div key={m.id} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18, display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:2 }}>{m.titre}</div>
                      {m.categorie && <div style={{ display:'inline-block', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:600, background:'rgba(139,92,246,.15)', color:'#a78bfa' }}>{m.categorie}</div>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:10, fontSize:12, color:'#64748b' }}>
                    <span>⏱️ {m.duree_heures || '—'}h</span>
                    <span>📍 {m.modalites}</span>
                  </div>
                  {m.objectifs && <div style={{ fontSize:11, color:'#94a3b8', lineHeight:1.4, maxHeight:50, overflow:'hidden' }}>{m.objectifs.slice(0,150)}{m.objectifs.length>150?'...':''}</div>}
                  <div style={{ marginTop:'auto', display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:'1px solid rgba(255,255,255,.05)' }}>
                    <div>
                      <div style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#10b981' }}>{(m.prix_ht||0).toLocaleString('fr-FR')}€</div>
                      <div style={{ fontSize:10, color:'#64748b' }}>Net de taxes (art. 261-4-4 CGI)</div>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>openEdit(m)} style={{ padding:'8px 12px', borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:12, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>✏️ Modifier</button>
                      <button onClick={()=>deleteModele(m.id, m.titre)} style={{ padding:'8px 12px', borderRadius:7, border:'1px solid rgba(239,68,68,.2)', background:'rgba(239,68,68,.1)', color:'#ef4444', fontSize:12, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Création/Édition */}
        {showForm && (
          <div onClick={()=>setShowForm(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:24, maxWidth:650, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
              <h3 style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 18px' }}>
                {editing.id ? '✏️ Modifier la formation' : '➕ Nouvelle formation'}
              </h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div style={{ gridColumn:'1 / -1' }}><label style={labelStyle}>Titre de la formation *</label><input value={editing.titre} onChange={e=>update('titre',e.target.value)} placeholder="Ex: Diagnostic immobilier certifié COFRAC" style={inputStyle}/></div>
                <div><label style={labelStyle}>Catégorie</label><input value={editing.categorie} onChange={e=>update('categorie',e.target.value)} placeholder="Ex: Immobilier, RH, Compta..." style={inputStyle}/></div>
                <div>
                  <label style={labelStyle}>Modalités</label>
                  <select value={editing.modalites} onChange={e=>update('modalites',e.target.value)} style={inputStyle}>
                    <option value="présentiel">Présentiel</option>
                    <option value="distanciel">Distanciel</option>
                    <option value="mixte">Mixte</option>
                    <option value="e-learning">E-learning</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Durée (heures)</label><input type="number" value={editing.duree_heures} onChange={e=>update('duree_heures', parseInt(e.target.value)||0)} style={inputStyle}/></div>
                <div><label style={labelStyle}>Lieu type</label><input value={editing.lieu} onChange={e=>update('lieu',e.target.value)} placeholder="Centre ANZ Paris" style={inputStyle}/></div>
                <div style={{ gridColumn:'1 / -1' }}><label style={labelStyle}>Prix (€) — TVA non applicable, art. 261-4-4 du CGI</label><input type="number" value={editing.prix_ht} onChange={e=>update('prix_ht', parseFloat(e.target.value)||0)} placeholder="2000" style={inputStyle}/></div>
                <div style={{ gridColumn:'1 / -1' }}><label style={labelStyle}>Objectifs pédagogiques</label><textarea rows={3} value={editing.objectifs} onChange={e=>update('objectifs',e.target.value)} placeholder="À l'issue de cette formation, l'apprenant sera capable de..." style={{...inputStyle, resize:'vertical' as const}}/></div>
                <div style={{ gridColumn:'1 / -1' }}><label style={labelStyle}>Programme détaillé</label><textarea rows={4} value={editing.programme} onChange={e=>update('programme',e.target.value)} placeholder={`Jour 1: Introduction\nJour 2: Pratique\nJour 3: Évaluation`} style={{...inputStyle, resize:'vertical' as const}}/></div>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, padding:11, borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>Annuler</button>
                <button onClick={saveModele} disabled={saving} style={{ flex:1, padding:11, borderRadius:9, border:'none', background:saving?'#1e3a5f':'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:saving?'not-allowed':'pointer' }}>{saving?'⏳':editing.id?'💾 Enregistrer':'➕ Créer'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
