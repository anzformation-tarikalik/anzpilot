import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

const MENU = [
  {
    items: [
      { id:'home', icon:'⊞', label:'Tableau de bord', href:'/dashboard' },
      { id:'sessions', icon:'📅', label:'Sessions', href:'/classes-virtuelles' },
      { id:'visio', icon:'🎥', label:'ANZPilot Visio', href:'/visio', badge:'NEW' },
      { id:'catalogue', icon:'📚', label:'Catalogue', href:'/catalogue', badge:'NEW' },
    ]
  },
  {
    title: 'ADMINISTRATIF',
    items: [
      { id:'conventions', icon:'📄', label:'Conventions & docs', href:'/conventions' },
      { id:'factures', icon:'💳', label:'Facturation', href:'/factures' },
      { id:'bpf', icon:'📊', label:'BPF automatique', href:'/bpf' },
    ]
  },
  {
    title: 'CONFORMITÉ',
    items: [
      { id:'qualiopi', icon:'🛡️', label:'Qualiopi', href:'/qualiopi' },
    ]
  },
  {
    title: 'CONFIGURATION',
    items: [
      { id:'admin', icon:'⚙️', label:'Administration', href:'/admin' },
    ]
  },
]

interface LayoutProps {
  children: React.ReactNode
  ofNom?: string
}

export default function Layout({ children, ofNom }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const [nomOrganisme, setNomOrganisme] = useState(ofNom || 'ANZ Formation')

  useEffect(() => {
    if (ofNom) return
    fetch('/api/admin/config').then(r=>r.json()).then(d=>{
      if (d.config?.nom_organisme) setNomOrganisme(d.config.nom_organisme)
    }).catch(()=>{})
  }, [ofNom])

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui' }}>
      <aside style={{ width: collapsed?72:240, flexShrink:0, background:'#0a1628', borderRight:'1px solid rgba(255,255,255,.06)', display:'flex', flexDirection:'column', transition:'width .2s', position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
        <div style={{ padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>✈️</div>
          {!collapsed && (
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontFamily:'Sora,Georgia', fontSize:15, fontWeight:700, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{nomOrganisme}</div>
              <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>Propulsé par ANZPilot</div>
            </div>
          )}
        </div>

        <nav style={{ flex:1, padding:'14px 8px' }}>
          {MENU.map((section, si) => (
            <div key={si} style={{ marginBottom: section.title?18:0 }}>
              {!collapsed && section.title && (
                <div style={{ padding:'8px 10px', fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.08em' }}>{section.title}</div>
              )}
              {section.items.map(item => {
                const active = router.pathname === item.href || (item.href !== '/dashboard' && router.pathname.startsWith(item.href))
                return (
                  <Link key={item.id} href={item.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, color: active?'#0ea5e9':'#94a3b8', background: active?'rgba(14,165,233,.1)':'transparent', textDecoration:'none', fontSize:13, fontWeight:500, marginBottom:2, transition:'all .15s' }}
                    onMouseEnter={e=>{if(!active){e.currentTarget.style.background='rgba(255,255,255,.04)'; e.currentTarget.style.color='#fff'}}}
                    onMouseLeave={e=>{if(!active){e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#94a3b8'}}}>
                    <span style={{ fontSize:16, width:20, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                    {!collapsed && <span style={{ flex:1 }}>{item.label}</span>}
                    {!collapsed && (item as any).badge && <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:10, background:'rgba(16,185,129,.15)', color:'#10b981' }}>{(item as any).badge}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, color:'#64748b', textDecoration:'none', fontSize:13 }}>
            <span style={{ fontSize:16, width:20, textAlign:'center' }}>🌐</span>
            {!collapsed && <span>Voir le site public</span>}
          </Link>
          <button onClick={()=>setCollapsed(!collapsed)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, border:'none', background:'transparent', color:'#64748b', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,system-ui' }}>
            <span style={{ fontSize:14, width:20, textAlign:'center' }}>{collapsed?'→':'←'}</span>
            {!collapsed && <span>Réduire</span>}
          </button>
        </div>
      </aside>

      <main style={{ flex:1, padding:24, overflowY:'auto' }}>
        {children}
      </main>
    </div>
  )
}
