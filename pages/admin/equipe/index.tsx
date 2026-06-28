import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminShell, { useAdminAuth } from '../../../components/admin/AdminShell'
import { Button, Card, Badge, Input, Modal, EmptyState, tokens } from '../../../components/admin/AdminUI'

interface AdminUser {
  id: string
  email: string
  nom: string
  role: string
  actif: boolean
  last_login_at: string | null
  created_at: string
  notes: string
}

const ROLES_META: any = {
  super_admin: { label:'Super Admin', color:'#ef4444', icon:'👑', desc:'Tous les droits, gestion équipe' },
  admin: { label:'Admin', color:'#0ea5e9', icon:'🔧', desc:'Tous les droits sauf équipe' },
  support: { label:'Support', color:'#10b981', icon:'🎧', desc:'Lecture + notes + statuts organismes' },
  finance: { label:'Finance', color:'#a855f7', icon:'💰', desc:'Lecture + paiements' },
  lecture_seule: { label:'Lecture seule', color:'#94a3b8', icon:'👁️', desc:'Lecture uniquement' },
}

export default function EquipePage() {
  const { auth } = useAdminAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEmail, setCurrentEmail] = useState('')

  // Modal add/edit
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form, setForm] = useState({ email:'', nom:'', password:'', role:'admin', actif:true, notes:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentEmail(sessionStorage.getItem('anzpilot_admin_email') || 'master')
    }
    if (auth) load()
  }, [auth])

  function load() {
    setLoading(true)
    fetch('/api/admin/team').then(r=>r.json()).then(d=>{
      setUsers(d.users || []); setLoading(false)
    }).catch(()=>setLoading(false))
  }

  function openAdd() {
    setEditing(null)
    setForm({ email:'', nom:'', password:'', role:'admin', actif:true, notes:'' })
    setShowModal(true)
  }

  function openEdit(u: AdminUser) {
    setEditing(u)
    setForm({ email:u.email, nom:u.nom||'', password:'', role:u.role||'admin', actif:u.actif, notes:u.notes||'' })
    setShowModal(true)
  }

  async function save() {
    setSaving(true)
    try {
      if (editing) {
        const body: any = { id: editing.id, nom: form.nom, role: form.role, actif: form.actif, notes: form.notes }
        if (form.password) body.password = form.password
        const res = await fetch('/api/admin/team', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
        const d = await res.json()
        if (d.success) { setShowModal(false); load() }
        else alert('Erreur: '+(d.error||''))
      } else {
        if (!form.email || !form.password) { alert('Email et mot de passe requis'); setSaving(false); return }
        const res = await fetch('/api/admin/team', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
        const d = await res.json()
        if (d.success) { setShowModal(false); load() }
        else alert('Erreur: '+(d.error||''))
      }
    } catch(e:any) { alert(e.message) }
    setSaving(false)
  }

  async function deleteUser(u: AdminUser) {
    if (!confirm(`Supprimer définitivement ${u.email} ?`)) return
    try {
      const res = await fetch(`/api/admin/team?id=${u.id}`, { method:'DELETE' })
      const d = await res.json()
      if (d.success) load()
      else alert('Erreur: '+(d.error||''))
    } catch(e:any) { alert(e.message) }
  }

  if (!auth) return null

  return (
    <>
      <Head><title>Équipe admin — ANZPilot</title></Head>
      <AdminShell activeSection="equipe" breadcrumb={[{ label:'Équipe admin' }]}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:14 }}>
          <div>
            <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>👥 Équipe admin</h1>
            <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Gérez les administrateurs et leurs permissions</p>
          </div>
          <Button variant="primary" icon="➕" onClick={openAdd}>Inviter un admin</Button>
        </div>

        <Card style={{ marginBottom:14, background:'rgba(14,165,233,.06)', border:'1px solid rgba(14,165,233,.2)' }}>
          <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ fontSize:22 }}>💡</div>
            <div style={{ fontSize:13, color:tokens.textMuted, lineHeight:1.5 }}>
              <strong style={{ color:tokens.text }}>Mode Master toujours actif :</strong> en cas de perte d'accès, tu peux toujours te connecter avec le mot de passe master <code style={{ background:tokens.bg, padding:'2px 6px', borderRadius:4, fontSize:11 }}>ANZPilot2026!</code> (laisser l'email vide au login).
            </div>
          </div>
        </Card>

        {loading ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div>
        : users.length === 0 ? (
          <EmptyState icon="👥" title="Aucun admin invité" description="Invitez votre premier administrateur" action={<Button variant="primary" icon="➕" onClick={openAdd}>Inviter un admin</Button>}/>
        ) : (
          <Card padding={0}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 140px 100px 130px 130px', gap:14, padding:'12px 16px', borderBottom:`1px solid ${tokens.border}`, fontSize:11, fontWeight:700, color:tokens.textDim, textTransform:'uppercase', letterSpacing:'.06em' }}>
              <div>Utilisateur</div>
              <div>Rôle</div>
              <div>Statut</div>
              <div>Dernière connexion</div>
              <div>Actions</div>
            </div>
            {users.map((u, i) => {
              const r = ROLES_META[u.role] || ROLES_META.admin
              const isSelf = u.email === currentEmail
              const isProtected = u.email === 'tarikalik@gmail.com'
              return (
                <div key={u.id} style={{ display:'grid', gridTemplateColumns:'1fr 140px 100px 130px 130px', gap:14, padding:14, borderBottom: i<users.length-1?`1px solid ${tokens.border}`:'none', alignItems:'center' }}>
                  <div style={{ minWidth:0, display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:`linear-gradient(135deg,${r.color},${r.color}cc)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{r.icon}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:tokens.text }}>{u.nom || u.email.split('@')[0]} {isSelf && <span style={{ fontSize:10, color:tokens.primary, fontWeight:600 }}>(vous)</span>}</div>
                      <div style={{ fontSize:11, color:tokens.textDim, marginTop:2 }}>📧 {u.email}</div>
                    </div>
                  </div>
                  <Badge color={r.color} icon={r.icon}>{r.label}</Badge>
                  <Badge color={u.actif ? tokens.success : tokens.textDim}>{u.actif?'● Actif':'○ Désactivé'}</Badge>
                  <div style={{ fontSize:11, color:tokens.textMuted }}>{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('fr-FR') : 'Jamais'}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <Button size="sm" variant="secondary" onClick={()=>openEdit(u)}>✏️</Button>
                    <Button size="sm" variant="danger" onClick={()=>deleteUser(u)} disabled={isProtected||isSelf}>🗑️</Button>
                  </div>
                </div>
              )
            })}
          </Card>
        )}

        {/* Modal add/edit */}
        <Modal
          open={showModal}
          onClose={()=>setShowModal(false)}
          title={editing ? `✏️ Modifier ${editing.email}` : '➕ Inviter un admin'}
          subtitle={editing ? 'Modifiez les informations et le rôle' : 'Créez un nouveau compte administrateur'}
          maxWidth={520}
          footer={
            <>
              <Button variant="secondary" fullWidth onClick={()=>setShowModal(false)}>Annuler</Button>
              <Button variant="success" fullWidth onClick={save} disabled={saving}>{saving?'⏳':editing?'💾 Enregistrer':'➕ Créer'}</Button>
            </>
          }
        >
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Input label="Email" type="email" value={form.email} onChange={v=>setForm({...form, email:v})} placeholder="admin@anzpilot.com" required hint={editing ? "Email non modifiable" : undefined}/>
            <Input label="Nom complet" value={form.nom} onChange={v=>setForm({...form, nom:v})} placeholder="Jean Dupont"/>
            <Input label={editing?"Nouveau mot de passe (laisser vide pour ne pas changer)":"Mot de passe initial"} type="password" value={form.password} onChange={v=>setForm({...form, password:v})} placeholder="Minimum 8 caractères" required={!editing} hint="Min. 8 caractères. À communiquer en main propre."/>
            <Input label="Rôle" value={form.role} onChange={v=>setForm({...form, role:v})} options={Object.entries(ROLES_META).map(([k,v]:any)=>({ value:k, label:`${v.icon} ${v.label} — ${v.desc}` }))}/>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:12, background:tokens.bg, borderRadius:8, border:`1px solid ${tokens.border}` }}>
              <div>
                <div style={{ fontSize:13, color:tokens.text }}>Compte actif</div>
                <div style={{ fontSize:11, color:tokens.textDim, marginTop:2 }}>L'admin pourra se connecter si activé</div>
              </div>
              <label style={{ position:'relative', display:'inline-block', width:42, height:24, cursor:'pointer' }}>
                <input type="checkbox" checked={form.actif} onChange={e=>setForm({...form, actif:e.target.checked})} style={{ opacity:0 }}/>
                <span style={{ position:'absolute', inset:0, background:form.actif?tokens.success:tokens.surface, borderRadius:12, transition:'.2s' }}>
                  <span style={{ position:'absolute', height:18, width:18, left:form.actif?20:3, top:3, background:'#fff', borderRadius:'50%', transition:'.2s' }}/>
                </span>
              </label>
            </div>

            <Input label="Notes" value={form.notes} onChange={v=>setForm({...form, notes:v})} rows={2} placeholder="Notes internes (optionnel)"/>
          </div>
        </Modal>

      </AdminShell>
    </>
  )
}


