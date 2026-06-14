import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function VisioHome() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [roomName, setRoomName] = useState('')

  function generateRoom() {
    const id = Math.random().toString(36).substring(2, 10)
    const slug = roomName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g,'').slice(0, 30) || 'reunion'
    router.push(`/visio/${slug}-${id}`)
  }

  function joinRoom() {
    if (!roomCode.trim()) return
    router.push(`/visio/${roomCode.trim()}`)
  }

  return (
    <>
      <Head><title>ANZPilot Visio — Visioconférence sécurisée</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <Link href="/dashboard" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour</Link>

          <div style={{ textAlign:'center', margin:'40px 0 50px' }}>
            <div style={{ width:80, height:80, margin:'0 auto', borderRadius:20, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, marginBottom:18 }}>🎥</div>
            <h1 style={{ fontFamily:'Sora,Georgia', fontSize:36, fontWeight:800, color:'#fff', margin:'0 0 8px' }}>ANZPilot Visio</h1>
            <p style={{ fontSize:16, color:'#94a3b8', margin:0 }}>Visioconférence sécurisée pour vos formations · Chiffrement de bout en bout</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Créer */}
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:28 }}>
              <div style={{ fontSize:32, marginBottom:14 }}>➕</div>
              <h2 style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>Démarrer une réunion</h2>
              <p style={{ fontSize:13, color:'#64748b', margin:'0 0 18px' }}>Créez une nouvelle salle pour votre session de formation</p>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' }}>Nom de la formation</label>
              <input value={roomName} onChange={e=>setRoomName(e.target.value)} placeholder="Excel avancé - Session 1" onKeyDown={e=>e.key==='Enter'&&generateRoom()}
                style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, padding:'12px 14px', fontSize:14, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', marginBottom:14 }}/>
              <button onClick={generateRoom} style={{ width:'100%', padding:'13px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:14, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>
                🎥 Démarrer la visioconférence
              </button>
            </div>

            {/* Rejoindre */}
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:28 }}>
              <div style={{ fontSize:32, marginBottom:14 }}>🔑</div>
              <h2 style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>Rejoindre une réunion</h2>
              <p style={{ fontSize:13, color:'#64748b', margin:'0 0 18px' }}>Entrez le code de la salle que vous avez reçu</p>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' }}>Code de la salle</label>
              <input value={roomCode} onChange={e=>setRoomCode(e.target.value)} placeholder="excel-avance-abc123" onKeyDown={e=>e.key==='Enter'&&joinRoom()}
                style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, padding:'12px 14px', fontSize:14, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', marginBottom:14 }}/>
              <button onClick={joinRoom} disabled={!roomCode.trim()} style={{ width:'100%', padding:'13px', borderRadius:10, border:'none', background:!roomCode.trim()?'#1e3a5f':'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:14, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:!roomCode.trim()?'not-allowed':'pointer' }}>
                🚪 Rejoindre la réunion
              </button>
            </div>
          </div>

          {/* Avantages */}
          <div style={{ marginTop:40 }}>
            <h3 style={{ fontFamily:'Sora,Georgia', fontSize:16, fontWeight:700, color:'#fff', margin:'0 0 16px', textAlign:'center' }}>Pourquoi ANZPilot Visio ?</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
              {[
                ['🔐','Chiffré de bout en bout','Vos sessions sont privées et sécurisées'],
                ['👥','Participants illimités','Aucune limite de durée ou de participants'],
                ['📺','Partage d\'écran','Présentez vos supports en haute qualité'],
                ['💬','Chat intégré','Posez vos questions en temps réel'],
                ['📱','Mobile & Desktop','Fonctionne partout sans installation'],
                ['🇫🇷','Données en Europe','Serveurs en France, conforme RGPD'],
              ].map(([icon,title,desc])=>(
                <div key={title} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:11, padding:14 }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:4 }}>{title}</div>
                  <div style={{ fontSize:11, color:'#64748b', lineHeight:1.4 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
