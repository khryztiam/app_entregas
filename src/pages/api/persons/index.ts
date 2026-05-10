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

// GET: Obtener personas con paginación y filtrado
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  role: string
) {
  try {
    const { search, page = '1', pageSize = '50', includeInactive = 'false' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page)));
    const limit = Math.min(parseInt(String(pageSize)), 100);
    const skip = (pageNum - 1) * limit;
    const showInactive = includeInactive === 'true' && role === ROLES.ADMINISTRACION;

    const where = showInactive ? {} : { estado: true };

    if (search) {
      const query = String(search).trim().toLowerCase();
      where.OR = [
        { nombre: { contains: query, mode: 'insensitive' } },
        { documento: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [persons, total] = await Promise.all([
      prisma.person.findMany({
        where,
        take: limit,
        skip,
        orderBy: { nombre: 'asc' },
      }),
      prisma.person.count({ where }),
    ]);

    return res.status(200).json({
      data: persons,
      pagination: {
        page: pageNum,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching persons:', error);
    return res.status(500).json({ error: 'Error al obtener personas' });
  }
}

// POST: Crear nueva persona
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  role: string
) {
  try {
    const { documento, nombre, email, direccion, telefono } = req.body;

    if (!documento || !nombre) {
      return res.status(400).json({
        error: 'Documento y nombre son requeridos',
      });
    }

    // Verificar documento único
    const existing = await prisma.person.findUnique({
      where: { documento },
    });

    if (existing) {
      return res.status(400).json({
        error: 'El documento ya existe',
      });
    }

    // Verificar email único si se proporciona
    if (email) {
      const existingEmail = await prisma.person.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return res.status(400).json({
          error: 'El email ya está registrado',
        });
      }
    }

    const person = await prisma.person.create({
      data: {
        documento,
        nombre,
        email: email || null,
        direccion: direccion || null,
        telefono: telefono || null,
        estado: true,
      },
    });

    return res.status(201).json({ data: person });
  } catch (error) {
    console.error('Error creating person:', error);
    return res.status(500).json({ error: 'Error al crear persona' });
  }
}

// PUT: Actualizar persona
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  role: string
) {
  try {
    const { id, nombre, email, direccion, telefono, estado } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID requerido' });
    }

    const person = await prisma.person.findUnique({ where: { id } });

    if (!person) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }

    // Validar cambios de email únicos
    if (email && email !== person.email) {
      const existing = await prisma.person.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
    }

    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email || null;
    if (direccion !== undefined) updateData.direccion = direccion || null;
    if (telefono !== undefined) updateData.telefono = telefono || null;

    // Solo admin puede cambiar estado (puede desactivar)
    if (estado !== undefined && role === ROLES.ADMINISTRACION) {
      updateData.estado = estado;
    } else if (estado !== undefined && estado === false) {
      // Los usuarios regulares pueden desactivar (pero no reactivar)
      updateData.estado = false;
    }

    const updated = await prisma.person.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({ data: updated });
  } catch (error) {
    console.error('Error updating person:', error);
    return res.status(500).json({ error: 'Error al actualizar persona' });
  }
}

// DELETE: Eliminar persona (solo admin)
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  role: string
) {
  if (role !== ROLES.ADMINISTRACION) {
    return res.status(403).json({
      error: 'Solo administradores pueden eliminar personas',
    });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID requerido' });
    }

    const person = await prisma.person.findUnique({ where: { id } });

    if (!person) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }

    await prisma.person.delete({ where: { id } });

    return res.status(200).json({ message: 'Persona eliminada' });
  } catch (error) {
    console.error('Error deleting person:', error);
    return res.status(500).json({ error: 'Error al eliminar persona' });
  }
}
