import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const [activas, desactivadas, total] = await Promise.all([
      prisma.person.count({ where: { estado: true } }),
      prisma.person.count({ where: { estado: false } }),
      prisma.person.count(),
    ]);

    return res.status(200).json({
      activas,
      desactivadas,
      total,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}
