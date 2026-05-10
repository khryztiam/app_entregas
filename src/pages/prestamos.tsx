import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { ROLES } from '@/config/roles';
import LoanRegisterModal from '@/components/LoanRegisterModal';
import styles from '@/styles/prestamos.module.css';

export default function LoansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ENTREGA' | 'RECEPCION'>('ENTREGA');

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const isAdmin = user.role === ROLES.ADMINISTRACION;

  const openModal = (mode: 'ENTREGA' | 'RECEPCION') => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Préstamos</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isAdmin && (
            <button
              onClick={() => openModal('ENTREGA')}
              className={styles.btnPrimary}
            >
              + Registrar Préstamo
            </button>
          )}
          <button
            onClick={() => openModal('RECEPCION')}
            className={styles.btnSecondary}
          >
            ✓ Recibir Préstamo
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
        <div className={styles.loading}>Cargando préstamos...</div>

        <div className={styles.empty}>No hay préstamos registrados</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Persona</th>
                <th>Artículo</th>
                <th>Inicio</th>
                <th>Vencimiento</th>
                <th>Días asignados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

          </table>
        </div>
    </div>
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
