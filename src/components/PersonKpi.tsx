import styles from '@/styles/components/person-kpi.module.css';

interface PersonKpiProps {
  activas: number;
  desactivadas: number;
  total: number;
  isLoading?: boolean;
}

export default function PersonKpi({
  activas,
  desactivadas,
  total,
  isLoading = false,
}: PersonKpiProps) {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.active}`}>
        <div className={styles.value}>{isLoading ? '-' : activas}</div>
        <div className={styles.label}>Activas</div>
      </div>

      <div className={`${styles.card} ${styles.inactive}`}>
        <div className={styles.value}>{isLoading ? '-' : desactivadas}</div>
        <div className={styles.label}>Desactivadas</div>
      </div>

      <div className={`${styles.card} ${styles.total}`}>
        <div className={styles.value}>{isLoading ? '-' : total}</div>
        <div className={styles.label}>Total</div>
      </div>
    </div>
  );
}
