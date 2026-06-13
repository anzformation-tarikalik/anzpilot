import Head from 'next/head'
import { useState, useEffect } from 'react'

interface Config {
  nom_plateforme: string
  slogan: string
  email_contact: string
  couleur_principale: string
  couleur_secondaire: string
  couleur_accent: string
  essai_duree_jours: string
  prix_starter_mensuel: string
  prix_pro_mensuel: string
  prix_business_mensuel: string
  prix_starter_annuel: string
  prix_pro_annuel: string
  prix_business_annuel: string
  remise_annuel_pct: string
  remise_code_promo: string
  starter_nb_utilisateurs: string
  pro_nb_utilisateurs: string
  [key: string]: string
}

const DEFAULT: Config = {
  nom_plateforme: 'ANZPilot',
  slogan: 'Pilotez votre organisme de formation',
  email_contact: 'contact@anzpilot.com',
  couleur_principale: '#0ea5e9',
  couleur_secondaire: '#2563eb',
  couleur_accent: '#8b5cf6',
  essai_duree_jours: '14',
  prix_starter_mensuel: '49',
  prix_pro_mensuel: '129',
  prix_business_mensuel: '299',
  prix_starter_annuel: '390',
  prix_pro_annuel: '1068',
  prix_business_annuel: '2508',
  remise_annuel_pct: '35',
  remise_code_promo: '',
  starter_nb_utilisateurs: '3',
  pro_nb_utilisateurs: '10',
}

