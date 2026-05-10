import { useEffect, useState, useCallback } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { ROLES, mapRoleToGeneric } from '@/config/roles';
import RoleGate from '@/components/RoleGate';
import PersonKpi from '@/components/PersonKpi';
import PersonTable from '@/components/PersonTable';
import PersonModal, { PersonFormData } from '@/components/PersonModal';
import styles from '@/styles/personas.module.css';
import { FaPlus, FaSearch } from 'react-icons/fa';

interface Person {
  id: string;
  documento: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  estado: boolean;
  createdAt?: string;
}

interface ApiResponse {
  data?: Person[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

interface StatsResponse {
  activas?: number;
  desactivadas?: number;
  total?: number;
  error?: string;
}

const PersonasPage: NextPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const role = user?.role ? mapRoleToGeneric(user.role) : null;
  const isAdmin = role === ROLES.ADMINISTRACION;

  // Estado de datos
  const [persons, setPersons] = useState<Person[]>([]);
  const [stats, setStats] = useState({ activas: 0, desactivadas: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de paginación
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [totalPages, setTotalPages] = useState(1);

  // Estado de filtros
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Estado de modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Cargar personas
  const fetchPersons = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        includeInactive: String(showInactive),
        ...(search && { search }),
      });

      const res = await fetch(`/api/persons?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const data = (await res.json()) as ApiResponse;
        throw new Error(data.error || 'Error al cargar personas');
      }

      const data = (await res.json()) as ApiResponse;
      setPersons(data.data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar personas');
    } finally {
      setLoading(false);
    }
  }, [page, showInactive, search]);

  // Cargar estadísticas
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/persons/stats', {
        credentials: 'include',
      });

      if (res.ok) {
        const data = (await res.json()) as StatsResponse;
        setStats({
          activas: data.activas || 0,
          desactivadas: data.desactivadas || 0,
          total: data.total || 0,
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (!authLoading) {
      fetchPersons();
      fetchStats();
    }
  }, [authLoading, fetchPersons, fetchStats]);

  // Manejar búsqueda
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Abrir modal para crear
  const handleNewPerson = () => {
    setSelectedPerson(null);
    setModalOpen(true);
  };

  // Editar persona
  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setModalOpen(true);
  };

  // Guardar persona (crear o actualizar)
  const handleSavePerson = async (data: PersonFormData) => {
    setModalLoading(true);

    try {
      const method = data.id ? 'PUT' : 'POST';
      const res = await fetch('/api/persons', {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = (await res.json()) as ApiResponse;
        throw new Error(result.error || 'Error al guardar persona');
      }

      // Actualizar lista y estadísticas
      await fetchPersons();
      await fetchStats();
    } catch (err) {
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  // Cambiar estado de persona
  const handleToggleStatus = async (person: Person) => {
    try {
      const res = await fetch('/api/persons', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: person.id,
          estado: !person.estado,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as ApiResponse;
        throw new Error(data.error || 'Error al cambiar estado');
      }

      // Actualizar lista y estadísticas
      await fetchPersons();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  // Eliminar persona (solo admin)
  const handleDeletePerson = async (person: Person) => {
    if (!isAdmin) return;

    try {
      const res = await fetch('/api/persons', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: person.id }),
      });

      if (!res.ok) {
        const data = (await res.json()) as ApiResponse;
        throw new Error(data.error || 'Error al eliminar persona');
      }

      // Actualizar lista y estadísticas
      await fetchPersons();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar persona');
    }
  };

  if (authLoading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <RoleGate allowedRoles={[ROLES.ADMINISTRACION, ROLES.USUARIO]}>
      <div className={styles.container}>
        {/* KPI Cards */}
        <PersonKpi
          activas={stats.activas}
          desactivadas={stats.desactivadas}
          total={stats.total}
          isLoading={loading}
        />

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por documento, nombre o email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.toolbarRight}>
            {isAdmin && (
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => {
                    setShowInactive(e.target.checked);
                    setPage(1);
                  }}
                />
                <span>Mostrar desactivadas</span>
              </label>
            )}

            <button
              className={styles.btnNew}
              onClick={handleNewPerson}
              disabled={loading}
            >
              <FaPlus /> Nueva Persona
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Tabla */}
        <PersonTable
          persons={persons}
          isLoading={loading}
          onEdit={handleEditPerson}
          onToggleStatus={handleToggleStatus}
          onDelete={isAdmin ? handleDeletePerson : undefined}
          showInactive={showInactive}
          canDelete={isAdmin}
        />

        {/* Paginación */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
            >
              Anterior
            </button>

            <span className={styles.pageInfo}>
              Página {page} de {totalPages}
            </span>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Modal */}
        <PersonModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSavePerson}
          initialData={selectedPerson}
          isLoading={modalLoading}
          canDelete={isAdmin}
          onDelete={async (id) => {
            await handleDeletePerson({ id } as Person);
          }}
        />
      </div>
    </RoleGate>
  );
};

export default PersonasPage;
