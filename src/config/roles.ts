/**
 * Configuración de roles genéricos de la aplicación.
 * Mantienen nombres neutrales sin referir a industria específica.
 */

export const ROLES = {
  ADMINISTRACION: 'ADMINISTRACION',  // Administrador del sistema
  USUARIO: 'USUARIO',                // Usuario de vista operativa general
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Rutas permitidas por rol.
 */
export const ROLE_ROUTES: Record<Role, string[]> = {
  [ROLES.ADMINISTRACION]: [
    '/admin/asignacion',
    '/admin/inventario',
    '/admin/usuarios',
    '/dashboard',
    '/prestamos',
  ],

  [ROLES.USUARIO]: [
    '/dashboard',
    '/prestamos',
    '/admin/asignacion',
  ],
};

export const ROLE_MAP: Record<string, Role> = {
  'admin': ROLES.ADMINISTRACION,
  'user': ROLES.USUARIO,
};

/**
 * Normaliza un rol al nombre genérico configurado.
 */
export const mapRoleToGeneric = (role: string): Role => {
  return ROLE_MAP[role] || (role as Role);
};

export const ROLE_ID_MAP: Record<string, number> = {
  ADMINISTRACION: 1,
  USUARIO: 2,
};

export const ADMIN_ROLE_NAMES = [ROLES.ADMINISTRACION];
export const OPERATOR_ROLE_NAMES = [ROLES.ADMINISTRACION];
