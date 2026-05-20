'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Receipt, FileText, CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import styles from '../dashboard.module.css';

interface Invoice {
  id: number; customer_name: string; customer_cuit: string;
  invoice_type: string; total_amount: number; status: string;
  cae?: string; created_at: string;
}
interface Sale {
  id: string; fuel_type: string; liters: number; amount: number;
}

function NewInvoiceModal({ open, onClose, tenantId, onCreated, pendingSales }: {
  open: boolean; onClose: () => void; tenantId: number; onCreated: () => void; pendingSales: Sale[];
}) {
  const [form, setForm] = useState({ customer_name: '', customer_cuit: '', invoice_type: 'B', total_amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.customer_name || !form.customer_cuit || !form.total_amount) {
      setError('Complete todos los campos obligatorios.'); return;
    }
    setLoading(true); setError('');
    const { error: err } = await supabase.from('invoices').insert({
      tenant_id: tenantId,
      customer_name: form.customer_name,
      customer_cuit: form.customer_cuit,
      invoice_type: form.invoice_type,
      total_amount: parseFloat(form.total_amount),
      status: 'PENDING',
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onCreated(); onClose();
  };

  const inp = { width:'100%', padding:'10px 14px', background:'#0f172a', border:'1px solid #334155', borderRadius:8, color:'#f1f5f9', fontSize:14, boxSizing:'border-box' as const };
  const lbl = { fontSize:12, color:'#94a3b8', fontWeight:600 as const, display:'block' as const, marginBottom:6 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1e2a3a', borderRadius:16, padding:32, width:480, position:'relative', maxHeight:'90vh', overflowY:'auto' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'none', color:'#94a3b8', border:'none', cursor:'pointer' }}><X size={20}/></button>
        <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4, color:'#f1f5f9' }}>📄 Emitir Nueva Factura</h2>
        <p style={{ fontSize:12, color:'#64748b', marginBottom:24 }}>Comprobante electrónico AFIP</p>

        {error && <div style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', padding:'10px 14px', borderRadius:8, marginBottom:16, fontSize:13 }}>{error}</div>}

        <div style={{ marginBottom:16 }}>
          <label style={lbl}>TIPO DE COMPROBANTE</label>
          <select value={form.invoice_type} onChange={e => setForm(f => ({...f, invoice_type: e.target.value}))} style={inp}>
            <option value="A">Factura A (Responsable Inscripto)</option>
            <option value="B">Factura B (Consumidor Final)</option>
            <option value="C">Factura C (Monotributista / Exento)</option>
          </select>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={lbl}>RAZÓN SOCIAL / NOMBRE *</label>
          <input value={form.customer_name} onChange={e => setForm(f => ({...f, customer_name: e.target.value}))} placeholder="Ej: Juan Pérez" style={inp} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={lbl}>CUIT / DNI *</label>
          <input value={form.customer_cuit} onChange={e => setForm(f => ({...f, customer_cuit: e.target.value}))} placeholder="Ej: 20-12345678-9" style={inp} />
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={lbl}>MONTO TOTAL *</label>
          <input type="number" value={form.total_amount} onChange={e => setForm(f => ({...f, total_amount: e.target.value}))} placeholder="0.00" style={inp} />
        </div>

        {pendingSales.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>VENTAS A INCLUIR (opcional)</label>
            <div style={{ background:'#0f172a', borderRadius:8, padding:12, fontSize:12, color:'#94a3b8' }}>
              {pendingSales.slice(0,3).map(s => (
                <div key={s.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #1e293b' }}>
                  <span>{s.fuel_type} — {s.liters} L</span>
                  <span style={{color:'#10b981'}}>${Number(s.amount).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width:'100%', padding:'13px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' }}>
          {loading ? 'Generando...' : '📤 Generar Comprobante'}
        </button>
        <p style={{ fontSize:11, color:'#475569', textAlign:'center', marginTop:12 }}>
          ⚠ La emisión real requiere certificado AFIP configurado en Integraciones
        </p>
      </div>
    </div>
  );
}

export default function FacturacionClient({ invoicesInitial, pendingSalesInitial, tenantId }: {
  invoicesInitial: Invoice[]; pendingSalesInitial: Sale[]; tenantId: number;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>(invoicesInitial);
  const [pendingSales] = useState<Sale[]>(pendingSalesInitial);
  const [showModal, setShowModal] = useState(false);
  const supabase = createClient();

  const refresh = async () => {
    const { data } = await supabase.from('invoices').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
    if (data) setInvoices(data);
  };

  return (
    <div className={styles.app}>
      <NewInvoiceModal open={showModal} onClose={() => setShowModal(false)} tenantId={tenantId} onCreated={refresh} pendingSales={pendingSales} />

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.logoTitle}>Facturación AFIP</h1>
            <div className={styles.logoSub}>Emisión de comprobantes electrónicos (Facturas A, B y C)</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button onClick={() => setShowModal(true)}
            style={{ background:'#3b82f6', color:'white', padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:600, display:'flex', gap:8, alignItems:'center', border:'none', cursor:'pointer' }}>
            <FileText size={16} />Emitir Nueva Factura
          </button>
        </div>
      </header>

      <div className={styles.body} style={{ padding:30, display:'flex', gap:24, alignItems:'flex-start' }}>
        <main className={styles.pumpsSection} style={{ padding:0, flex:1 }}>
          <h2 style={{ fontSize:13, fontWeight:700, color:'var(--text-secondary)', marginBottom:16, letterSpacing:1 }}>HISTORIAL DE EMISIONES</h2>
          <div className={styles.glass} style={{ overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,0.02)' }}>
                  {['FECHA','CLIENTE','COMPROBANTE','MONTO','ESTADO AFIP'].map(h => (
                    <th key={h} style={{ padding:'16px 20px', fontSize:12, fontWeight:600, color:'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'16px 20px', fontSize:13, color:'var(--text-secondary)' }}>
                      {new Date(inv.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td style={{ padding:'16px 20px' }}>
                      <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{inv.customer_name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>CUIT: {inv.customer_cuit}</div>
                    </td>
                    <td style={{ padding:'16px 20px', fontSize:13 }}>Factura {inv.invoice_type}</td>
                    <td style={{ padding:'16px 20px', fontWeight:600, color:'var(--text-primary)' }}>
                      ${Number(inv.total_amount).toLocaleString('es-AR', { minimumFractionDigits:2 })}
                    </td>
                    <td style={{ padding:'16px 20px' }}>
                      {inv.status === 'APPROVED'
                        ? <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#10B981', fontSize:12, fontWeight:600 }}><CheckCircle2 size={14}/>Aprobada {inv.cae && `(CAE: ${inv.cae})`}</span>
                        : inv.status === 'REJECTED'
                        ? <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#EF4444', fontSize:12, fontWeight:600 }}><XCircle size={14}/>Rechazada</span>
                        : <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#EAB308', fontSize:12, fontWeight:600 }}><AlertCircle size={14}/>Pendiente</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invoices.length === 0 && (
              <div className={styles.emptyState} style={{ padding:'40px 20px' }}>
                <Receipt size={32} opacity={0.3} />
                <p style={{ fontSize:13, marginTop:10 }}>No hay facturas emitidas aún. Usá el botón para crear la primera.</p>
              </div>
            )}
          </div>
        </main>

        <aside style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', gap:16 }}>
          <h2 style={{ fontSize:13, fontWeight:700, color:'var(--text-secondary)', letterSpacing:1 }}>VENTAS SIN FACTURAR</h2>
          <div className={styles.glass} style={{ padding:16 }}>
            {pendingSales.map(sale => (
              <div key={sale.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{sale.fuel_type}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{sale.liters} Lts</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)' }}>${Number(sale.amount).toLocaleString('es-AR')}</div>
                  <button onClick={() => setShowModal(true)}
                    style={{ background:'none', color:'var(--accent)', fontSize:11, fontWeight:600, marginTop:4, border:'none', cursor:'pointer' }}>
                    Facturar →
                  </button>
                </div>
              </div>
            ))}
            {pendingSales.length === 0 && (
              <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'20px 0' }}>
                ✅ No hay ventas pendientes.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
