'use client';

import { useState } from 'react';
import { Users, Shield, ShieldAlert, UserCog } from 'lucide-react';
import styles from '../dashboard.module.css';
import NewEmployeeModal from './NewEmployeeModal';

interface Employee {
  id: number; first_name: string; last_name: string;
  document_number?: string; email?: string; phone?: string;
  role: string; active: boolean;
}

export default function EmpleadosClient({ employeesInitial, tenantId, tenantParam }:
  { employeesInitial: Employee[]; tenantId: number; tenantParam?: string }) {
  const [employees, setEmployees] = useState<Employee[]>(employeesInitial);

  const refresh = async () => {
    const res = await fetch(`/api/employees?tenant_id=${tenantId}`);
    if (res.ok) setEmployees(await res.json());
  };

  const toggleActive = async (emp: Employee) => {
    await fetch(`/api/employees/${emp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...emp, active: !emp.active }),
    });
    refresh();
  };

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
          <NewEmployeeModal tenantId={String(tenantId)} onCreated={refresh} />
        </div>
      </header>

      <div className={styles.body}>
        <main className={styles.pumpsSection} style={{ padding: 30 }}>
          <div className={styles.glass} style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                  {['NOMBRE', 'CONTACTO', 'ROL', 'ESTADO', 'ACCIONES'].map(h => (
                    <th key={h} style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
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
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                        borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: emp.role === 'administrador' ? 'rgba(168,85,247,0.1)' : emp.role === 'supervisor' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                        color: emp.role === 'administrador' ? '#A855F7' : emp.role === 'supervisor' ? '#3B82F6' : '#10B981',
                      }}>
                        {emp.role === 'administrador' ? <ShieldAlert size={14} /> : emp.role === 'supervisor' ? <Shield size={14} /> : <UserCog size={14} />}
                        {emp.role.toUpperCase()}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {emp.active
                        ? <span style={{ color: '#10B981', fontSize: 13, fontWeight: 500 }}>Activo</span>
                        : <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 500 }}>Inactivo</span>}
                    </td>
                    <td style={{ padding: '16px 20px', display: 'flex', gap: 8 }}>
                      <button onClick={() => toggleActive(emp)}
                        style={{ background: emp.active ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', color: emp.active ? '#EF4444' : '#10B981', fontWeight: 600, fontSize: 12, padding: '5px 12px', borderRadius: 6 }}>
                        {emp.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {employees.length === 0 && (
              <div className={styles.emptyState} style={{ padding: '60px 20px' }}>
                <Users size={40} opacity={0.3} />
                <h3 style={{ marginTop: 10, fontSize: 16 }}>No hay empleados registrados</h3>
                <p style={{ maxWidth: 300, fontSize: 13, textAlign: 'center' }}>Hacé clic en "Nuevo Empleado" para comenzar.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
