import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar autenticación como admin
  const user = await requireAdmin(req, res);
  if (!user) return;

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  if (req.method === 'DELETE') {
    try {
      // No permitir auto-eliminación
      if (id === user.id) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
      }

      // Verificar que el usuario existe
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Eliminar usuario
      await prisma.user.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Usuario eliminado' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }

  res.setHeader('Allow', ['DELETE']);
  return res.status(405).json({ error: 'Método no permitido' });
}
