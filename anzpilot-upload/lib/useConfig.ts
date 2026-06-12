import { useState, useEffect } from 'react'

export interface PlatformConfig {
  nom_plateforme: string
  slogan: string
  email_contact: string
  email_support: string
  url_plateforme: string
  couleur_principale: string
  couleur_secondaire: string
  couleur_accent: string
  essai_duree_jours: string
  essai_nb_sessions: string
  essai_nb_apprenants: string
  prix_starter_mensuel: string
  prix_pro_mensuel: string
  prix_business_mensuel: string
  prix_starter_annuel: string
  prix_pro_annuel: string
  prix_business_annuel: string
  remise_annuel_pct: string
  remise_code_promo: string
  remise_code_valeur: string
  starter_nb_utilisateurs: string
  pro_nb_utilisateurs: string
  business_nb_utilisateurs: string
  message_accueil: string
  message_essai_expire: string
  feature_marketplace: string
  feature_ia: string
  feature_visio: string
  feature_mobile: string
  maintenance_mode: string
  [key: string]: string
}

const DEFAULT_CONFIG: PlatformConfig = {
  nom_plateforme: 'ANZPilot',
  slogan: 'Pilotez votre organisme de formation',
  email_contact: 'contact@anzpilot.com',
  email_support: 'support@anzpilot.com',
  url_plateforme: 'https://anzpilot.com',
  couleur_principale: '#0ea5e9',
  couleur_secondaire: '#2563eb',
  couleur_accent: '#8b5cf6',
  essai_duree_jours: '14',
  essai_nb_sessions: '5',
  essai_nb_apprenants: '10',
  prix_starter_mensuel: '49',
  prix_pro_mensuel: '129',
  prix_business_mensuel: '299',
  prix_starter_annuel: '390',
  prix_pro_annuel: '1068',
  prix_business_annuel: '2508',
  remise_annuel_pct: '35',
  remise_code_promo: '',
  remise_code_valeur: '0',
  starter_nb_utilisateurs: '3',
  pro_nb_utilisateurs: '10',
  business_nb_utilisateurs: '999',
  message_accueil: 'Bienvenue sur ANZPilot !',
  message_essai_expire: 'Votre essai gratuit a expiré.',
  feature_marketplace: 'true',
  feature_ia: 'true',
  feature_visio: 'false',
  feature_mobile: 'false',
  maintenance_mode: 'false',
}

export function useConfig() {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(data => {
        if (data.config) setConfig({ ...DEFAULT_CONFIG, ...data.config })
      })
      .catch(() => {}) // fallback to defaults
      .finally(() => setLoading(false))
  }, [])

  return { config, loading }
}

export async function saveConfig(updates: Partial<PlatformConfig>) {
  const res = await fetch('/api/admin/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates })
  })
  return res.json()
}

export { DEFAULT_CONFIG }
