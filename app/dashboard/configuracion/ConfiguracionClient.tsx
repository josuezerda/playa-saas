'use client';

import { useState, useRef } from 'react';
import { Save, CheckCircle2, Building2, MapPin, Phone, Hash, ImagePlus, Upload } from 'lucide-react';
import styles from '../dashboard.module.css';

export default function ConfiguracionClient({ tenant, tenantParam, isSuperadmin }: { tenant: any; tenantParam?: string; isSuperadmin?: boolean }) {
  const [form, setForm] = useState({
    name: tenant?.name || '',
    slug: tenant?.slug || '',
    cuit: tenant?.cuit || '',
    address: tenant?.address || '',
    phone: tenant?.phone || '',
    plan: tenant?.plan || 'basic',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Logo state
  const [logoPreview, setLogoPreview] = useState<string>(tenant?.logo_url || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoSaved, setLogoSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const save = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tenants/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenant.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    setLogoUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      formData.append('tenant_id', tenant.id);
      const res = await fetch('/api/tenants/logo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogoPreview(data.logo_url);
      setLogoFile(null);
      setLogoSaved(true);
      setTimeout(() => setLogoSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-panel)',
    color: 'var(--text-primary)', fontSize: 13,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6,
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.logoTitle}>Configuración General</h1>
            <div className={styles.logoSub}>Datos del comercio y preferencias del sistema</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: 13, fontWeight: 600 }}>
              <CheckCircle2 size={16} /> Guardado correctamente
            </div>
          )}
          {error && <span style={{ color: '#EF4444', fontSize: 13 }}>{error}</span>}
          <button onClick={save} disabled={loading}
            style={{ background: 'var(--accent)', color: 'white', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={15} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </header>

      <div className={styles.body} style={{ padding: 30, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Logo de la Empresa */}
        <div className={styles.glass} style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImagePlus size={20} color="#A855F7" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Logo de la Empresa</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Imagen visible en el sistema y documentos generados.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {/* Preview */}
            <div
              style={{
                width: 120, height: 120, borderRadius: 16,
                border: '2px dashed var(--border)',
                background: 'var(--bg-panel)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                position: 'relative',
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Haz clic para cambiar el logo"
            >
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Logo empresa"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ImagePlus size={28} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 11 }}>Sin logo</div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                style={{ display: 'none' }}
                onChange={handleLogoSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: '1px solid var(--border)', background: 'var(--bg-panel)',
                  color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <ImagePlus size={15} />
                {logoFile ? logoFile.name : 'Seleccionar imagen'}
              </button>

              {logoFile && (
                <button
                  onClick={uploadLogo}
                  disabled={logoUploading}
                  style={{
                    padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: '#A855F7', color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, border: 'none',
                    opacity: logoUploading ? 0.7 : 1,
                  }}
                >
                  <Upload size={15} />
                  {logoUploading ? 'Subiendo...' : 'Guardar logo'}
                </button>
              )}

              {logoSaved && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle2 size={15} /> Logo actualizado
                </div>
              )}

              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                PNG, JPG, SVG o WebP · Máx. 2 MB<br />
                Recomendado: fondo transparente, min. 200×200px
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className={styles.glass} style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="#3B82F6" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Datos del Comercio</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Información legal y de contacto de la estación.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}><Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />Razón Social / Nombre</label>
              <input name="name" value={form.name} onChange={handle} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><Hash size={12} style={{ display: 'inline', marginRight: 4 }} />CUIT (sin guiones)</label>
              <input name="cuit" value={form.cuit} onChange={handle} placeholder="30710217641" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Dirección</label>
              <input name="address" value={form.address} onChange={handle} placeholder="Av. Siempre Viva 123, Mendoza" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Teléfono de Contacto</label>
              <input name="phone" value={form.phone} onChange={handle} placeholder="+549261..." style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Plan — solo visible para superadmin */}
        {isSuperadmin && (
          <div className={styles.glass} style={{ padding: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Plan Activo</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>El plan determina el límite de estaciones, usuarios y funcionalidades.</p>
            <div style={{ display: 'flex', gap: 14 }}>
              {[
                { value: 'basic', label: 'BÁSICO', desc: 'Hasta 2 estaciones\n5 usuarios\nSurtidores y stock', color: '#10B981', price: 'Gratis' },
                { value: 'pro', label: 'PRO', desc: 'Hasta 10 estaciones\n20 usuarios\nFacturación AFIP\nCRM WhatsApp\nIA incluida', color: '#A855F7', price: '$15.000/mes' },
              ].map(p => {
                const selected = form.plan === p.value;
                return (
                  <div key={p.value} onClick={() => setForm(f => ({ ...f, plan: p.value }))}
                    style={{ flex: 1, padding: 20, borderRadius: 12, border: `2px solid ${selected ? p.color : 'var(--border)'}`,
                      background: selected ? `${p.color}10` : 'var(--bg-panel)', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: p.color }}>{p.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{p.price}</div>
                    <pre style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.7, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{p.desc}</pre>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>Zona de Peligro</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Estas acciones son irreversibles. Procedé con precaución.</p>
          <button style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 600 }}>
            Desactivar empresa...
          </button>
        </div>

      </div>
    </div>
  );
}
