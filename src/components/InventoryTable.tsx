import { FaEdit, FaTrash } from 'react-icons/fa';
import styles from '@/styles/components/inventory-table.module.css';

interface InventoryItem {
  id: string;
  eanCode: string | null;
  serieCode: string | null;
  description: string;
  type: string;
  stock: number;
  createdAt?: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading?: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => Promise<void>;
  canDelete?: boolean;
}

export default function InventoryTable({
  items,
  isLoading = false,
  onEdit,
  onDelete,
  canDelete = false,
}: InventoryTableProps) {
  const handleRowClick = (item: InventoryItem) => {
    onEdit(item);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(item);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Cargando inventario...</div>;
  }

  if (items.length === 0) {
    return <div className={styles.empty}>No hay items en el inventario</div>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Tipo</th>
            <th>EAN</th>
            <th>Serie</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={`${styles.row} ${item.stock === 0 ? styles.outOfStock : ''}`}
              onClick={() => handleRowClick(item)}
            >
              <td className={styles.description}>{item.description}</td>
              <td className={styles.type}>{item.type}</td>
              <td className={styles.code}>{item.eanCode || '-'}</td>
              <td className={styles.code}>{item.serieCode || '-'}</td>
              <td className={styles.stock}>
                <span className={`${styles.badge} ${item.stock > 0 ? styles.positive : styles.zero}`}>
                  {item.stock > 0 ? `+${item.stock}` : item.stock}
                </span>
              </td>
              <td className={styles.actions}>
                <button
                  className={styles.btnIcon}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  title="Editar"
                  aria-label="Editar item"
                >
                  <FaEdit />
                </button>
                {canDelete && (
                  <button
                    className={`${styles.btnIcon} ${styles.btnDelete}`}
                    onClick={(e) => handleDeleteClick(e, item)}
                    title="Eliminar"
                    aria-label="Eliminar item"
                  >
                    <FaTrash />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
