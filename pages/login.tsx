import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Head from 'next/head'

type AuthMode = 'magic_link' | 'password' | 'code'

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('magic_link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true); setError('')
    if (mode === 'magic_link') {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/dashboard` } })
      if (error) setError(error.message); else setSent(true)
    } else if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Email ou mot de passe incorrect'); else window.location.href = '/dashboard'
    } else {
      const res = await fetch('/api/auth/verify-code', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, code }) })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Code invalide')
      else window.location.href = `/apprenant/${data.token}`
    }
    setLoading(false)
  }

  return (
    <>
      <Head><title>Connexion — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'var(--bg)' }}>
        {/* Glow */}
        <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:'25%', left:'50%', transform:'translateX(-50%)', width:400, height:400, background:'rgba(14,165,233,.08)', borderRadius:'50%', filter:'blur(80px)' }} />
        </div>

        <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ width:60, height:60, borderRadius:18, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:28, boxShadow:'0 8px 32px rgba(14,165,233,.3)' }}>✈️</div>
            <h1 style={{ fontFamily:'Sora,Georgia', fontSize:26, fontWeight:700, color:'#fff', margin:0, letterSpacing:'-0.5px' }}>ANZPilot</h1>
            <p style={{ fontSize:13, color:'var(--text3)', marginTop:5 }}>Pilotez votre organisme de formation</p>
            <p style={{ fontSize:11, color:'#0ea5e9', marginTop:3, fontWeight:500 }}></p>
          </div>

          <div className="card">
            <h2 style={{ fontFamily:'Sora,Georgia', fontSize:17, color:'#fff', marginBottom:5 }}>Connexion</h2>
            <p style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>Accédez à votre espace organisme ou apprenant</p>

            {/* Mode tabs */}
            <div style={{ display:'flex', gap:4, padding:4, borderRadius:12, background:'var(--bg)', border:'1px solid var(--border)', marginBottom:20 }}>
              {[['magic_link','✉️ Lien magique'],['password','🔐 Mot de passe'],['code','🔢 Code']] .map(([id, label]) => (
                <button key={id} onClick={() => { setMode(id as AuthMode); setSent(false); setError('') }}
                  style={{ flex:1, padding:'7px 4px', borderRadius:8, border:'none', cursor:'pointer', fontSize:11, fontWeight:500, fontFamily:'DM Sans,system-ui', background: mode===id ? 'linear-gradient(135deg,#0ea5e9,#2563eb)' : 'transparent', color: mode===id ? '#fff' : 'var(--text3)', transition:'all .15s' }}>
                  {label}
                </button>
              ))}
            </div>

            {sent ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>✉️</div>
                <h3 style={{ color:'#fff', fontSize:16, marginBottom:8 }}>Lien envoyé !</h3>
                <p style={{ color:'var(--text2)', fontSize:13 }}>Vérifiez <strong style={{ color:'#fff' }}>{email}</strong></p>
                <button onClick={() => setSent(false)} style={{ marginTop:12, fontSize:12, color:'#0ea5e9', background:'none', border:'none', cursor:'pointer' }}>Renvoyer</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div><label className="form-label">Email</label><input type="email" className="form-input" placeholder="vous@organisme.fr" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleSubmit()} /></div>
                {mode === 'password' && <div><label className="form-label">Mot de passe</label><input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleSubmit()} /></div>}
                {mode === 'code' && <div><label className="form-label">Code à 6 chiffres</label><input type="text" inputMode="numeric" maxLength={6} className="form-input" style={{ textAlign:'center', fontSize:22, letterSpacing:10, fontFamily:'monospace' }} placeholder="123456" value={code} onChange={e => setCode(e.target.value.replace(/\D/g,''))} /></div>}
                {error && <div style={{ fontSize:12, color:'#fca5a5', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'8px 12px' }}>{error}</div>}
                <button onClick={handleSubmit} disabled={loading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 16px', borderRadius:9, border:'none', cursor: loading?'not-allowed':'pointer', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', opacity: loading ? 0.7 : 1, transition:'all .15s', boxShadow:'0 4px 15px rgba(14,165,233,.3)' }}>
                  {loading ? '⏳ Connexion…' : mode==='magic_link' ? '✉️ Envoyer le lien' : mode==='code' ? '🚀 Accéder à mon espace' : '🔐 Se connecter'}
                </button>
              </div>
            )}
          </div>

          <div style={{ textAlign:'center', marginTop:20 }}>
            <p style={{ fontSize:12, color:'var(--text3)' }}>
              Pas encore de compte ?{' '}
              <a href="/inscription" style={{ color:'#0ea5e9', fontWeight:600 }}>Créer votre organisme</a>
            </p>
            <p style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>🔒 Connexion sécurisée · Données hébergées en Europe</p>
          </div>
        </div>
      </div>
    </>
  )
}
