import Head from 'next/head'
import Link from 'next/link'

const MODULES = [
  { id:'conventions', icon:'📄', title:'Conventions', desc:'Conventions, convocations et attestations', href:'/conventions', color:'#0ea5e9' },
  { id:'factures', icon:'💳', title:'Facturation', desc:'Factures OPCO, entreprises, CPF', href:'/factures', color:'#10b981' },
  { id:'qualiopi', icon:'🛡️', title:'Qualiopi', desc:'7 critères · 32 indicateurs', href:'/qualiopi', color:'#f59e0b' },
  { id:'bpf', icon:'📊', title:'BPF automatique', desc:'Bilan Pédagogique et Financier', href:'/bpf', color:'#8b5cf6' },
  { id:'classes', icon:'🎥', title:'Classes virtuelles', desc:'Zoom, Teams, Google Meet', href:'/classes-virtuelles', color:'#06b6d4' },
  { id:'admin', icon:'⚙️', title:'Administration', desc:'Tarifs, apparence, fonctionnalités', href:'/admin', color:'#64748b' },
]

export default function DashboardPage() {
  return (
    <>
      <Head><title>Tableau de bord — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:6 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>✈️</div>
            <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0 }}>Bienvenue sur ANZPilot</h1>
          </div>
          <p style={{ fontSize:14, color:'#94a3b8', marginBottom:32 }}>Pilotez votre organisme de formation depuis une seule plateforme</p>

          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:32 }}>
            {[
              { label:'Sessions', value:'—', icon:'📅', color:'#0ea5e9' },
              { label:'Apprenants', value:'∞', icon:'👥', color:'#10b981' },
              { label:'Score Qualiopi', value:'—', icon:'🛡️', color:'#f59e0b' },
              { label:'CA ce mois', value:'—', icon:'💶', color:'#8b5cf6' },
            ].map(k => (
              <div key={k.label} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:16 }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{k.icon}</div>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:k.color }}>{k.value}</div>
                <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Modules */}
          <div style={{ marginBottom:18 }}>
            <h2 style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 14px' }}>📦 Modules disponibles</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
              {MODULES.map(m => (
                <Link key={m.id} href={m.href} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:20, textDecoration:'none', color:'inherit', transition:'all .15s', display:'block' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = m.color+'66'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10 }}>
                    <div style={{ width:44, height:44, borderRadius:11, background:m.color+'22', border:`1px solid ${m.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{m.icon}</div>
                    <div style={{ fontSize:15, fontWeight:600, color:'#fff' }}>{m.title}</div>
                  </div>
                  <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>{m.desc}</div>
                </Link>
              ))}
            </div>
          </div>

          <div style={{ marginTop:32, padding:16, background:'rgba(14,165,233,.05)', border:'1px solid rgba(14,165,233,.2)', borderRadius:12, fontSize:12, color:'#94a3b8', textAlign:'center' }}>
            💡 Tous les modules sont 100% conformes à la réglementation française des organismes de formation
          </div>
        </div>
      </div>
    </>
  )
}
