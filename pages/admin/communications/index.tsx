import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminShell, { useAdminAuth } from '../../../components/admin/AdminShell'
import { Button, Card, Badge, Input, Modal, Tabs, EmptyState, KpiCard, tokens } from '../../../components/admin/AdminUI'

const CATEGORIES: any = {
  transactionnel: { label:'Transactionnel', color:tokens.primary, icon:'📧' },
  marketing: { label:'Marketing', color:tokens.purple, icon:'📢' },
  systeme: { label:'Système', color:tokens.textDim, icon:'⚙️' },
}

const STATUTS_LOG: any = {
  sent: { label:'Envoyé', color:tokens.success, icon:'✅' },
  failed: { label:'Échec', color:tokens.danger, icon:'❌' },
  bounced: { label:'Bounce', color:tokens.warning, icon:'⚠️' },
}

export default function CommunicationsPage() {
  const { auth } = useAdminAuth()
  const [tab, setTab] = useState<'templates'|'logs'>('templates')
  const [templates, setTemplates] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [editing, setEditing] = useState<any>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState<any>({ slug:'', nom:'', description:'', sujet:'', corps_html:'', variables:'', categorie:'transactionnel', is_active:true })
  const [saving, setSaving] = useState(false)

  const [showTest, setShowTest] = useState(false)
  const [testTemplate, setTestTemplate] = useState<any>(null)
  const [testEmail, setTestEmail] = useState('')
  const [testVars, setTestVars] = useState<any>({})
  const [sendingTest, setSendingTest] = useState(false)

  useEffect(() => {
    if (!auth) return
    if (tab === 'templates') loadTemplates(); else loadLogs()
  }, [auth, tab])

  function loadTemplates() {
    setLoading(true)
    fetch('/api/admin/emails?action=templates').then(r=>r.json()).then(d=>{
      setTemplates(d.templates||[]); setLoading(false)
    }).catch(()=>setLoading(false))
  }

  function loadLogs() {
    setLoading(true)
    fetch('/api/admin/emails?action=logs').then(r=>r.json()).then(d=>{
      setLogs(d.logs||[]); setLoading(false)
    }).catch(()=>setLoading(false))
  }

  function openEdit(t:any) {
    setEditing(t)
    setForm({...t})
    setShowEdit(true)
  }
  function openCreate() {
    setEditing(null)
    setForm({ slug:'', nom:'', description:'', sujet:'', corps_html:'', variables:'', categorie:'transactionnel', is_active:true })
    setShowEdit(true)
  }
  async function saveTemplate() {
    setSaving(true)
    try {
      const method = editing ? 'PUT' : 'POST'
      const url = editing ? '/api/admin/emails' : '/api/admin/emails?action=template'
      const body = editing ? { id: editing.id, ...form } : form
      const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      const d = await res.json()
      if (d.success) { setShowEdit(false); loadTemplates() }
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
    setSaving(false)
  }
  async function deleteTemplate(id:string) {
    if (!confirm('Supprimer ce template ?')) return
    try {
      const res = await fetch(`/api/admin/emails?id=${id}`, { method:'DELETE' })
      const d = await res.json()
      if (d.success) loadTemplates(); else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
  }

  function openTest(t:any) {
    setTestTemplate(t)
    setTestEmail('')
    // Pré-remplir les variables détectées
    const vars: any = {}
    const varNames = (t.variables||'').split(',').map((s:string)=>s.trim()).filter(Boolean)
    varNames.forEach((v:string) => { vars[v] = `[${v}]` })
    setTestVars(vars)
    setShowTest(true)
  }
  async function sendTest() {
    if (!testEmail) { alert('Email destinataire requis'); return }
    setSendingTest(true)
    try {
      const res = await fetch('/api/admin/emails?action=test-send', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ template_slug: testTemplate.slug, destinataire: testEmail, variables: testVars })
      })
      const d = await res.json()
      if (d.success) { alert('✅ Email de test envoyé à '+testEmail); setShowTest(false) }
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
    setSendingTest(false)
  }

  if (!auth) return null

  const stats = {
    total: logs.length,
    sent: logs.filter(l=>l.statut==='sent').length,
    failed: logs.filter(l=>l.statut==='failed').length,
    templates_active: templates.filter(t=>t.is_active).length,
  }

  return (
    <>
      <Head><title>Communications — Admin ANZPilot</title></Head>
      <AdminShell activeSection="communications" breadcrumb={[{ label:'Communications' }]}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:14 }}>
          <div>
            <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>📧 Communications</h1>
            <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Gérez les templates d'emails et suivez les envois</p>
          </div>
        </div>

        <Tabs tabs={[
          { id:'templates', label:'Templates', icon:'📝', count: templates.length },
          { id:'logs', label:'Historique envois', icon:'📊', count: logs.length },
        ]} active={tab} onChange={(t:any)=>setTab(t)}/>

        {/* ═══ TEMPLATES ═══ */}
        {tab === 'templates' && (
          <>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
              <Button variant="primary" icon="➕" onClick={openCreate}>Nouveau template</Button>
            </div>

            {loading ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div>
            : templates.length === 0 ? <EmptyState icon="📧" title="Aucun template" description="Créez votre premier template d'email"/>
            : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:14 }}>
                {templates.map(t => {
                  const cat = CATEGORIES[t.categorie] || CATEGORIES.transactionnel
                  return (
                    <Card key={t.id} padding={20}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:10 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:36, height:36, borderRadius:8, background:cat.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{cat.icon}</div>
                          <div>
                            <div style={{ fontSize:14, fontWeight:700, color:tokens.text }}>{t.nom}</div>
                            <div style={{ fontSize:10, color:tokens.textDim, fontFamily:'monospace', marginTop:2 }}>{t.slug}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <Badge color={cat.color}>{cat.label}</Badge>
                          {!t.is_active && <Badge color={tokens.textDim}>Off</Badge>}
                        </div>
                      </div>
                      {t.description && <p style={{ fontSize:12, color:tokens.textDim, margin:'8px 0 12px', lineHeight:1.5 }}>{t.description}</p>}
                      <div style={{ padding:10, background:tokens.bg, borderRadius:8, border:`1px solid ${tokens.border}`, marginBottom:12 }}>
                        <div style={{ fontSize:10, color:tokens.textDim, marginBottom:4 }}>SUJET</div>
                        <div style={{ fontSize:13, color:tokens.text }}>{t.sujet}</div>
                      </div>
                      {t.variables && <div style={{ fontSize:11, color:tokens.textDim, marginBottom:12 }}>📌 Variables : <code style={{ background:tokens.bg, padding:'1px 5px', borderRadius:3, fontSize:10 }}>{t.variables}</code></div>}
                      <div style={{ display:'flex', gap:6 }}>
                        <Button size="sm" variant="secondary" onClick={()=>openEdit(t)}>✏️ Modifier</Button>
                        <Button size="sm" variant="success" onClick={()=>openTest(t)}>📧 Test</Button>
                        <Button size="sm" variant="danger" onClick={()=>deleteTemplate(t.id)}>🗑️</Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ═══ LOGS ═══ */}
        {tab === 'logs' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:16 }}>
              <KpiCard label="Emails envoyés" value={stats.total} icon="📧" color={tokens.primary}/>
              <KpiCard label="Succès" value={stats.sent} icon="✅" color={tokens.success}/>
              <KpiCard label="Échecs" value={stats.failed} icon="❌" color={tokens.danger}/>
              <KpiCard label="Templates actifs" value={stats.templates_active} icon="📝" color={tokens.purple}/>
            </div>

            {loading ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div>
            : logs.length === 0 ? <EmptyState icon="📊" title="Aucun envoi" description="L'historique des envois apparaîtra ici"/>
            : (
              <Card padding={0}>
                <div style={{ display:'grid', gridTemplateColumns:'150px 1fr 200px 130px 100px', gap:14, padding:'12px 16px', borderBottom:`1px solid ${tokens.border}`, fontSize:11, fontWeight:700, color:tokens.textDim, textTransform:'uppercase', letterSpacing:'.06em' }}>
                  <div>Template</div><div>Destinataire</div><div>Sujet</div><div>Date</div><div>Statut</div>
                </div>
                {logs.map((l, i) => {
                  const s = STATUTS_LOG[l.statut] || STATUTS_LOG.sent
                  return (
                    <div key={l.id} style={{ display:'grid', gridTemplateColumns:'150px 1fr 200px 130px 100px', gap:14, padding:14, borderBottom: i<logs.length-1?`1px solid ${tokens.border}`:'none', alignItems:'center' }}>
                      <div style={{ fontSize:12, color:tokens.text, fontFamily:'monospace' }}>{l.template_slug || '—'}</div>
                      <div style={{ fontSize:13, color:tokens.text, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{l.destinataire_email}</div>
                      <div style={{ fontSize:12, color:tokens.textMuted, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{l.sujet}</div>
                      <div style={{ fontSize:11, color:tokens.textDim }}>{new Date(l.created_at).toLocaleString('fr-FR')}</div>
                      <Badge color={s.color} icon={s.icon}>{s.label}</Badge>
                    </div>
                  )
                })}
              </Card>
            )}
          </>
        )}

        {/* Modal Edit/Create Template */}
        <Modal open={showEdit} onClose={()=>setShowEdit(false)} title={editing?`✏️ Modifier ${editing.nom}`:'➕ Nouveau template'} maxWidth={720}
          footer={<>
            <Button variant="secondary" fullWidth onClick={()=>setShowEdit(false)}>Annuler</Button>
            <Button variant="success" fullWidth onClick={saveTemplate} disabled={saving}>{saving?'⏳':'💾 Enregistrer'}</Button>
          </>}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Input label="Slug (identifiant)" value={form.slug} onChange={v=>setForm({...form, slug:v})} placeholder="mon_template" hint="Utilisé dans le code, sans espaces"/>
              <Input label="Catégorie" value={form.categorie} onChange={v=>setForm({...form, categorie:v})} options={Object.entries(CATEGORIES).map(([k,v]:any)=>({value:k, label:`${v.icon} ${v.label}`}))}/>
            </div>
            <Input label="Nom" value={form.nom} onChange={v=>setForm({...form, nom:v})} placeholder="Rappel essai J-7" required/>
            <Input label="Description" value={form.description||''} onChange={v=>setForm({...form, description:v})} placeholder="À quoi sert ce template"/>
            <Input label="Sujet email" value={form.sujet} onChange={v=>setForm({...form, sujet:v})} placeholder="Plus que 7 jours d'essai" required hint="Variables acceptées : {{nom_of}}, {{code}}, etc."/>
            <Input label="Variables disponibles (séparées par virgule)" value={form.variables||''} onChange={v=>setForm({...form, variables:v})} placeholder="nom_of, code, jours_restants"/>
            <Input label="Corps HTML" value={form.corps_html} onChange={v=>setForm({...form, corps_html:v})} rows={12} placeholder="<div>...</div>" required hint="HTML complet. Utilisez {{variable}} pour insérer les valeurs."/>
            {form.corps_html && <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:tokens.textMuted, marginBottom:5, textTransform:'uppercase' }}>🔍 Aperçu</label>
              <div style={{ background:'#fff', color:'#000', padding:14, borderRadius:8, maxHeight:250, overflowY:'auto' }} dangerouslySetInnerHTML={{__html: form.corps_html}}/>
            </div>}
          </div>
        </Modal>

        {/* Modal Test */}
        <Modal open={showTest} onClose={()=>setShowTest(false)} title={`📧 Envoyer un test`} subtitle={testTemplate?.nom} maxWidth={480}
          footer={<>
            <Button variant="secondary" fullWidth onClick={()=>setShowTest(false)}>Annuler</Button>
            <Button variant="success" fullWidth onClick={sendTest} disabled={sendingTest||!testEmail}>{sendingTest?'⏳ Envoi...':'📧 Envoyer le test'}</Button>
          </>}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Input label="Destinataire du test" type="email" value={testEmail} onChange={setTestEmail} placeholder="tarikalik@gmail.com" required/>
            {Object.keys(testVars).length > 0 && <>
              <div style={{ fontSize:11, fontWeight:600, color:tokens.textMuted, textTransform:'uppercase' }}>Variables (valeurs de test)</div>
              {Object.entries(testVars).map(([k,v]:any) => (
                <Input key={k} label={k} value={v} onChange={val=>setTestVars({...testVars, [k]:val})}/>
              ))}
            </>}
          </div>
        </Modal>
      </AdminShell>
    </>
  )
}
