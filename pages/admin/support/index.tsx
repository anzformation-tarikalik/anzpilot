import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminShell, { useAdminAuth } from '../../../components/admin/AdminShell'
import { Button, Card, Badge, Input, EmptyState, Tabs, KpiCard, tokens } from '../../../components/admin/AdminUI'

const STATUTS_META: any = {
  ouvert: { label:'Ouvert', color:tokens.warning, icon:'🔔' },
  en_cours: { label:'En cours', color:tokens.primary, icon:'💬' },
  resolu: { label:'Résolu', color:tokens.success, icon:'✅' },
  ferme: { label:'Fermé', color:tokens.textDim, icon:'📁' },
}
const PRIORITES_META: any = {
  basse: { label:'Basse', color:tokens.textDim },
  moyenne: { label:'Moyenne', color:tokens.primary },
  haute: { label:'Haute', color:tokens.warning },
  urgente: { label:'Urgente', color:tokens.danger },
}
const CATEGORIES_META: any = {
  bug: { label:'Bug', icon:'🐛' },
  question: { label:'Question', icon:'❓' },
  demande: { label:'Demande', icon:'💡' },
  facturation: { label:'Facturation', icon:'💳' },
}

export default function SupportPage() {
  const { auth } = useAdminAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => { if (auth) loadList() }, [auth])
  useEffect(() => { if (selected) loadDetail(selected) }, [selected])

  function loadList() {
    setLoading(true)
    fetch('/api/admin/tickets?action=list').then(r=>r.json()).then(d=>{
      setTickets(d.tickets||[]); setLoading(false)
    }).catch(()=>setLoading(false))
  }

  function loadDetail(id: string) {
    fetch(`/api/admin/tickets?action=detail&id=${id}`).then(r=>r.json()).then(d=>{
      setDetail(d)
    })
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      const adminEmail = typeof window !== 'undefined' ? sessionStorage.getItem('anzpilot_admin_email') || 'admin' : 'admin'
      const adminNom = typeof window !== 'undefined' ? sessionStorage.getItem('anzpilot_admin_nom') || 'Admin' : 'Admin'
      const res = await fetch('/api/admin/tickets?action=reply', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ticket_id: selected, message: reply, is_internal: isInternal, admin_email: adminEmail, admin_nom: adminNom })
      })
      const d = await res.json()
      if (d.success) { setReply(''); setIsInternal(false); loadDetail(selected); loadList() }
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
    setSending(false)
  }

  async function updateStatut(nouveauStatut: string) {
    if (!selected) return
    try {
      await fetch('/api/admin/tickets', {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id: selected, statut: nouveauStatut })
      })
      loadDetail(selected); loadList()
    } catch(e:any) { alert(e.message) }
  }

  async function updatePriorite(nouvellePriorite: string) {
    if (!selected) return
    try {
      await fetch('/api/admin/tickets', {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id: selected, priorite: nouvellePriorite })
      })
      loadDetail(selected); loadList()
    } catch(e:any) { alert(e.message) }
  }

  if (!auth) return null

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.statut === filter)
  const counts = {
    all: tickets.length,
    ouvert: tickets.filter(t=>t.statut==='ouvert').length,
    en_cours: tickets.filter(t=>t.statut==='en_cours').length,
    resolu: tickets.filter(t=>t.statut==='resolu').length,
    ferme: tickets.filter(t=>t.statut==='ferme').length,
    urgente: tickets.filter(t=>t.priorite==='urgente' && (t.statut==='ouvert'||t.statut==='en_cours')).length,
  }

  return (
    <>
      <Head><title>Support — Admin ANZPilot</title></Head>
      <AdminShell activeSection="support" breadcrumb={[{ label:'Support' }]}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>🎫 Support</h1>
          <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Gérez les tickets ouverts par les organismes clients</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:16 }}>
          <KpiCard label="Tous" value={counts.all} icon="🎫" color={tokens.primary}/>
          <KpiCard label="Ouverts" value={counts.ouvert} icon="🔔" color={tokens.warning}/>
          <KpiCard label="En cours" value={counts.en_cours} icon="💬" color={tokens.primary}/>
          <KpiCard label="Résolus" value={counts.resolu} icon="✅" color={tokens.success}/>
          <KpiCard label="Urgents" value={counts.urgente} icon="🚨" color={tokens.danger}/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: selected ? '380px 1fr' : '1fr', gap:16, alignItems:'start' }}>
          {/* Liste tickets */}
          <div>
            <Tabs tabs={[
              { id:'all', label:'Tous', count: counts.all },
              { id:'ouvert', label:'Ouvert', icon:'🔔', count: counts.ouvert },
              { id:'en_cours', label:'En cours', icon:'💬', count: counts.en_cours },
              { id:'resolu', label:'Résolu', icon:'✅', count: counts.resolu },
            ]} active={filter} onChange={setFilter}/>

            {loading ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳</div>
            : filtered.length === 0 ? <EmptyState icon="🎫" title="Aucun ticket" description="Aucun ticket dans cette catégorie"/>
            : (
              <Card padding={0}>
                {filtered.map((t, i) => {
                  const s = STATUTS_META[t.statut] || STATUTS_META.ouvert
                  const p = PRIORITES_META[t.priorite] || PRIORITES_META.moyenne
                  const isSelected = selected === t.id
                  return (
                    <div key={t.id} onClick={()=>setSelected(t.id)} style={{
                      padding:14, borderBottom: i<filtered.length-1?`1px solid ${tokens.border}`:'none',
                      cursor:'pointer', background: isSelected ? 'rgba(14,165,233,.1)' : 'transparent',
                      borderLeft: isSelected ? `3px solid ${tokens.primary}` : '3px solid transparent'
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', gap:8, marginBottom:6 }}>
                        <div style={{ fontFamily:'monospace', fontSize:11, color:tokens.textDim }}>{t.numero}</div>
                        <div style={{ display:'flex', gap:4 }}>
                          <Badge color={p.color}>{p.label}</Badge>
                          <Badge color={s.color} icon={s.icon}>{s.label}</Badge>
                        </div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color:tokens.text, marginBottom:4 }}>{t.sujet}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:6 }}>
                        <div style={{ fontSize:11, color:tokens.textDim, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>📧 {t.organisme_email}</div>
                        <div style={{ fontSize:10, color:tokens.textFaint, whiteSpace:'nowrap' }}>{new Date(t.last_message_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  )
                })}
              </Card>
            )}
          </div>

          {/* Panneau détail */}
          {selected && (
            <Card padding={0}>
              {!detail ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div>
              : (
                <>
                  <div style={{ padding:20, borderBottom:`1px solid ${tokens.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:10, gap:10 }}>
                      <div>
                        <div style={{ fontFamily:'monospace', fontSize:11, color:tokens.textDim, marginBottom:4 }}>{detail.ticket.numero}</div>
                        <h3 style={{ fontFamily:tokens.fontDisplay, fontSize:18, fontWeight:700, color:tokens.text, margin:0 }}>{detail.ticket.sujet}</h3>
                      </div>
                      <Button size="sm" variant="ghost" onClick={()=>setSelected(null)}>✕</Button>
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                      {(() => {
                        const s = STATUTS_META[detail.ticket.statut]; return <Badge color={s.color} icon={s.icon}>{s.label}</Badge>
                      })()}
                      {(() => {
                        const p = PRIORITES_META[detail.ticket.priorite]; return <Badge color={p.color}>Priorité {p.label}</Badge>
                      })()}
                      {(() => {
                        const c = CATEGORIES_META[detail.ticket.categorie] || CATEGORIES_META.question
                        return <Badge color={tokens.textMuted} icon={c.icon}>{c.label}</Badge>
                      })()}
                    </div>
                    {detail.organisme && (
                      <div style={{ padding:10, background:tokens.bg, borderRadius:8, fontSize:12, color:tokens.textMuted, border:`1px solid ${tokens.border}` }}>
                        <div style={{ fontWeight:600, color:tokens.text }}>{detail.organisme.nom || detail.organisme.email}</div>
                        <div style={{ marginTop:2 }}>📧 {detail.organisme.email} · Plan {detail.organisme.plan} · {detail.organisme.statut}</div>
                      </div>
                    )}

                    <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
                      <select value={detail.ticket.statut} onChange={e=>updateStatut(e.target.value)} style={{ padding:'6px 10px', borderRadius:6, background:tokens.bg, color:tokens.text, border:`1px solid ${tokens.border}`, fontSize:11, fontFamily:tokens.fontSans }}>
                        <option value="ouvert">🔔 Ouvert</option>
                        <option value="en_cours">💬 En cours</option>
                        <option value="resolu">✅ Résolu</option>
                        <option value="ferme">📁 Fermé</option>
                      </select>
                      <select value={detail.ticket.priorite} onChange={e=>updatePriorite(e.target.value)} style={{ padding:'6px 10px', borderRadius:6, background:tokens.bg, color:tokens.text, border:`1px solid ${tokens.border}`, fontSize:11, fontFamily:tokens.fontSans }}>
                        <option value="basse">Priorité basse</option>
                        <option value="moyenne">Priorité moyenne</option>
                        <option value="haute">Priorité haute</option>
                        <option value="urgente">🚨 Priorité urgente</option>
                      </select>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ padding:20, maxHeight:400, overflowY:'auto' }}>
                    {detail.messages.map((m: any, i: number) => {
                      const isAdmin = m.auteur_type === 'admin'
                      return (
                        <div key={m.id} style={{ display:'flex', flexDirection:isAdmin?'row-reverse':'row', gap:10, marginBottom:14 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background: isAdmin ? `linear-gradient(135deg,${tokens.primary},${tokens.primary2})` : tokens.surface, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, color:isAdmin?'#fff':tokens.text, fontWeight:700 }}>{(m.auteur_nom || '?').charAt(0).toUpperCase()}</div>
                          <div style={{ maxWidth:'70%' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, justifyContent:isAdmin?'flex-end':'flex-start' }}>
                              <span style={{ fontSize:11, fontWeight:600, color: isAdmin ? tokens.primary : tokens.text }}>{m.auteur_nom}</span>
                              {m.is_internal && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:8, background:'rgba(245,158,11,.15)', color:tokens.warning, fontWeight:700 }}>NOTE INTERNE</span>}
                              <span style={{ fontSize:10, color:tokens.textFaint }}>{new Date(m.created_at).toLocaleString('fr-FR')}</span>
                            </div>
                            <div style={{ padding:'10px 14px', borderRadius:10, background: isAdmin ? tokens.primary+'22' : m.is_internal ? 'rgba(245,158,11,.08)' : tokens.surface, border: isAdmin ? `1px solid ${tokens.primary}40` : m.is_internal ? '1px solid rgba(245,158,11,.2)' : `1px solid ${tokens.border}`, color:tokens.text, fontSize:13, lineHeight:1.5, whiteSpace:'pre-wrap' }}>{m.message}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Répondre */}
                  <div style={{ padding:20, borderTop:`1px solid ${tokens.border}`, background:tokens.bg }}>
                    <Input label="" value={reply} onChange={setReply} rows={3} placeholder={isInternal ? "Note interne (invisible pour l'OF)" : "Répondre à l'organisme..."}/>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, gap:10 }}>
                      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:tokens.textMuted, cursor:'pointer' }}>
                        <input type="checkbox" checked={isInternal} onChange={e=>setIsInternal(e.target.checked)} style={{ accentColor: tokens.warning }}/>
                        <span>Note interne (invisible pour l'OF)</span>
                      </label>
                      <Button variant="primary" icon="📤" onClick={sendReply} disabled={!reply.trim() || sending}>{sending?'Envoi...':isInternal?'Ajouter note':'Envoyer réponse'}</Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      </AdminShell>
    </>
  )
}

