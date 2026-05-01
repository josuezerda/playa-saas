import { Settings } from 'lucide-react';
import styles from '../dashboard.module.css';

export default function ConfiguracionPage() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.logoTitle}>Configuración General</h1>
            <div className={styles.logoSub}>Datos del comercio y preferencias del sistema</div>
          </div>
        </div>
      </header>
      <div className={styles.body}>
        <main className={styles.pumpsSection}>
          <div className={styles.emptyState}>
            <Settings size={40} opacity={0.3} />
            <h2>Módulo en construcción</h2>
            <p>Próximamente: Administración de datos de la estación, perfiles de usuario y preferencias de visualización.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
