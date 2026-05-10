import styles from '@/styles/components/inventory-kpi.module.css';

interface InventoryKpiProps {
  totalStock: number;
  itemsInStock: number;
  itemsInLoan: number;
  types: number;
  isLoading?: boolean;
}

export default function InventoryKpi({
  totalStock,
  itemsInStock,
  itemsInLoan,
  types,
  isLoading = false,
}: InventoryKpiProps) {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.primary}`}>
        <div className={styles.value}>{isLoading ? '-' : totalStock}</div>
        <div className={styles.label}>Stock Total</div>
      </div>

      <div className={`${styles.card} ${styles.success}`}>
        <div className={styles.value}>{isLoading ? '-' : itemsInStock}</div>
        <div className={styles.label}>Items Disponibles</div>
      </div>

      <div className={`${styles.card} ${styles.warning}`}>
        <div className={styles.value}>{isLoading ? '-' : itemsInLoan}</div>
        <div className={styles.label}>En Préstamo</div>
      </div>

      <div className={`${styles.card} ${styles.info}`}>
        <div className={styles.value}>{isLoading ? '-' : types}</div>
        <div className={styles.label}>Tipos</div>
      </div>
    </div>
  );
}
