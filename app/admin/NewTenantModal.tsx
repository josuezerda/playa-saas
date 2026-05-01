'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

export default function NewTenantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    cuit: '',
    plan: 'starter',
    punto_de_venta: '',
    afip_crt: '',
    afip_key: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error creating tenant');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button className={styles.btnPrimary} onClick={() => setIsOpen(true)}>
        + Nueva empresa
      </button>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Nueva Empresa (Tenant)</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Razón Social / Nombre</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label>Slug (URL ej: mipyme)</label>
              <input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>CUIT (Sin guiones)</label>
              <input value={formData.cuit} onChange={e => setFormData({...formData, cuit: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label>Plan</label>
              <select value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          </div>

          <hr />
          <h3>Configuración AFIP</h3>
          
          <div className={styles.field}>
            <label>Punto de Venta</label>
            <input type="number" value={formData.punto_de_venta} onChange={e => setFormData({...formData, punto_de_venta: e.target.value})} />
          </div>

          <div className={styles.field}>
            <label>Clave Privada (.key) (Opcional por ahora)</label>
            <textarea rows={3} value={formData.afip_key} onChange={e => setFormData({...formData, afip_key: e.target.value})} />
          </div>

          <div className={styles.field}>
            <label>Certificado (.crt) (Opcional por ahora)</label>
            <textarea rows={3} value={formData.afip_crt} onChange={e => setFormData({...formData, afip_crt: e.target.value})} />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary} onClick={() => setIsOpen(false)}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
