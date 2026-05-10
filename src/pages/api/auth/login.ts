import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { publicUser } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { username, password } = req.body || {};
  const cleanUsername = String(username || '').trim().toLowerCase();

  if (!cleanUsername || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  const user = await prisma.user.findUnique({
    where: { username: cleanUsername },
  });

  if (!user || !user.estado) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const passwordValid = await verifyPassword(String(password), user.passwordHash);
  if (!passwordValid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  setSessionCookie(res, user);
  return res.status(200).json({ user: publicUser(user) });
}
