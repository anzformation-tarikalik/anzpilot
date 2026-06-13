import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface Convention {
  id: string
  numero: string
  type: string
  apprenant_nom: string
  formation_titre: string
  date_debut: string
  date_fin: string
  prix_ttc: number
  statut: string
  created_at: string
}

export default function ConventionsList() {
  const [conventions, setConventions] = useState<Convention[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/conventions/list')
      .then(r => r.json())
      .then(d => { setConventions(d.conventions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? conventions : conventions.filter(c => c.type === filter)
  const totalCA = conventions.reduce((s, c) => s + (c.prix_ttc || 0), 0)

  return (
    <>
      <Head><title>Conventions — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:'24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0 }}>📄 Documents légaux</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Conventions, convocations et attestations de formation</p>
            </div>
            <Link href="/conventions/new" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 22px', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:600 }}>
              ➕ Nouveau document
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 }}>
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18 }}>
              <div style={{ fontSize:24, marginBottom:8 }}>📄</div>
              <div style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#0ea5e9' }}>{conventions.length}</div>
              <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>Total documents</div>
            </div>
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18 }}>
              <div style={{ fontSize:24, marginBottom:8 }}>✅</div>
              <div style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#10b981' }}>{conventions.filter(c=>c.statut==='signe').length}</div>
              <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>Signés</div>
            </div>
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18 }}>
              <div style={{ fontSize:24, marginBottom:8 }}>⏳</div>
              <div style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#f59e0b' }}>{conventions.filter(c=>c.statut==='en_attente').length}</div>
              <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>En attente</div>
            </div>
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18 }}>
              <div style={{ fontSize:24, marginBottom:8 }}>💰</div>
              <div style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#8b5cf6' }}>{totalCA.toLocaleString('fr-FR')}€</div>
              <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>CA conventionné</div>
            </div>
          </div>

          {/* Filtres */}
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {[
              ['all','Tous'],
              ['convention','📄 Conventions'],
              ['convocation','📩 Convocations'],
              ['attestation','🎓 Attestations'],
              ['programme','📋 Programmes'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)}
                style={{ padding:'8px 14px', borderRadius:8, border:filter===id?'1px solid #0ea5e9':'1px solid rgba(255,255,255,.1)', background:filter===id?'rgba(14,165,233,.15)':'rgba(255,255,255,.04)', color:filter===id?'#0ea5e9':'#94a3b8', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Liste */}
          {loading ? (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:48, textAlign:'center', color:'#64748b' }}>
              ⏳ Chargement des documents...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>📄</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#fff', marginBottom:6 }}>Aucun document pour l'instant</div>
              <div style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>Créez votre première convention de formation en 2 minutes</div>
              <Link href="/conventions/new" style={{ display:'inline-block', padding:'11px 22px', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:9, textDecoration:'none', fontSize:13, fontWeight:600 }}>
                ➕ Créer mon premier document
              </Link>
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, overflow:'hidden' }}>
              {filtered.map((c, i) => (
                <Link key={c.id} href={`/conventions/${c.id}`} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto auto', gap:16, padding:16, borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,.05)':'none', alignItems:'center', textDecoration:'none', color:'inherit', transition:'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width:40, height:40, borderRadius:10, background:c.type==='convention'?'rgba(14,165,233,.15)':c.type==='attestation'?'rgba(16,185,129,.15)':c.type==='convocation'?'rgba(245,158,11,.15)':'rgba(139,92,246,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                    {c.type==='convention'?'📄':c.type==='attestation'?'🎓':c.type==='convocation'?'📩':'📋'}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{c.numero} — {c.apprenant_nom}</div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{c.formation_titre}</div>
                  </div>
                  <div style={{ fontSize:12, color:'#94a3b8' }}>
                    {new Date(c.date_debut).toLocaleDateString('fr-FR')} → {new Date(c.date_fin).toLocaleDateString('fr-FR')}
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#10b981' }}>
                    {c.prix_ttc ? c.prix_ttc.toLocaleString('fr-FR')+'€' : '—'}
                  </div>
                  <div style={{ padding:'4px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:c.statut==='signe'?'rgba(16,185,129,.15)':'rgba(245,158,11,.15)', color:c.statut==='signe'?'#10b981':'#f59e0b' }}>
                    {c.statut==='signe'?'✅ Signé':'⏳ En attente'}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div style={{ marginTop:24, textAlign:'center' }}>
            <Link href="/dashboard" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour au tableau de bord</Link>
          </div>
        </div>
      </div>
    </>
  )
}
