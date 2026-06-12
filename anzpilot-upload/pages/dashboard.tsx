import Head from 'next/head'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/layout/Sidebar'

const Abonnements = dynamic(() => import('@/components/abonnements/Abonnements'), { ssr: false })

export default function DashboardPage() {
  const [section, setSection] = useState('dashboard')
  const organisme = { nom: 'ANZPilot', plan: 'trial', couleur: '#0ea5e9' }
  const user = { prenom: 'Admin', nom: '', email: 'admin@anzpilot.com' }

  return (
    <>
      <Head><title>ANZPilot — Tableau de bord</title></Head>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
        <Sidebar activeSection={section} onNavigate={setSection} organisme={organisme} user={user} />
        <main style={{ flex:1, overflowY:'auto' }}>
          {section === 'abonnements'
            ? <Abonnements currentPlan={organisme.plan} />
            : <div style={{ padding:24 }}>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:600, color:'#fff', marginBottom:8 }}>
                  ✈️ Bienvenue sur ANZPilot
                </div>
                <div style={{ fontSize:13, color:'#94a3b8', marginBottom:24 }}>
                  La plateforme tout-en-un pour piloter votre organisme de formation · 
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                  {[
                    { label:'Sessions', value:'47', icon:'📅', color:'#0ea5e9' },
                    { label:'Apprenants', value:'∞', icon:'👥', color:'#10b981' },
                    { label:'Score Qualiopi', value:'94%', icon:'🛡️', color:'#f59e0b' },
                    { label:'CA ce mois', value:'33 500€', icon:'💶', color:'#8b5cf6' },
                  ].map(k => (
                    <div key={k.label} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:14, padding:16 }}>
                      <div style={{ fontSize:24, marginBottom:8 }}>{k.icon}</div>
                      <div style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:k.color }}>{k.value}</div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{k.label}</div>
                    </div>
                  ))}
                </div>
              </div>
          }
        </main>
      </div>
    </>
  )
}
