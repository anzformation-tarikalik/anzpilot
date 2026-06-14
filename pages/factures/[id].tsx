import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function FactureView() {
  const router = useRouter()
  const { id } = router.query
  const [f, setF] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/factures/get?id=${id}`).then(r=>r.json()).then(d=>{ setF(d.facture); setLoading(false) }).catch(()=>setLoading(false))
  }, [id])

  async function genPDF() {
    if (!f) return
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      // Header
      doc.setFillColor(14,165,233); doc.rect(0,0,210,30,'F')
      doc.setTextColor(255,255,255); doc.setFontSize(22); doc.setFont('helvetica','bold')
      doc.text('FACTURE', 14, 18)
      doc.setFontSize(10); doc.setFont('helvetica','normal')
      doc.text(`N° ${f.numero}`, 196, 12, {align:'right'})
      doc.text(`Date: ${new Date(f.date_emission).toLocaleDateString('fr-FR')}`, 196, 18, {align:'right'})
      doc.text(`Échéance: ${new Date(f.date_echeance).toLocaleDateString('fr-FR')}`, 196, 24, {align:'right'})

      // Émetteur
      doc.setTextColor(15,23,42); doc.setFontSize(9)
      doc.setFont('helvetica','bold'); doc.text('ÉMETTEUR', 14, 42)
      doc.setFont('helvetica','normal')
      doc.text(f.of_nom||'', 14, 48); doc.text(`SIRET: ${f.of_siret||''}`, 14, 53)
      if (f.of_nda) doc.text(`NDA: ${f.of_nda}`, 14, 58)
      doc.text(f.of_adresse||'', 14, 63)

      // Destinataire
      doc.setFont('helvetica','bold'); doc.text('FACTURÉ À', 120, 42)
      doc.setFont('helvetica','normal')
      doc.text(f.destinataire_nom||'', 120, 48)
      if (f.destinataire_siret) doc.text(`SIRET: ${f.destinataire_siret}`, 120, 53)
      doc.text(f.destinataire_adresse||'', 120, 58)
      if (f.destinataire_reference) doc.text(`Réf: ${f.destinataire_reference}`, 120, 63)

      // Tableau
      let y = 85
      doc.setFillColor(241,245,249); doc.rect(14,y,182,8,'F')
      doc.setFont('helvetica','bold'); doc.setFontSize(9)
      doc.text('DÉSIGNATION', 16, y+5.5); doc.text('QTÉ', 130, y+5.5); doc.text('PU HT', 150, y+5.5); doc.text('TOTAL HT', 178, y+5.5, {align:'right'})
      y += 12
      doc.setFont('helvetica','normal')
      const desc = `Formation : ${f.formation_titre||''}\nApprenant : ${f.apprenant_nom||''}\nDates : ${f.date_formation_debut?new Date(f.date_formation_debut).toLocaleDateString('fr-FR'):''} → ${f.date_formation_fin?new Date(f.date_formation_fin).toLocaleDateString('fr-FR'):''}\nDurée : ${f.duree_heures||'-'} heures`
      const lines = doc.splitTextToSize(desc, 110)
      doc.text(lines, 16, y); doc.text('1', 130, y); doc.text(`${(f.prix_ht||0).toLocaleString('fr-FR')}€`, 150, y); doc.text(`${(f.prix_ht||0).toLocaleString('fr-FR')}€`, 196, y, {align:'right'})
      y += Math.max(lines.length*4, 18)

      // Totaux (sans TVA — exonération OF)
      doc.setDrawColor(200,200,200); doc.line(120, y, 196, y); y += 8
      doc.setFillColor(16,185,129); doc.rect(120, y-4, 76, 10, 'F'); doc.setTextColor(255,255,255)
      doc.setFont('helvetica','bold'); doc.setFontSize(11)
      doc.text('TOTAL:', 124, y+2); doc.text(`${(f.prix_ht||0).toLocaleString('fr-FR')}€`, 192, y+2, {align:'right'})
      doc.setTextColor(15,23,42); y += 8
      doc.setFontSize(8); doc.setFont('helvetica','italic')
      doc.text('TVA non applicable, article 261-4-4 du CGI', 196, y, {align:'right'})
      y += 10

      // Conditions paiement
      doc.setTextColor(15,23,42); doc.setFont('helvetica','bold'); doc.setFontSize(9)
      doc.text('MODALITÉS DE PAIEMENT', 14, y); y += 5
      doc.setFont('helvetica','normal'); doc.text(f.modalites_paiement||'', 14, y); y += 5
      if (f.of_iban) { doc.text(`IBAN: ${f.of_iban}`, 14, y); y += 4 }
      if (f.of_bic) { doc.text(`BIC: ${f.of_bic}`, 14, y); y += 4 }
      if (f.notes) {
        y += 4; const noteLines = doc.splitTextToSize(f.notes, 182)
        doc.setFontSize(8); doc.setTextColor(100,116,139); doc.text(noteLines, 14, y)
      }

      // Footer
      doc.setFontSize(7); doc.setTextColor(148,163,184)
      doc.text('Document généré par ANZPilot — anzpilot.com', 105, 290, {align:'center'})

      doc.save(`${f.numero}.pdf`)
    } catch(e:any) { alert(e.message) }
    setGenerating(false)
  }

  if (loading) return <div style={{ minHeight:'100vh', background:'#050c1a', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans,system-ui' }}>⏳ Chargement...</div>
  if (!f) return <div style={{ minHeight:'100vh', background:'#050c1a', color:'#94a3b8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans,system-ui', gap:14 }}><div style={{ fontSize:48 }}>💳</div><div>Facture introuvable</div><Link href="/factures" style={{ color:'#0ea5e9' }}>← Retour</Link></div>

  return (
    <>
      <Head><title>{f.numero} — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <Link href="/factures" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour</Link>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'14px 0 20px' }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:24, fontWeight:700, color:'#fff', margin:0 }}>💳 {f.numero}</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>{f.destinataire_nom} · {f.prix_ttc?.toLocaleString('fr-FR')}€ TTC</p>
            </div>
            <button onClick={genPDF} disabled={generating} style={{ padding:'12px 24px', borderRadius:9, border:'none', cursor:generating?'wait':'pointer', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', background:generating?'#1e3a5f':'linear-gradient(135deg,#10b981,#059669)', color:'#fff' }}>{generating?'⏳ Génération...':'⬇️ Télécharger PDF'}</button>
          </div>

          <div style={{ background:'#fff', color:'#0f172a', borderRadius:14, padding:32, fontFamily:'Helvetica, Arial, sans-serif' }}>
            <div style={{ background:'#0ea5e9', color:'#fff', padding:16, borderRadius:8, marginBottom:20, display:'flex', justifyContent:'space-between' }}>
              <div><div style={{ fontSize:22, fontWeight:700 }}>FACTURE</div></div>
              <div style={{ textAlign:'right', fontSize:13 }}>
                <div>N° {f.numero}</div>
                <div>Date: {new Date(f.date_emission).toLocaleDateString('fr-FR')}</div>
                <div>Échéance: {new Date(f.date_echeance).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
              <div style={{ background:'#f1f5f9', padding:14, borderRadius:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#0ea5e9', marginBottom:6 }}>ÉMETTEUR</div>
                <div style={{ fontSize:13, fontWeight:600 }}>{f.of_nom}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>SIRET: {f.of_siret}</div>
                {f.of_nda && <div style={{ fontSize:12, color:'#64748b' }}>NDA: {f.of_nda}</div>}
                <div style={{ fontSize:12, color:'#64748b' }}>{f.of_adresse}</div>
              </div>
              <div style={{ background:'#f1f5f9', padding:14, borderRadius:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#0ea5e9', marginBottom:6 }}>FACTURÉ À</div>
                <div style={{ fontSize:13, fontWeight:600 }}>{f.destinataire_nom}</div>
                {f.destinataire_siret && <div style={{ fontSize:12, color:'#64748b' }}>SIRET: {f.destinataire_siret}</div>}
                <div style={{ fontSize:12, color:'#64748b' }}>{f.destinataire_adresse}</div>
                {f.destinataire_reference && <div style={{ fontSize:12, color:'#64748b' }}>Réf: {f.destinataire_reference}</div>}
              </div>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}>
              <thead><tr style={{ background:'#f1f5f9' }}>
                <th style={{ padding:10, textAlign:'left', fontSize:11, fontWeight:700, color:'#0f172a' }}>DÉSIGNATION</th>
                <th style={{ padding:10, textAlign:'center', fontSize:11, fontWeight:700, color:'#0f172a' }}>QTÉ</th>
                <th style={{ padding:10, textAlign:'right', fontSize:11, fontWeight:700, color:'#0f172a' }}>PU HT</th>
                <th style={{ padding:10, textAlign:'right', fontSize:11, fontWeight:700, color:'#0f172a' }}>TOTAL HT</th>
              </tr></thead>
              <tbody><tr style={{ borderBottom:'1px solid #e2e8f0' }}>
                <td style={{ padding:14 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>Formation : {f.formation_titre}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>Apprenant : {f.apprenant_nom}</div>
                  {f.date_formation_debut && <div style={{ fontSize:12, color:'#64748b' }}>Du {new Date(f.date_formation_debut).toLocaleDateString('fr-FR')} au {new Date(f.date_formation_fin).toLocaleDateString('fr-FR')} · {f.duree_heures}h</div>}
                </td>
                <td style={{ padding:14, textAlign:'center', fontSize:13 }}>1</td>
                <td style={{ padding:14, textAlign:'right', fontSize:13 }}>{f.prix_ht?.toLocaleString('fr-FR')}€</td>
                <td style={{ padding:14, textAlign:'right', fontSize:13, fontWeight:600 }}>{f.prix_ht?.toLocaleString('fr-FR')}€</td>
              </tr></tbody>
            </table>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <div style={{ width:300 }}>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#10b981', color:'#fff', borderRadius:6, fontSize:15, fontWeight:700 }}><span>TOTAL</span><span>{f.prix_ht?.toLocaleString('fr-FR')}€</span></div>
                <div style={{ fontSize:11, color:'#64748b', textAlign:'right', marginTop:8, fontStyle:'italic' }}>TVA non applicable, art. 261-4-4 du CGI</div>
              </div>
            </div>
            <div style={{ marginTop:24, paddingTop:14, borderTop:'1px solid #e2e8f0', fontSize:12, color:'#64748b' }}>
              <div style={{ fontWeight:600, color:'#0f172a', marginBottom:6 }}>MODALITÉS DE PAIEMENT</div>
              <div>{f.modalites_paiement}</div>
              {f.of_iban && <div>IBAN : {f.of_iban}</div>}
              {f.of_bic && <div>BIC : {f.of_bic}</div>}
              {f.notes && <div style={{ marginTop:10, fontStyle:'italic' }}>{f.notes}</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
