export default function Dashboard({ organisme, user, onNavigate }: any) {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontFamily: 'Sora, Georgia', fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
        Tableau de bord
      </div>
      <div style={{ fontSize: 13, color: '#94a3b8' }}>
        Bienvenue, {user?.prenom} · {organisme?.nom}
      </div>
    </div>
  )
}
