import { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import styles from '@/styles/devices.module.css';

export function DevicesTable({ devices, onEdit, onDelete, isLoading = false }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDeleteConfirm = (resourceId) => {
    onDelete(resourceId);
    setConfirmDelete(null);
  };

  if (!devices || devices.length === 0) {
    return (
      <div className={styles.empty}>
        No hay recursos registrados
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Serie</th>
            <th>Asset tag</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => {
            const resourceId = device.resourceId || device.idtag;
            const assetTag = device.assetTag || device.service_tag;
            const isAssigned = device.isAssigned !== undefined ? device.isAssigned : device.in_loan;

            return (
            <tr key={resourceId}>
              <td>{resourceId}</td>
              <td>{assetTag || '-'}</td>
              <td className={styles.center}>
                <Badge variant={isAssigned ? 'error' : 'success'}>
                  {isAssigned ? 'Asignado' : 'Disponible'}
                </Badge>
              </td>
              <td className={styles.right}>
                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(device)}
                    disabled={isLoading}
                  >
                    Editar
                  </Button>
                  {confirmDelete === resourceId ? (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteConfirm(resourceId)}
                        disabled={isLoading}
                      >
                        Confirmar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setConfirmDelete(null)}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmDelete(resourceId)}
                      disabled={isLoading}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
