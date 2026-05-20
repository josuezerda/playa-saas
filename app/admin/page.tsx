import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import styles from './admin.module.css';
import NewTenantModal from './NewTenantModal';
import { Fuel, Users, Receipt, ShieldCheck, AlertTriangle, Building2 } from 'lucide-react';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'superadmin') redirect('/dashboard');

  // Tenants con estaciones, empleados e invoices
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, stations(id, name), employees(id), invoices(id, status)')
    .order('created_at');

  // Stats globales
  const totalTenants  = tenants?.length ?? 0;
  const activeTenants = tenants?.filter(t => t.active).length ?? 0;
  const totalStations = tenants?.reduce((a, t) => a + (t.stations?.length ?? 0), 0) ?? 0;

  // Turnos abiertos en este momento
  const { count: openShifts } = await supabase
    .from('shifts').select('id', { count: 'exact', head: true }).eq('status', 'OPEN');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.tenantIcon} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', fontSize:14 }}>
            <Fuel size={20} color="white" />
          </div>
          <div>
            <div className={styles.brand}>
              SurtOS <span className={styles.adminBadge}>SUPERADMIN</span>
            </div>
            <div className={styles.sub}>Panel maestro — Gestión global de empresas</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <a href="/dashboard" className={styles.btnSecondary}>← Dashboard</a>
          <form action="/api/logout" method="POST">
            <button className={styles.btnDanger}>Salir</button>
          </form>
        </div>
      </header>

      <main className={styles.main} style={{ maxWidth: 1200 }}>

        {/* Stats globales */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:32 }}>
          {[
            { label:'Empresas activas', val:`${activeTenants}/${totalTenants}`, icon:<Building2 size={18}/>, color:'#3b82f6' },
            { label:'Estaciones total', val:totalStations, icon:<Fuel size={18}/>, color:'#10b981' },
            { label:'Turnos abiertos', val:openShifts ?? 0, icon:<Users size={18}/>, color:'#f59e0b' },
            { label:'Certificados AFIP', val:`${tenants?.filter(t=>(t as any).afip_cert_status==='OK').length ?? 0}/${totalTenants}`, icon:<ShieldCheck size={18}/>, color:'#a855f7' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'18px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, color:s.color }}>{s.icon}<span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:1 }}>{s.label.toUpperCase()}</span></div>
              <div style={{ fontSize:28, fontWeight:800, color:'var(--text-primary)' }}>{s.val}</div>
            </div>
          ))}
        </div>

        <div className={styles.pageTitle}>
          <h1>Empresas habilitadas</h1>
          <NewTenantModal />
        </div>

        <div className={styles.tenantsGrid}>
          {tenants?.map(tenant => {
            const t = tenant as any;
            const invoiceOk = t.invoices?.filter((i:any) => i.status === 'APPROVED').length ?? 0;
            const certOk = t.afip_cert_status === 'OK';
            return (
              <div key={tenant.id} className={`${styles.tenantCard} ${!tenant.active ? styles.inactive : ''}`}>
                <div className={styles.tenantHeader}>
                  <div className={styles.tenantIcon}>
                    {tenant.logo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={tenant.logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:10, padding:4 }} />
                      : tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div className={styles.tenantName}>{tenant.name}</div>
                    <div className={styles.tenantSlug}>CUIT: {tenant.cuit || '—'}</div>
                  </div>
                  <div className={`${styles.statusBadge} ${tenant.active ? styles.active : styles.inactiveBadge}`}>
                    {tenant.active ? '● Activa' : '○ Inactiva'}
                  </div>
                </div>

                <div className={styles.tenantStats}>
                  <div className={styles.stat}>
                    <div className={styles.statVal}>{t.stations?.length ?? 0}</div>
                    <div className={styles.statLabel}>Estaciones</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statVal}>{t.employees?.length ?? 0}</div>
                    <div className={styles.statLabel}>Empleados</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statVal}>{invoiceOk}</div>
                    <div className={styles.statLabel}>Facturas ok</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statVal} style={{ color: tenant.plan === 'pro' ? '#A855F7' : '#10B981', fontSize:14 }}>
                      {tenant.plan.toUpperCase()}
                    </div>
                    <div className={styles.statLabel}>Plan</div>
                  </div>
                </div>

                {/* AFIP status */}
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:8,
                  background: certOk ? 'rgba(16,185,129,0.08)' : 'rgba(234,179,8,0.08)',
                  border: `1px solid ${certOk ? 'rgba(16,185,129,0.2)' : 'rgba(234,179,8,0.2)'}`,
                  fontSize:12 }}>
                  {certOk ? <ShieldCheck size={14} color="#10b981"/> : <AlertTriangle size={14} color="#EAB308"/>}
                  <span style={{ color: certOk ? '#10b981' : '#EAB308', fontWeight:600 }}>
                    {certOk ? 'AFIP activo' : 'Cert. AFIP pendiente'}
                  </span>
                  {t.afip_razon_social && <span style={{ color:'var(--text-muted)', marginLeft:'auto' }}>{t.afip_razon_social}</span>}
                </div>

                <div className={styles.tenantActions}>
                  <a href={`/dashboard?tenant=${tenant.id}`} className={styles.btnSmall}>
                    🖥 Dashboard →
                  </a>
                  <a href={`/dashboard/configuracion?tenant=${tenant.id}`} className={styles.btnSmall}>
                    ⚙ Config
                  </a>
                  <a href={`/dashboard/integraciones?tenant=${tenant.id}`} className={styles.btnSmall}>
                    🔌 AFIP
                  </a>
                </div>
              </div>
            );
          })}

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
