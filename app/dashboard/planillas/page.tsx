import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FileSpreadsheet, Clock, Droplets, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from '../dashboard.module.css';

export default async function PlanillasPage({ searchParams }: { searchParams: Promise<{ tenant?: string; fecha?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;

  if (!user) redirect('/login');

  let activeTenantId: number | null = null;
  let stationIds: number[] = [];
  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();

  if (profile?.role === 'superadmin') {
    if (!params?.tenant) redirect('/admin');
    activeTenantId = parseInt(params.tenant, 10);
  } else {
    activeTenantId = profile?.tenant_id ?? null;
  }
  if (!activeTenantId) redirect('/login');

  const { data: stations } = await supabase.from('stations').select('id').eq('tenant_id', activeTenantId);
  stationIds = stations?.map(s => s.id) ?? [];

  // Turnos del último mes
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const { data: shifts } = await supabase
    .from('shifts')
    .select('*')
    .in('station_id', stationIds)
    .gte('opened_at', monthAgo.toISOString())
    .order('opened_at', { ascending: false });

  // Ventas del día actual agrupadas por combustible
  const today = new Date(); today.setHours(0,0,0,0);
  const { data: todayTxs } = await supabase
    .from('fuel_transactions')
    .select('fuel_type, liters, amount')
    .in('station_id', stationIds)
    .gte('completed_at', today.toISOString())
    .eq('status', 'COMPLETED');

  const fuelSummary: Record<string, { liters: number; amount: number; count: number }> = {};
  const FUEL_LABELS: Record<string, string> = {
    NAFTA_SUPER: 'NS', NAFTA_PREMIUM: 'NP', DIESEL: 'DS', DIESEL_PREMIUM: 'DP', GNC: 'GNC'
  };
  const FUEL_COLORS: Record<string, string> = {
    NAFTA_SUPER: '#10B981', NAFTA_PREMIUM: '#3B82F6', DIESEL: '#F59E0B', DIESEL_PREMIUM: '#A855F7', GNC: '#0EA5E9'
  };

  todayTxs?.forEach(tx => {
    if (!fuelSummary[tx.fuel_type]) fuelSummary[tx.fuel_type] = { liters: 0, amount: 0, count: 0 };
    fuelSummary[tx.fuel_type].liters += Number(tx.liters);
    fuelSummary[tx.fuel_type].amount += Number(tx.amount);
    fuelSummary[tx.fuel_type].count++;
  });

  const totalHoy = {
    liters: todayTxs?.reduce((a, t) => a + Number(t.liters), 0) ?? 0,
    amount: todayTxs?.reduce((a, t) => a + Number(t.amount), 0) ?? 0,
  };

  function duracion(opened: string, closed?: string) {
    const ms = (closed ? new Date(closed) : new Date()).getTime() - new Date(opened).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoIcon}><FileSpreadsheet size={20} color="white" /></div>
          <div>
            <h1 className={styles.logoTitle}>Planillas y Reportes</h1>
            <div className={styles.logoSub}>Historial de turnos · Resumen diario · Despachos por combustible</div>
          </div>
        </div>
      </header>

      <div className={styles.body} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Resumen del día */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14, letterSpacing: 1 }}>
            RESUMEN DE HOY — {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {Object.entries(fuelSummary).map(([fuel, data]) => (
              <div key={fuel} className={styles.glass} style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ background: FUEL_COLORS[fuel] ?? '#94a3b8', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                    {FUEL_LABELS[fuel] ?? fuel}
                  </span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{data.liters.toFixed(0)} <span style={{ fontSize: 12, fontWeight: 500 }}>L</span></div>
                <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600, marginTop: 2 }}>${data.amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{data.count} despachos</div>
              </div>
            ))}
            {/* Total card */}
            <div className={styles.glass} style={{ padding: 16, border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginBottom: 10, letterSpacing: 1 }}>TOTAL DÍA</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{totalHoy.liters.toFixed(0)} <span style={{ fontSize: 12 }}>L</span></div>
              <div style={{ fontSize: 15, color: '#10b981', fontWeight: 700, marginTop: 4 }}>${totalHoy.amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{todayTxs?.length ?? 0} transacciones</div>
            </div>
          </div>
        </section>

        {/* Tabla de turnos */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14, letterSpacing: 1 }}>
            HISTORIAL DE TURNOS — ÚLTIMOS 30 DÍAS
          </h2>
          <div className={styles.glass} style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.04)' }}>
                  {['ID TURNO', 'OPERADOR', 'APERTURA', 'CIERRE', 'DURACIÓN', 'DESPACHOS', 'LITROS', 'MONTO', 'ESTADO'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts?.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '13px 16px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.id}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.operator_name}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(s.opened_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {s.closed_at ? new Date(s.closed_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />{duracion(s.opened_at, s.closed_at)}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.sales_count}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Droplets size={12} style={{ color: '#3b82f6' }} />{Number(s.total_liters).toFixed(1)} L
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: '#10b981' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <DollarSign size={12} />{Number(s.total_amount).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      {s.status === 'OPEN'
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />ABIERTO
                          </span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(148,163,184,0.1)', color: '#94a3b8', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                            <CheckCircle2 size={11} />CERRADO
                          </span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!shifts || shifts.length === 0) && (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p>No hay turnos registrados en los últimos 30 días.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
