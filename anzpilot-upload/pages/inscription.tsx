import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Head from 'next/head'
import { CheckCircle, ArrowRight } from 'lucide-react'

const PLANS = [
  { id: 'trial', nom: 'Essai gratuit', prix: 0, features: ['14 jours', '1 utilisateur', '5 sessions', '10 apprenants'] },
  { id: 'starter', nom: 'Starter', prix: 49, popular: false, features: ['3 utilisateurs', 'Sessions illimitées', '∞ Apprenants', 'BPF auto'] },
  { id: 'pro', nom: 'Pro', prix: 129, popular: true, features: ['10 utilisateurs', 'LMS + Visio', 'CRM + Qualiopi', 'IA basique'] },
  { id: 'business', nom: 'Business', prix: 299, popular: false, features: ['Illimité', 'Multi-centres', 'IA complète', 'API + CSM'] },
]

export default function Inscription() {
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState('trial')
  const [form, setForm] = useState({ prenom:'', nom:'', email:'', password:'', nomOrganisme:'', siret:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const up = (k: string, v: string) => setForm(f => ({...f, [k]: v}))

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      const { data, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { prenom: form.prenom, nom: form.nom } } })
      if (authErr) throw authErr
      await fetch('/api/auth/register-organisme', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ user_id: data.user?.id, email: form.email, prenom: form.prenom, nom: form.nom, nom_organisme: form.nomOrganisme, siret: form.siret, plan: selectedPlan }) })
      setDone(true)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  if (done) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
        <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, color:'#fff', marginBottom:8 }}>Compte créé !</h1>
        <p style={{ color:'var(--text2)', fontSize:14, marginBottom:20 }}>Vérifiez <strong style={{color:'#fff'}}>{form.email}</strong> pour activer votre compte.</p>
        <a href="/login" className="btn btn-primary">Aller à la connexion →</a>
      </div>
    </div>
  )

  return (
    <>
      <Head><title>Inscription — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', padding:'40px 16px', overflowY:'auto' }}>
        <div style={{ maxWidth: 640, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:22 }}>🎓</div>
            <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, color:'#fff', margin:0 }}>Créer votre compte ANZPilot</h1>
            <p style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>14 jours d'essai gratuit · Aucune CB requise</p>
          </div>

          {/* Steps */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:28 }}>
            {[1,2].map(s => (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background: step >= s ? '#2563eb' : 'var(--bg3)', border: step >= s ? 'none' : '1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color: step >= s ? '#fff' : 'var(--text3)', transition:'all .2s' }}>{s}</div>
                <span style={{ fontSize:12, color: step >= s ? 'var(--text)' : 'var(--text3)' }}>{s===1?'Votre compte':'Votre plan'}</span>
                {s < 2 && <div style={{ width:40, height:1, background: step > s ? '#2563eb' : 'var(--border)' }} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="card">
              <h2 style={{ fontFamily:'Sora,Georgia', fontSize:17, color:'#fff', marginBottom:20 }}>Informations du compte</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div><label className="form-label">Prénom</label><input className="form-input" placeholder="Marie" value={form.prenom} onChange={e=>up('prenom',e.target.value)}/></div>
                <div><label className="form-label">Nom</label><input className="form-input" placeholder="Lambert" value={form.nom} onChange={e=>up('nom',e.target.value)}/></div>
              </div>
              <div style={{ marginBottom:14 }}><label className="form-label">Nom de votre organisme de formation</label><input className="form-input" placeholder="Mon Centre de Formation" value={form.nomOrganisme} onChange={e=>up('nomOrganisme',e.target.value)}/></div>
              <div style={{ marginBottom:14 }}><label className="form-label">SIRET (optionnel)</label><input className="form-input" placeholder="12345678901234" maxLength={14} value={form.siret} onChange={e=>up('siret',e.target.value)}/></div>
              <div style={{ marginBottom:14 }}><label className="form-label">Email professionnel</label><input type="email" className="form-input" placeholder="vous@organisme.fr" value={form.email} onChange={e=>up('email',e.target.value)}/></div>
              <div style={{ marginBottom:20 }}><label className="form-label">Mot de passe (8 car. min)</label><input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e=>up('password',e.target.value)}/></div>
              <button onClick={() => setStep(2)} disabled={!form.prenom||!form.nom||!form.email||!form.nomOrganisme||form.password.length<8} className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}>Continuer →</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontFamily:'Sora,Georgia', fontSize:17, color:'#fff', marginBottom:20, textAlign:'center' }}>Choisissez votre plan</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                {PLANS.map(p => (
                  <div key={p.id} onClick={() => setSelectedPlan(p.id)} style={{ position:'relative', cursor:'pointer', borderRadius:14, padding:16, border: `${selectedPlan===p.id?2:1}px solid ${selectedPlan===p.id?'#3b82f6':'var(--border)'}`, background: selectedPlan===p.id?'rgba(59,130,246,.1)':'var(--bg3)', transition:'all .15s' }}>
                    {p.popular && <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', fontSize:9, fontWeight:700, color:'#fff', background:'#7c3aed', padding:'2px 10px', borderRadius:20 }}>POPULAIRE</div>}
                    <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
                      <span style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff' }}>{p.prix===0?'Gratuit':`${p.prix}€`}</span>
                      {p.prix>0&&<span style={{ fontSize:11, color:'var(--text3)' }}>/mois</span>}
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:10 }}>{p.nom}</div>
                    {p.features.map(f => <div key={f} style={{ fontSize:11, color:'var(--text2)', display:'flex', gap:6, marginBottom:4 }}><span style={{color:'#6ee7b7'}}>✓</span>{f}</div>)}
                    {selectedPlan===p.id && <div style={{ position:'absolute', top:10, right:10, width:18, height:18, borderRadius:'50%', background:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>✓</div>}
                  </div>
                ))}
              </div>
              {error && <div style={{ fontSize:12, color:'#fca5a5', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'8px 12px', marginBottom:14 }}>{error}</div>}
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex:1, justifyContent:'center' }}>← Retour</button>
                <button onClick={handleSubmit} disabled={loading} className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}>
                  {loading ? 'Création…' : 'Créer mon compte →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
