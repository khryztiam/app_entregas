import { useMemo, useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useNotification } from '@/hooks/useNotification';
import styles from '@/styles/devices.module.css';

const buildServiceTag = (idtag) => {
  const serie = idtag.trim();
  return serie ? `WS-${serie}` : '';
};

export function DeviceForm({ device = null, onSave, onCancel, isLoading = false }) {
  const { error: showError } = useNotification();
  const [formData, setFormData] = useState({
    idtag: device?.resourceId || device?.idtag || '',
    service_tag: device?.assetTag || device?.service_tag || buildServiceTag(device?.resourceId || device?.idtag || ''),
    in_loan: Boolean(device?.isAssigned !== undefined ? device.isAssigned : device?.in_loan),
  });

  const serviceTag = useMemo(() => {
    return formData.service_tag || buildServiceTag(formData.idtag);
  }, [formData.idtag, formData.service_tag]);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleIdtagChange = (value) => {
    setFormData({
      ...formData,
      idtag: value,
      service_tag: buildServiceTag(value),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const idtag = formData.idtag.trim();

    if (!idtag) {
      showError('Ingrese la serie del recurso');
      return;
    }

    try {
      onSave({
        idtag,
        service_tag: serviceTag || buildServiceTag(idtag),
        in_loan: Boolean(formData.in_loan),
      });
    } catch (err) {
      showError('Error al guardar el recurso');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Input
        label="Serie del recurso"
        value={formData.idtag}
        onChange={(e) => handleIdtagChange(e.target.value)}
        disabled={!!device || isLoading}
        required
      />

      <Input
        label="Asset tag"
        value={serviceTag}
        readOnly
        disabled
      />

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={formData.in_loan}
          onChange={(e) => handleChange('in_loan', e.target.checked)}
          className={styles.checkbox}
          disabled={isLoading}
        />
        <span className={styles.checkboxText}>Asignado</span>
      </label>

      <div className={styles.formActions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
