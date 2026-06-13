import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface Facture {
  id: string
  numero: string
  destinataire_nom: string
  destinataire_type: string
  apprenant_nom: string
  formation_titre: string
  date_emission: string
  date_echeance: string
  prix_ttc: number
  statut: string
}

export default function FacturesList() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/factures/list').then(r=>r.json()).then(d=>{ setFactures(d.factures||[]); setLoading(false) }).catch(()=>setLoading(false))
  }, [])

  const filtered = filter === 'all' ? factures : factures.filter(f => f.statut === filter)
  const totalEmis = factures.reduce((s,f)=>s+(f.prix_ttc||0),0)
  const totalPaye = factures.filter(f=>f.statut==='payee').reduce((s,f)=>s+(f.prix_ttc||0),0)
  const totalAttente = factures.filter(f=>f.statut==='en_attente').reduce((s,f)=>s+(f.prix_ttc||0),0)

  return (
    <>
      <Head><title>Facturation — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0 }}>💳 Facturation</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Factures OPCO, entreprises et apprenants</p>
            </div>
            <Link href="/factures/new" style={{ padding:'12px 22px', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:600 }}>➕ Nouvelle facture</Link>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
            {[
              ['💰', 'CA émis', totalEmis.toLocaleString('fr-FR')+'€', '#0ea5e9'],
              ['✅', 'Encaissé', totalPaye.toLocaleString('fr-FR')+'€', '#10b981'],
              ['⏳', 'En attente', totalAttente.toLocaleString('fr-FR')+'€', '#f59e0b'],
              ['📄', 'Total factures', String(factures.length), '#8b5cf6'],
            ].map(([icon,label,val,color]:any) => (
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
              <div style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>Créez votre première facture en 2 minutes</div>
              <Link href="/factures/new" style={{ display:'inline-block', padding:'11px 22px', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', borderRadius:9, textDecoration:'none', fontSize:13, fontWeight:600 }}>➕ Créer une facture</Link>
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, overflow:'hidden' }}>
              {filtered.map((f,i) => (
                <Link key={f.id} href={`/factures/${f.id}`} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto auto', gap:14, padding:14, borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,.05)':'none', alignItems:'center', textDecoration:'none', color:'inherit' }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'rgba(14,165,233,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>💳</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{f.numero} — {f.destinataire_nom}</div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{f.formation_titre} · {f.apprenant_nom}</div>
                  </div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>Émise: {new Date(f.date_emission).toLocaleDateString('fr-FR')}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#10b981' }}>{f.prix_ttc?.toLocaleString('fr-FR')}€</div>
                  <div style={{ padding:'4px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:f.statut==='payee'?'rgba(16,185,129,.15)':f.statut==='retard'?'rgba(239,68,68,.15)':'rgba(245,158,11,.15)', color:f.statut==='payee'?'#10b981':f.statut==='retard'?'#ef4444':'#f59e0b' }}>{f.statut==='payee'?'✅ Payée':f.statut==='retard'?'🔴 Retard':'⏳ Attente'}</div>
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
