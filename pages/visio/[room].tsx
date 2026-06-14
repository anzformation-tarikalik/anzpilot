import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

declare global {
  interface Window { JitsiMeetExternalAPI: any }
}

export default function VisioRoom() {
  const router = useRouter()
  const { room } = router.query
  const [api, setApi] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [name, setName] = useState('')
  const [showJoinForm, setShowJoinForm] = useState(true)

  useEffect(() => {
    if (!room) return
    // Récupérer le nom du localStorage si déjà saisi
    const saved = typeof window !== 'undefined' ? localStorage.getItem('anzpilot_visio_name') : ''
    if (saved) { setName(saved); setShowJoinForm(false) }
  }, [room])

  useEffect(() => {
    if (showJoinForm || !room || !name) return
    if (typeof window === 'undefined') return

    // Charger le script Jitsi si pas déjà chargé
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script')
      script.src = 'https://meet.jit.si/external_api.js'
      script.onload = () => initJitsi()
      document.body.appendChild(script)
    } else {
      initJitsi()
    }

    function initJitsi() {
      const roomName = `anzpilot-${String(room).replace(/[^a-zA-Z0-9-]/g,'')}`
      const domain = 'meet.jit.si'
      const options = {
        roomName,
        parentNode: document.getElementById('jitsi-container'),
        width: '100%',
        height: '100%',
        userInfo: { displayName: name },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableInviteFunctions: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DEFAULT_BACKGROUND: '#0a1628',
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
          TOOLBAR_BUTTONS: ['microphone','camera','desktop','chat','raisehand','tileview','fullscreen','hangup','settings','filmstrip'],
          DISABLE_VIDEO_BACKGROUND: false,
        },
      }
      const jitsi = new window.JitsiMeetExternalAPI(domain, options)
      setApi(jitsi)

      jitsi.addEventListener('readyToClose', () => {
        router.push('/visio')
      })
    }

    return () => { if (api) api.dispose() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showJoinForm, room, name])

  function joinRoom() {
    if (!name.trim()) { alert('Veuillez entrer votre nom'); return }
    localStorage.setItem('anzpilot_visio_name', name.trim())
    setShowJoinForm(false)
  }

  function copyLink() {
    const url = `https://anzpilot.com/visio/${room}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  return (
    <>
      <Head><title>ANZPilot Visio — {room}</title></Head>

      {showJoinForm ? (
        <div style={{ minHeight:'100vh', background:'#050c1a', color:'#e2e8f0', fontFamily:'DM Sans,system-ui', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ maxWidth:440, width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:32, textAlign:'center' }}>
            <div style={{ width:64, height:64, margin:'0 auto', borderRadius:16, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, marginBottom:18 }}>🎥</div>
            <h1 style={{ fontFamily:'Sora,Georgia', fontSize:22, fontWeight:700, color:'#fff', margin:'0 0 4px' }}>Rejoindre la réunion</h1>
            <p style={{ fontSize:13, color:'#64748b', margin:'0 0 24px' }}>Salle : <strong style={{ color:'#0ea5e9', fontFamily:'monospace' }}>{room}</strong></p>

            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em', textAlign:'left' }}>Votre nom complet</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Jean Dupont" autoFocus onKeyDown={e=>e.key==='Enter'&&joinRoom()}
              style={{ width:'100%', background:'#0a1628', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, padding:'12px 14px', fontSize:14, color:'#fff', fontFamily:'DM Sans,system-ui', outline:'none', marginBottom:18 }}/>
            <button onClick={joinRoom} style={{ width:'100%', padding:13, borderRadius:10, border:'none', background:'linear-gradient(135deg,#0ea5e9,#2563eb)', color:'#fff', fontSize:14, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>
              🚪 Entrer dans la réunion
            </button>

            <div style={{ marginTop:18, paddingTop:14, borderTop:'1px solid rgba(255,255,255,.05)', fontSize:11, color:'#64748b' }}>
              Visioconférence sécurisée · chiffrement de bout en bout
            </div>
            <Link href="/visio" style={{ display:'inline-block', marginTop:12, fontSize:12, color:'#64748b', textDecoration:'none' }}>← Annuler</Link>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#050c1a' }}>
          {/* Header */}
          <div style={{ padding:'10px 16px', background:'#0a1628', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:7, background:'linear-gradient(135deg,#0ea5e9,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🎥</div>
              <div>
                <div style={{ fontFamily:'Sora,Georgia', fontSize:13, fontWeight:700, color:'#fff' }}>ANZPilot Visio</div>
                <div style={{ fontSize:10, color:'#64748b', fontFamily:'monospace' }}>{room}</div>
              </div>
            </div>
            <button onClick={copyLink} style={{ padding:'8px 14px', borderRadius:7, border:'1px solid rgba(14,165,233,.3)', background:'rgba(14,165,233,.1)', color:'#0ea5e9', fontSize:12, fontWeight:600, fontFamily:'DM Sans,system-ui', cursor:'pointer' }}>
              {copied?'✅ Lien copié !':'📋 Copier le lien d\'invitation'}
            </button>
          </div>
          {/* Jitsi container */}
          <div id="jitsi-container" style={{ flex:1, minHeight:0 }}></div>
        </div>
      )}
    </>
  )
}