export default function Landing() {
  const [billing, setBilling] = useState<'monthly'|'annual'>('annual')
  const [openFaq, setOpenFaq] = useState<number|null>(null)
  const [cfg, setCfg] = useState<Config>(DEFAULT)

  // Charger la config depuis Supabase — sans cache, refresh auto
  useEffect(() => {
    const load = () => {
      fetch('/api/admin/config?t=' + Date.now(), { cache: 'no-store' })
        .then(r => r.json())
        .then(data => { if (data.config) setCfg({ ...DEFAULT, ...data.config }) })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const c1 = cfg.couleur_principale
  const c2 = cfg.couleur_secondaire
  const remise = parseInt(cfg.remise_annuel_pct || '35')

  const plans = [
    {
      id:'starter', name:'Starter',
      monthly: parseInt(cfg.prix_starter_mensuel || '49'),
      annual: Math.round(parseInt(cfg.prix_starter_annuel || '390') / 12),
      annualTotal: parseInt(cfg.prix_starter_annuel || '390'),
      color:'#3b82f6', popular:false,
      features:[`${cfg.starter_nb_utilisateurs || '3'} utilisateurs`,'Sessions illimitées','∞ Apprenants','Émargement numérique','BPF automatique','EDOF/CPF inclus','Support email 24h']
    },
    {
      id:'pro', name:'Pro',
      monthly: parseInt(cfg.prix_pro_mensuel || '129'),
      annual: Math.round(parseInt(cfg.prix_pro_annuel || '1068') / 12),
      annualTotal: parseInt(cfg.prix_pro_annuel || '1068'),
      color:'#8b5cf6', popular:true,
      features:[`${cfg.pro_nb_utilisateurs || '10'} utilisateurs`,'LMS complet + Visio','CRM intégré','Qualiopi 7 critères','Questionnaires IA','App mobile','Support prioritaire 4h']
    },
    {
      id:'business', name:'Business',
      monthly: parseInt(cfg.prix_business_mensuel || '299'),
      annual: Math.round(parseInt(cfg.prix_business_annuel || '2508') / 12),
      annualTotal: parseInt(cfg.prix_business_annuel || '2508'),
      color:'#f59e0b', popular:false,
      features:['Utilisateurs illimités','Multi-centres','IA complète','Marketplace formateurs','API publique','CSM dédié','Support 1h']
    },
  ]

  const features = [
    { icon:'📅', title:'Sessions illimitées', desc:'Gérez vos formations présentielles, virtuelles, e-learning et blended. Participants illimités sur tous les plans.', color:'#3b82f6' },
    { icon:'✍️', title:'Émargement numérique', desc:'Signature électronique sur tablette ou smartphone. QR Code, géolocalisation, export PDF horodaté. Conforme Qualiopi.', color:'#10b981' },
    { icon:'🛡️', title:'Qualiopi clé en main', desc:'Suivi automatique des 7 critères et 32 indicateurs. Collecte de preuves, simulation d\'audit IA, BPF auto-rempli.', color:'#f59e0b' },
    { icon:'📄', title:'Documents automatiques', desc:'Conventions, attestations, convocations générées en 1 clic. Signature électronique eIDAS intégrée.', color:'#8b5cf6' },
    { icon:'💳', title:'Facturation OPCO', desc:'Facturez vos OPCO sans erreur. Connexion EDOF/CPF bidirectionnelle. Export comptable FEC inclus.', color:'#ef4444' },
    { icon:'⭐', title:'Satisfaction & IA', desc:'Questionnaires à chaud et à froid envoyés automatiquement. Analyse sémantique IA des réponses apprenants.', color:'#06b6d4' },
    { icon:'👥', title:'Espace apprenant', desc:'Portail personnel pour chaque apprenant. Accès aux cours, documents, émargements et évaluations par lien magique.', color:'#10b981' },
    { icon:'⚡', title:'Assistant IA', desc:'Générez des programmes de formation, simulez un audit Qualiopi, analysez vos résultats. L\'IA travaille pour vous.', color:'#8b5cf6' },
  ]

  const problems = [
    { icon:'😫', text:'Vous passez des heures sur Excel pour gérer vos sessions et apprenants' },
    { icon:'📋', text:'Le BPF de mai vous donne des sueurs froides chaque année' },
    { icon:'🔴', text:'Vous jongler entre 5 outils différents qui ne se parlent pas' },
    { icon:'⚠️', text:'Qualiopi vous stresse avec ses 32 indicateurs à prouver' },
    { icon:'📞', text:'Vos apprenants vous appellent pour leurs documents et attestations' },
    { icon:'💸', text:'Vos factures OPCO sont rejetées à cause d\'erreurs administratives' },
  ]

  const testimonials = [
    { name:'Sophie M.', role:'Directrice — Centre Formation Pro Lyon', note:5, text:'ANZPilot a divisé par 3 notre temps administratif. Le BPF se remplit tout seul maintenant. Je recommande à tous les OF !' },
    { name:'Thomas R.', role:'Formateur indépendant — Paris', note:5, text:'Enfin une plateforme qui fait vraiment tout ! L\'émargement sur smartphone, les conventions automatiques... c\'est magique.' },
    { name:'Marie L.', role:'OF spécialisé RH — Bordeaux', note:5, text:'La préparation Qualiopi avec ANZPilot nous a sauvé lors de notre audit. Tout était en ordre automatiquement.' },
  ]

  const faqs = [
    { q:'Est-ce que ANZPilot est conforme Qualiopi ?', a:'Oui, ANZPilot a été conçu spécifiquement pour les 7 critères et 32 indicateurs Qualiopi. La plateforme collecte automatiquement les preuves et génère les documents nécessaires pour votre audit.' },
    { q:'Combien d\'apprenants puis-je avoir ?', a:'Apprenants ILLIMITÉS sur tous les plans, sans exception. C\'est notre engagement fort — vous ne serez jamais bridés dans votre croissance.' },
    { q:'Y a-t-il un engagement de durée ?', a:`Non, aucun engagement. Vous pouvez annuler à tout moment. Nous proposons également un essai gratuit de ${cfg.essai_duree_jours} jours sans carte bancaire.` },
    { q:'Puis-je migrer depuis Digiforma ou Dendreo ?', a:'Oui ! Nous proposons une migration gratuite assistée depuis Digiforma, Dendreo ou tout autre logiciel. Notre équipe vous accompagne.' },
    { q:'La connexion EDOF/CPF est-elle incluse ?', a:'Oui, la connexion EDOF bidirectionnelle est incluse dès le plan Starter. Import automatique des dossiers CPF, suivi conformité 2025.' },
    { q:'Comment fonctionne le support ?', a:'Réponse humaine garantie — jamais de bot. Support email en 24h (Starter), 4h (Pro), 1h (Business). Nous sommes là pour vous.' },
  ]

  return (
    <>
      <Head>
        <title>{cfg.nom_plateforme} — La plateforme tout-en-un pour organismes de formation</title>
        <meta name="description" content={`${cfg.slogan}. Participants illimités. Essai gratuit ${cfg.essai_duree_jours} jours.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui; background: #050c1a; color: #e2e8f0; -webkit-font-smoothing: antialiased; }
        .display { font-family: 'Sora', Georgia; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 2px; }
        .btn-primary { display:inline-flex;align-items:center;gap:8px;padding:13px 24px;border-radius:10px;border:none;cursor:pointer;font-size:14px;font-weight:600;font-family:'DM Sans',system-ui;background:linear-gradient(135deg,${c1},${c2});color:#fff;transition:all .2s;box-shadow:0 4px 20px ${c1}40;text-decoration:none; }
        .btn-primary:hover { transform:translateY(-1px);box-shadow:0 6px 25px ${c1}55; }
        .btn-secondary { display:inline-flex;align-items:center;gap:8px;padding:13px 24px;border-radius:10px;border:1px solid rgba(255,255,255,.15);cursor:pointer;font-size:14px;font-weight:600;font-family:'DM Sans',system-ui;background:rgba(255,255,255,.05);color:#fff;transition:all .2s;text-decoration:none; }
        .btn-secondary:hover { background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25); }
        .card { background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px; }
        .gradient-text { background:linear-gradient(135deg,${c1},${cfg.couleur_accent});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
        .stars { color:#f59e0b;font-size:14px; }
      `}</style>

      {/* NAV */}
      <nav style={{ position:'sticky',top:0,zIndex:100,background:'rgba(5,12,26,.9)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.06)',padding:'0 24px' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:64 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${c1},${c2})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>✈️</div>
            <span className="display" style={{ fontSize:18,fontWeight:700,color:'#fff' }}>{cfg.nom_plateforme}</span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <a href="/login" style={{ fontSize:13,color:'#94a3b8',textDecoration:'none',padding:'8px 16px',borderRadius:8 }}>Connexion</a>
            <a href="/inscription" className="btn-primary" style={{ padding:'9px 18px',fontSize:13 }}>
              Essai gratuit {cfg.essai_duree_jours} jours →
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position:'relative',overflow:'hidden',padding:'100px 24px 80px',textAlign:'center' }}>
        <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
          <div style={{ position:'absolute',top:'10%',left:'20%',width:500,height:500,background:`${c1}10`,borderRadius:'50%',filter:'blur(100px)' }} />
          <div style={{ position:'absolute',top:'20%',right:'15%',width:400,height:400,background:`${cfg.couleur_accent}08`,borderRadius:'50%',filter:'blur(80px)' }} />
        </div>
        <div style={{ maxWidth:800,margin:'0 auto',position:'relative',zIndex:1 }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:8,background:`${c1}18`,border:`1px solid ${c1}35`,borderRadius:20,padding:'6px 14px',marginBottom:24,fontSize:12,color:c1,fontWeight:600 }}>
            ✨ Participants illimités sur tous les plans
          </div>
          <h1 className="display" style={{ fontSize:'clamp(36px,5vw,64px)',fontWeight:800,lineHeight:1.1,color:'#fff',marginBottom:20 }}>
            {cfg.slogan.split(' ').slice(0,3).join(' ')}<br/>
            <span className="gradient-text">{cfg.slogan.split(' ').slice(3).join(' ')}</span>
          </h1>
          <p style={{ fontSize:'clamp(16px,2vw,20px)',color:'#94a3b8',lineHeight:1.7,marginBottom:36,maxWidth:600,margin:'0 auto 36px' }}>
            La plateforme tout-en-un pour gérer vos sessions, apprenants, Qualiopi, BPF et émargements. Fini les 5 outils qui ne se parlent pas.
          </p>
          <div style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:48 }}>
            <a href="/inscription" className="btn-primary" style={{ fontSize:15,padding:'14px 28px' }}>
              🚀 Démarrer gratuitement — {cfg.essai_duree_jours} jours
            </a>
            <a href="#fonctionnalites" className="btn-secondary" style={{ fontSize:15,padding:'14px 28px' }}>
              Voir les fonctionnalités
            </a>
          </div>
          <div style={{ display:'flex',justifyContent:'center',gap:32,flexWrap:'wrap',fontSize:13,color:'#94a3b8' }}>
            {['✓ Sans carte bancaire','✓ Sans engagement','✓ Migration gratuite','✓ Support humain'].map(t=>(
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding:'40px 24px',borderTop:'1px solid rgba(255,255,255,.05)',borderBottom:'1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth:1000,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:32,textAlign:'center' }}>
          {[
            { val:'∞', label:'Apprenants par OF', color:'#10b981' },
            { val:'100k+', label:'Organismes en France', color:c1 },
            { val:`${cfg.essai_duree_jours}j`, label:'Essai gratuit', color:cfg.couleur_accent },
            { val:'99.9%', label:'Disponibilité SLA', color:'#f59e0b' },
            { val:'<4h', label:'Support humain', color:'#ef4444' },
          ].map(s=>(
            <div key={s.label}>
              <div className="display" style={{ fontSize:32,fontWeight:800,color:s.color }}>{s.val}</div>
              <div style={{ fontSize:13,color:'#64748b',marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLÈME */}
      <section style={{ padding:'80px 24px',background:'rgba(239,68,68,.02)' }}>
        <div style={{ maxWidth:1000,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:48 }}>
            <h2 className="display" style={{ fontSize:'clamp(28px,4vw,42px)',fontWeight:700,color:'#fff',marginBottom:16 }}>Vous reconnaissez-vous ? 😔</h2>
            <p style={{ fontSize:16,color:'#64748b',maxWidth:500,margin:'0 auto' }}>Les problèmes quotidiens de 90% des organismes de formation</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16 }}>
            {problems.map((p,i)=>(
              <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:14,padding:'18px 20px',background:'rgba(239,68,68,.05)',border:'1px solid rgba(239,68,68,.1)',borderRadius:12 }}>
                <span style={{ fontSize:24,flexShrink:0 }}>{p.icon}</span>
                <span style={{ fontSize:14,color:'#94a3b8',lineHeight:1.5 }}>{p.text}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center',marginTop:40 }}>
            <p className="display" style={{ fontSize:22,fontWeight:700,color:'#fff' }}>
              {cfg.nom_plateforme} résout tout ça. <span className="gradient-text">En un seul outil.</span>
            </p>
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section id="fonctionnalites" style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1200,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:56 }}>
            <h2 className="display" style={{ fontSize:'clamp(28px,4vw,42px)',fontWeight:700,color:'#fff',marginBottom:16 }}>Tout ce dont votre OF a besoin</h2>
            <p style={{ fontSize:16,color:'#64748b',maxWidth:500,margin:'0 auto' }}>Une plateforme complète pensée pour les organismes de formation français</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20 }}>
            {features.map((f,i)=>(
              <div key={i} className="card" style={{ transition:'all .2s',cursor:'default' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=f.color+'44';(e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='rgba(255,255,255,.08)';(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}}>
                <div style={{ width:44,height:44,borderRadius:12,background:f.color+'18',border:`1px solid ${f.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:14 }}>{f.icon}</div>
                <h3 style={{ fontSize:15,fontWeight:600,color:'#fff',marginBottom:8 }}>{f.title}</h3>
                <p style={{ fontSize:13,color:'#64748b',lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" style={{ padding:'80px 24px',background:`${c1}05` }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:48 }}>
            <h2 className="display" style={{ fontSize:'clamp(28px,4vw,42px)',fontWeight:700,color:'#fff',marginBottom:16 }}>Tarifs simples et transparents</h2>
            <p style={{ fontSize:16,color:'#64748b',marginBottom:28 }}>Aucun frais caché · Aucun engagement · Annulez quand vous voulez</p>
            <div style={{ display:'inline-flex',alignItems:'center',gap:12,padding:'6px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:30 }}>
              <button onClick={()=>setBilling('monthly')} style={{ padding:'8px 20px',borderRadius:24,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'DM Sans,system-ui',background: billing==='monthly'?`linear-gradient(135deg,${c1},${c2})`:'transparent',color:billing==='monthly'?'#fff':'#64748b',transition:'all .2s' }}>
                Mensuel
              </button>
              <button onClick={()=>setBilling('annual')} style={{ padding:'8px 20px',borderRadius:24,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'DM Sans,system-ui',background: billing==='annual'?`linear-gradient(135deg,${c1},${c2})`:'transparent',color:billing==='annual'?'#fff':'#64748b',transition:'all .2s',display:'flex',alignItems:'center',gap:8 }}>
                Annuel <span style={{ fontSize:10,background:'rgba(16,185,129,.15)',color:'#10b981',border:'1px solid rgba(16,185,129,.25)',padding:'2px 7px',borderRadius:10 }}>-{remise}%</span>
              </button>
            </div>
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:20,marginBottom:32 }}>
            {/* Gratuit */}
            <div className="card">
              <div className="display" style={{ fontSize:16,fontWeight:600,color:'#fff',marginBottom:6 }}>Essai gratuit</div>
              <div style={{ display:'flex',alignItems:'baseline',gap:4,marginBottom:4 }}>
                <span className="display" style={{ fontSize:36,fontWeight:800,color:'#fff' }}>0€</span>
              </div>
              <div style={{ fontSize:12,color:'#64748b',marginBottom:20 }}>{cfg.essai_duree_jours} jours · Aucune CB requise</div>
              <ul style={{ listStyle:'none',marginBottom:24 }}>
                {['1 utilisateur','5 sessions','10 apprenants','Fonctions de base'].map(f=>(
                  <li key={f} style={{ display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#94a3b8',marginBottom:8 }}>
                    <span style={{ color:'#10b981' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href="/inscription" className="btn-secondary" style={{ display:'block',textAlign:'center',width:'100%',justifyContent:'center' }}>
                Commencer gratuitement
              </a>
            </div>

            {plans.map(plan=>(
              <div key={plan.id} style={{ position:'relative',borderRadius:16,padding:24,border:`${plan.popular?2:1}px solid ${plan.popular?plan.color:'rgba(255,255,255,.08)'}`,background: plan.popular?`${plan.color}08`:'rgba(255,255,255,.04)',transition:'all .2s' }}>
                {plan.popular && (
                  <div style={{ position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',background:plan.color,color:'#fff',fontSize:11,fontWeight:700,padding:'4px 14px',borderRadius:20,whiteSpace:'nowrap' }}>
                    ⚡ PLUS POPULAIRE
                  </div>
                )}
                <div className="display" style={{ fontSize:16,fontWeight:600,color:'#fff',marginBottom:6 }}>{plan.name}</div>
                <div style={{ display:'flex',alignItems:'baseline',gap:4,marginBottom:4 }}>
                  <span className="display" style={{ fontSize:36,fontWeight:800,color:'#fff' }}>
                    {billing==='annual'?plan.annual:plan.monthly}€
                  </span>
                  <span style={{ fontSize:13,color:'#64748b' }}>/mois</span>
                </div>
                {billing==='annual' && (
                  <div style={{ fontSize:12,color:'#10b981',marginBottom:20 }}>
                    Facturé {plan.annualTotal}€/an · Économie {(plan.monthly*12)-plan.annualTotal}€/an
                  </div>
                )}
                {billing==='monthly' && <div style={{ fontSize:12,color:'#64748b',marginBottom:20 }}>Facturé mensuellement</div>}
                <ul style={{ listStyle:'none',marginBottom:24 }}>
                  {plan.features.map(f=>(
                    <li key={f} style={{ display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#94a3b8',marginBottom:8 }}>
                      <span style={{ color:'#10b981' }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <a href="/inscription" style={{ display:'block',textAlign:'center',textDecoration:'none',padding:'12px',borderRadius:10,border:'none',cursor:'pointer',fontSize:14,fontWeight:600,fontFamily:'DM Sans,system-ui',background: plan.popular?`linear-gradient(135deg,${plan.color},${c2})`:plan.color,color:'#fff',transition:'all .2s',boxShadow: plan.popular?`0 4px 20px ${plan.color}40`:'' }}>
                  Démarrer avec {plan.name}
                </a>
              </div>
            ))}
          </div>

          <div style={{ textAlign:'center',padding:'16px',background:'rgba(16,185,129,.05)',border:'1px solid rgba(16,185,129,.15)',borderRadius:12 }}>
            <span style={{ fontSize:14,color:'#10b981',fontWeight:500 }}>
              🛡️ Garantie satisfait ou remboursé 30 jours · Aucun engagement · Annulation en 1 clic
            </span>
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1000,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:48 }}>
            <h2 className="display" style={{ fontSize:'clamp(28px,4vw,42px)',fontWeight:700,color:'#fff',marginBottom:16 }}>
              Ils pilotent déjà avec {cfg.nom_plateforme}
            </h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20 }}>
            {testimonials.map((t,i)=>(
              <div key={i} className="card">
                <div className="stars" style={{ marginBottom:12 }}>{'★'.repeat(t.note)}</div>
                <p style={{ fontSize:14,color:'#94a3b8',lineHeight:1.7,marginBottom:16,fontStyle:'italic' }}>"{t.text}"</p>
                <div>
                  <div style={{ fontSize:14,fontWeight:600,color:'#fff' }}>{t.name}</div>
                  <div style={{ fontSize:12,color:'#64748b',marginTop:2 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding:'80px 24px',background:'rgba(255,255,255,.01)' }}>
        <div style={{ maxWidth:700,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:48 }}>
            <h2 className="display" style={{ fontSize:'clamp(28px,4vw,42px)',fontWeight:700,color:'#fff',marginBottom:16 }}>Questions fréquentes</h2>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {faqs.map((faq,i)=>(
              <div key={i} style={{ background:'rgba(255,255,255,.04)',border:`1px solid ${openFaq===i?c1+'50':'rgba(255,255,255,.08)'}`,borderRadius:12,overflow:'hidden',transition:'border-color .2s' }}>
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,system-ui',textAlign:'left' }}>
                  <span style={{ fontSize:14,fontWeight:600,color:'#fff' }}>{faq.q}</span>
                  <span style={{ fontSize:20,color:'#64748b',flexShrink:0,marginLeft:16,transition:'transform .2s',transform: openFaq===i?'rotate(45deg)':'rotate(0)' }}>+</span>
                </button>
                {openFaq===i && <div style={{ padding:'0 20px 18px',fontSize:14,color:'#94a3b8',lineHeight:1.7 }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding:'80px 24px',textAlign:'center',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
          <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:400,background:`${c1}08`,borderRadius:'50%',filter:'blur(80px)' }} />
        </div>
        <div style={{ maxWidth:600,margin:'0 auto',position:'relative',zIndex:1 }}>
          <div style={{ fontSize:40,marginBottom:16 }}>✈️</div>
          <h2 className="display" style={{ fontSize:'clamp(28px,4vw,42px)',fontWeight:800,color:'#fff',marginBottom:16 }}>Prêt à décoller ?</h2>
          <p style={{ fontSize:16,color:'#94a3b8',marginBottom:32,lineHeight:1.7 }}>
            Rejoignez les organismes de formation qui ont choisi {cfg.nom_plateforme}. {cfg.essai_duree_jours} jours gratuits, sans carte bancaire.
          </p>
          <div style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:24 }}>
            <a href="/inscription" className="btn-primary" style={{ fontSize:15,padding:'14px 32px' }}>🚀 Démarrer gratuitement</a>
            <a href={`mailto:${cfg.email_contact}`} className="btn-secondary" style={{ fontSize:15,padding:'14px 32px' }}>📧 Nous contacter</a>
          </div>
          <p style={{ fontSize:12,color:'#475569' }}>✓ Sans engagement · ✓ Sans CB · ✓ Support humain inclus</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:'40px 24px',borderTop:'1px solid rgba(255,255,255,.06)',background:'rgba(0,0,0,.2)' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <span style={{ fontSize:20 }}>✈️</span>
            <span className="display" style={{ fontSize:16,fontWeight:700,color:'#fff' }}>{cfg.nom_plateforme}</span>
            <span style={{ fontSize:12,color:'#475569',marginLeft:8 }}>{cfg.slogan}</span>
          </div>
          <div style={{ display:'flex',gap:24,flexWrap:'wrap' }}>
            {[['#fonctionnalites','Fonctionnalités'],['#tarifs','Tarifs'],['#faq','FAQ'],['/login','Connexion'],['/inscription','Inscription']].map(([href,label])=>(
              <a key={label} href={href} style={{ fontSize:13,color:'#475569',textDecoration:'none' }}
                onMouseEnter={e=>(e.currentTarget.style.color='#94a3b8')} onMouseLeave={e=>(e.currentTarget.style.color='#475569')}>
                {label}
              </a>
            ))}
          </div>
          <div style={{ fontSize:12,color:'#334155' }}>© 2026 {cfg.nom_plateforme} · Données hébergées en Europe 🇪🇺</div>
        </div>
      </footer>
    </>
  )
}
