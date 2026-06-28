import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const ADMIN_PASSWORD = 'ANZPilot2026!'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('anzpilot_admin') === 'ok') {
      router.push('/admin/dashboard')
    }
  }, [router])

  function login() {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('anzpilot_admin', 'ok')
      router.push('/admin/dashboard')
    } else {
      setError('Mot de passe incorrect')
    }
  }

  return (
    <>
      <Head><title>Administration — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ maxWidth:420, width:'100%' }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ width:64, height:64, margin:'0 auto 14px', borderRadius:16, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>🔐</div>
            <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff', margin:'0 0 4px' }}>Console Administration</h1>
            <p style={{ fontSize:13, color:'#64748b', margin:0 }}>Accès réservé à l'équipe ANZPilot</p>
          </div>
          <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:28 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>Mot de passe</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="••••••••••••" autoFocus style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, padding:'12px 14px', fontSize:14, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', marginBottom:14, textAlign:'center' }}/>
            {error && <div style={{ padding:10, borderRadius:8, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#fca5a5', fontSize:12, marginBottom:14 }}>{error}</div>}
            <button onClick={login} style={{ width:'100%', padding:13, borderRadius:10, border:'none', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:14, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>🔓 Accéder</button>
          </div>
        </div>
      </div>
    </>
  )
}
