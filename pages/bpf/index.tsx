import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function BPFDashboard() {
  const [annee, setAnnee] = useState(new Date().getFullYear() - 1)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/bpf/aggregate?annee=${annee}`).then(r=>r.json()).then(d=>{ setData(d); setLoading(false) }).catch(()=>setLoading(false))
  }, [annee])

  async function genPDF() {
    if (!data) return
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      doc.setFillColor(14,165,233); doc.rect(0,0,210,30,'F')
      doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold')
      doc.text('BILAN PÉDAGOGIQUE ET FINANCIER', 14, 14)
      doc.setFontSize(11); doc.setFont('helvetica','normal')
      doc.text(`Exercice ${annee} — À déposer avant le 31 mai ${annee+1}`, 14, 22)

      doc.setTextColor(15,23,42); let y = 44
      doc.setFontSize(13); doc.setFont('helvetica','bold')
      doc.text('CADRE A — IDENTIFICATION', 14, y); y+=6
      doc.setFontSize(10); doc.setFont('helvetica','normal')
      doc.text(`Organisme : ${data.of_nom||'ANZ Formation'}`, 14, y); y+=5
      doc.text(`SIRET : ${data.of_siret||'À renseigner'}`, 14, y); y+=5
      doc.text(`NDA : ${data.of_nda||'À renseigner'}`, 14, y); y+=10

      doc.setFontSize(13); doc.setFont('helvetica','bold')
      doc.text('CADRE B — BILAN PÉDAGOGIQUE', 14, y); y+=8
      doc.setFontSize(10); doc.setFont('helvetica','normal')
      const items = [
        ['B1. Nombre de stagiaires', `${data.nb_stagiaires||0}`],
        ['B2. Heures stagiaires', `${(data.heures_stagiaires||0).toLocaleString('fr-FR')}h`],
        ['B3. Nombre de formations', `${data.nb_formations||0}`],
        ['B4. Heures formations dispensées', `${(data.heures_dispensees||0).toLocaleString('fr-FR')}h`],
      ]
      items.forEach(([l,v])=>{ doc.text(l, 16, y); doc.text(v, 196, y, {align:'right'}); y+=5 })
      y+=4

      doc.setFontSize(13); doc.setFont('helvetica','bold')
      doc.text('CADRE C — BILAN FINANCIER', 14, y); y+=8
      doc.setFontSize(10); doc.setFont('helvetica','normal')
      const finItems = [
        ['Produits OPCO', `${(data.ca_opco||0).toLocaleString('fr-FR')}€`],
        ['Produits entreprises', `${(data.ca_entreprise||0).toLocaleString('fr-FR')}€`],
        ['Produits CPF', `${(data.ca_cpf||0).toLocaleString('fr-FR')}€`],
        ['Produits Pôle Emploi', `${(data.ca_pole_emploi||0).toLocaleString('fr-FR')}€`],
        ['Autres produits', `${(data.ca_autres||0).toLocaleString('fr-FR')}€`],
      ]
      finItems.forEach(([l,v])=>{ doc.text(l, 16, y); doc.text(v, 196, y, {align:'right'}); y+=5 })
      y+=2
      doc.setFillColor(16,185,129); doc.rect(14, y-3, 182, 10, 'F'); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(11)
      doc.text('TOTAL CHIFFRE D\'AFFAIRES HT', 16, y+3); doc.text(`${(data.ca_total||0).toLocaleString('fr-FR')}€`, 194, y+3, {align:'right'})
      y+=16

      doc.setTextColor(15,23,42); doc.setFontSize(8); doc.setFont('helvetica','italic')
      doc.text('Ce BPF doit être déclaré en ligne sur https://bilan-pedagogique.travail-emploi.gouv.fr/', 14, 275)
      doc.text('Document généré par ANZPilot — anzpilot.com', 105, 285, {align:'center'})
      doc.save(`BPF-${annee}.pdf`)
    } catch(e:any) { alert(e.message) }
    setGenerating(false)
  }

  return (
    <>
      <Head><title>BPF — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <Link href="/dashboard" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour</Link>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'12px 0 24px' }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:0 }}>📊 BPF automatique</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>Bilan Pédagogique et Financier — calculé depuis vos conventions</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <select value={annee} onChange={e=>setAnnee(parseInt(e.target.value))} style={{ background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, padding:'10px 14px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}>
                {[2026,2025,2024,2023].map(y=><option key={y} value={y}>Année {y}</option>)}
              </select>
              <button onClick={genPDF} disabled={generating||!data} style={{ padding:'10px 22px', borderRadius:9, border:'none', background:generating?'#1e3a5f':'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:generating?'not-allowed':'pointer' }}>{generating?'⏳':'⬇️ Télécharger PDF'}</button>
            </div>
          </div>

          {/* Alerte échéance */}
          <div style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.3)', borderRadius:12, padding:16, marginBottom:24, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:24 }}>⏰</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#f59e0b' }}>Échéance déclaration BPF</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>Le BPF {annee} doit être déclaré en ligne avant le <strong>31 mai {annee+1}</strong> sur bilan-pedagogique.travail-emploi.gouv.fr</div>
            </div>
          </div>

          {loading ? <div style={{ textAlign:'center', padding:48, color:'#64748b' }}>⏳ Calcul des indicateurs...</div>
          : !data ? <div>Erreur de chargement</div>
          : (
            <>
              {/* Bilan pédagogique */}
              <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24, marginBottom:16 }}>
                <h3 style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 16px' }}>📚 Cadre B — Bilan pédagogique</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14 }}>
                  {[
                    ['👥', 'Stagiaires', data.nb_stagiaires||0, '#0ea5e9'],
                    ['⏱️', 'Heures stagiaires', (data.heures_stagiaires||0).toLocaleString('fr-FR')+'h', '#8b5cf6'],
                    ['🎓', 'Formations', data.nb_formations||0, '#10b981'],
                    ['📅', 'Heures dispensées', (data.heures_dispensees||0).toLocaleString('fr-FR')+'h', '#f59e0b'],
                  ].map(([icon,label,val,color]:any)=>(
                    <div key={label} style={{ background:'rgba(255,255,255,.02)', borderRadius:10, padding:14 }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
                      <div style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color }}>{val}</div>
                      <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bilan financier */}
              <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24, marginBottom:16 }}>
                <h3 style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 16px' }}>💰 Cadre C — Bilan financier (HT)</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:16 }}>
                  {[
                    ['🏦', 'OPCO', (data.ca_opco||0).toLocaleString('fr-FR')+'€'],
                    ['🏢', 'Entreprises', (data.ca_entreprise||0).toLocaleString('fr-FR')+'€'],
                    ['💳', 'CPF', (data.ca_cpf||0).toLocaleString('fr-FR')+'€'],
                    ['🎯', 'Pôle Emploi', (data.ca_pole_emploi||0).toLocaleString('fr-FR')+'€'],
                    ['👤', 'Autres', (data.ca_autres||0).toLocaleString('fr-FR')+'€'],
                  ].map(([icon,label,val]:any)=>(
                    <div key={label} style={{ background:'rgba(255,255,255,.02)', borderRadius:10, padding:14 }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
                      <div style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff' }}>{val}</div>
                      <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:14, background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:13, color:'#fff', fontWeight:600 }}>TOTAL CHIFFRE D'AFFAIRES HT</div>
                  <div style={{ fontFamily:'Sora,Georgia', fontSize:24, fontWeight:800, color:'#fff' }}>{(data.ca_total||0).toLocaleString('fr-FR')}€</div>
                </div>
              </div>

              <div style={{ background:'rgba(14,165,233,.05)', border:'1px solid rgba(14,165,233,.2)', borderRadius:12, padding:16, fontSize:12, color:'#94a3b8' }}>
                💡 Ces chiffres sont calculés automatiquement à partir de vos conventions et factures. Pour la déclaration officielle, rendez-vous sur <a href="https://bilan-pedagogique.travail-emploi.gouv.fr/" target="_blank" rel="noopener" style={{ color:'#0ea5e9' }}>bilan-pedagogique.travail-emploi.gouv.fr</a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
