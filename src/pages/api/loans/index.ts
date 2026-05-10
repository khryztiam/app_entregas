import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const { search, pageSize = '10', status } = req.query;
      const limit = Math.min(parseInt(String(pageSize)), 100);

      const where: any = {};

      if (status) {
        where.status = String(status).toUpperCase();
      }

      if (search) {
        const query = String(search).trim().toLowerCase();
        where.OR = [
          { person: { nombre: { contains: query, mode: 'insensitive' } } },
          { person: { documento: { contains: query, mode: 'insensitive' } } },
          { inventory: { description: { contains: query, mode: 'insensitive' } } },
          { inventory: { serieCode: { contains: query, mode: 'insensitive' } } },
        ];
      }

      const loans = await prisma.loan.findMany({
        where,
        include: {
          person: true,
          inventory: true,
          receivedBy: true,
        },
        take: limit,
        orderBy: { dateStart: 'desc' },
      });

      return res.status(200).json({ data: loans });
    } catch (error) {
      console.error('Error fetching loans:', error);
      return res.status(500).json({ error: 'Error al obtener préstamos' });
    }
  }

  if (req.method === 'POST') {
    // Solo admin puede crear préstamos
    const adminUser = await requireAdmin(req, res);
    if (!adminUser) return;

    try {
      const { personId, inventoryId, daysAssigned } = req.body;

      if (!personId || !inventoryId || !daysAssigned) {
        return res.status(400).json({ error: 'Persona, inventario y días son requeridos' });
      }

      // Validar persona
      const person = await prisma.person.findUnique({
        where: { id: String(personId) },
      });

      if (!person || !person.estado) {
        return res.status(404).json({ error: 'Persona no encontrada o inactiva' });
      }

      // Validar inventario y stock
      const inventory = await prisma.inventory.findUnique({
        where: { id: String(inventoryId) },
      });

      if (!inventory) {
        return res.status(404).json({ error: 'Item de inventario no encontrado' });
      }

      if (inventory.stock < 1) {
        return res.status(400).json({ error: `Item no disponible (stock: ${inventory.stock})` });
      }

      // Calcular fechas
      const dateStart = new Date();
      const dateEnd = new Date();
      dateEnd.setDate(dateEnd.getDate() + parseInt(String(daysAssigned)));

      // Crear préstamo y actualizar stock en transacción
      const loan = await prisma.loan.create({
        data: {
          personId: String(personId),
          inventoryId: String(inventoryId),
          dateStart,
          dateEnd,
          daysAssigned: parseInt(String(daysAssigned)),
        },
        include: {
          person: true,
          inventory: true,
        },
      });

      // Reducir stock
      await prisma.inventory.update({
        where: { id: String(inventoryId) },
        data: { stock: inventory.stock - 1 },
      });

      return res.status(201).json({ loan });
    } catch (error) {
      console.error('Error creating loan:', error);
      return res.status(500).json({ error: 'Error al crear préstamo' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Método no permitido' });
}
