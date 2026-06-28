import React, { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { tokens } from './AdminUI'

// ═══ MENU STRUCTURE (Sprint 1: dashboard + sections placeholder) ═══
const MENU = [
  {
    items: [
      { id:'dashboard', icon:'📊', label:'Dashboard', href:'/admin/dashboard' },
    ]
  },
  {
    title:'GESTION',
    items: [
      { id:'organismes', icon:'🏢', label:'Organismes', href:'/admin/organismes' },
      { id:'abonnements', icon:'💳', label:'Abonnements', href:'/admin/dashboard?section=abonnements', soon:true },
      { id:'support', icon:'🎫', label:'Support', href:'/admin/dashboard?section=support', soon:true },
    ]
  },
  {
    title:'INSIGHTS',
    items: [
      { id:'analytics', icon:'📈', label:'Analytics', href:'/admin/dashboard?section=analytics', soon:true },
      { id:'monitoring', icon:'🩺', label:'Monitoring', href:'/admin/dashboard?section=monitoring', soon:true },
    ]
  },
  {
    title:'CONFIGURATION',
    items: [
      { id:'config', icon:'⚙️', label:'Paramètres', href:'/admin/config' },
      { id:'communications', icon:'🔔', label:'Communications', href:'/admin/dashboard?section=communications', soon:true },
      { id:'integrations', icon:'🔌', label:'Intégrations', href:'/admin/dashboard?section=integrations', soon:true },
    ]
  },
  {
    title:'SÉCURITÉ',
    items: [
      { id:'equipe', icon:'👥', label:'Équipe admin', href:'/admin/dashboard?section=equipe', soon:true },
      { id:'audit', icon:'🛡️', label:'Audit & logs', href:'/admin/dashboard?section=audit', soon:true },
    ]
  },
]

// ═══ HOOK AUTH ═════════════════════════════════════════════
export function useAdminAuth() {
  const router = useRouter()
  const [auth, setAuth] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('anzpilot_admin') !== 'ok') {
      router.push('/admin')
    } else setAuth(true)
  }, [router])
  return { auth }
}

// ═══ ADMIN SHELL ══════════════════════════════════════════
interface AdminShellProps {
  children: ReactNode
  activeSection?: string
  breadcrumb?: Array<{ label: string, href?: string }>
}

export default function AdminShell({ children, activeSection='dashboard', breadcrumb }: AdminShellProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')

  function logout() {
    if (typeof window !== 'undefined') sessionStorage.removeItem('anzpilot_admin')
    router.push('/admin')
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:tokens.bg, color:tokens.text, fontFamily:tokens.fontSans }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{ width: collapsed?72:240, flexShrink:0, background:'#0a1628', borderRight:`1px solid ${tokens.border}`, display:'flex', flexDirection:'column', transition:'width .2s', position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
        {/* Logo */}
        <div style={{ padding:'18px 16px', borderBottom:`1px solid ${tokens.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,#ef4444,#dc2626)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🔐</div>
          {!collapsed && (
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontFamily:tokens.fontDisplay, fontSize:14, fontWeight:700, color:tokens.text }}>Admin Console</div>
              <div style={{ fontSize:10, color:tokens.textDim, marginTop:2 }}>ANZPilot Master</div>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav style={{ flex:1, padding:'14px 8px' }}>
          {MENU.map((section, si) => (
            <div key={si} style={{ marginBottom: section.title?18:0 }}>
              {!collapsed && section.title && (
                <div style={{ padding:'8px 10px', fontSize:10, fontWeight:700, color:tokens.textFaint, textTransform:'uppercase', letterSpacing:'.08em' }}>{section.title}</div>
              )}
              {section.items.map(item => {
                const isActive = activeSection === item.id
                return (
                  <Link key={item.id} href={item.href} style={{
                    display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8,
                    color: isActive ? tokens.primary : tokens.textMuted,
                    background: isActive ? 'rgba(14,165,233,.1)' : 'transparent',
                    textDecoration:'none', fontSize:13, fontWeight:500, marginBottom:2, transition:'all .15s'
                  }}>
                    <span style={{ fontSize:16, width:20, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                    {!collapsed && <span style={{ flex:1 }}>{item.label}</span>}
                    {!collapsed && (item as any).soon && <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:10, background:'rgba(245,158,11,.15)', color:tokens.warning }}>SOON</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding:'12px 8px', borderTop:`1px solid ${tokens.border}` }}>
          <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, color:tokens.textDim, textDecoration:'none', fontSize:12 }}>
            <span style={{ fontSize:14, width:20, textAlign:'center' }}>←</span>
            {!collapsed && <span>App ANZPilot</span>}
          </Link>
          <button onClick={logout} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, border:'none', background:'transparent', color:tokens.danger, cursor:'pointer', fontSize:12, fontFamily:tokens.fontSans }}>
            <span style={{ fontSize:14, width:20, textAlign:'center' }}>🚪</span>
            {!collapsed && <span>Déconnexion</span>}
          </button>
          <button onClick={()=>setCollapsed(!collapsed)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, border:'none', background:'transparent', color:tokens.textDim, cursor:'pointer', fontSize:12, fontFamily:tokens.fontSans }}>
            <span style={{ fontSize:14, width:20, textAlign:'center' }}>{collapsed?'→':'←'}</span>
            {!collapsed && <span>Réduire</span>}
          </button>
        </div>
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* ═══ HEADER ═══ */}
        <header style={{ height:60, background:'#0a1628', borderBottom:`1px solid ${tokens.border}`, padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, position:'sticky', top:0, zIndex:10 }}>
          {/* Breadcrumb */}
          <div style={{ fontSize:13, color:tokens.textMuted, display:'flex', alignItems:'center', gap:6 }}>
            <Link href="/admin/dashboard" style={{ color:tokens.textMuted, textDecoration:'none' }}>Admin</Link>
            {breadcrumb?.map((b, i) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ color:tokens.textFaint }}>/</span>
                {b.href ? <Link href={b.href} style={{ color:tokens.textMuted, textDecoration:'none' }}>{b.label}</Link> : <span style={{ color:tokens.text, fontWeight:600 }}>{b.label}</span>}
              </span>
            ))}
          </div>

          {/* Search + Actions */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13 }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." style={{
                width:260, background:tokens.bg, border:`1px solid ${tokens.border}`, borderRadius:9,
                padding:'8px 12px 8px 34px', fontSize:13, color:tokens.text, fontFamily:tokens.fontSans, outline:'none'
              }}/>
            </div>
            <button title="Notifications" style={{ width:36, height:36, borderRadius:9, border:`1px solid ${tokens.border}`, background:tokens.surface, color:tokens.textMuted, cursor:'pointer', position:'relative', fontSize:14 }}>
              🔔
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:9, background:tokens.surface, border:`1px solid ${tokens.border}` }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>T</div>
              <div style={{ fontSize:12, fontWeight:600, color:tokens.text }}>Tarik</div>
            </div>
          </div>
        </header>

        {/* ═══ CONTENT ═══ */}
        <main style={{ flex:1, padding:24, overflowY:'auto' }}>
          <div style={{ maxWidth:1400, margin:'0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
