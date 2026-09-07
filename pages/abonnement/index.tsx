import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const PLANS_META: any = {
  essai: { label:'Essai gratuit', color:'#f59e0b', icon:'⏳' },
  starter: { label:'Starter', color:'#0ea5e9', icon:'🚀' },
  pro: { label:'Pro', color:'#a855f7', icon:'💼' },
  enterprise: { label:'Enterprise', color:'#f59e0b', icon:'🏢' },
}

const STATUTS_FACTURE: any = {
  pending: { label:'À payer', color:'#f59e0b' },
  paid: { label:'Payée', color:'#10b981' },
  overdue: { label:'En retard', color:'#ef4444' },
  failed: { label:'Échec', color:'#ef4444' },
  cancelled: { label:'Annulée', color:'#64748b' },
}

function fmt(c: number): string { return ((c||0)/100).toLocaleString('fr-FR', { style:'currency', currency:'EUR' }) }

export default function AbonnementPage() {
  const router = useRouter()
  const [organisme, setOrganisme] = useState<any>(null)
  const [factures, setFactures] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const email = localStorage.getItem('anzpilot_user_email') || sessionStorage.getItem('anzpilot_user_email')
    if (!email) { router.push('/login'); return }
    fetch(`/api/of/abonnement?email=${encodeURIComponent(email)}`).then(r=>r.json()).then(d=>{
      setOrganisme(d.organisme||null); setFactures(d.factures||[]); setPlans(d.plans||[]); setLoading(false)
    }).catch(()=>setLoading(false))
  }, [router])

  if (loading) return <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans,system-ui' }}>⏳ Chargement...</div>

  if (!organisme) return <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans,system-ui', padding:24 }}>
    <div style={{ textAlign:'center', maxWidth:400 }}>
      <div style={{ fontSize:48, marginBottom:14 }}>🔒</div>
      <h2 style={{ marginBottom:14 }}>Non connecté</h2>
      <a href="/login" style={{ color:'#0ea5e9' }}>← Retour au login</a>
    </div>
  </div>

  const planMeta = PLANS_META[organisme.plan] || PLANS_META.essai
  const joursRestants = organisme.joursRestants
  const isEssai = organisme.statut === 'essai'
  const isActif = organisme.statut === 'actif'
  const isBloque = organisme.statut === 'bloque'

  return (
    <>
      <Head><title>Mon abonnement — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:14 }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0 }}>💳 Mon abonnement</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>{organisme.nom || organisme.email}</p>
            </div>
            <a href="/dashboard" style={{ padding:'10px 18px', borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', textDecoration:'none', fontSize:13 }}>← Tableau de bord</a>
          </div>

          {/* Statut */}
          <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
              <div style={{ width:64, height:64, borderRadius:14, background:`linear-gradient(135deg,${planMeta.color},${planMeta.color}cc)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>{planMeta.icon}</div>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Plan actuel</div>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:26, fontWeight:700, color:'#fff' }}>{planMeta.label}</div>
                <div style={{ fontSize:13, color:isActif?'#10b981':isEssai?'#f59e0b':'#ef4444', fontWeight:600, marginTop:6 }}>
                  {isActif && '● Abonnement actif'}
                  {isEssai && joursRestants !== null && joursRestants > 0 && `● Essai gratuit — ${joursRestants} jour${joursRestants>1?'s':''} restant${joursRestants>1?'s':''}`}
                  {isEssai && joursRestants !== null && joursRestants <= 0 && '⚠️ Essai expiré'}
                  {isBloque && '🔴 Accès bloqué'}
                </div>
              </div>
              {(isEssai || isBloque) && (
                <a href="#plans" style={{ padding:'12px 22px', borderRadius:10, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:600 }}>
                  🚀 Voir les plans
                </a>
              )}
            </div>
          </div>

          {/* Plans disponibles */}
          <h2 id="plans" style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#fff', margin:'24px 0 14px' }}>💎 Plans disponibles</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16, marginBottom:24 }}>
            {plans.filter((p:any)=>p.is_active && p.slug!=='essai').map((p:any) => (
              <div key={p.id} style={{ background:'rgba(255,255,255,.04)', border:p.is_featured?'2px solid #0ea5e9':'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24, position:'relative' }}>
                {p.is_featured && <div style={{ position:'absolute', top:-10, right:18, padding:'3px 10px', borderRadius:12, background:'#0ea5e9', color:'#fff', fontSize:10, fontWeight:700 }}>★ POPULAIRE</div>}
                <h3 style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>{p.nom}</h3>
                <p style={{ fontSize:12, color:'#64748b', margin:'0 0 14px', minHeight:32 }}>{p.description||'—'}</p>
                <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:18 }}>
                  <div style={{ fontFamily:'Sora,Georgia', fontSize:32, fontWeight:700, color:'#0ea5e9' }}>{fmt(p.prix_mensuel)}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>/mois HT</div>
                </div>
                <div style={{ fontSize:12, color:'#94a3b8', whiteSpace:'pre-line', marginBottom:18, lineHeight:1.7 }}>{(p.features||'').replace(/&#10;/g,'\n')}</div>
                <a href={`mailto:contact@anzpilot.com?subject=Souscription au plan ${p.nom}&body=Bonjour,%0A%0AJe souhaite passer au plan ${p.nom} pour mon organisme ${organisme.nom||''}.%0A%0AEmail : ${organisme.email}%0A%0AMerci de m'envoyer les modalités de paiement.%0A%0ACordialement`}
                   style={{ display:'block', textAlign:'center', padding:'12px', borderRadius:10, background:p.is_featured?'linear-gradient(135deg,#0ea5e9,#2563eb)':'rgba(255,255,255,.06)', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:600, border:p.is_featured?'none':'1px solid rgba(255,255,255,.1)' }}>
                  ✉️ Demander à souscrire
                </a>
              </div>
            ))}
          </div>

          {/* Factures */}
          <h2 style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#fff', margin:'24px 0 14px' }}>📄 Mes factures</h2>
          {factures.length === 0 ? (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>📄</div>
              <div style={{ fontSize:14, color:'#64748b' }}>Aucune facture pour le moment</div>
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 110px 110px 100px', gap:14, padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.06em' }}>
                <div>N° Facture</div>
                <div>Période</div>
                <div>Montant</div>
                <div>Émission</div>
                <div>Statut</div>
              </div>
              {factures.map((f:any, i:number) => {
                const s = STATUTS_FACTURE[f.statut] || STATUTS_FACTURE.pending
                return (
                  <div key={f.id} style={{ display:'grid', gridTemplateColumns:'130px 1fr 110px 110px 100px', gap:14, padding:14, borderBottom: i<factures.length-1?'1px solid rgba(255,255,255,.05)':'none', alignItems:'center' }}>
                    <div style={{ fontFamily:'monospace', fontSize:12, color:'#fff' }}>{f.numero}</div>
                    <div style={{ fontSize:13, color:'#fff' }}>Plan {f.plan_slug} ({f.periode})</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{fmt(f.montant_ttc)}</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>{new Date(f.date_emission).toLocaleDateString('fr-FR')}</div>
                    <span style={{ padding:'4px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:s.color+'22', color:s.color }}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </>
  )
}

