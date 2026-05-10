import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser, publicUser } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  return res.status(200).json({ user: publicUser(user) });
}
