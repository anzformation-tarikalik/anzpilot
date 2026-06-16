import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface Facture {
  id: string
  numero: string
  destinataire_nom: string
  destinataire_type: string
  destinataire_email: string
  apprenant_nom: string
  formation_titre: string
  date_emission: string
  date_echeance: string
  prix_ht: number
  statut: string
}

const STATUTS: any = {
  brouillon: { label:'Brouillon', icon:'📝', color:'#64748b', bg:'rgba(100,116,139,.15)' },
  en_attente: { label:'En attente', icon:'⏳', color:'#f59e0b', bg:'rgba(245,158,11,.15)' },
  payee: { label:'Payée', icon:'✅', color:'#10b981', bg:'rgba(16,185,129,.15)' },
  retard: { label:'En retard', icon:'🔴', color:'#ef4444', bg:'rgba(239,68,68,.15)' },
}

export default function FacturesList() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [openMenu, setOpenMenu] = useState<string|null>(null)
  const [relancing, setRelancing] = useState<string|null>(null)
  const [showRelanceModal, setShowRelanceModal] = useState<Facture|null>(null)
  const [messagePerso, setMessagePerso] = useState('')

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    fetch('/api/factures/list').then(r=>r.json()).then(d=>{ 
      const list = d.factures || []
      // Auto-détection en retard
      const today = new Date(); today.setHours(0,0,0,0)
      list.forEach((f:Facture) => {
        if (f.statut === 'en_attente' && f.date_echeance && new Date(f.date_echeance) < today) {
          f.statut = 'retard'
          // Mettre à jour en BDD silencieusement
          fetch('/api/factures/update-status', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: f.id, statut: 'retard' }) })
        }
      })
      setFactures(list); setLoading(false) 
    }).catch(()=>setLoading(false))
  }

  async function changeStatus(id: string, newStatut: string) {
    setOpenMenu(null)
    setFactures(p => p.map(f => f.id === id ? { ...f, statut: newStatut } : f))
    try {
      const res = await fetch('/api/factures/update-status', { 
        method:'POST', headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ id, statut: newStatut }) 
      })
      const d = await res.json()
      if (!d.success) { alert('Erreur: '+(d.error||'')); load() }
    } catch(e:any) { alert(e.message); load() }
  }

  async function envoyerRelance(f: Facture, message: string) {
    setRelancing(f.id)
    try {
      const res = await fetch('/api/factures/relancer', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id: f.id, message_perso: message })
      })
      const d = await res.json()
      if (d.success) {
        alert('✅ '+d.message)
        setShowRelanceModal(null)
        setMessagePerso('')
      } else alert('❌ '+(d.error||'Erreur inconnue'))
    } catch(e:any) { alert(e.message) }
    setRelancing(null)
  }

  const filtered = filter === 'all' ? factures : factures.filter(f => f.statut === filter)
  const totalEmis = factures.reduce((s,f)=>s+(f.prix_ht||0),0)
  const totalPaye = factures.filter(f=>f.statut==='payee').reduce((s,f)=>s+(f.prix_ht||0),0)
  const totalAttente = factures.filter(f=>f.statut==='en_attente'||f.statut==='retard').reduce((s,f)=>s+(f.prix_ht||0),0)
  const totalRetard = factures.filter(f=>f.statut==='retard').reduce((s,f)=>s+(f.prix_ht||0),0)

  return (
    <>
      <Head><title>Facturation — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }} onClick={()=>setOpenMenu(null)}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <Link href="/dashboard" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour</Link>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'12px 0 24px', flexWrap:'wrap', gap:14 }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0 }}>💳 Facturation</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Factures OPCO, entreprises et apprenants · Relances automatiques</p>
            </div>
            <Link href="/factures/new" style={{ padding:'12px 22px', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:600 }}>➕ Nouvelle facture</Link>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
            {[
              ['💰','CA émis',totalEmis.toLocaleString('fr-FR')+'€','#0ea5e9'],
              ['✅','Encaissé',totalPaye.toLocaleString('fr-FR')+'€','#10b981'],
              ['⏳','En attente',totalAttente.toLocaleString('fr-FR')+'€','#f59e0b'],
              ['🔴','En retard',totalRetard.toLocaleString('fr-FR')+'€','#ef4444'],
            ].map(([icon,label,val,color]:any)=>(
              <div key={label} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18 }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color }}>{val}</div>
                <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {[['all','Toutes'],['brouillon','📝 Brouillons'],['en_attente','⏳ En attente'],['payee','✅ Payées'],['retard','🔴 En retard']].map(([id,label]:any)=>(
              <button key={id} onClick={()=>setFilter(id)} style={{ padding:'8px 14px', borderRadius:8, border:filter===id?'1px solid #0ea5e9':'1px solid rgba(255,255,255,.1)', background:filter===id?'rgba(14,165,233,.15)':'rgba(255,255,255,.04)', color:filter===id?'#0ea5e9':'#94a3b8', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>{label}</button>
            ))}
          </div>

          {loading ? <div style={{ padding:48, textAlign:'center', color:'#64748b' }}>⏳ Chargement...</div>
          : filtered.length === 0 ? (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>💳</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#fff', marginBottom:6 }}>Aucune facture</div>
              <Link href="/factures/new" style={{ display:'inline-block', padding:'11px 22px', marginTop:16, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:9, textDecoration:'none', fontSize:13, fontWeight:600 }}>➕ Créer une facture</Link>
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, overflow:'visible' }}>
              {filtered.map((f,i) => {
                const s = STATUTS[f.statut] || STATUTS.en_attente
                const isLate = f.statut === 'retard' || f.statut === 'en_attente'
                return (
                  <div key={f.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto auto auto', gap:14, padding:14, borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,.05)':'none', alignItems:'center' }}>
                    <Link href={`/factures/${f.id}`} style={{ width:40, height:40, borderRadius:10, background:'rgba(14,165,233,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, textDecoration:'none' }}>💳</Link>
                    <Link href={`/factures/${f.id}`} style={{ textDecoration:'none', color:'inherit' }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{f.numero} — {f.destinataire_nom}</div>
                      <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{f.formation_titre} · {f.apprenant_nom}</div>
                    </Link>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>
                      <div>Émise: {new Date(f.date_emission).toLocaleDateString('fr-FR')}</div>
                      {f.date_echeance && <div style={{ color: f.statut==='retard'?'#ef4444':'#64748b', marginTop:2 }}>Échéance: {new Date(f.date_echeance).toLocaleDateString('fr-FR')}</div>}
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#10b981' }}>{f.prix_ht?.toLocaleString('fr-FR')}€</div>
                    {/* Dropdown statut */}
                    <div style={{ position:'relative' }} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>setOpenMenu(openMenu===f.id?null:f.id)} style={{ padding:'6px 12px', borderRadius:12, fontSize:11, fontWeight:600, background:s.bg, color:s.color, border:`1px solid ${s.color}40`, cursor:'pointer', fontFamily:'DM Sans,system-ui', display:'flex', alignItems:'center', gap:4 }}>
                        {s.icon} {s.label} ▾
                      </button>
                      {openMenu===f.id && (
                        <div style={{ position:'absolute', top:'100%', right:0, marginTop:4, background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, padding:6, zIndex:50, minWidth:150, boxShadow:'0 8px 24px rgba(0,0,0,.4)' }}>
                          {Object.entries(STATUTS).map(([id, st]:any)=>(
                            <button key={id} onClick={()=>changeStatus(f.id, id)} style={{ display:'block', width:'100%', textAlign:'left', padding:'7px 10px', borderRadius:6, border:'none', background: f.statut===id?'rgba(255,255,255,.05)':'transparent', color:st.color, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,system-ui', marginBottom:2 }}>
                              {st.icon} {st.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Relance */}
                    {isLate && f.destinataire_email ? (
                      <button onClick={()=>setShowRelanceModal(f)} disabled={relancing===f.id} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid '+(f.statut==='retard'?'rgba(239,68,68,.3)':'rgba(245,158,11,.3)'), background: f.statut==='retard'?'rgba(239,68,68,.1)':'rgba(245,158,11,.1)', color: f.statut==='retard'?'#ef4444':'#f59e0b', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>
                        {relancing===f.id?'⏳':'📧 Relancer'}
                      </button>
                    ) : <div/>}
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop:24, textAlign:'center' }}>
            <Link href="/dashboard" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour au tableau de bord</Link>
          </div>
        </div>

        {/* Modal Relance */}
        {showRelanceModal && (
          <div onClick={()=>setShowRelanceModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:24, maxWidth:500, width:'100%' }}>
              <h3 style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>📧 Envoyer une relance</h3>
              <p style={{ fontSize:13, color:'#64748b', margin:'0 0 18px' }}>À : <strong style={{ color:'#0ea5e9' }}>{showRelanceModal.destinataire_email}</strong></p>

              <div style={{ background:'rgba(245,158,11,.05)', border:'1px solid rgba(245,158,11,.2)', borderRadius:9, padding:12, marginBottom:14, fontSize:12 }}>
                <div style={{ color:'#fcd34d', fontWeight:600, marginBottom:4 }}>Facture {showRelanceModal.numero}</div>
                <div style={{ color:'#94a3b8' }}>Montant : <strong>{showRelanceModal.prix_ht?.toLocaleString('fr-FR')}€</strong></div>
                <div style={{ color:'#94a3b8' }}>Échéance : {new Date(showRelanceModal.date_echeance).toLocaleDateString('fr-FR')}</div>
              </div>

              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' }}>Message personnel (facultatif)</label>
              <textarea value={messagePerso} onChange={e=>setMessagePerso(e.target.value)} rows={4} placeholder="Ajoutez un mot personnel à votre relance..." style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', resize:'vertical', marginBottom:18 }}/>

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setShowRelanceModal(null)} style={{ flex:1, padding:11, borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>Annuler</button>
                <button onClick={()=>envoyerRelance(showRelanceModal, messagePerso)} disabled={relancing===showRelanceModal.id} style={{ flex:1, padding:11, borderRadius:9, border:'none', background:relancing===showRelanceModal.id?'#1e3a5f':'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:relancing===showRelanceModal.id?'not-allowed':'pointer' }}>
                  {relancing===showRelanceModal.id?'⏳ Envoi...':'📧 Envoyer la relance'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
