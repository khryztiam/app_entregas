import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de préstamo requerido' });
  }

  if (req.method === 'GET') {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id },
        include: {
          person: true,
          inventory: true,
          receivedBy: true,
        },
      });

      if (!loan) {
        return res.status(404).json({ error: 'Préstamo no encontrado' });
      }

      return res.status(200).json({ loan });
    } catch (error) {
      console.error('Error fetching loan:', error);
      return res.status(500).json({ error: 'Error al obtener préstamo' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { status, receivedById } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Estado es requerido' });
      }

      // Verificar que el préstamo existe
      const loan = await prisma.loan.findUnique({
        where: { id },
      });

      if (!loan) {
        return res.status(404).json({ error: 'Préstamo no encontrado' });
      }

      // Actualizar préstamo
      const updated = await prisma.loan.update({
        where: { id },
        data: {
          status: String(status).toUpperCase(),
          receivedAt: status === 'completed' ? new Date() : undefined,
          receivedById: receivedById ? String(receivedById) : undefined,
        },
        include: {
          person: true,
          inventory: true,
          receivedBy: true,
        },
      });

      // Si se completó, aumentar el stock del inventario
      if (status === 'completed' && loan.inventoryId) {
        await prisma.inventory.update({
          where: { id: loan.inventoryId },
          data: { stock: { increment: 1 } },
        });
      }

      return res.status(200).json({ loan: updated });
    } catch (error) {
      console.error('Error updating loan:', error);
      return res.status(500).json({ error: 'Error al actualizar préstamo' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ error: 'Método no permitido' });
}
