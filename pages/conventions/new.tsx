import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

const labelStyle = { display:'block' as const, fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:5, textTransform:'uppercase' as const, letterSpacing:'.06em' }
const inputStyle = { width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none' }
const textareaStyle = { ...inputStyle, resize:'vertical' as const, minHeight:80 }

export default function NewConvention() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [modeles, setModeles] = useState<any[]>([])
  const [showModeles, setShowModeles] = useState(false)
  const [savingModele, setSavingModele] = useState(false)

  const [form, setForm] = useState({
    type: 'convention',
    numero: `CONV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`,
    of_nom: 'ANZ Formation', of_siret: '', of_nda: '', of_adresse: '', of_email: 'contact@anzformation.fr', of_telephone: '', of_representant: '',
    apprenant_civilite: 'M.', apprenant_prenom: '', apprenant_nom: '', apprenant_email: '', apprenant_naissance: '', apprenant_adresse: '', apprenant_telephone: '',
    employeur_nom: '', employeur_siret: '', employeur_adresse: '', employeur_representant: '',
    formation_titre: '', formation_objectifs: '', formation_programme: '',
    formation_modalites: 'présentiel', formation_lieu: '',
    date_debut: '', date_fin: '', duree_heures: '', nb_participants: '1',
    prix_ht: '', tva_taux: '0', financement: 'opco', modalites_paiement: 'à réception de facture',
  })

  useEffect(() => {
    fetch('/api/modeles/list').then(r=>r.json()).then(d=>setModeles(d.modeles||[])).catch(()=>{})
  }, [])

  const update = (k:string, v:string) => setForm(p => ({ ...p, [k]: v }))

  function importModele(m: any) {
    setForm(p => ({
      ...p,
      formation_titre: m.titre || '',
      formation_objectifs: m.objectifs || '',
      formation_programme: m.programme || '',
      formation_modalites: m.modalites || 'présentiel',
      formation_lieu: m.lieu || p.formation_lieu,
      duree_heures: m.duree_heures?.toString() || '',
      prix_ht: m.prix_ht?.toString() || p.prix_ht,
      tva_taux: m.tva_taux?.toString() || '20',
    }))
    setShowModeles(false)
  }

  async function saveAsModele() {
    if (!form.formation_titre) { alert('Le titre de la formation est obligatoire pour enregistrer un modèle.'); return }
    setSavingModele(true)
    try {
      const res = await fetch('/api/modeles/save', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          titre: form.formation_titre, objectifs: form.formation_objectifs, programme: form.formation_programme,
          modalites: form.formation_modalites, duree_heures: form.duree_heures, lieu: form.formation_lieu,
          prix_ht: form.prix_ht, tva_taux: form.tva_taux,
        })
      })
      const d = await res.json()
      if (d.success) {
        setModeles(p => [...p, d.modele])
        alert('✅ Modèle enregistré ! Vous pourrez le réutiliser dans vos prochaines conventions.')
      } else alert('Erreur: '+(d.error||'inconnue'))
    } catch(e:any) { alert(e.message) }
    setSavingModele(false)
  }

  const prix_ht_num = parseFloat(form.prix_ht) || 0
  const tva_taux_num = parseFloat(form.tva_taux) || 0
  const tva_montant = prix_ht_num * tva_taux_num / 100
  const prix_ttc = prix_ht_num + tva_montant

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/conventions/create', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, prix_ht: prix_ht_num, prix_ttc, tva_montant })
      })
      const data = await res.json()
      if (data.success && data.id) router.push(`/conventions/${data.id}`)
      else { alert('Erreur: ' + (data.error || 'inconnue')); setSaving(false) }
    } catch (e: any) { alert('Erreur réseau: ' + e.message); setSaving(false) }
  }

  const card = { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:24, marginBottom:16 }

  return (
    <>
      <Head><title>Nouveau document — ANZPilot</title></Head>
      <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', padding:'24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <Link href="/conventions" style={{ fontSize:13, color:'#64748b', textDecoration:'none' }}>← Retour aux documents</Link>

          <h1 style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:700, color:'#fff', margin:'12px 0 4px' }}>📄 Nouveau document</h1>
          <p style={{ fontSize:14, color:'#94a3b8', marginBottom:24 }}>Remplissez les informations pour générer un document légal conforme</p>

          <div style={{ display:'flex', gap:8, marginBottom:24 }}>
            {['Type & OF','Apprenant','Formation','Tarifs'].map((label, i) => (
              <button key={i} onClick={() => setStep(i+1)}
                style={{ flex:1, padding:'10px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'DM Sans,system-ui', background:step===i+1?'linear-gradient(135deg,#0ea5e9,#2563eb)':step>i+1?'rgba(16,185,129,.15)':'rgba(255,255,255,.04)', color:step===i+1?'#fff':step>i+1?'#10b981':'#64748b', border:step===i+1?'none':'1px solid rgba(255,255,255,.08)' }}>
                {step>i+1?'✓ ':''}{i+1}. {label}
              </button>
            ))}
          </div>

          {/* Étape 1 — Type + OF */}
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
                  ].map(([id, icon, name, desc]:any) => (
                    <button key={id} onClick={() => update('type', id)}
                      style={{ padding:'14px 10px', borderRadius:10, cursor:'pointer', textAlign:'center', fontFamily:'DM Sans,system-ui', background:form.type===id?'rgba(14,165,233,.15)':'rgba(255,255,255,.04)', border:form.type===id?'1px solid #0ea5e9':'1px solid rgba(255,255,255,.08)' }}>
                      <div style={{ fontSize:26, marginBottom:6 }}>{icon}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:form.type===id?'#0ea5e9':'#fff' }}>{name}</div>
                      <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{desc}</div>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop:16 }}>
                  <label style={labelStyle}>Numéro du document <span style={{color:'#ef4444'}}>*</span></label>
                  <input value={form.numero} onChange={e=>update('numero',e.target.value)} style={inputStyle}/>
                </div>
              </div>

              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>🏢 Organisme de formation</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div><label style={labelStyle}>Raison sociale *</label><input value={form.of_nom} onChange={e=>update('of_nom',e.target.value)} style={inputStyle}/></div>
                  <div><label style={labelStyle}>SIRET *</label><input value={form.of_siret} onChange={e=>update('of_siret',e.target.value)} placeholder="123 456 789 00012" style={inputStyle}/></div>
                  <div><label style={labelStyle}>NDA *</label><input value={form.of_nda} onChange={e=>update('of_nda',e.target.value)} placeholder="11 75 12345 75" style={inputStyle}/></div>
                  <div><label style={labelStyle}>Représentant légal</label><input value={form.of_representant} onChange={e=>update('of_representant',e.target.value)} placeholder="Tarik Aliki, Gérant" style={inputStyle}/></div>
                  <div><label style={labelStyle}>Email</label><input type="email" value={form.of_email} onChange={e=>update('of_email',e.target.value)} style={inputStyle}/></div>
                  <div><label style={labelStyle}>Téléphone</label><input type="tel" value={form.of_telephone} onChange={e=>update('of_telephone',e.target.value)} style={inputStyle}/></div>
                  <div style={{ gridColumn:'1 / -1' }}><label style={labelStyle}>Adresse complète</label><input value={form.of_adresse} onChange={e=>update('of_adresse',e.target.value)} placeholder="123 rue de la Formation, 75001 Paris" style={inputStyle}/></div>
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
                    <label style={labelStyle}>Civilité</label>
                    <select value={form.apprenant_civilite} onChange={e => update('apprenant_civilite', e.target.value)} style={inputStyle}>
                      <option value="M.">M.</option><option value="Mme">Mme</option>
                    </select>
                  </div>
                  <div><label style={labelStyle}>Prénom *</label><input value={form.apprenant_prenom} onChange={e=>update('apprenant_prenom',e.target.value)} style={inputStyle}/></div>
                  <div><label style={labelStyle}>Nom *</label><input value={form.apprenant_nom} onChange={e=>update('apprenant_nom',e.target.value)} style={inputStyle}/></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14 }}>
                  <div><label style={labelStyle}>Email *</label><input type="email" value={form.apprenant_email} onChange={e=>update('apprenant_email',e.target.value)} style={inputStyle}/></div>
                  <div><label style={labelStyle}>Téléphone</label><input type="tel" value={form.apprenant_telephone} onChange={e=>update('apprenant_telephone',e.target.value)} style={inputStyle}/></div>
                  <div><label style={labelStyle}>Date de naissance</label><input type="date" value={form.apprenant_naissance} onChange={e=>update('apprenant_naissance',e.target.value)} style={inputStyle}/></div>
                  <div><label style={labelStyle}>Adresse complète</label><input value={form.apprenant_adresse} onChange={e=>update('apprenant_adresse',e.target.value)} style={inputStyle}/></div>
                </div>
              </div>

              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:6 }}>🏛️ Employeur <span style={{ fontSize:11, color:'#64748b', fontWeight:400 }}>(facultatif)</span></h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:10 }}>
                  <div><label style={labelStyle}>Raison sociale</label><input value={form.employeur_nom} onChange={e=>update('employeur_nom',e.target.value)} style={inputStyle}/></div>
                  <div><label style={labelStyle}>SIRET</label><input value={form.employeur_siret} onChange={e=>update('employeur_siret',e.target.value)} style={inputStyle}/></div>
                  <div><label style={labelStyle}>Représentant</label><input value={form.employeur_representant} onChange={e=>update('employeur_representant',e.target.value)} style={inputStyle}/></div>
                  <div><label style={labelStyle}>Adresse</label><input value={form.employeur_adresse} onChange={e=>update('employeur_adresse',e.target.value)} style={inputStyle}/></div>
                </div>
              </div>
            </>
          )}

          {/* Étape 3 — Formation avec modèles */}
          {step === 3 && (
            <div style={card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', margin:0 }}>🎓 Détails de la formation</h3>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setShowModeles(true)} type="button" style={{ padding:'8px 14px', borderRadius:8, border:'1px solid rgba(14,165,233,.3)', background:'rgba(14,165,233,.1)', color:'#0ea5e9', fontSize:12, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>
                    📋 Choisir un modèle ({modeles.length})
                  </button>
                  <button onClick={saveAsModele} disabled={savingModele||!form.formation_titre} type="button" style={{ padding:'8px 14px', borderRadius:8, border:'1px solid rgba(16,185,129,.3)', background:'rgba(16,185,129,.1)', color:'#10b981', fontSize:12, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:savingModele||!form.formation_titre?'not-allowed':'pointer', opacity:savingModele||!form.formation_titre?.5:1 }}>
                    {savingModele ? '⏳' : '💾 Enregistrer comme modèle'}
                  </button>
                </div>
              </div>
              <p style={{ fontSize:12, color:'#64748b', marginTop:-6, marginBottom:14 }}>💡 Astuce : enregistrez vos formations comme modèles pour les réutiliser en 1 clic à chaque nouvelle convention</p>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1 / -1' }}><label style={labelStyle}>Titre de la formation *</label><input value={form.formation_titre} onChange={e=>update('formation_titre',e.target.value)} placeholder="Diagnostic immobilier certifié COFRAC" style={inputStyle}/></div>
                <div><label style={labelStyle}>Date de début *</label><input type="date" value={form.date_debut} onChange={e=>update('date_debut',e.target.value)} style={inputStyle}/></div>
                <div><label style={labelStyle}>Date de fin *</label><input type="date" value={form.date_fin} onChange={e=>update('date_fin',e.target.value)} style={inputStyle}/></div>
                <div><label style={labelStyle}>Durée (heures) *</label><input type="number" value={form.duree_heures} onChange={e=>update('duree_heures',e.target.value)} placeholder="21" style={inputStyle}/></div>
                <div><label style={labelStyle}>Nombre de participants</label><input type="number" value={form.nb_participants} onChange={e=>update('nb_participants',e.target.value)} style={inputStyle}/></div>
                <div>
                  <label style={labelStyle}>Modalités</label>
                  <select value={form.formation_modalites} onChange={e=>update('formation_modalites',e.target.value)} style={inputStyle}>
                    <option value="présentiel">Présentiel</option>
                    <option value="distanciel">Distanciel</option>
                    <option value="mixte">Mixte</option>
                    <option value="e-learning">E-learning</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Lieu de formation</label><input value={form.formation_lieu} onChange={e=>update('formation_lieu',e.target.value)} style={inputStyle}/></div>
                <div style={{ gridColumn:'1 / -1' }}><label style={labelStyle}>Objectifs pédagogiques *</label><textarea rows={3} value={form.formation_objectifs} onChange={e=>update('formation_objectifs',e.target.value)} placeholder="À l'issue de cette formation, l'apprenant sera capable de..." style={textareaStyle}/></div>
                <div style={{ gridColumn:'1 / -1' }}><label style={labelStyle}>Programme détaillé</label><textarea rows={4} value={form.formation_programme} onChange={e=>update('formation_programme',e.target.value)} placeholder={`Jour 1: Introduction\nJour 2: Approfondissement\nJour 3: Cas pratiques`} style={textareaStyle}/></div>
              </div>
            </div>
          )}

          {/* Étape 4 — Tarifs */}
          {step === 4 && (
            <div style={card}>
              <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:14 }}>💰 Tarification</h3>
              <div style={{ padding:12, background:'rgba(245,158,11,.05)', border:'1px solid rgba(245,158,11,.2)', borderRadius:9, marginBottom:14, fontSize:12, color:'#fcd34d' }}>
                ℹ️ TVA non applicable, article 261-4-4 du CGI (exonération des organismes de formation)
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={labelStyle}>Prix (€) *</label><input type="number" value={form.prix_ht} onChange={e=>update('prix_ht',e.target.value)} placeholder="2000" style={inputStyle}/></div>
                <div>
                  <label style={labelStyle}>Financement</label>
                  <select value={form.financement} onChange={e=>update('financement',e.target.value)} style={inputStyle}>
                    <option value="opco">OPCO</option>
                    <option value="entreprise">Entreprise</option>
                    <option value="cpf">CPF (EDOF)</option>
                    <option value="pole_emploi">Pôle Emploi</option>
                    <option value="auto">Auto-financement</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Modalités de paiement</label><input value={form.modalites_paiement} onChange={e=>update('modalites_paiement',e.target.value)} style={inputStyle}/></div>
              </div>

              <div style={{ marginTop:16, padding:16, background:'rgba(16,185,129,.05)', border:'1px solid rgba(16,185,129,.2)', borderRadius:10, textAlign:'center' }}>
                <div style={{ fontSize:12, color:'#64748b' }}>Total à facturer (net de taxes)</div>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:28, fontWeight:800, color:'#10b981', marginTop:4 }}>{prix_ht_num.toLocaleString('fr-FR')}€</div>
              </div>
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'space-between', marginTop:24 }}>
            <button onClick={() => setStep(Math.max(1, step-1))} disabled={step===1} style={{ padding:'12px 24px', borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:step===1?'not-allowed':'pointer', opacity:step===1?.5:1 }}>← Précédent</button>
            {step < 4 ? (
              <button onClick={() => setStep(step+1)} style={{ padding:'12px 28px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>Suivant →</button>
            ) : (
              <button onClick={handleSave} disabled={saving} style={{ padding:'12px 28px', borderRadius:9, border:'none', background:saving?'#1e3a5f':'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:saving?'not-allowed':'pointer' }}>{saving?'⏳ Génération...':'📄 Générer le PDF'}</button>
            )}
          </div>
        </div>

        {/* Modal modèles */}
        {showModeles && (
          <div onClick={()=>setShowModeles(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:24, maxWidth:600, width:'100%', maxHeight:'80vh', overflowY:'auto' }}>
              <h3 style={{ fontFamily:'Sora,Georgia', fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 4px' }}>📋 Vos modèles de formation</h3>
              <p style={{ fontSize:12, color:'#64748b', margin:'0 0 18px' }}>Cliquez sur un modèle pour pré-remplir tous les champs de la formation</p>
              {modeles.length === 0 ? (
                <div style={{ padding:32, textAlign:'center' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
                  <div style={{ fontSize:14, color:'#fff', fontWeight:600, marginBottom:6 }}>Aucun modèle enregistré</div>
                  <div style={{ fontSize:12, color:'#64748b', marginBottom:14 }}>Remplissez la formation puis cliquez "Enregistrer comme modèle" pour la réutiliser</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {modeles.map((m:any) => (
                    <button key={m.id} onClick={()=>importModele(m)} style={{ textAlign:'left', padding:14, borderRadius:10, border:'1px solid rgba(255,255,255,.08)', background:'rgba(255,255,255,.02)', cursor:'pointer', fontFamily:'DM Sans,system-ui' }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginBottom:4 }}>{m.titre}</div>
                      <div style={{ fontSize:11, color:'#64748b' }}>
                        {m.duree_heures}h · {m.modalites} {m.prix_ht ? `· ${m.prix_ht.toLocaleString('fr-FR')}€ HT` : ''}
                      </div>
                      {m.objectifs && <div style={{ fontSize:11, color:'#94a3b8', marginTop:6, lineHeight:1.4, maxHeight:40, overflow:'hidden' }}>{m.objectifs.slice(0,120)}{m.objectifs.length>120?'...':''}</div>}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={()=>setShowModeles(false)} style={{ marginTop:18, width:'100%', padding:11, borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#94a3b8', fontSize:13, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
