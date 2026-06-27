import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'

export default function Dashboard() {
  const [nomOrganisme, setNomOrganisme] = useState('ANZ Formation')

  useEffect(() => {
    fetch('/api/admin/config').then(r=>r.json()).then(d=>{
      if (d.config?.nom_organisme) setNomOrganisme(d.config.nom_organisme)
    }).catch(()=>{})
  }, [])

  return (
    <>
      <Head><title>Tableau de bord — ANZPilot</title></Head>
      <Layout>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ marginBottom:32 }}>
            <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0, display:'flex', alignItems:'center', gap:12 }}>
              👋 Bienvenue, {nomOrganisme}
            </h1>
            <p style={{ fontSize:14, color:'#94a3b8', margin:'6px 0 0' }}>Pilotez votre organisme de formation depuis une seule plateforme</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:32 }}>
            {[
              { label:'Sessions', value:'47', icon:'📅', color:'#0ea5e9' },
              { label:'Apprenants', value:'∞', icon:'👥', color:'#10b981' },
              { label:'Score Qualiopi', value:'94%', icon:'🛡️', color:'#f59e0b' },
              { label:'CA ce mois', value:'33 500€', icon:'💶', color:'#8b5cf6' },
            ].map(k => (
              <div key={k.label} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:12 }}>
                  <div style={{ fontSize:24 }}>{k.icon}</div>
                  <div style={{ width:30, height:4, borderRadius:2, background:k.color }}/>
                </div>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:26, fontWeight:700, color:k.color }}>{k.value}</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{k.label}</div>
              </div>
            ))}
          </div>

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
        </div>
      </Layout>
    </>
  )
}
