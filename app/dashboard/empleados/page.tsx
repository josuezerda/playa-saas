import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Users, Plus, Shield, ShieldAlert, UserCog } from 'lucide-react';
import styles from '../dashboard.module.css';
import Link from 'next/link';

export default async function EmpleadosPage({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const resolvedParams = await searchParams;

  if (!user) redirect('/login');

  // Determinar el tenant activo
  let activeTenantId: number | null = null;
  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();

  if (profile?.role === 'superadmin') {
    if (!resolvedParams?.tenant) {
      redirect('/admin');
    }
    activeTenantId = parseInt(resolvedParams.tenant, 10);
  } else {
    activeTenantId = profile?.tenant_id ?? null;
  }

  if (!activeTenantId) redirect('/login');

  // Traer empleados
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', activeTenantId)
    .order('created_at', { ascending: false });

  const tenantQuery = resolvedParams?.tenant ? `?tenant=${resolvedParams.tenant}` : '';

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.logoTitle}>Empleados y Roles</h1>
            <div className={styles.logoSub}>Gestión de personal y permisos de acceso al sistema</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={`${styles.iconBtn} ${styles.btnPrimary}`} style={{ background: 'var(--accent)', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', gap: 8 }}>
            <Plus size={16} />
            Nuevo Empleado
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <main className={styles.pumpsSection} style={{ padding: '30px' }}>
          
          <div className={styles.glass} style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>NOMBRE</th>
                  <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>CONTACTO</th>
                  <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>ROL</th>
                  <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>ESTADO</th>
                  <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {employees?.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.last_name}, {emp.first_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>DNI: {emp.document_number || '—'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{emp.email || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{emp.phone || '—'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: emp.role === 'administrador' ? 'rgba(168, 85, 247, 0.1)' : emp.role === 'supervisor' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: emp.role === 'administrador' ? '#A855F7' : emp.role === 'supervisor' ? '#3B82F6' : '#10B981'
                      }}>
                        {emp.role === 'administrador' ? <ShieldAlert size={14} /> : emp.role === 'supervisor' ? <Shield size={14} /> : <UserCog size={14} />}
                        {emp.role.toUpperCase()}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {emp.active ? (
                        <span style={{ color: '#10B981', fontSize: 13, fontWeight: 500 }}>Activo</span>
                      ) : (
                        <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 500 }}>Inactivo</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button style={{ background: 'transparent', color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!employees || employees.length === 0) && (
              <div className={styles.emptyState} style={{ padding: '60px 20px' }}>
                <Users size={40} opacity={0.3} />
                <h3 style={{ marginTop: 10, fontSize: 16 }}>No hay empleados registrados</h3>
                <p style={{ maxWidth: 300, fontSize: 13 }}>Agregá tu primer empleado para asignar roles y controlar los accesos al sistema.</p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
