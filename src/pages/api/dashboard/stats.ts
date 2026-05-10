import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticación
    const user = await getCurrentUser(req as any);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Contar préstamos activos
    const loansActive = await prisma.loan.count({
      where: { dateEnd: null },
    });

    // Contar préstamos vencidos
    const loansOverdue = await prisma.loan.count({
      where: {
        dateEnd: { lt: new Date() },
      },
    });

    // Contar entregas de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const deliveriesToday = await prisma.delivery.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Contar personas registradas
    const peopleRegistered = await prisma.person.count({
      where: { estado: true },
    });

    // Solo admin: contar inventario
    let inventoryItems = 0;
    let inventoryLow = 0;

    if (user.role === 'admin') {
      inventoryItems = await prisma.inventory.count();
      inventoryLow = await prisma.inventory.count({
        where: { stock: { lte: 5 } },
      });
    }

    return res.status(200).json({
      loansActive,
      loansOverdue,
      deliveriesToday,
      peopleRegistered,
      inventoryItems,
      inventoryLow,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
