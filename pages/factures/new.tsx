import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function NewFacture() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    numero: `FAC-${new Date().getFullYear()}-${String(Math.floor(Math.random()*10000)).padStart(4,'0')}`,
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: new Date(Date.now()+30*86400000).toISOString().split('T')[0],
    // OF (émetteur)
    of_nom:'ANZ Formation', of_siret:'', of_nda:'', of_adresse:'',
    of_iban:'', of_bic:'',
    // Destinataire
    destinataire_type:'opco',
    destinataire_nom:'',
    destinataire_siret:'',
    destinataire_adresse:'',
    destinataire_email:'',
    destinataire_reference:'',
    // Apprenant + Formation
    apprenant_nom:'', formation_titre:'',
    date_formation_debut:'', date_formation_fin:'',
    duree_heures:'',
    // Tarifs
    prix_ht:'', tva_taux:'0',
    modalites_paiement:'30 jours fin de mois',
    notes:'',
  })

  const update = (k:string, v:string) => setForm(p=>({...p, [k]:v}))
  const prix_ht_num = parseFloat(form.prix_ht)||0
  const tva_num = parseFloat(form.tva_taux)||0
  const tva_montant = prix_ht_num * tva_num / 100
  const prix_ttc = prix_ht_num + tva_montant

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/factures/create', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({...form, prix_ht:prix_ht_num, tva_montant, prix_ttc})
      })
      const d = await res.json()
      if (d.success && d.id) router.push(`/factures/${d.id}`)
      else { alert('Erreur: '+(d.error||'inconnue')); setSaving(false) }
    } catch(e:any) { alert(e.message); setSaving(false) }
  }

  const F = ({label, k, type='text', placeholder='', required=false, full=false}:any) => (
    <div style={{ gridColumn: full?'1 / -1':'auto' }}>
      <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}{required && <span style={{ color:'#ef4444' }}> *</span>}</label>
      {type==='textarea' ? (
        <textarea value={(form as any)[k]} onChange={e=>update(k,e.target.value)} placeholder={placeholder} rows={3} style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', resize:'vertical' }}/>
      ) : (
        <input type={type} value={(form as any)[k]} onChange={e=>update(k,e.target.value)} placeholder={placeholder} style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}/>
      )}
    </div>
  )

  const card = { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24, marginBottom:16 }

  return (
    <>
      <Head><title>Nouvelle facture — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:24 }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <Link href="/factures" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour</Link>
          <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:'12px 0 4px' }}>💳 Nouvelle facture</h1>
          <p style={{ fontSize:14, color:'#94a3b8', marginBottom:24 }}>Créez une facture professionnelle conforme</p>

          <div style={{ display:'flex', gap:8, marginBottom:24 }}>
            {['Destinataire','Formation','Tarif'].map((l,i)=>(
              <button key={i} onClick={()=>setStep(i+1)} style={{ flex:1, padding:10, borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'DM Sans,system-ui', background:step===i+1?'linear-gradient(135deg,#0ea5e9,#2563eb)':step>i+1?'rgba(16,185,129,.15)':'rgba(255,255,255,.04)', color:step===i+1?'#fff':step>i+1?'#10b981':'#64748b', border:step===i+1?'none':'1px solid rgba(255,255,255,.08)' }}>{step>i+1?'✓ ':''}{i+1}. {l}</button>
            ))}
          </div>

          {step===1 && (
            <>
              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>🎯 Type de destinataire</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                  {[['opco','🏦','OPCO'],['entreprise','🏢','Entreprise'],['cpf','💳','CPF/EDOF'],['particulier','👤','Particulier']].map(([id,icon,name])=>(
                    <button key={id} onClick={()=>update('destinataire_type', id)} style={{ padding:'14px 10px', borderRadius:10, cursor:'pointer', textAlign:'center', fontFamily:'DM Sans,system-ui', background:form.destinataire_type===id?'rgba(14,165,233,.15)':'rgba(255,255,255,.04)', border:form.destinataire_type===id?'1px solid #0ea5e9':'1px solid rgba(255,255,255,.08)' }}>
                      <div style={{ fontSize:24, marginBottom:4 }}>{icon}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:form.destinataire_type===id?'#0ea5e9':'#fff' }}>{name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>📋 Coordonnées du destinataire</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {F({ label: "Raison sociale", k: "destinataire_nom", required: true, placeholder: form.destinataire_type==='opco'?'AFDAS, OPCO EP, etc.':'Nom complet' })}
                  {F({ label: "SIRET", k: "destinataire_siret" })}
                  {F({ label: "Email", k: "destinataire_email", type: "email" })}
                  {F({ label: "N° référence dossier", k: "destinataire_reference", placeholder: form.destinataire_type==='opco'?'N° dossier OPCO':'Bon de commande' })}
                  {F({ label: "Adresse complète", k: "destinataire_adresse", full: true })}
                </div>
              </div>
              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>🏢 Vos coordonnées (émetteur)</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {F({ label: "Raison sociale", k: "of_nom", required: true })}
                  {F({ label: "SIRET", k: "of_siret", required: true })}
                  {F({ label: "NDA", k: "of_nda" })}
                  {F({ label: "Adresse", k: "of_adresse" })}
                  {F({ label: "IBAN", k: "of_iban", placeholder: "FR76 ..." })}
                  {F({ label: "BIC", k: "of_bic" })}
                </div>
              </div>
            </>
          )}

          {step===2 && (
            <div style={card}>
              <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>🎓 Détails de la formation</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {F({ label: "Numéro de facture", k: "numero", required: true })}
                {F({ label: "Apprenant concerné", k: "apprenant_nom", required: true, full: true, placeholder: "Jean Dupont" })}
                {F({ label: "Titre de la formation", k: "formation_titre", required: true, full: true })}
                {F({ label: "Date début", k: "date_formation_debut", type: "date" })}
                {F({ label: "Date fin", k: "date_formation_fin", type: "date" })}
                {F({ label: "Durée (heures)", k: "duree_heures", type: "number", placeholder: "21" })}
                {F({ label: "Date d'émission", k: "date_emission", type: "date", required: true })}
                {F({ label: "Date d'échéance", k: "date_echeance", type: "date", required: true })}
                {F({ label: "Modalités de paiement", k: "modalites_paiement", full: true })}
              </div>
            </div>
          )}

          {step===3 && (
            <div style={card}>
              <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>💰 Montants</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {F({ label: "Prix HT (€)", k: "prix_ht", type: "number", required: true, placeholder: "2000" })}
                {F({ label: "Taux TVA (%)", k: "tva_taux", type: "number" })}
                <F label="Notes / mentions" k="notes" type="textarea" full placeholder="TVA non applicable, art. 261-4-4 du CGI (si dispensé)"/>
              </div>
              <div style={{ marginTop:16, padding:16, background:'rgba(14,165,233,.05)', border:'1px solid rgba(14,165,233,.2)', borderRadius:10 }}>
                <div style={{ fontSize:12, color:'#0ea5e9', fontWeight:600, marginBottom:10 }}>💡 Calcul automatique</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, textAlign:'center' }}>
                  <div><div style={{ fontSize:11, color:'#64748b' }}>HT</div><div style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#fff', marginTop:2 }}>{prix_ht_num.toLocaleString('fr-FR')}€</div></div>
                  <div><div style={{ fontSize:11, color:'#64748b' }}>TVA</div><div style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#f59e0b', marginTop:2 }}>{tva_montant.toLocaleString('fr-FR')}€</div></div>
                  <div><div style={{ fontSize:11, color:'#64748b' }}>TTC</div><div style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#10b981', marginTop:2 }}>{prix_ttc.toLocaleString('fr-FR')}€</div></div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'space-between', marginTop:24 }}>
            <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1} style={{ padding:'12px 24px', borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:step===1?'not-allowed':'pointer', opacity:step===1?.5:1 }}>← Précédent</button>
            {step<3 ? (
              <button onClick={()=>setStep(step+1)} style={{ padding:'12px 28px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>Suivant →</button>
            ) : (
              <button onClick={handleSave} disabled={saving} style={{ padding:'12px 28px', borderRadius:9, border:'none', background:saving?'#1e3a5f':'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:saving?'not-allowed':'pointer' }}>{saving?'⏳ Création...':'💳 Générer la facture'}</button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
