import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Receipt, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import styles from '../dashboard.module.css';

export default async function FacturacionPage({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const resolvedParams = await searchParams;

  if (!user) redirect('/login');

  let activeTenantId: number | null = null;
  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();

  if (profile?.role === 'superadmin') {
    if (!resolvedParams?.tenant) redirect('/admin');
    activeTenantId = parseInt(resolvedParams.tenant, 10);
  } else {
    activeTenantId = profile?.tenant_id ?? null;
  }

  if (!activeTenantId) redirect('/login');

  // Traer historial de facturas
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('tenant_id', activeTenantId)
    .order('created_at', { ascending: false });

  // Traer ventas pendientes (ejemplo)
  const { data: pendingSales } = await supabase
    .from('sales')
    .select('*, stations!inner(tenant_id)')
    .eq('stations.tenant_id', activeTenantId)
    .eq('status', 'PENDING')
    .limit(5);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.logoTitle}>Facturación AFIP</h1>
            <div className={styles.logoSub}>Emisión de comprobantes electrónicos (Facturas A, B y C)</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={`${styles.iconBtn} ${styles.btnPrimary}`} style={{ background: 'var(--accent)', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', gap: 8 }}>
            <FileText size={16} />
            Emitir Nueva Factura
          </button>
        </div>
      </header>

      <div className={styles.body} style={{ padding: '30px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        
        <main className={styles.pumpsSection} style={{ padding: 0, flex: 1 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>HISTORIAL DE EMISIONES</h2>
          <div className={styles.glass} style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>FECHA</th>
                  <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>CLIENTE</th>
                  <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>COMPROBANTE</th>
                  <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>MONTO</th>
                  <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>ESTADO AFIP</th>
                </tr>
              </thead>
              <tbody>
                {invoices?.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {new Date(inv.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.customer_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>CUIT: {inv.customer_cuit}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 13 }}>
                      Factura {inv.invoice_type}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ${inv.total_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {inv.status === 'APPROVED' ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                          <CheckCircle2 size={14} /> Aprobada (CAE: {inv.cae})
                        </div>
                      ) : inv.status === 'REJECTED' ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#EF4444', fontSize: 12, fontWeight: 600 }}>
                          <XCircle size={14} /> Rechazada
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#EAB308', fontSize: 12, fontWeight: 600 }}>
                          <AlertCircle size={14} /> Pendiente
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!invoices || invoices.length === 0) && (
              <div className={styles.emptyState} style={{ padding: '40px 20px' }}>
                <Receipt size={32} opacity={0.3} />
                <p style={{ fontSize: 13, marginTop: 10 }}>No hay facturas emitidas aún.</p>
              </div>
            )}
          </div>
        </main>

        <aside style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>VENTAS SIN FACTURAR</h2>
          <div className={styles.glass} style={{ padding: 16 }}>
            {pendingSales?.map(sale => (
              <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{sale.fuel_type}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sale.liters} Lts</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>${sale.amount}</div>
                  <button style={{ background: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 600, marginTop: 4 }}>Facturar →</button>
                </div>
              </div>
            ))}
            {(!pendingSales || pendingSales.length === 0) && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No hay ventas pendientes.
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
