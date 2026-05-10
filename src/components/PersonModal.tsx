import { useState, useEffect } from 'react';
import styles from '@/styles/components/person-modal.module.css';

export interface PersonFormData {
  id?: string;
  documento: string;
  nombre: string;
  email: string;
  direccion: string;
  telefono: string;
  estado?: boolean;
}

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PersonFormData) => Promise<void>;
  initialData?: PersonFormData | null;
  isLoading?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => Promise<void>;
}

export default function PersonModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  canDelete = false,
  onDelete,
}: PersonModalProps) {
  const [formData, setFormData] = useState<PersonFormData>({
    documento: '',
    nombre: '',
    email: '',
    direccion: '',
    telefono: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        documento: '',
        nombre: '',
        email: '',
        direccion: '',
        telefono: '',
      });
    }
    setErrors({});
    setDeleteConfirm(false);
  }, [initialData, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.documento.trim()) {
      newErrors.documento = 'El documento es requerido';
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      console.error('Error deleting person:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {initialData ? 'Editar Persona' : 'Nueva Persona'}
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
            <label htmlFor="documento">Documento *</label>
            <input
              id="documento"
              type="text"
              name="documento"
              value={formData.documento}
              onChange={handleChange}
              disabled={isLoading || !!initialData}
              placeholder="Ej: 12345678"
              className={errors.documento ? styles.error : ''}
            />
            {errors.documento && (
              <span className={styles.errorMsg}>{errors.documento}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="nombre">Nombre *</label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Ej: Juan Pérez"
              className={errors.nombre ? styles.error : ''}
            />
            {errors.nombre && (
              <span className={styles.errorMsg}>{errors.nombre}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Ej: juan@example.com"
              className={errors.email ? styles.error : ''}
            />
            {errors.email && (
              <span className={styles.errorMsg}>{errors.email}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Ej: +34 600 123 456"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="direccion">Dirección</label>
            <input
              id="direccion"
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Ej: Calle Principal 123"
            />
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
