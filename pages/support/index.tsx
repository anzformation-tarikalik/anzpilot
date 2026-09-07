import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

const STATUTS_META: any = {
  ouvert: { label:'Ouvert', color:'#f59e0b', icon:'🔔' },
  en_cours: { label:'En cours', color:'#0ea5e9', icon:'💬' },
  resolu: { label:'Résolu', color:'#10b981', icon:'✅' },
  ferme: { label:'Fermé', color:'#64748b', icon:'📁' },
}
const CATEGORIES: any = {
  bug: { label:'🐛 Bug', color:'#ef4444' },
  question: { label:'❓ Question', color:'#0ea5e9' },
  demande: { label:'💡 Demande', color:'#a855f7' },
  facturation: { label:'💳 Facturation', color:'#f59e0b' },
}

export default function SupportOFPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [showNew, setShowNew] = useState(false)
  const [newTicket, setNewTicket] = useState({ sujet:'', message:'', categorie:'question', priorite:'moyenne' })
  const [creating, setCreating] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const e = localStorage.getItem('anzpilot_user_email') || sessionStorage.getItem('anzpilot_user_email')
    if (!e) { router.push('/login'); return }
    setEmail(e); loadTickets(e)
  }, [router])

  useEffect(() => { if (selected && email) loadDetail(selected) }, [selected, email])

  function loadTickets(userEmail: string) {
    setLoading(true)
    fetch(`/api/of/tickets?email=${encodeURIComponent(userEmail)}`).then(r=>r.json()).then(d=>{
      setTickets(d.tickets||[]); setLoading(false)
    }).catch(()=>setLoading(false))
  }

  function loadDetail(id: string) {
    fetch(`/api/of/tickets?id=${id}&email=${encodeURIComponent(email)}`).then(r=>r.json()).then(d=>{
      setDetail(d)
    })
  }

  async function createTicket() {
    if (!newTicket.sujet || !newTicket.message) { alert('Sujet et message requis'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/of/tickets', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, ...newTicket })
      })
      const d = await res.json()
      if (d.success) {
        setShowNew(false); setNewTicket({ sujet:'', message:'', categorie:'question', priorite:'moyenne' })
        loadTickets(email); setSelected(d.ticket.id)
      } else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
    setCreating(false)
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      const res = await fetch('/api/of/tickets?action=reply', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ticket_id: selected, message: reply, email })
      })
      const d = await res.json()
      if (d.success) { setReply(''); loadDetail(selected); loadTickets(email) }
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
    setSending(false)
  }

  return (
    <>
      <Head><title>Support — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:14 }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0 }}>🎫 Support</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Une question ? Un problème ? Nous sommes là pour vous aider.</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Link href="/dashboard" style={{ padding:'10px 18px', borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', textDecoration:'none', fontSize:13 }}>← Tableau de bord</Link>
              <button onClick={()=>setShowNew(true)} style={{ padding:'10px 18px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>➕ Nouveau ticket</button>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: selected ? '380px 1fr' : '1fr', gap:16, alignItems:'start' }}>
            {/* Liste tickets */}
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, overflow:'hidden' }}>
              <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.06em' }}>Mes tickets ({tickets.length})</div>
              {loading ? <div style={{ padding:32, textAlign:'center', color:'#64748b', fontSize:13 }}>⏳ Chargement...</div>
              : tickets.length === 0 ? <div style={{ padding:32, textAlign:'center' }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>🎫</div>
                  <div style={{ fontSize:13, color:'#94a3b8', marginBottom:14 }}>Aucun ticket pour le moment</div>
                  <button onClick={()=>setShowNew(true)} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>➕ Créer mon premier ticket</button>
                </div>
              : tickets.map((t, i) => {
                  const s = STATUTS_META[t.statut]
                  const isSelected = selected === t.id
                  return (
                    <div key={t.id} onClick={()=>setSelected(t.id)} style={{
                      padding:14, borderBottom: i<tickets.length-1?'1px solid rgba(255,255,255,.05)':'none',
                      cursor:'pointer', background: isSelected ? 'rgba(14,165,233,.1)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #0ea5e9' : '3px solid transparent'
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', gap:8, marginBottom:6 }}>
                        <div style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{t.numero}</div>
                        <span style={{ padding:'3px 8px', borderRadius:10, fontSize:10, fontWeight:600, background:s.color+'22', color:s.color }}>{s.icon} {s.label}</span>
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:4 }}>{t.sujet}</div>
                      <div style={{ fontSize:10, color:'#475569' }}>{new Date(t.last_message_at).toLocaleString('fr-FR')}</div>
                    </div>
                  )
                })}
            </div>

            {/* Détail */}
            {selected && (
              <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, overflow:'hidden' }}>
                {!detail ? <div style={{ padding:32, textAlign:'center', color:'#64748b' }}>⏳ Chargement...</div>
                : (
                  <>
                    <div style={{ padding:20, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:8 }}>
                        <div style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{detail.ticket.numero}</div>
                        <button onClick={()=>setSelected(null)} style={{ background:'transparent', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:16 }}>✕</button>
                      </div>
                      <h3 style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 8px' }}>{detail.ticket.sujet}</h3>
                      {(() => {
                        const s = STATUTS_META[detail.ticket.statut]
                        return <span style={{ padding:'4px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:s.color+'22', color:s.color }}>{s.icon} {s.label}</span>
                      })()}
                    </div>

                    <div style={{ padding:20, maxHeight:400, overflowY:'auto' }}>
                      {detail.messages.map((m: any) => {
                        const isAdmin = m.auteur_type === 'admin'
                        return (
                          <div key={m.id} style={{ display:'flex', flexDirection:isAdmin?'row':'row-reverse', gap:10, marginBottom:14 }}>
                            <div style={{ width:32, height:32, borderRadius:'50%', background: isAdmin ? 'linear-gradient(135deg,#0ea5e9,#2563eb)' : 'rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, color:'#fff', fontWeight:700 }}>{(m.auteur_nom || '?').charAt(0).toUpperCase()}</div>
                            <div style={{ maxWidth:'70%' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, justifyContent:isAdmin?'flex-start':'flex-end' }}>
                                <span style={{ fontSize:11, fontWeight:600, color: isAdmin ? '#0ea5e9' : '#fff' }}>{isAdmin ? 'Support ANZPilot' : 'Vous'}</span>
                                <span style={{ fontSize:10, color:'#475569' }}>{new Date(m.created_at).toLocaleString('fr-FR')}</span>
                              </div>
                              <div style={{ padding:'10px 14px', borderRadius:10, background: isAdmin ? 'rgba(14,165,233,.15)' : 'rgba(255,255,255,.06)', border: isAdmin ? '1px solid rgba(14,165,233,.3)' : '1px solid rgba(255,255,255,.1)', color:'#fff', fontSize:13, lineHeight:1.5, whiteSpace:'pre-wrap' }}>{m.message}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {detail.ticket.statut !== 'ferme' && (
                      <div style={{ padding:20, borderTop:'1px solid rgba(255,255,255,.06)', background:'#050c1a' }}>
                        <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3} placeholder="Votre réponse..." style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', resize:'vertical' }}/>
                        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
                          <button onClick={sendReply} disabled={!reply.trim() || sending} style={{ padding:'10px 18px', borderRadius:9, border:'none', background: !reply.trim() || sending ? 'rgba(255,255,255,.06)' : 'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:13, fontWeight:600, cursor: !reply.trim() || sending ? 'not-allowed' : 'pointer' }}>{sending?'Envoi...':'📤 Envoyer'}</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal nouveau ticket */}
        {showNew && (
          <div onClick={()=>setShowNew(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:24, maxWidth:520, width:'100%' }}>
              <h3 style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#fff', margin:'0 0 4px' }}>➕ Nouveau ticket</h3>
              <p style={{ fontSize:12, color:'#64748b', margin:'0 0 18px' }}>Décrivez votre problème, nous vous répondons rapidement</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' }}>Catégorie</label>
                    <select value={newTicket.categorie} onChange={e=>setNewTicket({...newTicket, categorie:e.target.value})} style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}>
                      {Object.entries(CATEGORIES).map(([k,v]:any)=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' }}>Priorité</label>
                    <select value={newTicket.priorite} onChange={e=>setNewTicket({...newTicket, priorite:e.target.value})} style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}>
                      <option value="basse">Basse</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="haute">Haute</option>
                      <option value="urgente">🚨 Urgente</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' }}>Sujet</label>
                  <input value={newTicket.sujet} onChange={e=>setNewTicket({...newTicket, sujet:e.target.value})} placeholder="Ex: Problème avec la génération d'une convention" style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' }}>Décrivez votre demande</label>
                  <textarea value={newTicket.message} onChange={e=>setNewTicket({...newTicket, message:e.target.value})} rows={5} placeholder="Décrivez le problème rencontré, la version, ce que vous avez essayé..." style={{ width:'100%', background:'#050c1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', resize:'vertical' }}/>
                </div>
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <button onClick={()=>setShowNew(false)} style={{ flex:1, padding:11, borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>Annuler</button>
                  <button onClick={createTicket} disabled={creating} style={{ flex:1, padding:11, borderRadius:9, border:'none', background:creating?'#1e3a5f':'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:13, fontWeight:600, cursor:creating?'not-allowed':'pointer', fontFamily:'DM Sans,system-ui' }}>{creating?'⏳ Création...':'➕ Créer le ticket'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

