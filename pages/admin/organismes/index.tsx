import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminShell, { useAdminAuth } from '../../../components/admin/AdminShell'
import { Button, Card, Badge, Input, Tabs, EmptyState, tokens } from '../../../components/admin/AdminUI'

interface Organisme {
  id: string
  email: string
  nom: string
  siret: string
  statut: string
  plan: string
  date_inscription: string
  date_fin_essai: string
  joursRestants: number | null
  notes_admin: string
}

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

const PAGE_SIZES = [10, 25, 50, 100]

export default function OrganismesListPage() {
  const { auth } = useAdminAuth()

  const [organismes, setOrganismes] = useState<Organisme[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date_inscription' | 'nom' | 'joursRestants'>('date_inscription')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!auth) return
    load()
  }, [auth])

  function load() {
    setLoading(true)
    fetch('/api/admin-saas/list-organismes').then(r=>r.json()).then(d=>{
      setOrganismes(d.organismes||[]); setLoading(false)
    }).catch(()=>setLoading(false))
  }

  // ═══ Filtrage + Tri ═══
  const filtered = useMemo(() => {
    let result = organismes
    if (statutFilter !== 'all') result = result.filter(o => o.statut === statutFilter)
    if (planFilter !== 'all') result = result.filter(o => o.plan === planFilter)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(o =>
        (o.nom || '').toLowerCase().includes(q) ||
        (o.email || '').toLowerCase().includes(q) ||
        (o.siret || '').toLowerCase().includes(q)
      )
    }
    // Tri
    result = [...result].sort((a, b) => {
      let av: any = a[sortBy]; let bv: any = b[sortBy]
      if (av === null || av === undefined) av = ''
      if (bv === null || bv === undefined) bv = ''
      if (sortBy === 'date_inscription') {
        av = new Date(av).getTime(); bv = new Date(bv).getTime()
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [organismes, statutFilter, planFilter, search, sortBy, sortDir])

  // ═══ Pagination ═══
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage-1)*pageSize, currentPage*pageSize)

  useEffect(() => { setPage(1) }, [search, statutFilter, planFilter, pageSize])

  // ═══ Sélection ═══
  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }
  function toggleSelectAll() {
    if (paginated.every(o => selected.has(o.id))) {
      setSelected(new Set(Array.from(selected).filter(id => !paginated.find(o => o.id === id))))
    } else {
      setSelected(new Set([...Array.from(selected), ...paginated.map(o => o.id)]))
    }
  }
  const allSelected = paginated.length > 0 && paginated.every(o => selected.has(o.id))

  // ═══ Actions en masse ═══
  async function bulkAction(action: 'prolong' | 'block' | 'unblock') {
    if (selected.size === 0) return
    if (!confirm(`Appliquer l'action sur ${selected.size} organisme(s) ?`)) return
    try {
      for (const id of Array.from(selected)) {
        const body: any = { id }
        if (action === 'prolong') body.prolongation_jours = 30
        if (action === 'block') body.statut = 'bloque'
        if (action === 'unblock') body.statut = 'actif'
        await fetch('/api/admin-saas/update-statut', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      }
      setSelected(new Set())
      load()
    } catch(e:any) { alert(e.message) }
  }

  // ═══ Export CSV ═══
  function exportCSV() {
    const rows = filtered.length > 0 ? filtered : organismes
    if (rows.length === 0) { alert('Aucune donnée à exporter'); return }
    const headers = ['Email','Nom','SIRET','Statut','Plan','Date inscription','Jours restants essai','Notes admin']
    const csv = [
      headers.join(','),
      ...rows.map(o => [
        o.email, o.nom||'', o.siret||'', o.statut, o.plan,
        new Date(o.date_inscription).toLocaleDateString('fr-FR'),
        o.joursRestants?.toString() || '',
        (o.notes_admin||'').replace(/,/g,';').replace(/\n/g,' ')
      ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
    ].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `organismes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!auth) return null

  const orgCounts = {
    all: organismes.length,
    essai: organismes.filter(o => o.statut==='essai').length,
    actif: organismes.filter(o => o.statut==='actif').length,
    bloque: organismes.filter(o => o.statut==='bloque').length,
    annule: organismes.filter(o => o.statut==='annule').length,
  }

  return (
    <>
      <Head><title>Organismes — Admin ANZPilot</title></Head>
      <AdminShell activeSection="organismes" breadcrumb={[{ label:'Organismes' }]}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:14 }}>
          <div>
            <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>🏢 Organismes</h1>
            <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Gérez tous les organismes de formation inscrits sur ANZPilot</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Button variant="secondary" icon="⬇️" onClick={exportCSV}>Exporter CSV</Button>
            <Button variant="primary" icon="🔄" onClick={load}>Actualiser</Button>
          </div>
        </div>

        {/* Tabs filtres statut */}
        <Tabs
          tabs={[
            { id:'all', label:'Tous', count: orgCounts.all },
            { id:'essai', label:'Essai', icon:'⏳', count: orgCounts.essai },
            { id:'actif', label:'Actifs', icon:'✅', count: orgCounts.actif },
            { id:'bloque', label:'Bloqués', icon:'🔴', count: orgCounts.bloque },
            { id:'annule', label:'Annulés', icon:'⚪', count: orgCounts.annule },
          ]}
          active={statutFilter}
          onChange={setStatutFilter}
        />

        {/* Barre recherche + filtres */}
        <Card padding={16} style={{ marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:12 }}>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:tokens.textDim }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher (nom, email, SIRET)..." style={{
                width:'100%', background:tokens.bg, border:`1px solid ${tokens.border}`, borderRadius:8,
                padding:'10px 12px 10px 34px', fontSize:13, color:tokens.text, fontFamily:tokens.fontSans, outline:'none'
              }}/>
            </div>
            <Input label="" value={planFilter} onChange={setPlanFilter} options={[
              { value:'all', label:'Tous les plans' },
              { value:'essai', label:'Essai' },
              { value:'starter', label:'Starter' },
              { value:'pro', label:'Pro' },
              { value:'enterprise', label:'Enterprise' },
            ]}/>
            <Input label="" value={sortBy} onChange={(v:any)=>setSortBy(v)} options={[
              { value:'date_inscription', label:'Tri par date' },
              { value:'nom', label:'Tri par nom' },
              { value:'joursRestants', label:'Tri par jours essai' },
            ]}/>
            <Input label="" value={String(pageSize)} onChange={v=>setPageSize(parseInt(v))} options={PAGE_SIZES.map(n=>({ value:String(n), label:`${n}/page` }))}/>
          </div>
        </Card>

        {/* Actions en masse */}
        {selected.size > 0 && (
          <Card padding={12} style={{ marginBottom:14, background:'rgba(14,165,233,.08)', border:`1px solid rgba(14,165,233,.3)` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
              <div style={{ fontSize:13, color:tokens.text }}>
                <strong>{selected.size}</strong> organisme(s) sélectionné(s)
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Button size="sm" variant="secondary" onClick={()=>bulkAction('prolong')}>⏰ Prolonger +30j</Button>
                <Button size="sm" variant="secondary" onClick={()=>bulkAction('unblock')}>✅ Débloquer</Button>
                <Button size="sm" variant="danger" onClick={()=>bulkAction('block')}>🔴 Bloquer</Button>
                <Button size="sm" variant="ghost" onClick={()=>setSelected(new Set())}>Annuler</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Liste */}
        {loading ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div>
        : paginated.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Aucun résultat"
            description={search ? `Aucun organisme ne correspond à "${search}"` : "Aucun organisme dans cette catégorie"}
            action={search ? <Button variant="secondary" onClick={()=>setSearch('')}>Effacer la recherche</Button> : undefined}
          />
        ) : (
          <Card padding={0}>
            {/* Header table */}
            <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 130px 110px 110px 110px 100px', gap:14, padding:'12px 16px', borderBottom:`1px solid ${tokens.border}`, fontSize:11, fontWeight:700, color:tokens.textDim, textTransform:'uppercase', letterSpacing:'.06em' }}>
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ accentColor:tokens.primary, cursor:'pointer' }}/>
              <div>Organisme</div>
              <div>Inscription</div>
              <div>Statut</div>
              <div>Plan</div>
              <div>Essai</div>
              <div>Actions</div>
            </div>
            {/* Lignes */}
            {paginated.map((o,i) => {
              const s = STATUTS_META[o.statut] || STATUTS_META.essai
              const p = PLANS_META[o.plan] || PLANS_META.essai
              const isSelected = selected.has(o.id)
              return (
                <div key={o.id} style={{
                  display:'grid', gridTemplateColumns:'40px 1fr 130px 110px 110px 110px 100px', gap:14,
                  padding:14, borderBottom: i<paginated.length-1 ? `1px solid ${tokens.border}`:'none',
                  alignItems:'center',
                  background: isSelected ? 'rgba(14,165,233,.05)' : 'transparent'
                }}>
                  <input type="checkbox" checked={isSelected} onChange={()=>toggleSelect(o.id)} style={{ accentColor:tokens.primary, cursor:'pointer' }}/>
                  <Link href={`/admin/organismes/${o.id}`} style={{ textDecoration:'none', color:'inherit', minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:tokens.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.nom || '(non renseigné)'}</div>
                    <div style={{ fontSize:11, color:tokens.textDim, marginTop:2 }}>📧 {o.email}</div>
                  </Link>
                  <div style={{ fontSize:11, color:tokens.textMuted }}>{new Date(o.date_inscription).toLocaleDateString('fr-FR')}</div>
                  <Badge color={s.color} icon={s.icon}>{s.label}</Badge>
                  <Badge color={p.color}>{p.label}</Badge>
                  <div style={{ fontSize:11, color: o.joursRestants !== null && o.joursRestants <= 3 ? tokens.danger : o.joursRestants !== null && o.joursRestants <= 7 ? tokens.warning : tokens.textMuted, fontWeight:600 }}>
                    {o.statut==='essai' && o.joursRestants !== null ? (o.joursRestants > 0 ? `J-${o.joursRestants}` : 'Expiré') : '—'}
                  </div>
                  <Link href={`/admin/organismes/${o.id}`}>
                    <Button size="sm" variant="primary">Ouvrir →</Button>
                  </Link>
                </div>
              )
            })}
          </Card>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, fontSize:12, color:tokens.textMuted }}>
            <div>Affichage {(currentPage-1)*pageSize+1}-{Math.min(currentPage*pageSize, filtered.length)} sur {filtered.length}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Button size="sm" variant="secondary" disabled={currentPage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>← Précédent</Button>
              <span style={{ padding:'0 8px' }}>Page {currentPage} / {totalPages}</span>
              <Button size="sm" variant="secondary" disabled={currentPage>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Suivant →</Button>
            </div>
          </div>
        )}

      </AdminShell>
    </>
  )
}
