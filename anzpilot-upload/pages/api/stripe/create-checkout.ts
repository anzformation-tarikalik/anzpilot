import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  return res.status(200).json({ error: 'Stripe non configuré — ajoutez STRIPE_SECRET_KEY dans Vercel' })
}
