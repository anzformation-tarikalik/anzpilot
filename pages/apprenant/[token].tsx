import type { GetServerSideProps } from 'next'
import { useState } from 'react'
import Head from 'next/head'
import { supabaseAdmin } from '@/lib/supabase'

export default function ApprenantPortal({ apprenant, organisme, cours, documents, emargements, questionnaires }: any) {
  const [tab, setTab] = useState('cours')
  const [ratings, setRatings] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState<string[]>([])
  const couleur = organisme?.couleur || '#2d5af7'
  const initials = apprenant ? `${apprenant.prenom?.[0]}${apprenant.nom?.[0]}`.toUpperCase() : '?'

  const tabs = [
    { id: 'cours', label: '📚 Cours', count: cours.length },
    { id: 'documents', label: '📄 Documents', count: documents.length },
    { id: 'emargements', label: '✍️ Émargements', count: emargements.length },
    { id: 'satisfaction', label: '⭐ Satisfaction', count: questionnaires.filter((q:any) => q.statut !== 'complete').length },
  ]

  const submitSatisfaction = async (qid: string) => {
    await fetch('/api/apprenants/submit-satisfaction', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ questionnaire_id: qid, reponses: ratings[qid] }) })
    setSubmitted(s => [...s, qid])
  }

  return (
    <>
      <Head><title>Mon espace formation — {organisme?.nom}</title><meta name="viewport" content="width=device-width,initial-scale=1"/></Head>
      <div style={{ minHeight:'100vh', maxWidth:680, margin:'0 auto', padding:'0 0 80px' }}>
        {/* Header */}
        <div style={{ background:couleur, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎓</div>
            <div><div style={{ color:'#fff', fontWeight:600, fontSize:14 }}>{organisme?.nom}</div><div style={{ color:'rgba(255,255,255,.7)', fontSize:11 }}>Espace formation</div></div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'#fff', fontSize:13, fontWeight:500 }}>{apprenant?.prenom} {apprenant?.nom}</div>
              <div style={{ color:'rgba(255,255,255,.6)', fontSize:11 }}>{apprenant?.entreprise}</div>
            </div>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>{initials}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ background:couleur+'cc', padding:'8px 16px 16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[['📚', cours.length, 'Formations'],['✅', cours.filter((c:any)=>c.progressions?.[0]?.complete).length,'Terminées'],['📄', documents.filter((d:any)=>d.signe).length+'/'+documents.length,'Documents']].map(([icon,val,label])=>(
              <div key={String(label)} style={{ background:'rgba(255,255,255,.12)', borderRadius:12, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontSize:18 }}>{icon}</div>
                <div style={{ color:'#fff', fontWeight:700, fontSize:18, lineHeight:1 }}>{val}</div>
                <div style={{ color:'rgba(255,255,255,.7)', fontSize:10, marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding:'12px 16px' }}>
          <div style={{ display:'flex', gap:4, padding:4, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:12, marginBottom:16 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:'8px 4px', borderRadius:8, border:'none', cursor:'pointer', fontSize:11, fontWeight:500, fontFamily:'DM Sans,system-ui', background: tab===t.id ? couleur : 'transparent', color: tab===t.id ? '#fff' : 'var(--text3)', transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                {t.label} {t.count>0 && <span style={{ fontSize:9, background: tab===t.id?'rgba(255,255,255,.25)':'rgba(255,255,255,.1)', padding:'1px 5px', borderRadius:10 }}>{t.count}</span>}
              </button>
            ))}
          </div>

          {/* COURS */}
          {tab==='cours' && <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {!cours.length && <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Aucun cours disponible</div>}
            {cours.map((c:any) => {
              const prog = c.progressions?.[0]?.pourcentage || 0
              const done = c.progressions?.[0]?.complete
              return (
                <div key={c.id} className="card">
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ width:44, height:44, borderRadius:11, background:couleur+'20', border:`1px solid ${couleur}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                      {c.type==='video'?'🎬':c.type==='quiz'?'❓':'📖'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:4 }}>{c.titre}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:10, color: done?'#6ee7b7':'#93c5fd', background: done?'rgba(16,185,129,.1)':'rgba(59,130,246,.1)', padding:'2px 8px', borderRadius:20, border:`1px solid ${done?'rgba(16,185,129,.2)':'rgba(59,130,246,.2)'}` }}>{done?'✓ Terminé':prog>0?`${prog}% en cours`:'À commencer'}</span>
                        {c.duree_minutes&&<span style={{ fontSize:10, color:'var(--text3)' }}>⏱ {c.duree_minutes}min</span>}
                      </div>
                      {prog>0&&!done&&<div style={{ marginTop:8 }}>
                        <div style={{ height:5, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${prog}%`, background:couleur, borderRadius:3, transition:'width .5s' }} />
                        </div>
                      </div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>}

          {/* DOCUMENTS */}
          {tab==='documents' && <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {!documents.length && <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Aucun document</div>}
            {documents.map((d:any) => (
              <div key={d.id} className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:24, flexShrink:0 }}>{d.type==='convention'?'📋':d.type==='attestation'?'🏆':d.type==='convocation'?'📨':'📄'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.nom}</div>
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    <span style={{ fontSize:10, color:'var(--text3)' }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
                    <span style={{ fontSize:10, padding:'1px 7px', borderRadius:20, border:'1px solid', ...(d.signe?{color:'#6ee7b7',background:'rgba(16,185,129,.1)',borderColor:'rgba(16,185,129,.25)'}:{color:'#fcd34d',background:'rgba(245,158,11,.1)',borderColor:'rgba(245,158,11,.25)'}) }}>{d.signe?'✓ Signé':'⏳ En attente'}</span>
                  </div>
                </div>
                {d.fichier_url && <a href={d.fichier_url} target="_blank" rel="noreferrer" style={{ width:36, height:36, borderRadius:9, background:couleur+'15', border:`1px solid ${couleur}30`, color:couleur, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, textDecoration:'none' }}>⬇</a>}
              </div>
            ))}
          </div>}

          {/* ÉMARGEMENTS */}
          {tab==='emargements' && <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {!emargements.length && <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Aucun émargement</div>}
            {emargements.map((e:any) => (
              <div key={e.id} className="card">
                <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:6 }}>{e.sessions?.titre||'Session'}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:10 }}>📅 {e.sessions?.date_debut ? new Date(e.sessions.date_debut).toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) : '—'}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {['matin','aprem'].map(p => (
                    <div key={p} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:9 }}>
                      <span style={{ fontSize:12, color:'var(--text2)' }}>{p==='matin'?'🌅 Matin':'🌇 Après-midi'}</span>
                      <span style={{ fontSize:11, color: e.signe&&e.periode===p?'#6ee7b7':'var(--text3)' }}>{e.signe&&e.periode===p?(e.heure_signature?new Date(e.heure_signature).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'✓'):'—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>}

          {/* SATISFACTION */}
          {tab==='satisfaction' && <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {!questionnaires.length && <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Aucun questionnaire</div>}
            {questionnaires.map((q:any) => {
              const isDone = q.statut==='complete' || submitted.includes(q.id)
              return (
                <div key={q.id} className="card">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{q.sessions?.titre||'Formation'}</div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Questionnaire {q.type==='a_chaud'?'à chaud':'à froid'}</div>
                    </div>
                    <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, border:'1px solid', ...(isDone?{color:'#6ee7b7',background:'rgba(16,185,129,.1)',borderColor:'rgba(16,185,129,.25)'}:{color:'#fcd34d',background:'rgba(245,158,11,.1)',borderColor:'rgba(245,158,11,.25)'})}}>
                      {isDone?'✓ Complété':'En attente'}
                    </span>
                  </div>
                  {!isDone && <>
                    {[['note_global','⭐ Note globale'],['note_contenu','📚 Contenu'],['note_formateur','👤 Formateur'],['note_organisation','🏢 Organisation']].map(([key,label])=>(
                      <div key={key} style={{ marginBottom:12 }}>
                        <div style={{ fontSize:12, color:'var(--text2)', marginBottom:6 }}>{label}</div>
                        <div style={{ display:'flex', gap:8 }}>
                          {[1,2,3,4,5].map(n => (
                            <button key={n} onClick={() => setRatings(r => ({...r, [q.id]: {...(r[q.id]||{}), [key]:n}}))}
                              style={{ width:42, height:42, borderRadius:9, border:`2px solid ${ratings[q.id]?.[key]===n?couleur:'var(--border)'}`, background:ratings[q.id]?.[key]===n?couleur:'var(--bg)', color:ratings[q.id]?.[key]===n?'#fff':'var(--text2)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans,system-ui', transition:'all .15s' }}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:12, color:'var(--text2)', marginBottom:6 }}>💬 Commentaire (optionnel)</div>
                      <textarea className="form-textarea" placeholder="Partagez vos impressions..." rows={3} onChange={e => setRatings(r => ({...r, [q.id]: {...(r[q.id]||{}), commentaire:e.target.value}}))} />
                    </div>
                    <button onClick={() => submitSatisfaction(q.id)} disabled={!ratings[q.id]?.note_global} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', background:couleur, opacity:!ratings[q.id]?.note_global?.5:1 }}>
                      Envoyer mon évaluation ✓
                    </button>
                  </>}
                </div>
              )
            })}
          </div>}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { token } = ctx.params as { token: string }
  try {
    const { data: apprenant, error } = await supabaseAdmin
      .from('apprenants').select('*, organismes(id, nom, couleur)')
      .eq('lien_acces', token).single()
    if (error || !apprenant) return { redirect: { destination: '/login?expired=true', permanent: false } }
    await supabaseAdmin.from('apprenants').update({ dernier_acces: new Date().toISOString() }).eq('id', apprenant.id)
    const [{ data: cours }, { data: documents }, { data: emargements }, { data: questionnaires }] = await Promise.all([
      supabaseAdmin.from('cours').select('*, progressions(pourcentage,complete)').eq('organisme_id', apprenant.organisme_id).eq('actif', true).order('ordre'),
      supabaseAdmin.from('documents').select('*').eq('apprenant_id', apprenant.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('emargements').select('*, sessions(titre,date_debut)').eq('apprenant_id', apprenant.id),
      supabaseAdmin.from('questionnaires').select('*, sessions(titre)').eq('apprenant_id', apprenant.id),
    ])
    return { props: { apprenant, organisme: apprenant.organismes, cours: cours||[], documents: documents||[], emargements: emargements||[], questionnaires: questionnaires||[] } }
  } catch {
    return { redirect: { destination: '/login', permanent: false } }
  }
}
