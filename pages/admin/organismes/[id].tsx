import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AdminShell, { useAdminAuth } from '../../../components/admin/AdminShell'
import { Button, Card, Badge, Input, Tabs, EmptyState, KpiCard, tokens } from '../../../components/admin/AdminUI'

const STATUTS_META: any = {
  essai: { label:'Essai', color:tokens.warning, icon:'⏳' },
  actif: { label:'Actif', color:tokens.success, icon:'✅' },
  bloque: { label:'Bloqué', color:tokens.danger, icon:'🔴' },
  annule: { label:'Annulé', color:tokens.textDim, icon:'⚪' },
}
const PLANS_META: any = {
  essai: { label:'Essai', color:tokens.textDim },
  starter: { label:'Starter', color:tokens.primary },
  pro: { label:'Pro', color:tokens.purple },
  enterprise: { label:'Enterprise', color:tokens.warning },
}

export default function OrganismeFichePage() {
  const router = useRouter()
  const { id } = router.query
  const { auth } = useAdminAuth()

  const [organisme, setOrganisme] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [lastLogins, setLastLogins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('infos')
  const [saving, setSaving] = useState(false)
  const [edited, setEdited] = useState<any>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!auth || !id) return
    load()
  }, [auth, id])

  function load() {
    setLoading(true)
    fetch(`/api/admin-saas/get-organisme?id=${id}`).then(r=>r.json()).then(d=>{
      if (d.organisme) {
        setOrganisme(d.organisme); setEdited(d.organisme); setStats(d.stats); setLastLogins(d.lastLogins||[])
      }
      setLoading(false)
    }).catch(()=>setLoading(false))
  }

  function updateField(key: string, value: any) {
    setEdited((prev: any) => ({...prev, [key]: value}))
    setDirty(true)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin-saas/update-organisme', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id, ...edited })
      })
      const d = await res.json()
      if (d.success) { setDirty(false); load(); alert('✅ Modifications enregistrées') }
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
    setSaving(false)
  }

  async function prolonger(jours: number) {
    if (!confirm(`Prolonger l'essai de ${jours} jours ?`)) return
    try {
      const res = await fetch('/api/admin-saas/update-statut', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id, prolongation_jours: jours })
      })
      if ((await res.json()).success) load()
    } catch {}
  }

  async function changerStatut(nouveauStatut: string) {
    if (!confirm(`Changer le statut en "${nouveauStatut}" ?`)) return
    try {
      const res = await fetch('/api/admin-saas/update-statut', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id, statut: nouveauStatut })
      })
      if ((await res.json()).success) load()
    } catch {}
  }

  if (!auth) return null
  if (loading) return (
    <AdminShell breadcrumb={[{ label:'Organismes', href:'/admin/organismes' }, { label:'Chargement...' }]}>
      <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div>
    </AdminShell>
  )
  if (!organisme) return (
    <AdminShell breadcrumb={[{ label:'Organismes', href:'/admin/organismes' }, { label:'Introuvable' }]}>
      <EmptyState icon="❌" title="Organisme introuvable" description="Cet organisme n'existe pas ou a été supprimé" action={<Link href="/admin/organismes"><Button variant="primary">← Retour à la liste</Button></Link>}/>
    </AdminShell>
  )

  const s = STATUTS_META[organisme.statut] || STATUTS_META.essai
  const p = PLANS_META[organisme.plan] || PLANS_META.essai

  return (
    <>
      <Head><title>{organisme.nom || organisme.email} — Admin</title></Head>
      <AdminShell activeSection="organismes" breadcrumb={[
        { label:'Organismes', href:'/admin/organismes' },
        { label: organisme.nom || organisme.email }
      ]}>

        {/* En-tête fiche */}
        <Card padding={24} style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
            <div style={{ width:64, height:64, borderRadius:14, background:`linear-gradient(135deg,${s.color},${s.color}cc)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, flexShrink:0 }}>
              {s.icon}
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:24, fontWeight:700, color:tokens.text, margin:0 }}>{organisme.nom || '(nom non renseigné)'}</h1>
                <Badge color={s.color} icon={s.icon}>{s.label}</Badge>
                <Badge color={p.color}>{p.label}</Badge>
              </div>
              <div style={{ fontSize:13, color:tokens.textMuted, display:'flex', gap:14, flexWrap:'wrap' }}>
                <span>📧 {organisme.email}</span>
                {organisme.siret && <span>🆔 SIRET {organisme.siret}</span>}
                <span>📅 Inscrit le {new Date(organisme.date_inscription).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {organisme.statut === 'essai' && (
                <>
                  <Button size="md" variant="secondary" icon="⏰" onClick={()=>prolonger(30)}>Prolonger +30j</Button>
                  <Button size="md" variant="success" icon="✅" onClick={()=>changerStatut('actif')}>Activer</Button>
                </>
              )}
              {organisme.statut === 'actif' && (
                <Button size="md" variant="danger" icon="🔴" onClick={()=>changerStatut('bloque')}>Bloquer</Button>
              )}
              {organisme.statut === 'bloque' && (
                <Button size="md" variant="success" icon="✅" onClick={()=>changerStatut('actif')}>Débloquer</Button>
              )}
            </div>
          </div>

          {/* Bandeau jours essai */}
          {organisme.statut === 'essai' && organisme.joursRestants !== null && (
            <div style={{ marginTop:18, padding:'12px 16px', borderRadius:10, background: organisme.joursRestants <= 3 ? 'rgba(239,68,68,.1)' : organisme.joursRestants <= 7 ? 'rgba(245,158,11,.1)' : 'rgba(14,165,233,.08)', border: organisme.joursRestants <= 3 ? '1px solid rgba(239,68,68,.3)' : organisme.joursRestants <= 7 ? '1px solid rgba(245,158,11,.3)' : '1px solid rgba(14,165,233,.2)', fontSize:13, color: organisme.joursRestants <= 3 ? tokens.danger : organisme.joursRestants <= 7 ? tokens.warning : tokens.primary, fontWeight:600 }}>
              {organisme.joursRestants > 0
                ? `⏳ Essai gratuit : ${organisme.joursRestants} jour${organisme.joursRestants>1?'s':''} restant${organisme.joursRestants>1?'s':''} — Expire le ${new Date(organisme.date_fin_essai).toLocaleDateString('fr-FR')}`
                : `⚠️ Essai expiré depuis ${Math.abs(organisme.joursRestants)} jour${Math.abs(organisme.joursRestants)>1?'s':''}`
              }
            </div>
          )}
        </Card>

        {/* KPIs OF */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:16 }}>
          <KpiCard label="Conventions" value={stats?.conventions ?? '—'} icon="📄" color={tokens.primary}/>
          <KpiCard label="Factures" value={stats?.factures ?? '—'} icon="💳" color={tokens.success}/>
          <KpiCard label="Modèles catalogue" value={stats?.modeles ?? '—'} icon="📚" color={tokens.purple}/>
          <KpiCard label="Indicateurs Qualiopi" value={stats?.qualiopi ?? '—'} icon="🛡️" color={tokens.warning}/>
          <KpiCard label="Classes virtuelles" value={stats?.classes ?? '—'} icon="🎥" color={tokens.primary}/>
        </div>

        {/* Onglets */}
        <Tabs
          tabs={[
            { id:'infos', label:'Informations', icon:'📋' },
            { id:'activite', label:'Activité', icon:'📈' },
            { id:'notes', label:'Notes admin', icon:'📝' },
            { id:'documents', label:'Documents', icon:'📂' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* ═══ Onglet INFOS ═══ */}
        {activeTab === 'infos' && (
          <>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
              {dirty && <Button variant="success" icon="💾" onClick={save} disabled={saving}>{saving?'Enregistrement...':'Enregistrer les modifications'}</Button>}
            </div>

            <Card title="🏢 Coordonnées de l'organisme" style={{ marginBottom:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Input label="Nom de l'OF" value={edited.nom||''} onChange={v=>updateField('nom', v)} placeholder="ANZ Formation"/>
                <Input label="Email" value={edited.email||''} onChange={()=>{}} hint="Email non modifiable (identifiant)"/>
                <Input label="SIRET" value={edited.siret||''} onChange={v=>updateField('siret', v)} placeholder="123 456 789 00012"/>
                <Input label="N° Déclaration Activité (NDA)" value={edited.nda||''} onChange={v=>updateField('nda', v)} placeholder="11 75 12345 75"/>
                <Input label="Téléphone" value={edited.telephone||''} onChange={v=>updateField('telephone', v)} placeholder="01 23 45 67 89"/>
                <Input label="Représentant légal" value={edited.representant||''} onChange={v=>updateField('representant', v)} placeholder="Prénom Nom"/>
              </div>
              <div style={{ marginTop:14 }}>
                <Input label="Adresse complète" value={edited.adresse||''} onChange={v=>updateField('adresse', v)} rows={2} placeholder="12 rue de la Formation, 75001 Paris"/>
              </div>
            </Card>

            <Card title="⚙️ Configuration plan & essai">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                <Input label="Statut" value={edited.statut||'essai'} onChange={v=>updateField('statut', v)} options={[
                  { value:'essai', label:'⏳ Essai gratuit' },
                  { value:'actif', label:'✅ Actif (payant)' },
                  { value:'bloque', label:'🔴 Bloqué' },
                  { value:'annule', label:'⚪ Annulé' },
                ]}/>
                <Input label="Plan" value={edited.plan||'essai'} onChange={v=>updateField('plan', v)} options={[
                  { value:'essai', label:'Essai' },
                  { value:'starter', label:'Starter' },
                  { value:'pro', label:'Pro' },
                  { value:'enterprise', label:'Enterprise' },
                ]}/>
                <Input label="Date fin d'essai" type="date" value={edited.date_fin_essai?edited.date_fin_essai.split('T')[0]:''} onChange={v=>updateField('date_fin_essai', v?new Date(v).toISOString():null)}/>
              </div>
            </Card>
          </>
        )}

        {/* ═══ Onglet ACTIVITÉ ═══ */}
        {activeTab === 'activite' && (
          <Card title="📈 Dernières connexions" subtitle="Historique des authentifications réussies">
            {lastLogins.length === 0 ? (
              <div style={{ padding:14, color:tokens.textDim, fontSize:13, textAlign:'center' }}>Aucune connexion enregistrée</div>
            ) : (
              <div>
                {lastLogins.map((l:any, i:number) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderTop: i>0 ? `1px solid ${tokens.border}`:'none' }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:tokens.success+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🔑</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:tokens.text }}>Connexion réussie par code email</div>
                      <div style={{ fontSize:11, color:tokens.textDim, marginTop:2 }}>{new Date(l.created_at).toLocaleString('fr-FR')}</div>
                    </div>
                    <Badge color={tokens.success}>OK</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ═══ Onglet NOTES ═══ */}
        {activeTab === 'notes' && (
          <Card title="📝 Notes admin" subtitle="Notes internes, non visibles par l'organisme">
            <Input label="" value={edited.notes_admin||''} onChange={v=>updateField('notes_admin', v)} rows={8} placeholder="Ex: Client prometteur, à recontacter en janvier..."/>
            <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
              {dirty && <Button variant="success" icon="💾" onClick={save} disabled={saving}>{saving?'Enregistrement...':'Enregistrer'}</Button>}
            </div>
          </Card>
        )}

        {/* ═══ Onglet DOCUMENTS ═══ */}
        {activeTab === 'documents' && (
          <EmptyState
            icon="📂"
            title="Documents générés"
            description="Conventions, factures et autres documents émis par cet organisme. Disponible quand le multi-tenant sera actif (Sprint 5)."
            action={<Link href="/conventions"><Button variant="secondary">Voir les conventions (global)</Button></Link>}
          />
        )}

      </AdminShell>
    </>
  )
}

