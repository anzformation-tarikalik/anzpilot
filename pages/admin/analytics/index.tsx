import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminShell, { useAdminAuth } from '../../../components/admin/AdminShell'
import { Card, KpiCard, EmptyState, tokens } from '../../../components/admin/AdminUI'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'

const PLAN_COLORS: Record<string,string> = {
  essai: tokens.warning, starter: tokens.primary, pro: tokens.purple, enterprise: '#f59e0b',
}
const STATUT_COLORS: Record<string,string> = {
  essai: tokens.warning, actif: tokens.success, bloque: tokens.danger, annule: tokens.textDim,
}
const STATUT_LABELS: Record<string,string> = {
  essai:'Essai', actif:'Actif', bloque:'Bloqué', annule:'Annulé',
}

function fmt(centimes: number): string { return ((centimes||0)/100).toLocaleString('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits: 0 }) }

const CustomTooltip = ({ active, payload, label, valueFormatter }: any) => {
  if (!active || !payload || !payload.length) return null
  return <div style={{ background:'#0a1628', border:`1px solid ${tokens.border}`, borderRadius:8, padding:'10px 14px', fontSize:12, fontFamily:tokens.fontSans }}>
    {label && <div style={{ color:tokens.textMuted, marginBottom:6, fontWeight:600 }}>{label}</div>}
    {payload.map((p:any, i:number) => (
      <div key={i} style={{ color: p.color, display:'flex', gap:8, alignItems:'center' }}>
        <span>●</span><span style={{ color:tokens.text }}>{p.name} : <strong>{valueFormatter?valueFormatter(p.value):p.value}</strong></span>
      </div>
    ))}
  </div>
}

export default function AnalyticsPage() {
  const { auth } = useAdminAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    fetch('/api/admin/analytics').then(r=>r.json()).then(d=>{
      setData(d); setLoading(false)
    }).catch(()=>setLoading(false))
  }, [auth])

  if (!auth) return null

  const kpis = data?.kpis || {}

  return (
    <>
      <Head><title>Analytics — Admin ANZPilot</title></Head>
      <AdminShell activeSection="analytics" breadcrumb={[{ label:'Analytics' }]}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:tokens.fontDisplay, fontSize:26, fontWeight:700, color:tokens.text, margin:0 }}>📈 Analytics</h1>
          <p style={{ fontSize:14, color:tokens.textMuted, margin:'4px 0 0' }}>Vue analytique complète d'ANZPilot</p>
        </div>

        {loading ? <div style={{ padding:48, textAlign:'center', color:tokens.textDim }}>⏳ Chargement...</div> : (
          <>
            {/* KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
              <KpiCard label="MRR (revenus mensuels)" value={fmt(kpis.mrr_centimes)} icon="💰" color={tokens.success}/>
              <KpiCard label="ARR (revenus annuels)" value={fmt(kpis.arr_centimes)} icon="📊" color={tokens.primary}/>
              <KpiCard label="CA total encaissé" value={fmt(kpis.ca_total_centimes)} icon="💎" color={tokens.purple}/>
              <KpiCard label="OF actifs" value={kpis.actifs || 0} icon="✅" color={tokens.success}/>
              <KpiCard label="Inscrits (30j)" value={kpis.signups_30d || 0} icon="🆕" color={tokens.warning}/>
            </div>

            {/* Croissance + Répartitions */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
              <Card title="📈 Croissance (30 derniers jours)" subtitle="Nouvelles inscriptions par jour + cumul">
                {data?.growth?.some((g:any)=>g.signups>0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data.growth} margin={{ top:10, right:10, left:0, bottom:0 }}>
                      <defs>
                        <linearGradient id="colGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={tokens.primary} stopOpacity={0.4}/>
                          <stop offset="100%" stopColor={tokens.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={tokens.border} vertical={false}/>
                      <XAxis dataKey="day" tick={{ fill:tokens.textDim, fontSize:11 }} axisLine={{ stroke:tokens.border }} tickLine={false} interval={4}/>
                      <YAxis tick={{ fill:tokens.textDim, fontSize:11 }} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Area type="monotone" dataKey="signups" name="Inscriptions" stroke={tokens.primary} strokeWidth={2} fill="url(#colGrowth)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon="📊" title="Pas encore de données" description="Les inscriptions apparaîtront ici"/>}
              </Card>

              <Card title="🎯 Par statut">
                {kpis.total_of > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={data.byStatut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                          {data.byStatut.map((e:any, i:number) => <Cell key={i} fill={STATUT_COLORS[e.name] || tokens.textDim}/>)}
                        </Pie>
                        <Tooltip content={<CustomTooltip/>}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                      {data.byStatut.filter((s:any)=>s.value>0).map((s:any)=> (
                        <div key={s.name} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                          <span style={{ display:'flex', alignItems:'center', gap:6, color:tokens.text }}>
                            <span style={{ width:10, height:10, borderRadius:2, background:STATUT_COLORS[s.name] }}/>
                            {STATUT_LABELS[s.name]||s.name}
                          </span>
                          <span style={{ color:tokens.textDim, fontWeight:600 }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <div style={{ padding:20, textAlign:'center', color:tokens.textDim, fontSize:13 }}>Aucun OF</div>}
              </Card>
            </div>

            {/* Revenus + Plans */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
              <Card title="💰 Revenus par mois" subtitle="Chiffre d'affaires encaissé — 6 derniers mois">
                {data?.revenue?.some((r:any)=>r.ca>0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.revenue} margin={{ top:10, right:10, left:0, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={tokens.border} vertical={false}/>
                      <XAxis dataKey="month" tick={{ fill:tokens.textDim, fontSize:11 }} axisLine={{ stroke:tokens.border }} tickLine={false}/>
                      <YAxis tick={{ fill:tokens.textDim, fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={(v)=>fmt(v)}/>
                      <Tooltip content={<CustomTooltip valueFormatter={fmt}/>}/>
                      <Bar dataKey="ca" name="Revenus" fill={tokens.success} radius={[6,6,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon="💰" title="Pas encore de revenus" description="Encaissez votre première facture pour voir la courbe"/>}
              </Card>

              <Card title="💎 Par plan">
                {kpis.total_of > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={data.byPlan} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                          {data.byPlan.map((e:any, i:number) => <Cell key={i} fill={PLAN_COLORS[e.name] || tokens.textDim}/>)}
                        </Pie>
                        <Tooltip content={<CustomTooltip/>}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                      {data.byPlan.filter((p:any)=>p.value>0).map((p:any)=> (
                        <div key={p.name} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                          <span style={{ display:'flex', alignItems:'center', gap:6, color:tokens.text, textTransform:'capitalize' }}>
                            <span style={{ width:10, height:10, borderRadius:2, background:PLAN_COLORS[p.name] || tokens.textDim }}/>
                            {p.name}
                          </span>
                          <span style={{ color:tokens.textDim, fontWeight:600 }}>{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <div style={{ padding:20, textAlign:'center', color:tokens.textDim, fontSize:13 }}>Aucun OF</div>}
              </Card>
            </div>

            {/* Emails */}
            <Card title="📧 Emails envoyés (30 derniers jours)" subtitle="Succès vs échecs par jour">
              {data?.emailsPerDay?.some((e:any)=>e.count>0 || e.failed>0) ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.emailsPerDay} margin={{ top:10, right:10, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={tokens.border} vertical={false}/>
                    <XAxis dataKey="day" tick={{ fill:tokens.textDim, fontSize:11 }} axisLine={{ stroke:tokens.border }} tickLine={false} interval={4}/>
                    <YAxis tick={{ fill:tokens.textDim, fontSize:11 }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend wrapperStyle={{ fontSize:12 }}/>
                    <Line type="monotone" dataKey="count" name="Envoyés" stroke={tokens.success} strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="failed" name="Échecs" stroke={tokens.danger} strokeWidth={2} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyState icon="📧" title="Aucun email récent" description="Les envois apparaîtront ici"/>}
            </Card>
          </>
        )}
      </AdminShell>
    </>
  )
}

