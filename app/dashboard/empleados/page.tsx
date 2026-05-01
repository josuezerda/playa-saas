import { Users } from 'lucide-react';
import styles from '../dashboard.module.css';

export default function EmpleadosPage() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.logoTitle}>Empleados y Roles</h1>
            <div className={styles.logoSub}>Gestión de personal y permisos de acceso</div>
          </div>
        </div>
      </header>
      <div className={styles.body}>
        <main className={styles.pumpsSection}>
          <div className={styles.emptyState}>
            <Users size={40} opacity={0.3} />
            <h2>Módulo en construcción</h2>
            <p>Próximamente: ABM de empleados, control de turnos y asignación de permisos.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
