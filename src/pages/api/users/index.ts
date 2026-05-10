import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { hashPassword } from '@/lib/password';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar autenticación como admin
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          estado: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ users });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { username, password, role } = req.body;

      // Validar campos
      if (!username || !password || !role) {
        return res.status(400).json({ error: 'Usuario, contraseña y rol son requeridos' });
      }

      const cleanUsername = String(username).trim().toLowerCase();

      // Verificar que el usuario no exista
      const existing = await prisma.user.findUnique({
        where: { username: cleanUsername },
      });

      if (existing) {
        return res.status(409).json({ error: 'El usuario ya existe' });
      }

      // Hash la contraseña
      const passwordHash = await hashPassword(password);

      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          passwordHash,
          role,
          estado: true,
        },
        select: {
          id: true,
          username: true,
          role: true,
          estado: true,
          createdAt: true,
        },
      });

      return res.status(201).json({ user: newUser });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Error al crear usuario' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Método no permitido' });
}
