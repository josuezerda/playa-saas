'use client';

import { useState } from 'react';
import { X, UserPlus, Shield, ShieldAlert, UserCog } from 'lucide-react';
import styles from '../dashboard.module.css';

interface NewEmployeeModalProps {
  tenantId?: string;
  onCreated: () => void;
}

const ROLES = [
  { value: 'operador', label: 'Operador', icon: UserCog, desc: 'Solo puede ver el panel de surtidores y gestionar turnos.', color: '#10B981' },
  { value: 'supervisor', label: 'Supervisor', icon: Shield, desc: 'Puede ver reportes y gestionar empleados.', color: '#3B82F6' },
  { value: 'administrador', label: 'Administrador', icon: ShieldAlert, desc: 'Acceso completo: facturación, integraciones y configuración.', color: '#A855F7' },
];

export default function NewEmployeeModal({ tenantId, onCreated }: NewEmployeeModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name: '', last_name: '', document_number: '',
    email: '', phone: '', role: 'operador',
  });

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tenant_id: tenantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear empleado');
      setOpen(false);
      setForm({ first_name: '', last_name: '', document_number: '', email: '', phone: '', role: 'operador' });
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ background: 'var(--accent)', color: 'white', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <UserPlus size={16} /> Nuevo Empleado
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Nuevo Empleado</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Completá los datos para registrar al empleado.</p>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nombre *</label>
              <input name="first_name" value={form.first_name} onChange={handle} required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Apellido *</label>
              <input name="last_name" value={form.last_name} onChange={handle} required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>DNI</label>
              <input name="document_number" value={form.document_number} onChange={handle}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Teléfono</label>
              <input name="phone" value={form.phone} onChange={handle}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handle}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: 13 }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>Rol</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {ROLES.map(r => {
                const Icon = r.icon;
                const selected = form.role === r.value;
                return (
                  <button key={r.value} type="button" onClick={() => setForm(p => ({ ...p, role: r.value }))}
                    style={{ flex: 1, padding: '12px 8px', borderRadius: 10, border: `2px solid ${selected ? r.color : 'var(--border)'}`, background: selected ? `${r.color}15` : 'var(--bg-panel)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Icon size={18} color={selected ? r.color : 'var(--text-muted)'} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: selected ? r.color : 'var(--text-secondary)' }}>{r.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div style={{ color: '#EF4444', fontSize: 13, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={() => setOpen(false)}
              style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14 }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '11px', borderRadius: 8, background: 'var(--accent)', color: 'white', fontWeight: 600, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Guardando...' : 'Crear Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
