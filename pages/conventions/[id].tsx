import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ConventionView() {
  const router = useRouter()
  const { id } = router.query
  const [convention, setConvention] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/conventions/get?id=${id}`)
      .then(r => r.json())
      .then(d => { setConvention(d.convention); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function generatePDF() {
    if (!convention) return
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit:'mm', format:'a4' })
      let y = 20

      // Header
      doc.setFillColor(14, 165, 233)
      doc.rect(0, 0, 210, 12, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica','bold')
      doc.text('ANZPILOT', 14, 7.5)
      doc.setFont('helvetica','normal')
      doc.text(`Document n° ${convention.numero}`, 196, 7.5, {align:'right'})

      // Titre
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(20)
      doc.setFont('helvetica','bold')
      const titres: Record<string,string> = {
        convention:'CONVENTION DE FORMATION PROFESSIONNELLE',
        convocation:'CONVOCATION DE FORMATION',
        attestation:'ATTESTATION DE FIN DE FORMATION',
        programme:'PROGRAMME DE FORMATION'
      }
      doc.text(titres[convention.type] || titres.convention, 105, y, {align:'center'})
      y += 6
      doc.setFontSize(9)
      doc.setFont('helvetica','normal')
      doc.setTextColor(100, 116, 139)
      doc.text('Articles L.6353-1 et suivants du Code du travail', 105, y, {align:'center'})
      y += 12

      // Organisme
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(14, y, 182, 32, 2, 2, 'F')
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(11)
      doc.setFont('helvetica','bold')
      doc.text('ENTRE LES SOUSSIGNÉS', 18, y+5.5)
      doc.setFontSize(9)
      doc.setFont('helvetica','normal')
      y += 11
      doc.setFont('helvetica','bold')
      doc.text(convention.of_nom, 18, y)
      doc.setFont('helvetica','normal')
      y += 4
      doc.text(`SIRET : ${convention.of_siret} — NDA : ${convention.of_nda}`, 18, y)
      y += 4
      doc.text(convention.of_adresse, 18, y)
      y += 4
      doc.text(`Représenté par ${convention.of_representant || ''}`, 18, y)
      y += 4
      doc.text(`Ci-après dénommé « l'Organisme de Formation »`, 18, y)
      y += 10

      // Apprenant
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(14, y, 182, 28, 2, 2, 'F')
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(11)
      doc.setFont('helvetica','bold')
      doc.text('ET', 18, y+5.5)
      doc.setFontSize(9)
      doc.setFont('helvetica','normal')
      y += 11
      doc.setFont('helvetica','bold')
      doc.text(`${convention.apprenant_civilite} ${convention.apprenant_prenom} ${convention.apprenant_nom}`, 18, y)
      doc.setFont('helvetica','normal')
      y += 4
      if (convention.apprenant_adresse) {
        doc.text(convention.apprenant_adresse, 18, y)
        y += 4
      }
      if (convention.apprenant_email) {
        doc.text(`Email : ${convention.apprenant_email}`, 18, y)
        y += 4
      }
      doc.text(`Ci-après dénommé(e) « l'Apprenant(e) »`, 18, y)
      y += 10

      // Article 1 - Objet
      doc.setFontSize(11)
      doc.setFont('helvetica','bold')
      doc.text('ARTICLE 1 — OBJET DE LA FORMATION', 14, y)
      y += 5
      doc.setFontSize(9)
      doc.setFont('helvetica','normal')
      doc.text(`Intitulé : ${convention.formation_titre}`, 14, y)
      y += 4
      doc.text(`Modalités : ${convention.formation_modalites} — Durée : ${convention.duree_heures} heures`, 14, y)
      y += 4
      doc.text(`Du ${new Date(convention.date_debut).toLocaleDateString('fr-FR')} au ${new Date(convention.date_fin).toLocaleDateString('fr-FR')}`, 14, y)
      y += 4
      if (convention.formation_lieu) {
        doc.text(`Lieu : ${convention.formation_lieu}`, 14, y)
        y += 4
      }

      // Objectifs
      y += 4
      doc.setFont('helvetica','bold')
      doc.text('ARTICLE 2 — OBJECTIFS PÉDAGOGIQUES', 14, y)
      y += 5
      doc.setFont('helvetica','normal')
      const objectifs = doc.splitTextToSize(convention.formation_objectifs || '', 182)
      doc.text(objectifs, 14, y)
      y += objectifs.length * 4 + 4

      // Programme
      if (convention.formation_programme) {
        doc.setFont('helvetica','bold')
        doc.text('ARTICLE 3 — PROGRAMME', 14, y)
        y += 5
        doc.setFont('helvetica','normal')
        const prog = doc.splitTextToSize(convention.formation_programme, 182)
        doc.text(prog, 14, y)
        y += prog.length * 4 + 4
      }

      // Page 2 si besoin
      if (y > 240) { doc.addPage(); y = 20 }

      // Article tarif
      doc.setFont('helvetica','bold')
      doc.text('ARTICLE 4 — DISPOSITIONS FINANCIÈRES', 14, y)
      y += 6
      doc.setFillColor(240, 253, 244)
      doc.roundedRect(14, y, 182, 20, 2, 2, 'F')
      doc.setFontSize(10)
      doc.setFont('helvetica','bold')
      doc.text(`Montant total : ${convention.prix_ht?.toLocaleString('fr-FR')}€`, 20, y+7)
      doc.setFontSize(8)
      doc.setFont('helvetica','italic')
      doc.text(`TVA non applicable, article 261-4-4 du Code Général des Impôts`, 20, y+12)
      doc.setFont('helvetica','normal')
      doc.text(`Financement : ${convention.financement?.toUpperCase()} — Paiement : ${convention.modalites_paiement}`, 20, y+17)
      y += 26

      // Signatures
      y = Math.max(y, 240)
      doc.setFontSize(10)
      doc.setFont('helvetica','bold')
      doc.text('SIGNATURES', 105, y, {align:'center'})
      y += 8
      doc.setFont('helvetica','normal')
      doc.setFontSize(9)
      doc.text(`Fait à ${convention.of_adresse?.split(',').pop()?.trim() || 'Paris'}, le ${new Date().toLocaleDateString('fr-FR')}`, 105, y, {align:'center'})
      y += 10
      doc.setDrawColor(200,200,200)
      doc.rect(20, y, 75, 25)
      doc.rect(115, y, 75, 25)
      doc.setFont('helvetica','bold')
      doc.text("L'Organisme", 57, y+30, {align:'center'})
      doc.text("L'Apprenant(e)", 152, y+30, {align:'center'})

      // Footer
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text('Document généré par ANZPilot — anzpilot.com', 105, 290, {align:'center'})

      doc.save(`${convention.numero}-${convention.apprenant_nom}.pdf`)
    } catch (e: any) {
      alert('Erreur génération PDF: ' + e.message)
    }
    setGenerating(false)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#050c1a', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans,system-ui' }}>
      ⏳ Chargement...
    </div>
  )

  if (!convention) return (
    <div style={{ minHeight:'100vh', background:'#050c1a', color:'#94a3b8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans,system-ui', gap:14 }}>
      <div style={{ fontSize:48 }}>📄</div>
      <div>Document introuvable</div>
      <Link href="/conventions" style={{ color:'#0ea5e9', textDecoration:'none' }}>← Retour aux documents</Link>
    </div>
  )

  return (
    <>
      <Head><title>{convention.numero} — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:'24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <Link href="/conventions" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour aux documents</Link>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'14px 0 20px' }}>
            <div>
              <h1 style={{ fontFamily:'Sora,Georgia', fontSize:24, fontWeight:700, color:'#fff', margin:0 }}>📄 {convention.numero}</h1>
              <p style={{ fontSize:14, color:'#94a3b8', margin:'4px 0 0' }}>{convention.formation_titre}</p>
            </div>
            <button onClick={generatePDF} disabled={generating}
              style={{ padding:'12px 24px', borderRadius:9, border:'none', cursor:generating?'wait':'pointer', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', background:generating?'#1e3a5f':'linear-gradient(135deg,#10b981,#059669)', color:'#fff' }}>
              {generating?'⏳ Génération...':'⬇️ Télécharger PDF'}
            </button>
          </div>

          {/* Aperçu type fiche */}
          <div style={{ background:'#fff', color:'#0f172a', borderRadius:14, padding:32, fontFamily:'Helvetica, Arial, sans-serif' }}>
            <div style={{ borderBottom:'2px solid #0ea5e9', paddingBottom:14, marginBottom:20 }}>
              <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'.1em' }}>Document n° {convention.numero}</div>
              <h2 style={{ fontSize:22, fontWeight:700, color:'#0f172a', margin:'6px 0', textAlign:'center' }}>
                {{
                  convention:'CONVENTION DE FORMATION PROFESSIONNELLE',
                  convocation:'CONVOCATION DE FORMATION',
                  attestation:'ATTESTATION DE FIN DE FORMATION',
                  programme:'PROGRAMME DE FORMATION'
                }[convention.type as string]}
              </h2>
              <div style={{ fontSize:11, color:'#64748b', textAlign:'center' }}>Articles L.6353-1 et suivants du Code du travail</div>
            </div>

            <div style={{ background:'#f1f5f9', padding:16, borderRadius:8, marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#0ea5e9', textTransform:'uppercase', marginBottom:6 }}>Organisme de formation</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>{convention.of_nom}</div>
              <div style={{ fontSize:12, color:'#475569', marginTop:4 }}>SIRET : {convention.of_siret} — NDA : {convention.of_nda}</div>
              <div style={{ fontSize:12, color:'#475569' }}>{convention.of_adresse}</div>
              {convention.of_representant && <div style={{ fontSize:12, color:'#475569' }}>Représenté par {convention.of_representant}</div>}
            </div>

            <div style={{ background:'#f1f5f9', padding:16, borderRadius:8, marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#0ea5e9', textTransform:'uppercase', marginBottom:6 }}>Apprenant</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>{convention.apprenant_civilite} {convention.apprenant_prenom} {convention.apprenant_nom}</div>
              {convention.apprenant_email && <div style={{ fontSize:12, color:'#475569', marginTop:4 }}>{convention.apprenant_email}</div>}
              {convention.apprenant_adresse && <div style={{ fontSize:12, color:'#475569' }}>{convention.apprenant_adresse}</div>}
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:6 }}>ARTICLE 1 — OBJET</div>
              <div style={{ fontSize:13, color:'#334155', lineHeight:1.6 }}>
                <strong>Intitulé :</strong> {convention.formation_titre}<br/>
                <strong>Modalités :</strong> {convention.formation_modalites} — <strong>Durée :</strong> {convention.duree_heures}h<br/>
                <strong>Période :</strong> du {new Date(convention.date_debut).toLocaleDateString('fr-FR')} au {new Date(convention.date_fin).toLocaleDateString('fr-FR')}<br/>
                {convention.formation_lieu && <><strong>Lieu :</strong> {convention.formation_lieu}</>}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:6 }}>ARTICLE 2 — OBJECTIFS</div>
              <div style={{ fontSize:13, color:'#334155', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{convention.formation_objectifs}</div>
            </div>

            {convention.formation_programme && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:6 }}>ARTICLE 3 — PROGRAMME</div>
                <div style={{ fontSize:13, color:'#334155', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{convention.formation_programme}</div>
              </div>
            )}

            <div style={{ background:'#f0fdf4', padding:16, borderRadius:8, marginBottom:14, border:'1px solid #86efac', textAlign:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#059669', textTransform:'uppercase', marginBottom:8 }}>Article 4 — Dispositions financières</div>
              <div style={{ fontSize:11, color:'#64748b' }}>Montant total</div>
              <div style={{ fontSize:28, fontWeight:800, color:'#10b981', marginTop:2 }}>{convention.prix_ht?.toLocaleString('fr-FR')}€</div>
              <div style={{ fontSize:10, color:'#64748b', fontStyle:'italic', marginTop:6 }}>TVA non applicable, art. 261-4-4 du CGI</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:8 }}>Financement : {convention.financement?.toUpperCase()} — {convention.modalites_paiement}</div>
            </div>

            <div style={{ marginTop:24, paddingTop:14, borderTop:'1px solid #e2e8f0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <div style={{ border:'1px dashed #cbd5e1', padding:14, borderRadius:6, textAlign:'center', minHeight:80 }}>
                <div style={{ fontSize:11, color:'#94a3b8' }}>Signature Organisme</div>
              </div>
              <div style={{ border:'1px dashed #cbd5e1', padding:14, borderRadius:6, textAlign:'center', minHeight:80 }}>
                <div style={{ fontSize:11, color:'#94a3b8' }}>Signature Apprenant(e)</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop:16, padding:14, background:'rgba(14,165,233,.05)', border:'1px solid rgba(14,165,233,.2)', borderRadius:10, fontSize:12, color:'#94a3b8', textAlign:'center' }}>
            💡 Cliquez sur "Télécharger PDF" pour obtenir le fichier PDF officiel à envoyer à votre apprenant
          </div>
        </div>
      </div>
    </>
  )
}
