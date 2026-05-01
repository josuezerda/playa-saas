import { Receipt } from 'lucide-react';
import styles from '../dashboard.module.css';

export default function FacturacionPage() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.logoTitle}>Facturación AFIP</h1>
            <div className={styles.logoSub}>Emisión de comprobantes electrónicos (A, B, C)</div>
          </div>
        </div>
      </header>
      <div className={styles.body}>
        <main className={styles.pumpsSection}>
          <div className={styles.emptyState}>
            <Receipt size={40} opacity={0.3} />
            <h2>Módulo en construcción</h2>
            <p>Próximamente: Historial de facturas, sincronización con ventas y emisión manual vía Web Services de AFIP.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
