// src/components/RoleGate.tsx
import React, { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { mapRoleToGeneric, ROLES } from '@/config/roles';
import { useRouter } from 'next/router';

type RoleGateProps = {
  allowedRoles: string[];
  children: ReactNode;
};

/**
 * Componente de protección por rol.
 * Acepta roles antiguos o nuevos; mapea a genéricos automáticamente.
 */
const RoleGate = ({ allowedRoles, children }: RoleGateProps) => {
  const { user, role } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Mapear rol antiguo a genérico
  const genericRole = mapRoleToGeneric(role);
  // Normalizar roles permitidos a genéricos
  const normalizedAllowedRoles = allowedRoles.map(r => mapRoleToGeneric(r));

  useEffect(() => {
    if (user && role) {
      setLoading(false);
    }
  }, [user, role]);

  if (loading) {
    return (
      <div className="access-container">
        <h2>Validando permisos...</h2>
        <p>Espera un momento.</p>
      </div>
    );
  }

  if (normalizedAllowedRoles.includes(genericRole) || genericRole === ROLES.ADMINISTRACION) {
    return children;
  }

  return (
    <div className="access-container">
      <h2>No tienes acceso a esta sección</h2>
      <p>Tu rol actual <strong>({genericRole})</strong> no tiene permisos para ver este contenido.</p>
      <button onClick={() => router.back()} className="admingate-back-btn">Volver</button>
    </div>
  );
};

export default RoleGate;
