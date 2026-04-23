import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import styles from './home.module.css';

export const metadata: Metadata = {
  title: 'SurtOS — El sistema operativo de tu estación de servicio',
  description: 'Plataforma SaaS de gestión en tiempo real para estaciones de servicio. Control de surtidores, stock de tanques y despachos desde cualquier dispositivo.',
};

const features = [
  {
    icon: '⚡',
    title: 'Tiempo real',
    desc: 'Estado de cada pico actualizado al instante vía protocolo VOX sobre TCP/IP. Sin refreshes manuales.',
  },
  {
    icon: '🛢️',
    title: 'Control de stock',
    desc: 'Monitoreo de tanques con alertas automáticas cuando el combustible alcanza el umbral crítico.',
  },
  {
    icon: '🔒',
    title: 'Multi-tenant seguro',
    desc: 'Cada estación tiene su propio entorno aislado. Tus datos nunca se mezclan con otra empresa.',
  },
  {
    icon: '📊',
    title: 'Turnos y reportes',
    desc: 'Apertura y cierre de turno, listado de transacciones y totales de litros y monto por operador.',
  },
  {
    icon: '🔌',
    title: 'Compatible con tu hardware',
    desc: 'Soporte para surtidores PMD-4821 y PMD-2421 (Óctupla y Cuádrupla) con controladora VOX.',
  },
  {
    icon: '☁️',
    title: 'En la nube',
    desc: 'Accedé desde cualquier dispositivo, en cualquier lugar. Sin servidores locales que mantener.',
  },
];

const stats = [
  { value: '36', label: 'Picos simultáneos' },
  { value: '<1s', label: 'Latencia de eventos' },
  { value: '100%', label: 'Uptime garantizado' },
  { value: '0', label: 'Instalaciones on-site' },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <Image src="/logo.svg" alt="SurtOS Logo" width={34} height={34} />
            <span className={styles.logoText}>
              Surt<span className={styles.logoOS}>OS</span>
            </span>
          </div>
          <div className={styles.navLinks}>
            <a href="#features">Funciones</a>
          </div>
          <Link href="/login" className={styles.navBtn}>
            Ingresar al sistema →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Sistema activo · VOX Forecourt Controller
          </div>

          <h1 className={styles.heroTitle}>
            El sistema operativo
            <br />
            <span className={styles.heroGradient}>de tu estación de servicio</span>
          </h1>

          <p className={styles.heroSub}>
            Gestioná tus surtidores en tiempo real, controlá el stock de combustible
            y auditá cada despacho — desde cualquier dispositivo, en la nube.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/login" className={styles.ctaPrimary}>
              ⚡ Acceder a la Terminal
            </Link>
            <a href="#features" className={styles.ctaSecondary}>
              Ver funciones →
            </a>
          </div>

          {/* Live dashboard preview */}
          <div className={styles.heroMockup}>
            <div className={styles.mockupBar}>
              <div className={styles.mockupDots}>
                <span /><span /><span />
              </div>
              <div className={styles.mockupUrl}>surtos.com.ar/dashboard</div>
              <div className={styles.mockupLive}>
                <span className={styles.liveDot} />LIVE
              </div>
            </div>
            <div className={styles.mockupBody}>
              <MockPumps />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={styles.stats}>
        <div className={styles.statsInner}>
          {stats.map(s => (
            <div key={s.label} className={styles.statItem}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionBadge}>FUNCIONALIDADES</div>
          <h2 className={styles.sectionTitle}>Todo lo que necesitás, nada que no necesitás</h2>
          <p className={styles.sectionSub}>
            Construido específicamente para estaciones de servicio con protocolo VOX sobre TCP/IP.
          </p>
          <div className={styles.featGrid}>
            {features.map(f => (
              <div key={f.title} className={styles.featCard}>
                <div className={styles.featIcon}>{f.icon}</div>
                <h3 className={styles.featTitle}>{f.title}</h3>
                <p className={styles.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <Image src="/logo.svg" alt="SurtOS" width={52} height={52} style={{ marginBottom: 8 }} />
          <h2 className={styles.finalTitle}>¿Listo para modernizar tu estación?</h2>
          <p className={styles.finalSub}>
            Sin instalaciones. Sin servidores locales. Acceso inmediato.
          </p>
          <Link href="/login" className={styles.ctaPrimary}>
            ⚡ Ingresá ahora
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.logo}>
            <Image src="/logo.svg" alt="SurtOS" width={22} height={22} />
            <span className={styles.logoText} style={{ fontSize: 14 }}>
              Surt<span className={styles.logoOS}>OS</span>
            </span>
          </div>
          <p className={styles.footerText}>
            © {new Date().getFullYear()} SurtOS. Sistema de gestión de playas VOX.
          </p>
          <Link href="/login" className={styles.footerLink}>Ingresar →</Link>
        </div>
      </footer>
    </div>
  );
}

/* ── Mini mockup dark preview ── */
function MockPumps() {
  // On mobile only show 1 pump; CSS hides the 3rd
  const mockPumps = [
    { n: 'Surtidor 1', nozzles: ['NS','NP','DS','DP'], state: ['LIBRE','LIBRE','DESPACHANDO','LIBRE'] },
    { n: 'Surtidor 2', nozzles: ['NS','NP','DS','DP'], state: ['LIBRE','AUTORIZADO','LIBRE','LIBRE'] },
    { n: 'Surtidor 3', nozzles: ['NS','NP','DS','DP'], state: ['LIBRE','LIBRE','LIBRE','LIBRE'] },
  ];
  const stateColor: Record<string,string> = { LIBRE: '#4B5C73', DESPACHANDO: '#3B82F6', AUTORIZADO: '#EAB308' };
  const fuelColor: Record<string,string> = { NS: '#10B981', NP: '#3B82F6', DS: '#F59E0B', DP: '#A855F7' };
  return (
    <div style={{ padding: '16px', display: 'flex', gap: 12, overflowX: 'hidden' }}>
      {mockPumps.map((p, i) => (
        <div key={i} data-pump={i > 0 ? String(i) : undefined} style={{
          flex: 1, minWidth: 0, background: '#0F1829', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              background: '#3B82F6', width: 20, height: 20, borderRadius: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'white',
            }}>{i + 1}</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9' }}>{p.n}</span>
          </div>
          {p.nozzles.map((fuel, j) => (
            <div key={j} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, color: '#4B5C73', fontFamily: 'monospace' }}>{j+1}</span>
                <span style={{ background: fuelColor[fuel], padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 700, color: 'white' }}>{fuel}</span>
              </div>
              <span style={{ fontSize: 9, color: stateColor[p.state[j]] ?? '#4B5C73', fontWeight: 500 }}>
                {p.state[j] === 'DESPACHANDO' && '● '}
                {p.state[j]}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
