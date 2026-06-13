import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function NewConvention() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    type: 'convention',
    numero: `CONV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`,
    // Organisme
    of_nom: 'ANZ Formation',
    of_siret: '',
    of_nda: '',
    of_adresse: '',
    of_email: 'contact@anzformation.fr',
    of_telephone: '',
    of_representant: '',
    // Apprenant
    apprenant_civilite: 'M.',
    apprenant_prenom: '',
    apprenant_nom: '',
    apprenant_email: '',
    apprenant_naissance: '',
    apprenant_adresse: '',
    apprenant_telephone: '',
    // Employeur (optionnel)
    employeur_nom: '',
    employeur_siret: '',
    employeur_adresse: '',
    employeur_representant: '',
    // Formation
    formation_titre: '',
    formation_objectifs: '',
    formation_programme: '',
    formation_modalites: 'présentiel',
    formation_lieu: '',
    date_debut: '',
    date_fin: '',
    duree_heures: '',
    nb_participants: '1',
    // Tarifs
    prix_ht: '',
    tva_taux: '20',
    financement: 'opco',
    modalites_paiement: 'à réception de facture',
  })

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const prix_ht_num = parseFloat(form.prix_ht) || 0
  const tva_taux_num = parseFloat(form.tva_taux) || 0
  const tva_montant = prix_ht_num * tva_taux_num / 100
  const prix_ttc = prix_ht_num + tva_montant

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/conventions/create', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, prix_ht: prix_ht_num, prix_ttc, tva_montant })
      })
      const data = await res.json()
      if (data.success && data.id) {
        router.push(`/conventions/${data.id}`)
      } else {
        alert('Erreur: ' + (data.error || 'inconnue'))
        setSaving(false)
      }
    } catch (e: any) {
      alert('Erreur réseau: ' + e.message)
      setSaving(false)
    }
  }

  const Field = ({ label, k, type='text', placeholder='', required=false, full=false }: any) => (
    <div style={{ gridColumn: full?'1 / -1':'auto' }}>
      <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>
        {label} {required && <span style={{ color:'#ef4444' }}>*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea value={(form as any)[k]} onChange={e => update(k, e.target.value)} placeholder={placeholder} rows={3}
          style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', resize:'vertical' }} />
      ) : type === 'select' ? null : (
        <input type={type} value={(form as any)[k]} onChange={e => update(k, e.target.value)} placeholder={placeholder}
          style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }} />
      )}
    </div>
  )

  const card = { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24, marginBottom:16 }

  return (
    <>
      <Head><title>Nouveau document — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:'24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <Link href="/conventions" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour aux documents</Link>

          <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:'12px 0 4px' }}>📄 Nouveau document</h1>
          <p style={{ fontSize:14, color:'#94a3b8', marginBottom:24 }}>Remplissez les informations pour générer un document légal conforme</p>

          {/* Étapes */}
          <div style={{ display:'flex', gap:8, marginBottom:24 }}>
            {['Type & OF','Apprenant','Formation','Tarifs'].map((label, i) => (
              <button key={i} onClick={() => setStep(i+1)}
                style={{ flex:1, padding:'10px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'DM Sans,system-ui', background:step===i+1?'linear-gradient(135deg,#0ea5e9,#2563eb)':step>i+1?'rgba(16,185,129,.15)':'rgba(255,255,255,.04)', color:step===i+1?'#fff':step>i+1?'#10b981':'#64748b', border:step===i+1?'none':'1px solid rgba(255,255,255,.08)' }}>
                {step>i+1?'✓ ':''}{i+1}. {label}
              </button>
            ))}
          </div>

          {/* Étape 1 — Type et OF */}
          {step === 1 && (
            <>
              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>📋 Type de document</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                  {[
                    ['convention','📄','Convention','Contrat formation'],
                    ['convocation','📩','Convocation','Inviter apprenant'],
                    ['attestation','🎓','Attestation','Fin de formation'],
                    ['programme','📋','Programme','Détail formation'],
                  ].map(([id, icon, name, desc]) => (
                    <button key={id} onClick={() => update('type', id)}
                      style={{ padding:'14px 10px', borderRadius:10, cursor:'pointer', textAlign:'center' as const, fontFamily:'DM Sans,system-ui', background:form.type===id?'rgba(14,165,233,.15)':'rgba(255,255,255,.04)', border:form.type===id?'1px solid #0ea5e9':'1px solid rgba(255,255,255,.08)' }}>
                      <div style={{ fontSize:26, marginBottom:6 }}>{icon}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:form.type===id?'#0ea5e9':'#fff' }}>{name}</div>
                      <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{desc}</div>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr', gap:14 }}>
                  <Field label="Numéro du document" k="numero" required />
                </div>
              </div>

              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>🏢 Organisme de formation</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <Field label="Raison sociale" k="of_nom" required />
                  <Field label="SIRET" k="of_siret" required placeholder="123 456 789 00012" />
                  <Field label="Numéro de déclaration (NDA)" k="of_nda" required placeholder="11 75 12345 75" />
                  <Field label="Représentant légal" k="of_representant" placeholder="Tarik Aliki, Gérant" />
                  <Field label="Email" k="of_email" type="email" />
                  <Field label="Téléphone" k="of_telephone" type="tel" />
                  <Field label="Adresse complète" k="of_adresse" full placeholder="123 rue de la Formation, 75001 Paris" />
                </div>
              </div>
            </>
          )}

          {/* Étape 2 — Apprenant */}
          {step === 2 && (
            <>
              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>👤 Apprenant</h3>
                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr', gap:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>Civilité</label>
                    <select value={form.apprenant_civilite} onChange={e => update('apprenant_civilite', e.target.value)}
                      style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}>
                      <option value="M.">M.</option>
                      <option value="Mme">Mme</option>
                    </select>
                  </div>
                  <Field label="Prénom" k="apprenant_prenom" required />
                  <Field label="Nom" k="apprenant_nom" required />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14 }}>
                  <Field label="Email" k="apprenant_email" type="email" required />
                  <Field label="Téléphone" k="apprenant_telephone" type="tel" />
                  <Field label="Date de naissance" k="apprenant_naissance" type="date" />
                  <Field label="Adresse complète" k="apprenant_adresse" />
                </div>
              </div>

              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:6 }}>🏛️ Employeur <span style={{ fontSize:11, color:'#64748b', fontWeight:400 }}>(facultatif — uniquement si formation prise en charge par l'entreprise)</span></h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:10 }}>
                  <Field label="Raison sociale" k="employeur_nom" />
                  <Field label="SIRET" k="employeur_siret" />
                  <Field label="Représentant" k="employeur_representant" />
                  <Field label="Adresse" k="employeur_adresse" />
                </div>
              </div>
            </>
          )}

          {/* Étape 3 — Formation */}
          {step === 3 && (
            <div style={card}>
              <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>🎓 Détails de la formation</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="Titre de la formation" k="formation_titre" required full placeholder="Excel Avancé pour Comptables" />
                <Field label="Date de début" k="date_debut" type="date" required />
                <Field label="Date de fin" k="date_fin" type="date" required />
                <Field label="Durée (heures)" k="duree_heures" type="number" required placeholder="21" />
                <Field label="Nombre de participants" k="nb_participants" type="number" placeholder="1" />
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>Modalités</label>
                  <select value={form.formation_modalites} onChange={e => update('formation_modalites', e.target.value)}
                    style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}>
                    <option value="présentiel">Présentiel</option>
                    <option value="distanciel">Distanciel</option>
                    <option value="mixte">Mixte (présentiel + distanciel)</option>
                    <option value="e-learning">E-learning</option>
                  </select>
                </div>
                <Field label="Lieu de formation" k="formation_lieu" placeholder="Salle de formation ANZ, Paris" />
                <Field label="Objectifs pédagogiques" k="formation_objectifs" type="textarea" required full placeholder="À l'issue de cette formation, l'apprenant sera capable de..." />
                <Field label="Programme détaillé" k="formation_programme" type="textarea" full placeholder="Jour 1: Introduction\nJour 2: Approfondissement\nJour 3: Cas pratiques" />
              </div>
            </div>
          )}

          {/* Étape 4 — Tarifs */}
          {step === 4 && (
            <div style={card}>
              <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>💰 Tarification</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="Prix HT (€)" k="prix_ht" type="number" required placeholder="2000" />
                <Field label="Taux TVA (%)" k="tva_taux" type="number" placeholder="20" />
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>Financement</label>
                  <select value={form.financement} onChange={e => update('financement', e.target.value)}
                    style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }}>
                    <option value="opco">OPCO</option>
                    <option value="entreprise">Entreprise (plan de développement)</option>
                    <option value="cpf">CPF (EDOF)</option>
                    <option value="pole_emploi">Pôle Emploi / France Travail</option>
                    <option value="auto">Auto-financement</option>
                  </select>
                </div>
                <Field label="Modalités de paiement" k="modalites_paiement" placeholder="à réception de facture" />
              </div>

              {/* Calcul automatique */}
              <div style={{ marginTop:16, padding:16, background:'rgba(14,165,233,.05)', border:'1px solid rgba(14,165,233,.2)', borderRadius:10 }}>
                <div style={{ fontSize:12, color:'#0ea5e9', fontWeight:600, marginBottom:10 }}>💡 Calcul automatique</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, textAlign:'center' }}>
                  <div>
                    <div style={{ fontSize:11, color:'#64748b' }}>Prix HT</div>
                    <div style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#fff', marginTop:2 }}>{prix_ht_num.toLocaleString('fr-FR')}€</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'#64748b' }}>TVA ({tva_taux_num}%)</div>
                    <div style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#f59e0b', marginTop:2 }}>{tva_montant.toLocaleString('fr-FR')}€</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'#64748b' }}>Prix TTC</div>
                    <div style={{ fontFamily:'Sora,Georgia', fontSize:20, fontWeight:700, color:'#10b981', marginTop:2 }}>{prix_ttc.toLocaleString('fr-FR')}€</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:24 }}>
            <button onClick={() => setStep(Math.max(1, step-1))} disabled={step===1}
              style={{ padding:'12px 24px', borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:step===1?'not-allowed':'pointer', opacity:step===1?.5:1 }}>
              ← Précédent
            </button>
            {step < 4 ? (
              <button onClick={() => setStep(step+1)}
                style={{ padding:'12px 28px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>
                Suivant →
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving}
                style={{ padding:'12px 28px', borderRadius:9, border:'none', background:saving?'#1e3a5f':'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:saving?'not-allowed':'pointer' }}>
                {saving?'⏳ Génération...':'📄 Générer le PDF'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
