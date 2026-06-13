import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// Les 7 critères et 32 indicateurs Qualiopi officiels
const CRITERES = [
  { id:1, nom:'Information du public', indicateurs:[
    {n:1, t:'Information publique sur les prestations'},
    {n:2, t:'Indicateurs de résultats (taux satisfaction, abandon...)'},
    {n:3, t:'Conditions de l\'offre (prérequis, accessibilité)'},
  ]},
  { id:2, nom:'Identification des objectifs', indicateurs:[
    {n:4, t:'Objectifs opérationnels et évaluables'},
    {n:5, t:'Adéquation des prestations aux objectifs'},
    {n:6, t:'Modalités d\'évaluation à l\'entrée'},
    {n:7, t:'Adaptation pour public en situation handicap'},
  ]},
  { id:3, nom:'Adaptation aux publics', indicateurs:[
    {n:8, t:'Adaptation du parcours aux bénéficiaires'},
    {n:9, t:'Adaptation du contenu et progression pédagogique'},
    {n:10, t:'Conditions d\'accueil, d\'encadrement et de suivi'},
    {n:11, t:'Évaluation de l\'atteinte des objectifs'},
  ]},
  { id:4, nom:'Adéquation des moyens', indicateurs:[
    {n:12, t:'Moyens pédagogiques, techniques et d\'encadrement'},
    {n:13, t:'Information sur les conditions de déroulement'},
    {n:14, t:'Coordination des intervenants internes/externes'},
    {n:15, t:'Mise à disposition de ressources pédagogiques'},
  ]},
  { id:5, nom:'Qualification des personnels', indicateurs:[
    {n:16, t:'Compétences et qualifications du personnel'},
    {n:17, t:'Compétences des intervenants externes'},
    {n:18, t:'Maintien et développement des compétences'},
  ]},
  { id:6, nom:'Inscription dans l\'environnement', indicateurs:[
    {n:19, t:'Veille sur les évolutions de la profession'},
    {n:20, t:'Veille légale et réglementaire'},
    {n:21, t:'Veille sur les innovations pédagogiques'},
    {n:22, t:'Articulation avec acteurs socio-économiques'},
    {n:23, t:'Mobilisation des compétences handicap'},
  ]},
  { id:7, nom:'Recueil des appréciations', indicateurs:[
    {n:24, t:'Recueil des appréciations bénéficiaires'},
    {n:25, t:'Recueil des appréciations financeurs/entreprises'},
    {n:26, t:'Traitement des réclamations'},
    {n:27, t:'Mise en œuvre des mesures d\'amélioration'},
    {n:28, t:'Mesure de l\'atteinte des objectifs'},
    {n:29, t:'Taux de retour des questionnaires'},
    {n:30, t:'Suivi des taux d\'interruption'},
    {n:31, t:'Indicateurs spécifiques actions handicap'},
    {n:32, t:'Définition et suivi d\'objectifs d\'amélioration'},
  ]},
]

