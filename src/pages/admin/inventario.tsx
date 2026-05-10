import { useEffect, useState, useCallback } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { ROLES, mapRoleToGeneric } from '@/config/roles';
import RoleGate from '@/components/RoleGate';
import InventoryKpi from '@/components/InventoryKpi';
import InventoryTable from '@/components/InventoryTable';
import InventoryModal, { InventoryFormData } from '@/components/InventoryModal';
import styles from '@/styles/inventory.module.css';
import { FaPlus, FaSearch } from 'react-icons/fa';

interface InventoryItem {
  id: string;
  eanCode: string | null;
  serieCode: string | null;
  description: string;
  type: string;
  stock: number;
  createdAt?: string;
}

interface ApiResponse {
  data?: InventoryItem[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

interface StatsResponse {
  totalStock?: number;
  itemsInStock?: number;
  itemsInLoan?: number;
  types?: number;
  error?: string;
}

const InventarioPage: NextPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const role = user?.role ? mapRoleToGeneric(user.role) : null;
  const isAdmin = role === ROLES.ADMINISTRACION;

  // Estado de datos
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState({
    totalStock: 0,
    itemsInStock: 0,
    itemsInLoan: 0,
    types: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de paginación
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [totalPages, setTotalPages] = useState(1);

  // Estado de filtros
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Estado de modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Cargar items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
      });

      const res = await fetch(`/api/inventory?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const data = (await res.json()) as ApiResponse;
        throw new Error(data.error || 'Error al cargar inventario');
      }

      const data = (await res.json()) as ApiResponse;
      setItems(data.data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  // Cargar estadísticas
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/stats', {
        credentials: 'include',
      });

      if (res.ok) {
        const data = (await res.json()) as StatsResponse;
        setStats({
          totalStock: data.totalStock || 0,
          itemsInStock: data.itemsInStock || 0,
          itemsInLoan: data.itemsInLoan || 0,
          types: data.types || 0,
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (!authLoading) {
      fetchItems();
      fetchStats();
    }
  }, [authLoading, fetchItems, fetchStats]);

  // Manejar búsqueda
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Abrir modal para crear
  const handleNewItem = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  // Editar item
  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  // Guardar item (crear o actualizar)
  const handleSaveItem = async (data: InventoryFormData) => {
    setModalLoading(true);

    try {
      const method = data.id ? 'PUT' : 'POST';
      const res = await fetch('/api/inventory', {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = (await res.json()) as ApiResponse;
        throw new Error(result.error || 'Error al guardar item');
      }

      // Actualizar lista y estadísticas
      await fetchItems();
      await fetchStats();
    } catch (err) {
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  // Eliminar item (solo admin)
  const handleDeleteItem = async (item: InventoryItem) => {
    if (!isAdmin) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });

      if (!res.ok) {
        const data = (await res.json()) as ApiResponse;
        throw new Error(data.error || 'Error al eliminar item');
      }

      // Actualizar lista y estadísticas
      await fetchItems();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar item');
    }
  };

  if (authLoading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <RoleGate allowedRoles={[ROLES.ADMINISTRACION, ROLES.USUARIO]}>
      <div className={styles.container}>
        {/* KPI Cards */}
        <InventoryKpi
          totalStock={stats.totalStock}
          itemsInStock={stats.itemsInStock}
          itemsInLoan={stats.itemsInLoan}
          types={stats.types}
          isLoading={loading}
        />

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por descripción, EAN, serie o tipo..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.toolbarRight}>
            {isAdmin && (
              <button
                className={styles.btnNew}
                onClick={handleNewItem}
                disabled={loading}
              >
                <FaPlus /> Nuevo Item
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Tabla */}
        <InventoryTable
          items={items}
          isLoading={loading}
          onEdit={handleEditItem}
          onDelete={isAdmin ? handleDeleteItem : undefined}
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
        <InventoryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSaveItem}
          initialData={selectedItem}
          isLoading={modalLoading}
          canDelete={isAdmin}
          onDelete={async (id) => {
            await handleDeleteItem({ id } as InventoryItem);
          }}
        />
      </div>
    </RoleGate>
  );
};

export default InventarioPage;

