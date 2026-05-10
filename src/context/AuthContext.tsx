import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { ROLES, ROLE_ROUTES, mapRoleToGeneric } from '@/config/roles';


type AppUser = {
  id: string;
  username: string;
  role: string;
  estado: boolean;
};

type AuthContextValue = {
  user: AppUser | null;
  userName: string;
  role: string;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Obtener sesión actual
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Inicializar sesión al montar
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await res.json();
    setUser(data.user);
    
    // Redireccionar automáticamente según el rol del usuario
    const genericRole = mapRoleToGeneric(data.user.role);
    const allowedRoutes = ROLE_ROUTES[genericRole] || [];
    const redirectPath = allowedRoutes[0] || '/dashboard';
    
    // Usar setTimeout para asegurar que el state se actualiza antes de redirigir
    setTimeout(() => {
      router.push(redirectPath);
    }, 0);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, userName: user?.username || '', role: user?.role || '', loading, login, logout, refreshSession: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
