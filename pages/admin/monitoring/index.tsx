import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminShell, { useAdminAuth } from '../../../components/admin/AdminShell'
import { Button, Card, Badge, KpiCard, EmptyState, tokens } from '../../../components/admin/AdminUI'

const STATUS_META: any = {
  up: { label:'Opérationnel', color:tokens.success, icon:'●' },
  degraded: { label:'Dégradé', color:tokens.warning, icon:'●' },
  down: { label:'En panne', color:tokens.danger, icon:'●' },
  unknown: { label:'Inconnu', color:tokens.textDim, icon:'○' },
}

export default function MonitoringPage() {
  const { auth } = useAdminAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { if (auth) load() }, [auth])
  useEffect(() => {
    if (!auth) return
    const id = setInterval(load, 60000) // Refresh toutes les 60s
    return () => clearInterval(id)
  }, [auth])

  async function load() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/monitoring')
      const d = await res.json()
      setData(d)
    } catch {}
    setLoading(false); setRefreshing(false)
  }

  if (!auth) return null

  const global = STATUS_META[data?.global_status || 'unknown']
  const stats = data?.stats || {}

  return (
    <>
      <Head><title>Monitoring — Admin ANZPilot</title></Head>
      <AdminShell activeSection="monitoring" breadcrumb={[{ label:'Monitoring' }]}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:14 }}>
          <div>
            <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>🩺 Monitoring</h1>
            <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>État en temps réel des services d'ANZPilot</p>
          </div>
          <Button variant="primary" icon="🔄" onClick={load} disabled={refreshing}>{refreshing?'Vérification...':'Actualiser'}</Button>
        </div>

        {loading ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Vérification des services...</div> : (
          <>
            {/* Statut global */}
            <Card padding={24} style={{ marginBottom:16, background: `linear-gradient(135deg,${global.color}15,${global.color}05)`, border:`1px solid ${global.color}40` }}>
              <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
                <div style={{ width:60, height:60, borderRadius:14, background:`linear-gradient(135deg,${global.color},${global.color}cc)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, animation:'pulse 2s ease-in-out infinite' }}>{global.icon}</div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:tokens.textMuted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Statut global</div>
                  <div style={{ fontFamily:tokens.fontDisplay, fontSize:24, fontWeight:700, color: global.color }}>
                    {data?.global_status==='up' ? '✅ Tous les services opérationnels' : data?.global_status==='degraded' ? '⚠️ Performance dégradée' : '🔴 Incident en cours'}
                  </div>
                  <div style={{ fontSize:12, color:tokens.textDim, marginTop:4 }}>Dernière vérification : {data ? new Date(data.timestamp).toLocaleTimeString('fr-FR') : '—'}</div>
                </div>
              </div>
            </Card>

            {/* KPIs santé */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
              <KpiCard label="Organismes" value={stats.total_organismes || 0} icon="🏢" color={tokens.primary}/>
              <KpiCard label="Factures SaaS" value={stats.total_factures || 0} icon="💳" color={tokens.success}/>
              <KpiCard label="Emails (24h)" value={stats.emails_24h || 0} icon="📧" color={tokens.purple}/>
              <KpiCard label="Emails échoués (24h)" value={stats.emails_failed_24h || 0} icon="❌" color={(stats.emails_failed_24h||0)>0 ? tokens.danger : tokens.success}/>
            </div>

            {/* Détail des services */}
            <div style={{ marginBottom:14 }}>
              <h2 style={{ fontFamily:tokens.fontDisplay, fontSize:15, fontWeight:700, color:tokens.text, margin:'0 0 12px' }}>🔍 Services individuels</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
              {(data?.services || []).map((svc: any) => {
                const meta = STATUS_META[svc.status] || STATUS_META.unknown
                const isSlow = svc.latency_ms > 500
                return (
                  <Card key={svc.slug} padding={20}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                      <div style={{ fontSize:26 }}>{svc.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:tokens.text }}>{svc.name}</div>
                        <div style={{ fontSize:11, color:tokens.textDim, marginTop:2 }}>{svc.details || svc.error || '—'}</div>
                      </div>
                      <Badge color={meta.color} icon={meta.icon}>{meta.label}</Badge>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:tokens.bg, borderRadius:8, border:`1px solid ${tokens.border}` }}>
                      <span style={{ fontSize:11, color:tokens.textDim, textTransform:'uppercase', letterSpacing:'.06em' }}>Latence</span>
                      <span style={{ fontSize:14, fontWeight:700, color: svc.status==='down' ? tokens.danger : isSlow ? tokens.warning : tokens.success, fontFamily:'monospace' }}>{svc.latency_ms} ms</span>
                    </div>
                    {svc.error && <div style={{ marginTop:10, padding:10, background:'rgba(239,68,68,.08)', border:`1px solid rgba(239,68,68,.2)`, borderRadius:8, fontSize:11, color:tokens.danger }}>⚠️ {svc.error}</div>}
                  </Card>
                )
              })}
            </div>

            <div style={{ marginTop:24, textAlign:'center', fontSize:12, color:tokens.textDim }}>
              🔄 Actualisation automatique toutes les 60 secondes
            </div>
          </>
        )}

        <style jsx global>{`
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.8;transform:scale(1.05)} }
        `}</style>
      </AdminShell>
    </>
  )
}
