import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Limpiar la cookie de sesión (usar Lax como en login para consistencia)
  const isDev = process.env.NODE_ENV !== 'production';
  const sameSite = isDev ? 'Lax' : 'Strict';
  res.setHeader('Set-Cookie', `session=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0`);
  
  return res.status(200).json({ message: 'Sesión cerrada' });
}
