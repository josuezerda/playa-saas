import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import styles from './admin.module.css';
import NewTenantModal from './NewTenantModal';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verificar que sea superadmin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'superadmin') redirect('/dashboard');

  // Traer todos los tenants con sus estaciones
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, stations(id, name)')
    .order('created_at');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="SurtOS" width={36} height={36} />
          <div>
            <div className={styles.brand}>SurtOS <span className={styles.adminBadge}>SUPERADMIN</span></div>
            <div className={styles.sub}>Panel de control global</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Link href="/dashboard" className={styles.btnSecondary}>← Ir al dashboard</Link>
          <form action="/api/logout" method="POST">
            <button className={styles.btnDanger}>Salir</button>
          </form>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageTitle}>
          <h1>Empresas habilitadas</h1>
          <NewTenantModal />
        </div>

        <div className={styles.tenantsGrid}>
          {tenants?.map(tenant => (
            <div key={tenant.id} className={`${styles.tenantCard} ${!tenant.active ? styles.inactive : ''}`}>
              <div className={styles.tenantHeader}>
                <div className={styles.tenantIcon}>
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={styles.tenantName}>{tenant.name}</div>
                  <div className={styles.tenantSlug}>surtos.com.ar/{tenant.slug}</div>
                </div>
                <div className={`${styles.statusBadge} ${tenant.active ? styles.active : styles.inactiveBadge}`}>
                  {tenant.active ? '● Activa' : '○ Inactiva'}
                </div>
              </div>

              <div className={styles.tenantStats}>
                <div className={styles.stat}>
                  <div className={styles.statVal}>{tenant.stations?.length ?? 0}</div>
                  <div className={styles.statLabel}>Estaciones</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statVal} style={{ color: tenant.plan === 'pro' ? '#A855F7' : '#10B981' }}>
                    {tenant.plan.toUpperCase()}
                  </div>
                  <div className={styles.statLabel}>Plan</div>
                </div>
              </div>

              <div className={styles.tenantActions}>
                <a href={`/dashboard?tenant=${tenant.id}`} className={styles.btnSmall}>
                  Ver dashboard →
                </a>
                <button className={`${styles.btnSmall} ${styles.btnToggle} ${tenant.active ? styles.btnDeactivate : styles.btnActivate}`}>
                  {tenant.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}

          {(!tenants || tenants.length === 0) && (
            <div className={styles.empty}>
              No hay empresas registradas aún.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
