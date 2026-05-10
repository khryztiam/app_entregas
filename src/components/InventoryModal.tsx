import { useState, useEffect } from 'react';
import styles from '@/styles/components/inventory-modal.module.css';

export interface InventoryFormData {
  id?: string;
  eanCode: string;
  serieCode: string;
  description: string;
  type: string;
  stock: number;
}

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InventoryFormData) => Promise<void>;
  initialData?: InventoryFormData | null;
  isLoading?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => Promise<void>;
  types?: string[];
}

export default function InventoryModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  canDelete = false,
  onDelete,
  types = [],
}: InventoryModalProps) {
  const [formData, setFormData] = useState<InventoryFormData>({
    eanCode: '',
    serieCode: '',
    description: '',
    type: '',
    stock: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        eanCode: '',
        serieCode: '',
        description: '',
        type: '',
        stock: 0,
      });
    }
    setErrors({});
    setDeleteConfirm(false);
  }, [initialData, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (!formData.type.trim()) {
      newErrors.type = 'El tipo es requerido';
    }
    if (formData.stock < 0) {
      newErrors.stock = 'El stock no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelect>) => {
    const { name, value, type: fieldType } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: fieldType === 'number' ? parseInt(value, 10) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = async () => {
    if (!formData.id || !onDelete) return;

    try {
      await onDelete(formData.id);
      setDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {initialData ? 'Editar Item' : 'Nuevo Item'}
          </h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isLoading}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="description">Descripción *</label>
            <input
              id="description"
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Ej: MacBook Pro 15 pulgadas"
              className={errors.description ? styles.error : ''}
            />
            {errors.description && (
              <span className={styles.errorMsg}>{errors.description}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="type">Tipo *</label>
            {types.length > 0 ? (
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleSelectChange}
                disabled={isLoading}
                className={errors.type ? styles.error : ''}
              >
                <option value="">Selecciona un tipo</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="type"
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Ej: Laptop"
                className={errors.type ? styles.error : ''}
              />
            )}
            {errors.type && (
              <span className={styles.errorMsg}>{errors.type}</span>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="eanCode">Código EAN</label>
              <input
                id="eanCode"
                type="text"
                name="eanCode"
                value={formData.eanCode}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Ej: 5901234123457"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="serieCode">Código de Serie</label>
              <input
                id="serieCode"
                type="text"
                name="serieCode"
                value={formData.serieCode}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Ej: SN123456789"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="stock">Stock</label>
            <input
              id="stock"
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              disabled={isLoading}
              min="0"
              className={errors.stock ? styles.error : ''}
            />
            {errors.stock && (
              <span className={styles.errorMsg}>{errors.stock}</span>
            )}
          </div>

          <div className={styles.actions}>
            {!deleteConfirm ? (
              <>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </button>

                {canDelete && initialData && (
                  <button
                    type="button"
                    className={styles.btnDelete}
                    onClick={() => setDeleteConfirm(true)}
                    disabled={isLoading}
                  >
                    Eliminar
                  </button>
                )}

                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setDeleteConfirm(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.btnDeleteConfirm}
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {isLoading ? 'Eliminando...' : 'Confirmar eliminación'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
