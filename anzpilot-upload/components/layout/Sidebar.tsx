import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const navGroups = [
  { label: 'Principal', items: [
    { icon: '⊞', label: 'Tableau de bord', id: 'dashboard' },
    { icon: '🔔', label: 'Notifications', id: 'notifications', badge: '3' },
  ]},
  { label: 'Formations', items: [
    { icon: '📅', label: 'Sessions', id: 'sessions' },
    { icon: '🎥', label: 'Classes virtuelles', id: 'virtual', badge: 'NEW' },
    { icon: '📚', label: 'Catalogue LMS', id: 'lms' },
    { icon: '🧑‍🏫', label: 'Formateurs', id: 'formateurs' },
    { icon: '👥', label: 'Espace apprenants', id: 'apprenants' },
    { icon: '✍️', label: 'Émargements', id: 'emargement' },
  ]},
  { label: 'Administratif', items: [
    { icon: '📄', label: 'Conventions & docs', id: 'conventions' },
    { icon: '💳', label: 'Facturation', id: 'facturation' },
    { icon: '🤝', label: 'CRM & Prospects', id: 'crm' },
  ]},
  { label: 'Conformité', items: [
    { icon: '🛡️', label: 'Qualiopi', id: 'qualiopi' },
    { icon: '📊', label: 'BPF', id: 'bpf' },
    { icon: '⭐', label: 'Évaluations', id: 'evaluations' },
  ]},
  { label: 'Outils IA', items: [
    { icon: '⚡', label: 'Assistant IA', id: 'ai', badge: 'IA' },
    { icon: '🎓', label: 'Marketplace', id: 'marketplace' },
  ]},
]

const planColors: Record<string, string> = { trial:'#64748b', starter:'#3b82f6', pro:'#7c3aed', business:'#d97706', enterprise:'#059669' }
const planLabels: Record<string, string> = { trial:'Essai', starter:'Starter', pro:'Pro', business:'Business', enterprise:'Entreprise' }

export default function Sidebar({ activeSection, onNavigate, organisme, user }: any) {
  const [collapsed, setCollapsed] = useState(false)
  const plan = organisme?.plan || 'trial'
  const couleur = organisme?.couleur || '#0ea5e9'
  const userInitials = user ? `${user.prenom?.[0]||''}${user.nom?.[0]||''}`.toUpperCase() : '??'

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/login' }

  const btnStyle = (isActive: boolean) => ({
    display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, cursor:'pointer',
    fontSize:13, fontWeight:500, fontFamily:'DM Sans,system-ui',
    color: isActive ? '#93c5fd' : 'var(--text2)',
    background: isActive ? 'rgba(59,130,246,.12)' : 'transparent',
    border: isActive ? '1px solid rgba(59,130,246,.2)' : '1px solid transparent',
    justifyContent: collapsed ? 'center' : 'flex-start' as const,
    whiteSpace:'nowrap' as const, overflow:'hidden', transition:'all .15s', width:'100%'
  })

  return (
    <aside style={{ width: collapsed ? 60 : 240, flexShrink:0, background:'var(--bg2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', height:'100vh', transition:'width .3s', position:'relative' }}>
      {/* Logo ANZPilot */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 16px', borderBottom:'1px solid var(--border)', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>✈️</div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily:'Sora,Georgia', fontWeight:700, color:'#fff', fontSize:15, letterSpacing:'-0.3px' }}>ANZPilot</div>
            <div style={{ fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'.1em', color:'#0ea5e9', marginTop:1 }}></div>
          </div>
        )}
      </div>

      {/* Collapse btn */}
      <button onClick={() => setCollapsed(!collapsed)} style={{ position:'absolute', right:-12, top:64, width:24, height:24, borderRadius:'50%', background:'#132035', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text3)', fontSize:12, zIndex:10 }}>
        {collapsed ? '›' : '‹'}
      </button>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:'auto', padding:'12px 8px', display:'flex', flexDirection:'column', gap:18 }}>
        {navGroups.map(group => (
          <div key={group.label}>
            {!collapsed && <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.1em', padding:'0 10px', marginBottom:4 }}>{group.label}</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {group.items.map((item: any) => {
                const isActive = activeSection === item.id
                return (
                  <button key={item.id} onClick={() => onNavigate(item.id)} style={btnStyle(isActive)} title={collapsed ? item.label : ''}>
                    <span style={{ fontSize:15, flexShrink:0, width:18, textAlign:'center' }}>{item.icon}</span>
                    {!collapsed && <>
                      <span style={{ flex:1, textAlign:'left' }}>{item.label}</span>
                      {item.badge && <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:20, background: item.badge==='NEW'?'rgba(16,185,129,.15)': item.badge==='IA'?'rgba(139,92,246,.15)':'rgba(239,68,68,.15)', color: item.badge==='NEW'?'#6ee7b7': item.badge==='IA'?'#c4b5fd':'#fca5a5', border:`1px solid ${item.badge==='NEW'?'rgba(16,185,129,.25)': item.badge==='IA'?'rgba(139,92,246,.25)':'rgba(239,68,68,.25)'}` }}>{item.badge}</span>}
                      {isActive && <span style={{ fontSize:11, color:'#93c5fd' }}>›</span>}
                    </>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding:'10px 8px', borderTop:'1px solid var(--border)' }}>
        <button onClick={() => onNavigate('abonnements')} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'7px 10px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:500, fontFamily:'DM Sans,system-ui', color:planColors[plan], background:`${planColors[plan]}15`, border:`1px solid ${planColors[plan]}30`, justifyContent: collapsed?'center':'flex-start', marginBottom:6 }} title={collapsed?'Abonnement':''}>
          💳{!collapsed && <><span>Plan {planLabels[plan]}</span>{plan==='trial'&&<span style={{marginLeft:'auto',fontSize:9,color:'var(--text3)'}}>Upgrader →</span>}</>}
        </button>
        <button onClick={() => onNavigate('settings')} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'7px 10px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:500, fontFamily:'DM Sans,system-ui', color:'var(--text2)', background:'transparent', border:'1px solid transparent', justifyContent: collapsed?'center':'flex-start', marginBottom:4 }}>
          ⚙️{!collapsed && <span>Paramètres</span>}
        </button>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', marginTop:4 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>{userInitials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.prenom} {user?.nom}</div>
              <div style={{ fontSize:10, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
            </div>
            <button onClick={handleLogout} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:14 }} title="Déconnexion">🚪</button>
          </div>
        )}
      </div>
    </aside>
  )
}
