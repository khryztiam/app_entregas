import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { ROLES, ROLE_ROUTES, mapRoleToGeneric } from '@/config/roles';
import styles from '@/styles/AdminGate.module.css';

const OPEN_ROUTES = ['/', '/auth/login', '/login'];

/**
 * Componente de protección de rutas por rol.
 * Redirige usuarios según su rol genérico configurado.
 */
export default function AdminGate({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);

  // Mapear rol antiguo a genérico si es necesario
  const genericRole = mapRoleToGeneric(role);

  useEffect(() => {
    if (loading) return;

    const isOpenRoute = OPEN_ROUTES.includes(router.pathname);

    // Sin sesión en ruta protegida → login
    if (!user && !isOpenRoute) {
      router.replace('/');
      return;
    }

    if (user) {
      // Con sesión en ruta abierta → redirigir a la primera ruta del rol
      if (isOpenRoute) {
        const allowedRoutes = ROLE_ROUTES[genericRole] || [];
        router.replace(allowedRoutes[0] || '/');
        return;
      }

      // Verificar acceso a la ruta actual
      const allowedRoutes = ROLE_ROUTES[genericRole] || [];
      setAccessDenied(!allowedRoutes.includes(router.pathname));
    }
  }, [user, role, loading, router, router.pathname, genericRole]);

  if (loading) return null;

  if (accessDenied) {
    return (
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h2>Acceso Denegado</h2>
          <p>
            El usuario <strong>{user?.username}</strong> (rol: <strong>{genericRole}</strong>) no tiene permisos para
            ver esta página.
          </p>
          <button
            onClick={() => {
              const allowedRoutes = ROLE_ROUTES[genericRole] || [];
              router.push(allowedRoutes[0] || '/');
            }}
            className={styles.backBtn}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
