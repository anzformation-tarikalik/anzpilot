import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminShell, { useAdminAuth } from '../../../components/admin/AdminShell'
import { Button, Card, Badge, Input, Modal, Tabs, EmptyState, KpiCard, tokens } from '../../../components/admin/AdminUI'

const STATUTS_FACTURE: any = {
  pending: { label:'En attente', color:tokens.warning, icon:'⏳' },
  paid: { label:'Payée', color:tokens.success, icon:'✅' },
  overdue: { label:'Retard', color:tokens.danger, icon:'⚠️' },
  failed: { label:'Échec', color:tokens.danger, icon:'❌' },
  refunded: { label:'Remboursée', color:tokens.textDim, icon:'↩️' },
  cancelled: { label:'Annulée', color:tokens.textDim, icon:'⚪' },
}

function fmtMoney(centimes: number): string {
  return ((centimes||0)/100).toLocaleString('fr-FR', { style:'currency', currency:'EUR' })
}

export default function BillingPage() {
  const { auth } = useAdminAuth()
  const [tab, setTab] = useState<'plans'|'factures'>('plans')

  // Plans
  const [plans, setPlans] = useState<any[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [planForm, setPlanForm] = useState<any>({ slug:'', nom:'', description:'', prix_mensuel:0, prix_annuel:0, features:'', limite_apprenants:'', is_active:true, is_featured:false, ordre:0 })
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)

  // Factures
  const [factures, setFactures] = useState<any[]>([])
  const [organismes, setOrganismes] = useState<any[]>([])
  const [loadingFactures, setLoadingFactures] = useState(false)
  const [editingFacture, setEditingFacture] = useState<any>(null)
  const [factureForm, setFactureForm] = useState<any>({ organisme_id:'', plan_slug:'starter', periode:'mensuel', montant_ttc:'', date_echeance:'', notes:'' })
  const [showFactureModal, setShowFactureModal] = useState(false)
  const [savingFacture, setSavingFacture] = useState(false)
  const [statutFilter, setStatutFilter] = useState('all')

  useEffect(() => {
    if (!auth) return
    if (tab === 'plans') loadPlans()
    else loadFactures()
  }, [auth, tab])

  useEffect(() => {
    if (!auth) return
    // Charger les organismes pour les select
    fetch('/api/admin-saas/list-organismes').then(r=>r.json()).then(d=>setOrganismes(d.organismes||[])).catch(()=>{})
  }, [auth])

  function loadPlans() {
    setLoadingPlans(true)
    fetch('/api/admin/billing?action=plans').then(r=>r.json()).then(d=>{
      setPlans(d.plans||[]); setLoadingPlans(false)
    }).catch(()=>setLoadingPlans(false))
  }

  function loadFactures() {
    setLoadingFactures(true)
    fetch('/api/admin/billing?action=factures').then(r=>r.json()).then(d=>{
      setFactures(d.factures||[]); setLoadingFactures(false)
    }).catch(()=>setLoadingFactures(false))
  }

  // ═══ Plans ═══
  function openAddPlan() {
    setEditingPlan(null)
    setPlanForm({ slug:'', nom:'', description:'', prix_mensuel:0, prix_annuel:0, features:'', limite_apprenants:'', is_active:true, is_featured:false, ordre:plans.length })
    setShowPlanModal(true)
  }
  function openEditPlan(p:any) {
    setEditingPlan(p)
    setPlanForm({ ...p })
    setShowPlanModal(true)
  }
  async function savePlan() {
    setSavingPlan(true)
    try {
      const method = editingPlan ? 'PUT' : 'POST'
      const body = editingPlan ? { id:editingPlan.id, ...planForm } : planForm
      const res = await fetch('/api/admin/billing?action=plan', { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      const d = await res.json()
      if (d.success) { setShowPlanModal(false); loadPlans() }
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
    setSavingPlan(false)
  }
  async function deletePlan(id:string) {
    if (!confirm('Supprimer définitivement ce plan ?')) return
    try {
      const res = await fetch(`/api/admin/billing?action=plan&id=${id}`, { method:'DELETE' })
      const d = await res.json()
      if (d.success) loadPlans(); else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
  }

  // ═══ Factures ═══
  function openAddFacture() {
    setEditingFacture(null)
    const echeance = new Date(); echeance.setDate(echeance.getDate()+30)
    setFactureForm({ organisme_id:'', plan_slug:'starter', periode:'mensuel', montant_ttc:'', date_echeance:echeance.toISOString().split('T')[0], notes:'' })
    setShowFactureModal(true)
  }
  function openEditFacture(f:any) {
    setEditingFacture(f)
    setFactureForm({ ...f, montant_ttc:String(f.montant_ttc) })
    setShowFactureModal(true)
  }
  async function saveFacture() {
    setSavingFacture(true)
    try {
      if (editingFacture) {
        const res = await fetch('/api/admin/billing?action=facture', {
          method:'PUT', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ id:editingFacture.id, statut:factureForm.statut, date_paiement:factureForm.date_paiement, reference_paiement:factureForm.reference_paiement, notes:factureForm.notes })
        })
        const d = await res.json()
        if (d.success) { setShowFactureModal(false); loadFactures() }
        else alert('Erreur: '+(d.error||''))
      } else {
        if (!factureForm.organisme_id || !factureForm.montant_ttc) { alert('OF et montant requis'); setSavingFacture(false); return }
        const res = await fetch('/api/admin/billing?action=facture', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ ...factureForm, montant_ttc:Math.round(parseFloat(factureForm.montant_ttc)*100) })
        })
        const d = await res.json()
        if (d.success) { setShowFactureModal(false); loadFactures() }
        else alert('Erreur: '+(d.error||''))
      }
    } catch(e:any) { alert(e.message) }
    setSavingFacture(false)
  }

  if (!auth) return null

  const filteredFactures = statutFilter==='all' ? factures : factures.filter(f=>f.statut===statutFilter)
  const stats = {
    total: factures.length,
    pending: factures.filter(f=>f.statut==='pending').length,
    paid: factures.filter(f=>f.statut==='paid').length,
    overdue: factures.filter(f=>f.statut==='overdue').length,
    ca_total: factures.filter(f=>f.statut==='paid').reduce((sum,f)=>sum+(f.montant_ttc||0), 0),
    ca_pending: factures.filter(f=>f.statut==='pending').reduce((sum,f)=>sum+(f.montant_ttc||0), 0),
  }

  return (
    <>
      <Head><title>Facturation SaaS — Admin ANZPilot</title></Head>
      <AdminShell activeSection="abonnements" breadcrumb={[{ label:'Facturation SaaS' }]}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:14 }}>
          <div>
            <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>💳 Facturation SaaS</h1>
            <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Gérez les plans tarifaires et les factures émises à vos OF clients</p>
          </div>
        </div>

        <Tabs tabs={[
          { id:'plans', label:'Plans tarifaires', icon:'💎', count: plans.length },
          { id:'factures', label:'Factures émises', icon:'📄', count: factures.length },
        ]} active={tab} onChange={(t:any)=>setTab(t)}/>

        {/* ═══ PLANS ═══ */}
        {tab === 'plans' && (
          <>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
              <Button variant="primary" icon="➕" onClick={openAddPlan}>Ajouter un plan</Button>
            </div>

            {loadingPlans ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div>
            : plans.length === 0 ? <EmptyState icon="💎" title="Aucun plan défini" description="Créez votre premier plan tarifaire" action={<Button variant="primary" icon="➕" onClick={openAddPlan}>Ajouter un plan</Button>}/>
            : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
                {plans.map(p => (
                  <Card key={p.id} padding={20} style={{
                    border: p.is_featured ? `2px solid ${tokens.primary}` : `1px solid ${tokens.border}`,
                    position:'relative'
                  }}>
                    {p.is_featured && <div style={{ position:'absolute', top:-10, right:14, padding:'3px 10px', borderRadius:12, background:tokens.primary, color:'#fff', fontSize:10, fontWeight:700 }}>★ POPULAIRE</div>}
                    {!p.is_active && <Badge color={tokens.textDim} icon="○">Inactif</Badge>}
                    <h3 style={{ fontFamily:tokens.fontDisplay, fontSize:18, fontWeight:700, color:tokens.text, margin:'8px 0 4px' }}>{p.nom}</h3>
                    <p style={{ fontSize:12, color:tokens.textDim, margin:'0 0 14px', minHeight:32 }}>{p.description||'—'}</p>
                    <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:6 }}>
                      <div style={{ fontFamily:tokens.fontDisplay, fontSize:28, fontWeight:700, color:tokens.primary }}>{fmtMoney(p.prix_mensuel)}</div>
                      <div style={{ fontSize:12, color:tokens.textDim }}>/mois HT</div>
                    </div>
                    {p.prix_annuel>0 && <div style={{ fontSize:11, color:tokens.success, marginBottom:14 }}>ou {fmtMoney(p.prix_annuel)}/an</div>}
                    <div style={{ fontSize:12, color:tokens.textMuted, whiteSpace:'pre-line', marginBottom:14, lineHeight:1.6 }}>{(p.features||'').replace(/&#10;/g,'\n')}</div>
                    {p.limite_apprenants && <div style={{ fontSize:11, color:tokens.textDim, marginBottom:14 }}>Limite : {p.limite_apprenants} apprenants</div>}
                    <div style={{ display:'flex', gap:6 }}>
                      <Button size="sm" variant="secondary" onClick={()=>openEditPlan(p)}>✏️ Modifier</Button>
                      <Button size="sm" variant="danger" onClick={()=>deletePlan(p.id)}>🗑️</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ FACTURES ═══ */}
        {tab === 'factures' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:16 }}>
              <KpiCard label="Factures total" value={stats.total} icon="📄" color={tokens.primary}/>
              <KpiCard label="En attente" value={stats.pending} icon="⏳" color={tokens.warning}/>
              <KpiCard label="Payées" value={stats.paid} icon="✅" color={tokens.success}/>
              <KpiCard label="CA encaissé" value={fmtMoney(stats.ca_total)} icon="💰" color={tokens.success}/>
              <KpiCard label="CA en attente" value={fmtMoney(stats.ca_pending)} icon="⏰" color={tokens.warning}/>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <Tabs tabs={[
                { id:'all', label:'Toutes' },
                { id:'pending', label:'En attente', icon:'⏳' },
                { id:'paid', label:'Payées', icon:'✅' },
                { id:'overdue', label:'En retard', icon:'⚠️' },
              ]} active={statutFilter} onChange={setStatutFilter}/>
              <Button variant="primary" icon="➕" onClick={openAddFacture}>Nouvelle facture</Button>
            </div>

            {loadingFactures ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div>
            : filteredFactures.length === 0 ? <EmptyState icon="📄" title="Aucune facture" description="Émettez votre première facture SaaS"/>
            : (
              <Card padding={0}>
                <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 100px 110px 110px 100px', gap:14, padding:'12px 16px', borderBottom:`1px solid ${tokens.border}`, fontSize:11, fontWeight:700, color:tokens.textDim, textTransform:'uppercase', letterSpacing:'.06em' }}>
                  <div>N° Facture</div>
                  <div>Organisme</div>
                  <div>Montant</div>
                  <div>Émission</div>
                  <div>Statut</div>
                  <div>Actions</div>
                </div>
                {filteredFactures.map((f, i) => {
                  const s = STATUTS_FACTURE[f.statut] || STATUTS_FACTURE.pending
                  return (
                    <div key={f.id} style={{ display:'grid', gridTemplateColumns:'120px 1fr 100px 110px 110px 100px', gap:14, padding:14, borderBottom: i<filteredFactures.length-1?`1px solid ${tokens.border}`:'none', alignItems:'center' }}>
                      <div style={{ fontFamily:'monospace', fontSize:12, color:tokens.text }}>{f.numero}</div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:tokens.text }}>{f.organisme_nom || '(supprimé)'}</div>
                        <div style={{ fontSize:11, color:tokens.textDim, marginTop:2 }}>{f.organisme_email}</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color:tokens.text }}>{fmtMoney(f.montant_ttc)}</div>
                      <div style={{ fontSize:11, color:tokens.textMuted }}>{new Date(f.date_emission).toLocaleDateString('fr-FR')}</div>
                      <Badge color={s.color} icon={s.icon}>{s.label}</Badge>
                      <Button size="sm" variant="secondary" onClick={()=>openEditFacture(f)}>✏️</Button>
                    </div>
                  )
                })}
              </Card>
            )}
          </>
        )}

        {/* Modal Plan */}
        <Modal open={showPlanModal} onClose={()=>setShowPlanModal(false)} title={editingPlan?`✏️ Modifier le plan`:'➕ Nouveau plan'} maxWidth={580}
          footer={<>
            <Button variant="secondary" fullWidth onClick={()=>setShowPlanModal(false)}>Annuler</Button>
            <Button variant="success" fullWidth onClick={savePlan} disabled={savingPlan}>{savingPlan?'⏳':'💾 Enregistrer'}</Button>
          </>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Input label="Slug (URL)" value={planForm.slug||''} onChange={v=>setPlanForm({...planForm, slug:v})} placeholder="pro" hint="Identifiant unique, sans espaces"/>
              <Input label="Nom commercial" value={planForm.nom||''} onChange={v=>setPlanForm({...planForm, nom:v})} placeholder="Plan Pro"/>
            </div>
            <Input label="Description" value={planForm.description||''} onChange={v=>setPlanForm({...planForm, description:v})} placeholder="Pour les OF avec plusieurs formateurs"/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
              <Input label="Prix mensuel HT (en centimes)" type="number" value={planForm.prix_mensuel||0} onChange={v=>setPlanForm({...planForm, prix_mensuel:v})} hint="4900 = 49,00 €"/>
              <Input label="Prix annuel HT (en centimes)" type="number" value={planForm.prix_annuel||0} onChange={v=>setPlanForm({...planForm, prix_annuel:v})} hint="47000 = 470 €"/>
              <Input label="Limite apprenants" type="number" value={planForm.limite_apprenants||''} onChange={v=>setPlanForm({...planForm, limite_apprenants:v})} placeholder="∞ vide"/>
            </div>
            <Input label="Features (1 par ligne)" rows={5} value={(planForm.features||'').replace(/&#10;/g,'\n')} onChange={v=>setPlanForm({...planForm, features:v.replace(/\n/g,'&#10;')})} placeholder="Conventions illimitées&#10;Factures auto&#10;Support email"/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
              <Input label="Ordre affichage" type="number" value={planForm.ordre||0} onChange={v=>setPlanForm({...planForm, ordre:parseInt(v)||0})}/>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:tokens.textMuted, marginBottom:5, textTransform:'uppercase' }}>Actif</label>
                <label style={{ position:'relative', display:'inline-block', width:42, height:24, cursor:'pointer' }}>
                  <input type="checkbox" checked={planForm.is_active!==false} onChange={e=>setPlanForm({...planForm, is_active:e.target.checked})} style={{ opacity:0 }}/>
                  <span style={{ position:'absolute', inset:0, background:planForm.is_active!==false?tokens.success:tokens.surface, borderRadius:12 }}>
                    <span style={{ position:'absolute', height:18, width:18, left:planForm.is_active!==false?20:3, top:3, background:'#fff', borderRadius:'50%' }}/>
                  </span>
                </label>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:tokens.textMuted, marginBottom:5, textTransform:'uppercase' }}>★ Mis en avant</label>
                <label style={{ position:'relative', display:'inline-block', width:42, height:24, cursor:'pointer' }}>
                  <input type="checkbox" checked={planForm.is_featured===true} onChange={e=>setPlanForm({...planForm, is_featured:e.target.checked})} style={{ opacity:0 }}/>
                  <span style={{ position:'absolute', inset:0, background:planForm.is_featured?tokens.primary:tokens.surface, borderRadius:12 }}>
                    <span style={{ position:'absolute', height:18, width:18, left:planForm.is_featured?20:3, top:3, background:'#fff', borderRadius:'50%' }}/>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </Modal>

        {/* Modal Facture */}
        <Modal open={showFactureModal} onClose={()=>setShowFactureModal(false)} title={editingFacture?`✏️ Facture ${editingFacture.numero}`:'➕ Nouvelle facture'} maxWidth={520}
          footer={<>
            <Button variant="secondary" fullWidth onClick={()=>setShowFactureModal(false)}>Annuler</Button>
            <Button variant="success" fullWidth onClick={saveFacture} disabled={savingFacture}>{savingFacture?'⏳':editingFacture?'💾 Enregistrer':'➕ Créer'}</Button>
          </>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {!editingFacture && <>
              <Input label="Organisme" value={factureForm.organisme_id||''} onChange={v=>setFactureForm({...factureForm, organisme_id:v})} options={[{ value:'', label:'-- Choisir un OF --' }, ...organismes.map((o:any)=>({ value:o.id, label:`${o.nom||o.email}` }))]}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Input label="Plan" value={factureForm.plan_slug||'starter'} onChange={v=>setFactureForm({...factureForm, plan_slug:v})} options={[
                  { value:'starter', label:'Starter' },
                  { value:'pro', label:'Pro' },
                  { value:'enterprise', label:'Enterprise' },
                  { value:'custom', label:'Personnalisé' },
                ]}/>
                <Input label="Période" value={factureForm.periode||'mensuel'} onChange={v=>setFactureForm({...factureForm, periode:v})} options={[
                  { value:'mensuel', label:'Mensuel' },
                  { value:'annuel', label:'Annuel' },
                ]}/>
              </div>
              <Input label="Montant TTC (en euros)" type="number" value={factureForm.montant_ttc} onChange={v=>setFactureForm({...factureForm, montant_ttc:v})} placeholder="49"/>
              <Input label="Date d'échéance" type="date" value={factureForm.date_echeance||''} onChange={v=>setFactureForm({...factureForm, date_echeance:v})}/>
              <Input label="Notes (visible sur facture)" rows={2} value={factureForm.notes||''} onChange={v=>setFactureForm({...factureForm, notes:v})} placeholder="Conditions de paiement, RIB..."/>
            </>}
            {editingFacture && <>
              <Input label="Statut" value={factureForm.statut||'pending'} onChange={v=>setFactureForm({...factureForm, statut:v})} options={Object.entries(STATUTS_FACTURE).map(([k,v]:any)=>({ value:k, label:`${v.icon} ${v.label}` }))}/>
              {factureForm.statut === 'paid' && <>
                <Input label="Date du paiement" type="date" value={factureForm.date_paiement?factureForm.date_paiement.split('T')[0]:''} onChange={v=>setFactureForm({...factureForm, date_paiement:v?new Date(v).toISOString():null})}/>
                <Input label="Référence (n° virement, etc.)" value={factureForm.reference_paiement||''} onChange={v=>setFactureForm({...factureForm, reference_paiement:v})}/>
              </>}
              <Input label="Notes" rows={2} value={factureForm.notes||''} onChange={v=>setFactureForm({...factureForm, notes:v})}/>
            </>}
          </div>
        </Modal>
      </AdminShell>
    </>
  )
}
