import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { getCurrentUser } from '@/lib/auth';
import RoleGate from '@/components/RoleGate';
import { ROLES } from '@/config/roles';
import styles from '@/styles/dashboard.module.css';

interface DashboardStats {
  loansActive: number;
  loansOverdue: number;
  deliveriesToday: number;
  peopleRegistered: number;
  inventoryItems: number;
  inventoryLow: number;
}

export default function DashboardPage() {
  const { user, userName } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    loansActive: 0,
    loansOverdue: 0,
    deliveriesToday: 0,
    peopleRegistered: 0,
    inventoryItems: 0,
    inventoryLow: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats', {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (!user) return null;
  

  return (
     <RoleGate allowedRoles={[ROLES.USUARIO, ROLES.ADMINISTRACION]}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p>Bienvenido de nuevo, <strong>{userName || user.username}</strong></p>
        </header>

        {loading ? (
          <div className={styles.loading}>
            <span>Cargando estadísticas del sistema...</span>
          </div>
        ) : (
         <div className={styles.grid}>
            <div className={styles.card}>
              <p className={styles.label}>Préstamos Activos</p>
              <span className={styles.value}>{stats.loansActive}</span>
            </div>

            <div className={styles.card}>
              <p className={styles.label}>Préstamos Vencidos</p>
              <span className={`${styles.value} ${stats.loansOverdue > 0 ? styles.alert : ''}`}>
                {stats.loansOverdue}
              </span>
            </div>

            <div className={styles.card}>
              <p className={styles.label}>Entregas Hoy</p>
              <span className={styles.value}>{stats.deliveriesToday}</span>
            </div>

            <div className={styles.card}>
              <p className={styles.label}>Usuarios en Sistema</p>
              <span className={styles.value}>{stats.peopleRegistered}</span>
            </div>

            {/* Sección exclusiva para Admin */}
            {user.role === ROLES.ADMINISTRACION && (
              <>
                <div className={styles.card}>
                  <p className={styles.label}>Total Inventario</p>
                  <span className={styles.value}>{stats.inventoryItems}</span>
                </div>

                <div className={styles.card}>
                  <p className={styles.label}>Alertas de Stock</p>
                  <span className={`${styles.value} ${stats.inventoryLow > 0 ? styles.warning : ''}`}>
                    {stats.inventoryLow}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </RoleGate>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getCurrentUser(context.req as any);
  if (!user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
