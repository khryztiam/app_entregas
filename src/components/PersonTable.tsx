import { useCallback } from 'react';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import styles from '@/styles/components/person-table.module.css';

interface Person {
  id: string;
  documento: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  estado: boolean;
  createdAt?: string;
}

interface PersonTableProps {
  persons: Person[];
  isLoading?: boolean;
  onEdit: (person: Person) => void;
  onToggleStatus: (person: Person) => Promise<void>;
  onDelete?: (person: Person) => Promise<void>;
  showInactive?: boolean;
  canDelete?: boolean;
}

export default function PersonTable({
  persons,
  isLoading = false,
  onEdit,
  onToggleStatus,
  onDelete,
  showInactive = false,
  canDelete = false,
}: PersonTableProps) {
  const handleRowClick = (person: Person) => {
    onEdit(person);
  };

  const handleToggleClick = (e: React.MouseEvent, person: Person) => {
    e.stopPropagation();
    onToggleStatus(person);
  };

  const handleDeleteClick = (e: React.MouseEvent, person: Person) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(person);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Cargando personas...</div>;
  }

  if (persons.length === 0) {
    return <div className={styles.empty}>No hay personas registradas</div>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Documento</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {persons.map((person) => (
            <tr
              key={person.id}
              className={`${styles.row} ${!person.estado ? styles.inactive : ''}`}
              onClick={() => handleRowClick(person)}
            >
              <td className={styles.documento}>{person.documento}</td>
              <td className={styles.nombre}>{person.nombre}</td>
              <td className={styles.email}>{person.email || '-'}</td>
              <td className={styles.telefono}>{person.telefono || '-'}</td>
              <td className={styles.estado}>
                <span
                  className={`${styles.badge} ${
                    person.estado ? styles.active : styles.inactive
                  }`}
                >
                  {person.estado ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td className={styles.actions}>
                <button
                  className={styles.btnIcon}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(person);
                  }}
                  title="Editar"
                  aria-label="Editar persona"
                >
                  <FaEdit />
                </button>
                <button
                  className={`${styles.btnIcon} ${styles.btnToggle}`}
                  onClick={(e) => handleToggleClick(e, person)}
                  title={person.estado ? 'Desactivar' : 'Activar'}
                  aria-label={person.estado ? 'Desactivar persona' : 'Activar persona'}
                >
                  {person.estado ? <FaToggleOn /> : <FaToggleOff />}
                </button>
                {canDelete && (
                  <button
                    className={`${styles.btnIcon} ${styles.btnDelete}`}
                    onClick={(e) => handleDeleteClick(e, person)}
                    title="Eliminar"
                    aria-label="Eliminar persona"
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
