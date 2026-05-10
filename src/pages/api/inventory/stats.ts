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
    const items = await prisma.inventory.findMany();

    const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
    const itemsInStock = items.filter((item) => item.stock > 0).length;
    const itemsInLoan = items.filter((item) => item.stock < 0).length;
    const types = new Set(items.map((item) => item.type)).size;

    return res.status(200).json({
      totalStock,
      itemsInStock,
      itemsInLoan,
      types,
      totalItems: items.length,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}
