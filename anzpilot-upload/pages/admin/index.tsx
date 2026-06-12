import { useState } from 'react'
import Head from 'next/head'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (password === 'ANZPilot2026!') {
      localStorage.setItem('anzpilot_admin', 'true')
      window.location.href = '/admin/dashboard'
    } else {
      setError('Mot de passe incorrect')
    }
  }

  return (
    <>
      <Head><title>Admin — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050c1a', fontFamily:'DM Sans,system-ui' }}>
        <div style={{ width:'100%', maxWidth:380, padding:24 }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:26 }}>🛡️</div>
            <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff', margin:0 }}>ANZPilot Admin</h1>
            <p style={{ fontSize:13, color:'#475569', marginTop:6 }}>Accès réservé aux administrateurs</p>
          </div>
          <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:24 }}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>Mot de passe admin</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••••••"
                style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 14px', fontSize:14, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}
              />
            </div>
            {error && (
              <div style={{ fontSize:12, color:'#fca5a5', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'8px 12px', marginBottom:14 }}>{error}</div>
            )}
            <button onClick={handleLogin} style={{ width:'100%', padding:'11px', borderRadius:9, border:'none', cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:'DM Sans,system-ui', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff' }}>
              Accéder au panneau admin →
            </button>
          </div>
          <p style={{ textAlign:'center', fontSize:11, color:'#334155', marginTop:16 }}>🔒 Accès sécurisé · ANZPilot Super Admin</p>
        </div>
      </div>
    </>
  )
}
