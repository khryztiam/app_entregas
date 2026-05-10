import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ROLES, mapRoleToGeneric } from '@/config/roles';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const genericRole = mapRoleToGeneric(user.role);

  if (req.method === 'GET') {
    return handleGet(req, res, genericRole);
  }

  if (req.method === 'POST') {
    return handlePost(req, res, genericRole);
  }

  if (req.method === 'PUT') {
    return handlePut(req, res, genericRole);
  }

  if (req.method === 'DELETE') {
    return handleDelete(req, res, genericRole);
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: 'Método no permitido' });
}

// GET: Obtener inventario con paginación y filtrado
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  role: string
) {
  try {
    const { search, page = '1', pageSize = '50', type } = req.query;
    const pageNum = Math.max(1, parseInt(String(page)));
    const limit = Math.min(parseInt(String(pageSize)), 100);
    const skip = (pageNum - 1) * limit;

    const where: any = {};

    if (search) {
      const query = String(search).trim().toLowerCase();
      where.OR = [
        { description: { contains: query, mode: 'insensitive' } },
        { eanCode: { contains: query, mode: 'insensitive' } },
        { serieCode: { contains: query, mode: 'insensitive' } },
        { type: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = String(type);
    }

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        take: limit,
        skip,
        orderBy: { description: 'asc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    return res.status(200).json({
      data: items,
      pagination: {
        page: pageNum,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ error: 'Error al obtener inventario' });
  }
}

// POST: Crear nuevo item (solo admin)
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  role: string
) {
  if (role !== ROLES.ADMINISTRACION) {
    return res.status(403).json({
      error: 'Solo administradores pueden crear items',
    });
  }

  try {
    const { eanCode, serieCode, description, type, stock } = req.body;

    if (!description || !type) {
      return res.status(400).json({
        error: 'Descripción y tipo son requeridos',
      });
    }

    // Verificar códigos únicos
    if (eanCode) {
      const existing = await prisma.inventory.findUnique({
        where: { eanCode },
      });
      if (existing) {
        return res.status(400).json({
          error: 'El código EAN ya existe',
        });
      }
    }

    if (serieCode) {
      const existing = await prisma.inventory.findUnique({
        where: { serieCode },
      });
      if (existing) {
        return res.status(400).json({
          error: 'El código de serie ya existe',
        });
      }
    }

    const item = await prisma.inventory.create({
      data: {
        eanCode: eanCode || null,
        serieCode: serieCode || null,
        description,
        type,
        stock: stock || 0,
      },
    });

    return res.status(201).json({ data: item });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return res.status(500).json({ error: 'Error al crear item' });
  }
}

// PUT: Actualizar item
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  role: string
) {
  try {
    const { id, eanCode, serieCode, description, type, stock } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID requerido' });
    }

    const item = await prisma.inventory.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    // Validar códigos únicos
    if (eanCode && eanCode !== item.eanCode) {
      const existing = await prisma.inventory.findUnique({
        where: { eanCode },
      });
      if (existing) {
        return res.status(400).json({ error: 'El código EAN ya existe' });
      }
    }

    if (serieCode && serieCode !== item.serieCode) {
      const existing = await prisma.inventory.findUnique({
        where: { serieCode },
      });
      if (existing) {
        return res.status(400).json({ error: 'El código de serie ya existe' });
      }
    }

    const updateData: any = {};
    if (eanCode !== undefined) updateData.eanCode = eanCode || null;
    if (serieCode !== undefined) updateData.serieCode = serieCode || null;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (stock !== undefined) updateData.stock = stock;

    const updated = await prisma.inventory.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({ data: updated });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return res.status(500).json({ error: 'Error al actualizar item' });
  }
}

// DELETE: Eliminar item (solo admin)
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  role: string
) {
  if (role !== ROLES.ADMINISTRACION) {
    return res.status(403).json({
      error: 'Solo administradores pueden eliminar items',
    });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID requerido' });
    }

    const item = await prisma.inventory.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    await prisma.inventory.delete({ where: { id } });

    return res.status(200).json({ message: 'Item eliminado' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return res.status(500).json({ error: 'Error al eliminar item' });
  }
}