export default function QualiopiDashboard() {
  const [statuts, setStatuts] = useState<Record<number,any>>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number|null>(null)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')
  const [preuveUrl, setPreuveUrl] = useState('')
  const [statut, setStatut] = useState('a_faire')

  useEffect(() => {
    fetch('/api/qualiopi/list').then(r=>r.json()).then(d=>{
      const map:Record<number,any> = {}
      ;(d.preuves||[]).forEach((p:any) => { map[p.indicateur_num] = p })
      setStatuts(map); setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const totaux = { conforme:0, a_faire:0, non_concerne:0, total:32 }
  Object.values(statuts).forEach((p:any) => { if (totaux[p.statut as keyof typeof totaux] !== undefined) (totaux as any)[p.statut]++ })
  totaux.a_faire = 32 - totaux.conforme - totaux.non_concerne
  const score = Math.round((totaux.conforme / (32 - totaux.non_concerne)) * 100) || 0

  function openModal(n:number) {
    setSelected(n)
    const existing = statuts[n]
    setStatut(existing?.statut || 'a_faire')
    setNote(existing?.note || '')
    setPreuveUrl(existing?.preuve_url || '')
  }

  async function saveIndicateur() {
    if (selected === null) return
    setSaving(true)
    try {
      const res = await fetch('/api/qualiopi/save', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ indicateur_num: selected, statut, note, preuve_url: preuveUrl })
      })
      const d = await res.json()
      if (d.success) {
        setStatuts(p => ({ ...p, [selected]: { indicateur_num:selected, statut, note, preuve_url:preuveUrl } }))
        setSelected(null)
      } else alert('Erreur: '+(d.error||'inconnue'))
    } catch(e:any) { alert(e.message) }
    setSaving(false)
  }

  return (
    <>
      <Head><title>Qualiopi — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <Link href="/dashboard" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour</Link>
          <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:'12px 0 4px' }}>🛡️ Qualiopi</h1>
          <p style={{ fontSize:14, color:'#94a3b8', marginBottom:24 }}>7 critères · 32 indicateurs · Suivi de votre conformité audit</p>

          {/* Score global */}
          <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24, marginBottom:24, display:'flex', alignItems:'center', gap:24 }}>
            <div style={{ width:120, height:120, borderRadius:'50%', background:`conic-gradient(${score>=80?'#10b981':score>=50?'#f59e0b':'#ef4444'} ${score*3.6}deg, rgba(255,255,255,.08) 0)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <div style={{ width:96, height:96, borderRadius:'50%', background:'#050c1a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:800, color: score>=80?'#10b981':score>=50?'#f59e0b':'#ef4444' }}>{score}%</div>
                <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>conformité</div>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', marginBottom:14 }}>Score global de conformité</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                <div><div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase' }}>Conformes</div><div style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#10b981' }}>{totaux.conforme}/32</div></div>
                <div><div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase' }}>À faire</div><div style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#f59e0b' }}>{totaux.a_faire}</div></div>
                <div><div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase' }}>Non concernés</div><div style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#64748b' }}>{totaux.non_concerne}</div></div>
              </div>
            </div>
          </div>

          {loading ? <div style={{ textAlign:'center', padding:48, color:'#64748b' }}>⏳ Chargement...</div>
          : CRITERES.map(crit => {
            const indicConformes = crit.indicateurs.filter(i => statuts[i.n]?.statut === 'conforme').length
            return (
              <div key={crit.id} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:20, marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'rgba(14,165,233,.15)', border:'1px solid rgba(14,165,233,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Sora,Georgia', fontWeight:700, color:'#0ea5e9' }}>{crit.id}</div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:600, color:'#fff' }}>Critère {crit.id} — {crit.nom}</div>
                      <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{indicConformes}/{crit.indicateurs.length} indicateurs conformes</div>
                    </div>
                  </div>
                  <div style={{ width:80, height:8, background:'rgba(255,255,255,.08)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${(indicConformes/crit.indicateurs.length)*100}%`, height:'100%', background:'#10b981' }}/>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:8 }}>
                  {crit.indicateurs.map(ind => {
                    const s = statuts[ind.n]?.statut || 'a_faire'
                    const color = s==='conforme'?'#10b981':s==='non_concerne'?'#64748b':'#f59e0b'
                    return (
                      <button key={ind.n} onClick={()=>openModal(ind.n)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)', cursor:'pointer', textAlign:'left', fontFamily:'DM Sans,system-ui' }}>
                        <div style={{ width:24, height:24, borderRadius:6, background:color+'22', border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:700, color }}>{ind.n}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, color:'#fff' }}>{ind.t}</div>
                          <div style={{ fontSize:10, color, marginTop:2 }}>{s==='conforme'?'✅ Conforme':s==='non_concerne'?'⚪ Non concerné':'⏳ À faire'}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal édition */}
        {selected !== null && (
          <div onClick={()=>setSelected(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:24, maxWidth:500, width:'100%' }}>
              <h3 style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>Indicateur {selected}</h3>
              <p style={{ fontSize:12, color:'#64748b', marginBottom:18 }}>{CRITERES.flatMap(c=>c.indicateurs).find(i=>i.n===selected)?.t}</p>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' }}>Statut</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:14 }}>
                {[['conforme','✅','Conforme','#10b981'],['a_faire','⏳','À faire','#f59e0b'],['non_concerne','⚪','Non concerné','#64748b']].map(([id,icon,name,col]:any)=>(
                  <button key={id} onClick={()=>setStatut(id as string)} style={{ padding:10, borderRadius:8, border:statut===id?`1px solid ${col}`:'1px solid rgba(255,255,255,.08)', background:statut===id?col+'22':'rgba(255,255,255,.04)', cursor:'pointer', textAlign:'center', fontFamily:'DM Sans,system-ui' }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:statut===id?col:'#94a3b8' }}>{name}</div>
                  </button>
                ))}
              </div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' }}>Note / Preuve fournie</label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Décrivez la preuve mise en place..." style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', resize:'vertical', marginBottom:14 }}/>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase' }}>Lien vers la preuve (URL)</label>
              <input value={preuveUrl} onChange={e=>setPreuveUrl(e.target.value)} placeholder="https://drive.google.com/..." style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', marginBottom:18 }}/>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setSelected(null)} style={{ flex:1, padding:11, borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>Annuler</button>
                <button onClick={saveIndicateur} disabled={saving} style={{ flex:1, padding:11, borderRadius:9, border:'none', background:saving?'#1e3a5f':'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:saving?'not-allowed':'pointer' }}>{saving?'⏳':'💾 Sauvegarder'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
