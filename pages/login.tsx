import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [step, setStep] = useState<'email'|'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function envoyerCode() {
    setError(''); setInfo('')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Adresse email invalide'); return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-code', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email })
      })
      const d = await res.json()
      if (d.success) { setStep('code'); setInfo('✅ Code envoyé ! Vérifiez votre boîte mail (et vos spams)') }
      else setError(d.error || 'Échec de l\'envoi')
    } catch(e:any) { setError('Erreur réseau : '+e.message) }
    setLoading(false)
  }

  async function verifierCode() {
    setError('')
    if (code.length !== 6) { setError('Le code doit faire 6 chiffres'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-code', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, code })
      })
      const d = await res.json()
      if (d.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('anzpilot_user', email)
          localStorage.setItem('anzpilot_session', new Date().toISOString())
        }
        router.push('/dashboard')
      } else setError(d.error || 'Code incorrect')
    } catch(e:any) { setError('Erreur réseau : '+e.message) }
    setLoading(false)
  }

  return (
    <>
      <Head><title>Connexion — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ maxWidth:440, width:'100%' }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ width:64, height:64, margin:'0 auto 14px', borderRadius:16, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>✈️</div>
            <div style={{ fontFamily:'Sora,Georgia', fontSize:24, fontWeight:700, color:'#fff' }}>ANZPilot</div>
            <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>Pilotez votre organisme de formation</div>
          </div>

          <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:28 }}>
            <h1 style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#fff', margin:'0 0 4px' }}>
              {step==='email' ? 'Connexion' : 'Code reçu par email'}
            </h1>
            <p style={{ fontSize:13, color:'#64748b', margin:'0 0 22px' }}>
              {step==='email' ? 'Recevez un code à 6 chiffres par email' : `Entrez le code envoyé à ${email}`}
            </p>

            {step==='email' ? (
              <>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>Adresse email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&envoyerCode()} placeholder="vous@exemple.com" autoFocus style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, padding:'12px 14px', fontSize:14, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', marginBottom:14 }}/>
                {error && <div style={{ padding:10, borderRadius:8, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#fca5a5', fontSize:12, marginBottom:14 }}>{error}</div>}
                <button onClick={envoyerCode} disabled={loading} style={{ width:'100%', padding:13, borderRadius:10, border:'none', background:loading?'#1e3a5f':'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:14, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:loading?'wait':'pointer' }}>
                  {loading ? '⏳ Envoi...' : '📧 Recevoir mon code'}
                </button>
              </>
            ) : (
              <>
                {info && <div style={{ padding:10, borderRadius:8, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)', color:'#86efac', fontSize:12, marginBottom:14 }}>{info}</div>}
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>Code à 6 chiffres</label>
                <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} onKeyDown={e=>e.key==='Enter'&&verifierCode()} placeholder="123456" autoFocus style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, padding:'14px', fontSize:24, color:'#fff', fontFamily:'monospace', outline:'none', marginBottom:14, textAlign:'center', letterSpacing:8 }}/>
                {error && <div style={{ padding:10, borderRadius:8, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#fca5a5', fontSize:12, marginBottom:14 }}>{error}</div>}
                <button onClick={verifierCode} disabled={loading||code.length!==6} style={{ width:'100%', padding:13, borderRadius:10, border:'none', background:(loading||code.length!==6)?'#1e3a5f':'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:14, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:(loading||code.length!==6)?'wait':'pointer', marginBottom:10 }}>
                  {loading ? '⏳ Vérification...' : '🚪 Me connecter'}
                </button>
                <button onClick={()=>{setStep('email'); setCode(''); setError(''); setInfo('')}} style={{ width:'100%', padding:11, borderRadius:9, border:'1px solid rgba(255,255,255,.08)', background:'transparent', color:'#64748b', fontSize:12, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>← Changer d'email</button>
              </>
            )}
          </div>

          <div style={{ textAlign:'center', marginTop:18, fontSize:12, color:'#64748b' }}>
            Pas encore de compte ? <Link href="/inscription" style={{ color:'#0ea5e9', textDecoration:'none', fontWeight:600 }}>Créer votre organisme</Link>
          </div>
          <div style={{ textAlign:'center', marginTop:14, fontSize:11, color:'#475569' }}>
            🔒 Connexion sécurisée · Données hébergées en Europe
          </div>
        </div>
      </div>
    </>
  )
}
