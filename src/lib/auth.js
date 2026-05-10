import { prisma } from '@/lib/prisma';
import { readSessionToken, verifySessionToken } from '@/lib/session';
import { ADMIN_ROLE_NAMES, OPERATOR_ROLE_NAMES, ROLES, mapRoleToGeneric } from '@/config/roles';

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    role: mapRoleToGeneric(user.role),
    estado: user.estado,
  };
}

export async function getCurrentUser(req) {
  const token = readSessionToken(req);
  const session = verifySessionToken(token);
  if (!session?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
  });

  if (!user?.estado) return null;
  return user;
}

export async function requireAuth(req, res) {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
  }
  return user;
}

export async function requireAdmin(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return null;

  if (!ADMIN_ROLE_NAMES.includes(user.role) && mapRoleToGeneric(user.role) !== ROLES.ADMINISTRACION) {
    res.status(403).json({ error: 'Sin permisos de administración' });
    return null;
  }

  return user;
}

export async function requireOperator(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return null;

  if (!OPERATOR_ROLE_NAMES.includes(user.role) && mapRoleToGeneric(user.role) !== ROLES.OPERADOR) {
    res.status(403).json({ error: 'Sin permisos para actualizar solicitudes' });
    return null;
  }

  return user;
}
