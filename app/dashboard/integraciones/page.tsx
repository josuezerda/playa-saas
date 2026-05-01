import { Link2 } from 'lucide-react';
import styles from '../dashboard.module.css';

export default function IntegracionesPage() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.logoTitle}>Integraciones</h1>
            <div className={styles.logoSub}>Conexión con Inteligencia Artificial y WhatsApp API</div>
          </div>
        </div>
      </header>
      <div className={styles.body}>
        <main className={styles.pumpsSection}>
          <div className={styles.emptyState}>
            <Link2 size={40} opacity={0.3} />
            <h2>Módulo en construcción</h2>
            <p>Próximamente: Configuración de tokens de Meta/WhatsApp y prompts personalizados para Gemini/OpenAI.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
