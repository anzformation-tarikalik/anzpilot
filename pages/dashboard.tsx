import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const MENU_SECTIONS = [
  {
    title: null,
    items: [
      { id:'home', icon:'⊞', label:'Tableau de bord', href:'/dashboard' },
      { id:'sessions', icon:'📅', label:'Sessions', href:'/classes-virtuelles' },
      { id:'visio', icon:'🎥', label:'ANZPilot Visio', href:'/visio', badge:'NEW' },
      { id:'catalogue', icon:'📚', label:'Catalogue', href:'/catalogue', badge:'NEW' },
      { id:'apprenants', icon:'👥', label:'Espace apprenants', href:'#' },
    ]
  },
  {
    title: 'ADMINISTRATIF',
    items: [
      { id:'conventions', icon:'📄', label:'Conventions & docs', href:'/conventions' },
      { id:'factures', icon:'💳', label:'Facturation', href:'/factures' },
      { id:'bpf', icon:'📊', label:'BPF automatique', href:'/bpf' },
    ]
  },
  {
    title: 'CONFORMITÉ',
    items: [
      { id:'qualiopi', icon:'🛡️', label:'Qualiopi', href:'/qualiopi' },
    ]
  },
  {
    title: 'CONFIGURATION',
    items: [
      { id:'admin', icon:'⚙️', label:'Administration', href:'/admin' },
    ]
  },
]

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <Head><title>Tableau de bord — ANZPilot</title></Head>
      <div style={{ display:'flex', minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui' }}>

        {/* SIDEBAR */}
        <aside style={{ width: collapsed?72:240, flexShrink:0, background:'#0a1628', borderRight:'1px solid rgba(255,255,255,.06)', display:'flex', flexDirection:'column', transition:'width .2s', position:'sticky', top:0, height:'100vh' }}>
          {/* Logo */}
          <div style={{ padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>✈️</div>
            {!collapsed && (
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:16, fontWeight:700, color:'#fff' }}>ANZPilot</div>
                <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>Plan Essai · 14 jours restants</div>
              </div>
            )}
          </div>

          {/* Menu */}
          <nav style={{ flex:1, overflowY:'auto', padding:'14px 8px' }}>
            {MENU_SECTIONS.map((section, si) => (
              <div key={si} style={{ marginBottom: section.title ? 18 : 0 }}>
                {!collapsed && section.title && (
                  <div style={{ padding:'8px 10px', fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.08em' }}>{section.title}</div>
                )}
                {section.items.map(item => (
                  <Link key={item.id} href={item.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, color:'#94a3b8', textDecoration:'none', fontSize:13, fontWeight:500, marginBottom:2, transition:'all .15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.04)'; e.currentTarget.style.color='#fff'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#94a3b8'}}>
                    <span style={{ fontSize:16, width:20, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                    {!collapsed && <span style={{ flex:1 }}>{item.label}</span>}
                    {!collapsed && item.badge && <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:10, background:'rgba(16,185,129,.15)', color:'#10b981' }}>{item.badge}</span>}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          {/* Footer sidebar */}
          <div style={{ padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, color:'#64748b', textDecoration:'none', fontSize:13, fontWeight:500 }}>
              <span style={{ fontSize:16, width:20, textAlign:'center' }}>🌐</span>
              {!collapsed && <span>Voir le site public</span>}
            </Link>
            <button onClick={()=>setCollapsed(!collapsed)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, border:'none', background:'transparent', color:'#64748b', cursor:'pointer', fontSize:13, fontWeight:500, fontFamily:'DM Sans,system-ui' }}>
              <span style={{ fontSize:14, width:20, textAlign:'center' }}>{collapsed?'→':'←'}</span>
              {!collapsed && <span>Réduire</span>}
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex:1, padding:32, overflowY:'auto' }}>
          <div style={{ maxWidth:1200, margin:'0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom:32 }}>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0, display:'flex', alignItems:'center', gap:12 }}>
                ✈️ Bienvenue sur ANZPilot
              </h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'6px 0 0' }}>La plateforme tout-en-un pour piloter votre organisme de formation</p>
            </div>

            {/* KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:32 }}>
              {[
                { label:'Sessions', value:'47', icon:'📅', color:'#0ea5e9' },
                { label:'Apprenants', value:'∞', icon:'👥', color:'#10b981' },
                { label:'Score Qualiopi', value:'94%', icon:'🛡️', color:'#f59e0b' },
                { label:'CA ce mois', value:'33 500€', icon:'💶', color:'#8b5cf6' },
              ].map(k => (
                <div key={k.label} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:20, transition:'all .15s' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:12 }}>
                    <div style={{ fontSize:24 }}>{k.icon}</div>
                    <div style={{ width:30, height:4, borderRadius:2, background:k.color }}/>
                  </div>
                  <div style={{ fontFamily:'Sora,Georgia', fontSize:26, fontWeight:700, color:k.color }}>{k.value}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Actions rapides */}
            <div style={{ marginBottom:32 }}>
              <h2 style={{ fontFamily:'Sora,Georgia', fontSize:16, fontWeight:700, color:'#fff', margin:'0 0 16px' }}>⚡ Actions rapides</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
                {[
                  { icon:'📄', label:'Nouvelle convention', href:'/conventions/new', color:'#0ea5e9' },
                  { icon:'💳', label:'Nouvelle facture', href:'/factures/new', color:'#10b981' },
                  { icon:'🎥', label:'Démarrer une visio', href:'/visio', color:'#06b6d4' },
                  { icon:'📚', label:'Ajouter au catalogue', href:'/catalogue', color:'#a855f7' },
                ].map(a => (
                  <Link key={a.label} href={a.href} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:11, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', textDecoration:'none', color:'#fff', transition:'all .15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=a.color+'66'; e.currentTarget.style.transform='translateY(-2px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.08)'; e.currentTarget.style.transform='translateY(0)'}}>
                    <div style={{ width:36, height:36, borderRadius:9, background:a.color+'22', border:`1px solid ${a.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{a.icon}</div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{a.label}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Modules complets */}
            <div>
              <h2 style={{ fontFamily:'Sora,Georgia', fontSize:16, fontWeight:700, color:'#fff', margin:'0 0 16px' }}>📦 Modules disponibles</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
                {[
                  { icon:'📚', title:'Catalogue', desc:'Formations & tarifs personnalisés', href:'/catalogue', color:'#a855f7' },
                  { icon:'📄', title:'Conventions', desc:'Conventions, convocations, attestations', href:'/conventions', color:'#0ea5e9' },
                  { icon:'💳', title:'Facturation', desc:'Factures OPCO, entreprises, CPF', href:'/factures', color:'#10b981' },
                  { icon:'🛡️', title:'Qualiopi', desc:'7 critères · 32 indicateurs', href:'/qualiopi', color:'#f59e0b' },
                  { icon:'📊', title:'BPF automatique', desc:'Bilan Pédagogique et Financier', href:'/bpf', color:'#8b5cf6' },
                  { icon:'🎥', title:'ANZPilot Visio', desc:'Visioconférence intégrée', href:'/visio', color:'#06b6d4' },
                  { icon:'📅', title:'Sessions virtuelles', desc:'Planifier vos visios', href:'/classes-virtuelles', color:'#3b82f6' },
                ].map(m => (
                  <Link key={m.title} href={m.href} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:20, textDecoration:'none', color:'inherit', transition:'all .15s', display:'block' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color+'66'; e.currentTarget.style.transform='translateY(-2px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.08)'; e.currentTarget.style.transform='translateY(0)'}}>
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
        </main>
      </div>
    </>
  )
}
