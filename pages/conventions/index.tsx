import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'

interface Convention {
  id: string
  numero: string
  type: string
  apprenant_nom: string
  formation_titre: string
  date_debut: string
  prix_ht: number
  statut: string
}

const TYPE_LABELS: any = {
  convention: { label:'Convention', icon:'📄', color:'#0ea5e9' },
  convocation: { label:'Convocation', icon:'📩', color:'#8b5cf6' },
  attestation: { label:'Attestation', icon:'🎓', color:'#10b981' },
  programme: { label:'Programme', icon:'📋', color:'#f59e0b' },
}

export default function ConventionsList() {
  const [items, setItems] = useState<Convention[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [deleting, setDeleting] = useState<string|null>(null)

  useEffect(() => { load() }, [])
  function load() {
    setLoading(true)
    fetch('/api/conventions/list').then(r=>r.json()).then(d=>{ setItems(d.conventions||[]); setLoading(false) }).catch(()=>setLoading(false))
  }

  async function supprimer(c: Convention) {
    if (!confirm(`Supprimer définitivement "${c.numero}" ?\n\nCette action est irréversible.`)) return
    setDeleting(c.id)
    try {
      const res = await fetch('/api/conventions/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: c.id }) })
      const d = await res.json()
      if (d.success) setItems(p => p.filter(x => x.id !== c.id))
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
    setDeleting(null)
  }

  const filtered = filter==='all' ? items : items.filter(c => c.type===filter)

  return (
    <>
      <Head><title>Conventions — ANZPilot</title></Head>
      <Layout>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:14 }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0 }}>📄 Conventions & documents</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Conventions, convocations, attestations et programmes</p>
            </div>
            <Link href="/conventions/new" style={{ padding:'12px 22px', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:600 }}>➕ Nouveau document</Link>
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {[['all','Tous'],['convention','📄 Conventions'],['convocation','📩 Convocations'],['attestation','🎓 Attestations'],['programme','📋 Programmes']].map(([id,label]:any)=>(
              <button key={id} onClick={()=>setFilter(id)} style={{ padding:'8px 14px', borderRadius:8, border:filter===id?'1px solid #0ea5e9':'1px solid rgba(255,255,255,.1)', background:filter===id?'rgba(14,165,233,.15)':'rgba(255,255,255,.04)', color:filter===id?'#0ea5e9':'#94a3b8', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>{label}</button>
            ))}
          </div>

          {loading ? <div style={{ padding:48, textAlign:'center', color:'#64748b' }}>⏳ Chargement...</div>
          : filtered.length === 0 ? (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>📄</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#fff', marginBottom:6 }}>Aucun document</div>
              <Link href="/conventions/new" style={{ display:'inline-block', padding:'11px 22px', marginTop:14, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:9, textDecoration:'none', fontSize:13, fontWeight:600 }}>➕ Créer un document</Link>
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, overflow:'hidden' }}>
              {filtered.map((c,i) => {
                const t = TYPE_LABELS[c.type] || TYPE_LABELS.convention
                return (
                  <div key={c.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto auto', gap:14, padding:14, borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,.05)':'none', alignItems:'center' }}>
                    <Link href={`/conventions/${c.id}`} style={{ width:40, height:40, borderRadius:10, background:t.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, textDecoration:'none' }}>{t.icon}</Link>
                    <Link href={`/conventions/${c.id}`} style={{ textDecoration:'none', color:'inherit' }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{c.numero} — {c.formation_titre}</div>
                      <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{t.label} · {c.apprenant_nom}{c.date_debut?` · ${new Date(c.date_debut).toLocaleDateString('fr-FR')}`:''}</div>
                    </Link>
                    <div style={{ fontSize:14, fontWeight:600, color:'#10b981' }}>{c.prix_ht?.toLocaleString('fr-FR')||0}€</div>
                    <Link href={`/conventions/${c.id}`} style={{ padding:'7px 12px', borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:12, textDecoration:'none', fontFamily:'DM Sans,system-ui' }}>👁️ Voir</Link>
                    <button onClick={()=>supprimer(c)} disabled={deleting===c.id} style={{ padding:'7px 12px', borderRadius:7, border:'1px solid rgba(239,68,68,.2)', background:'rgba(239,68,68,.1)', color:'#ef4444', fontSize:12, fontWeight:600, cursor:deleting===c.id?'wait':'pointer', fontFamily:'DM Sans,system-ui' }}>
                      {deleting===c.id?'⏳':'🗑️'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Layout>
    </>
  )
}
